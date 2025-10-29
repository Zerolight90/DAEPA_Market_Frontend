"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import s from "./MarketChat.module.css";
import { useChatSocket } from "@/lib/chat/useChatSocket";
import {
    fetchRooms,
    fetchMe,
    fetchMessages,
    sendMessageRest,
    markReadUpTo,
    uploadChatImage,
} from "@/lib/chat/api";
import { useSearchParams } from "next/navigation";
import { Box, styled, IconButton, Tooltip } from "@mui/material";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ImageIcon from "@mui/icons-material/Image";
import EmojiPicker from "emoji-picker-react";

const LOG = false;
const log = (...a) => LOG && console.log("[CHAT]", ...a);
const READ_SEND_MINIMUM_INTERVAL = 1500;

const ScrollArea = styled(Box)(({ theme }) => ({
    overflowY: "auto",
    overscrollBehavior: "contain",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.palette.divider} transparent`,
    "&::-webkit-scrollbar": { width: 8, height: 8 },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: theme.palette.divider,
        borderRadius: 8,
    },
    "&::-webkit-scrollbar-track": { background: "transparent" },
}));

const pad2 = (n) => String(n).padStart(2, "0");
const toDate = (v) => (v instanceof Date ? v : new Date(v));
const isToday = (d) => {
    const t = new Date();
    return (
        d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate()
    );
};
const fmtHHMM = (v) => {
    const d = toDate(v);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtDateLine = (v) => {
    const d = toDate(v);
    if (isToday(d)) return "오늘";
    const yo = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(
        d.getDate()
    )} (${yo})`;
};

export default function MarketChat() {
    const search = useSearchParams();
    const initialRoomId = search.get("roomId")
        ? Number(search.get("roomId"))
        : null;

    const [me, setMe] = useState(null);
    const [roomList, setRoomList] = useState([]);
    const [activeId, setActiveId] = useState(initialRoomId);
    const [messagesByRoom, setMessagesByRoom] = useState({});
    const [text, setText] = useState("");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [pendingImage, setPendingImage] = useState(null);
    const fileInputRef = useRef(null);
    const textAreaRef = useRef(null);

    const scrollerRef = useRef(null);
    const wsCursorRef = useRef(0);
    const lastReadSentRef = useRef({});
    const lastReadSentAtRef = useRef(0);
    const ready = useMemo(() => typeof window !== "undefined", []);

    // ✅ ESC 누르면 이모지창 닫기
    useEffect(() => {
        if (!emojiOpen) return;
        const handleEsc = (e) => {
            if (e.key === "Escape") setEmojiOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [emojiOpen]);

    // 내 정보
    useEffect(() => {
        if (!ready) return;
        (async () => {
            try {
                const res = await fetchMe();
                if (res?.userId) {
                    setMe({
                        id: res.userId,
                        name: `유저${res.userId}`,
                        profile: "/images/profile_img/sangjun.jpg",
                    });
                } else {
                    setMe(null);
                }
            } catch {
                setMe(null);
            }
        })();
    }, [ready]);

    // 방 목록
    useEffect(() => {
        if (!ready || !me?.id) return;
        (async () => {
            try {
                const list = await fetchRooms();
                const safe = Array.isArray(list) ? list : [];
                setRoomList(safe);
                const deduped = Array.from(
                    new Map(safe.filter(Boolean).map((r) => [String(r.roomId), r])).values()
                );
                if (!initialRoomId && deduped.length && !activeId) {
                    setActiveId(deduped[0].roomId);
                }
            } catch {
                setRoomList([]);
            }
        })();
    }, [ready, me?.id, initialRoomId, activeId]);

    const rooms = useMemo(() => {
        const map = new Map();
        for (const r of roomList || []) {
            if (!r?.roomId) continue;
            map.set(String(r.roomId), r);
        }
        return Array.from(map.values());
    }, [roomList]);

    const activeChat = useMemo(
        () => rooms.find((r) => String(r.roomId) === String(activeId)),
        [rooms, activeId]
    );

    const otherName = activeChat?.counterpartyName ?? "상대";
    const otherAvatar =
        activeChat?.counterpartyProfile || "/images/profile_img/sangjun.jpg";

    // ✅ WebSocket 연결
    const { connected, messages: wsMessages, sendText, sendImage, sendRead, setOnServerMessage } =
        useChatSocket({
            roomId: me?.id ? activeId ?? 0 : 0,
            me: me ?? undefined,
            baseUrl: process.env.NEXT_PUBLIC_API_BASE,
        });

    useEffect(() => {
        setOnServerMessage(() => {});
    }, [setOnServerMessage]);

    // ✅ 채팅 내역
    useEffect(() => {
        if (!activeId || !me?.id) return;
        wsCursorRef.current = 0;
        (async () => {
            try {
                const list = await fetchMessages(activeId, 30);
                const mapped = (list || []).map((m) =>
                    mapMessageToUi(m, me, otherName, otherAvatar)
                );
                setMessagesByRoom((prev) => ({ ...prev, [activeId]: mapped }));
            } catch {
                setMessagesByRoom((prev) => ({ ...prev, [activeId]: [] }));
            }
        })();
    }, [activeId, me?.id]);

    // WS 메시지 반영
    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null || !me?.id) return;
        const delta = wsMessages.slice(wsCursorRef.current);
        wsCursorRef.current = wsMessages.length;
        setMessagesByRoom((prev) => {
            const cur = [...(prev[activeId] || [])];
            for (const m of delta) {
                const msgType = m.type || "TEXT";
                if (msgType === "READ") {
                    if (Number(m.readerId) !== Number(me.id)) {
                        const upTo = Number(m.lastSeenMessageId);
                        for (let i = 0; i < cur.length; i++) {
                            const it = cur[i];
                            if (it.fromMe && typeof it.id === "number" && it.id <= upTo && !it.read) {
                                cur[i] = { ...it, read: true };
                            }
                        }
                    }
                    continue;
                }
                const next = mapMessageToUi(m, me, otherName, otherAvatar);
                if (m.tempId) {
                    const idx = cur.findIndex((x) => x.tempId === m.tempId);
                    if (idx >= 0) {
                        cur[idx] = { ...next, tempId: undefined };
                        continue;
                    }
                }
                if (typeof m.messageId === "number" && cur.some((x) => x.id === m.messageId))
                    continue;
                cur.push(next);
            }
            return { ...prev, [activeId]: cur };
        });
    }, [wsMessages, activeId, me?.id]);

    // 스크롤 하단 고정
    const scrollToBottom = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setTimeout(() => (el.scrollTop = el.scrollHeight), 0);
    };
    useEffect(() => {
        scrollToBottom();
    }, [messagesByRoom[activeId]?.length]);

    // ✅ 이미지 전송
    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setPendingImage({ file, previewUrl });
    };

    // ✅ 붙여넣기 전송
    const onPaste = (e) => {
        const item = Array.from(e.clipboardData.items).find((x) =>
            x.type.startsWith("image/")
        );
        if (item) {
            const file = item.getAsFile();
            if (file) {
                const previewUrl = URL.createObjectURL(file);
                setPendingImage({ file, previewUrl });
            }
        }
    };

    // ✅ 전송
    const doSendMessage = async () => {
        if (!me?.id || !activeId) return;
        const trimmed = text.trim();
        if (!trimmed && !pendingImage) return;

        const tempId = `tmp-${activeId}-${Date.now()}`;
        const optimistic = {
            id: tempId,
            tempId,
            fromMe: true,
            senderName: me.name,
            avatar: me.profile,
            text: trimmed,
            imageUrl: pendingImage?.previewUrl || null,
            type: pendingImage ? "IMAGE" : "TEXT",
            ts: new Date(),
            read: false,
        };
        setMessagesByRoom((prev) => ({
            ...prev,
            [activeId]: [...(prev[activeId] || []), optimistic],
        }));

        setText("");
        setPendingImage(null);

        try {
            let imageUrl = null;
            if (pendingImage) {
                const res = await uploadChatImage(pendingImage.file); // ✅ File만 전달
                imageUrl = res?.url || null;
            }

            if (connected) {
                if (imageUrl) sendImage(imageUrl, tempId);   // ✅ 이미지 전송
                if (trimmed)  sendText(trimmed, tempId);     // ✅ 텍스트 전송(있을 때만)
            } else {
                await sendMessageRest(activeId, {
                    text: trimmed,
                    imageUrl,
                    tempId,
                    senderId: me.id,
                });
            }
        } catch (err) {
            console.error("send failed", err);
        }
    };

    const insertEmoji = (emoji) => {
        const ta = textAreaRef.current;
        if (!ta) {
            setText((t) => (t || "") + emoji);
            return;
        }
        const start = ta.selectionStart || 0;
        const end = ta.selectionEnd || 0;
        const next = text.slice(0, start) + emoji + text.slice(end);
        setText(next);
    };

    const messages = (messagesByRoom[activeId] ?? []).reduce((acc, cur, idx, all) => {
        const prev = all[idx - 1];
        const needDivider =
            !prev ||
            prev.ts.getFullYear() !== cur.ts.getFullYear() ||
            prev.ts.getMonth() !== cur.ts.getMonth() ||
            prev.ts.getDate() !== cur.ts.getDate();
        if (needDivider)
            acc.push({ __divider: true, label: fmtDateLine(cur.ts), key: `d-${cur.id}` });
        acc.push(cur);
        return acc;
    }, []);

    return (
        <div className={s.wrap}>
            <h2 className={s.title}>채팅</h2>
            <div className={s.box}>
                <aside className={s.list}>
                    <h3 className={s.listTitle}>
                        채팅 목록 {connected ? "(연결됨)" : "(연결 중…)"}
                    </h3>
                    <ScrollArea className={s.ul} component="ul" sx={{ maxHeight: "600px" }}>
                        {rooms.map((r) => (
                            <li
                                key={r.roomId}
                                className={`${s.item} ${
                                    String(activeId) === String(r.roomId) ? s.active : ""
                                }`}
                                onClick={() => setActiveId(r.roomId)}
                            >
                                <img className={s.thumb} src={r.productThumb} alt="" />
                                <div className={s.itemMain}>
                                    <div className={s.top}>
                                        <span className={s.name}>{r.counterpartyName}</span>
                                        <span className={s.time}>
                      {r.lastAt ? fmtHHMM(new Date(r.lastAt)) : "-"}
                    </span>
                                    </div>
                                    <div className={s.productRow}>
                                        <span className={s.product}>{r.productTitle}</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ScrollArea>
                </aside>

                <section className={s.room}>
                    <ScrollArea ref={scrollerRef} className={s.messages} sx={{ maxHeight: "600px" }}>
                        {messages.map((m) =>
                            m.__divider ? (
                                <div key={m.key} className={s.dateDivider}>
                                    {m.label}
                                </div>
                            ) : (
                                <div key={m.id} className={`${s.msg} ${m.fromMe ? s.me : s.other}`}>
                                    {!m.fromMe && (
                                        <div className={s.senderRow}>
                                            <img className={s.avatar} src={m.avatar} alt="" />
                                            <span className={s.senderName}>{m.senderName}</span>
                                        </div>
                                    )}
                                    <div className={s.bubbleRow}>
                                        {m.imageUrl ? (
                                            <img className={s.image} src={m.imageUrl} alt="" />
                                        ) : (
                                            <p className={s.bubble}>{m.text}</p>
                                        )}
                                        <span className={s.timeSmall}>{fmtHHMM(m.ts)}</span>
                                    </div>
                                    {m.fromMe && m.read && <span className={s.readText}>읽음</span>}
                                </div>
                            )
                        )}
                    </ScrollArea>

                    {/* ✅ 입력 바 */}
                    <form
                        className={s.inputBar}
                        onSubmit={(e) => {
                            e.preventDefault();
                            doSendMessage();
                        }}
                        onPaste={onPaste}
                    >
                        <div className={s.composer}>
                            <div className={s.inputTools}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={onFileChange}
                                />
                                <Tooltip title="이미지 보내기">
                                    <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
                                        <ImageIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="이모지">
                                    <IconButton size="small" onClick={() => setEmojiOpen((v) => !v)}>
                                        <InsertEmoticonIcon />
                                    </IconButton>
                                </Tooltip>
                            </div>

                            <div className={s.inputMain}>
                                {emojiOpen && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: "100%",
                                            left: 0,
                                            marginBottom: 10,
                                            zIndex: 10,
                                        }}
                                    >
                                        <EmojiPicker
                                            onEmojiClick={(emojiData) => insertEmoji(emojiData.emoji)}
                                            previewConfig={{ showPreview: false }}
                                            searchDisabled={true}
                                            lazyLoadEmojis
                                            height={340}
                                            width={320}
                                        />
                                    </div>
                                )}

                                {!!pendingImage && (
                                    <div className={s.imagePreview}>
                                        <img src={pendingImage.previewUrl} alt="" />
                                        <button
                                            type="button"
                                            className={s.removePreview}
                                            onClick={() => {
                                                setPendingImage(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                <textarea
                                    ref={textAreaRef}
                                    className={s.input}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="메시지를 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈) — 이미지 드래그·붙여넣기 가능"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            doSendMessage();
                                        }
                                    }}
                                    rows={1}
                                />
                            </div>
                        </div>

                        <button
                            className={s.sendBtn}
                            type="submit"
                            disabled={!text.trim() && !pendingImage}
                        >
                            보내기
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}

/** ---------- 유틸: 서버 DTO -> UI ---------- **/
function mapMessageToUi(m, me, otherName, otherAvatar) {
    const type = m.type || (m.imageUrl ? "IMAGE" : "TEXT");
    const fromMe = Number(m.senderId) === Number(me.id);
    return {
        id: m.messageId ?? `tmp-echo-${m.roomId || "r"}-${m.time || Date.now()}`,
        type,
        fromMe,
        senderName: fromMe ? me.name : otherName,
        avatar: fromMe ? me.profile : otherAvatar,
        text: m.content || m.text || "",
        imageUrl: m.imageUrl || null,
        ts: m.time ? new Date(m.time) : new Date(),
        read: false,
    };
}
