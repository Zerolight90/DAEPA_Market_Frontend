"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import s from "./MarketChat.module.css";
import { useChatSocket } from "@/lib/chat/useChatSocket";
import {
    fetchRooms,
    fetchMe,
    fetchMessages,
    sendMessageRest,
    uploadChatImage,
} from "@/lib/chat/api";
import { useSearchParams } from "next/navigation";
import { Box, styled, IconButton, Tooltip } from "@mui/material";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ImageIcon from "@mui/icons-material/Image";
import EmojiPicker from "emoji-picker-react";

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
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} (${yo})`;
};

/** ✅ 상단 고정 시스템 안내(클라에서만 렌더, DB 저장 안함) */
function createSystemIntro(roomId) {
    return {
        id: `sys-${roomId}`,
        type: "SYSTEM",
        text: "안전한 거래를 위해 개인정보를 포함한 내용은 채팅에서 삼가해주세요.",
        ts: new Date(0), // 항상 최상단에 위치
        fromMe: false,
        senderName: "system",
        avatar: null,
        read: true,
        __systemIntro: true,
    };
}

/** ✅ 방에서 내 역할 계산 */
function resolveRole(room, meId) {
    if (room?.sellerId != null) {
        return Number(room.sellerId) === Number(meId) ? "판매자" : "구매자";
    }
    if (typeof room?.isSeller === "boolean") return room.isSeller ? "판매자" : "구매자";
    if (typeof room?.role === "string") return room.role; // 이미 "판매자"/"구매자"로 제공 시
    return null;
}

export default function MarketChat() {
    const search = useSearchParams();
    const initialRoomId = search.get("roomId") ? Number(search.get("roomId")) : null;

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
    const ready = useMemo(() => typeof window !== "undefined", []);

    // ESC → 이모지 닫기
    useEffect(() => {
        if (!emojiOpen) return;
        const onEsc = (e) => e.key === "Escape" && setEmojiOpen(false);
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
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
                } else setMe(null);
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
    const myRole = resolveRole(activeChat, me?.id);
    const otherName = activeChat?.counterpartyName ?? "상대";
    const otherAvatar = activeChat?.counterpartyProfile || "/images/profile_img/sangjun.jpg";

    // WebSocket
    const { connected, messages: wsMessages, sendText, sendImage } = useChatSocket({
        roomId: me?.id ? activeId ?? 0 : 0,
        me: me ?? undefined,
        baseUrl: process.env.NEXT_PUBLIC_API_BASE,
    });

    // 메시지 로드 (서버 SYSTEM은 무시하고, 클라 고정 1개만 상단에)
    useEffect(() => {
        if (!activeId || !me?.id) return;
        wsCursorRef.current = 0;
        (async () => {
            try {
                const list = await fetchMessages(activeId, 30);
                const mapped = (list || [])
                    .map((m) => mapMessageToUi(m, me, otherName, otherAvatar))
                    .filter((x) => x.type !== "SYSTEM");
                setMessagesByRoom((prev) => ({
                    ...prev,
                    [activeId]: [createSystemIntro(activeId), ...mapped],
                }));
            } catch {
                setMessagesByRoom((prev) => ({
                    ...prev,
                    [activeId]: [createSystemIntro(activeId)],
                }));
            }
        })();
    }, [activeId, me?.id, otherName, otherAvatar]);

    // WS 메시지 반영 (SYSTEM 무시)
    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null || !me?.id) return;
        const delta = wsMessages.slice(wsCursorRef.current);
        wsCursorRef.current = wsMessages.length;

        setMessagesByRoom((prev) => {
            const cur = [...(prev[activeId] || [])];
            for (const m of delta) {
                const next = mapMessageToUi(m, me, otherName, otherAvatar);
                if (next.type === "SYSTEM") continue; // 서버 시스템 메세지는 버림

                if (m.tempId) {
                    const idx = cur.findIndex((x) => x.tempId === m.tempId);
                    if (idx >= 0) {
                        cur[idx] = { ...next, tempId: undefined };
                        continue;
                    }
                }
                if (typeof m.messageId === "number" && cur.some((x) => x.id === m.messageId)) continue;
                cur.push(next);
            }
            return { ...prev, [activeId]: cur };
        });
    }, [wsMessages, activeId, me?.id, otherName, otherAvatar]);

    /** ✅ 하단 스크롤 (컨테이너 직접 — window는 건드리지 않음) */
    const scrollToBottom = useCallback((smooth = false) => {
        const el = scrollerRef.current;
        if (!el) return;
        const doScroll = () => {
            if (smooth && "scrollTo" in el) {
                el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            } else {
                el.scrollTop = el.scrollHeight;
            }
        };
        requestAnimationFrame(doScroll); // 레이아웃 확정 이후 실행
    }, []);

    // 방 전환/첫 진입 시
    useEffect(() => {
        if (!activeId) return;
        requestAnimationFrame(() => scrollToBottom(false));
    }, [activeId, scrollToBottom]);

    // 메시지 수 변화 시
    useEffect(() => {
        if (!activeId) return;
        scrollToBottom(false);
    }, [activeId, messagesByRoom[activeId]?.length, scrollToBottom]);

    /** ✅ 전송 */
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
                const res = await uploadChatImage(pendingImage.file);
                imageUrl = res?.url || null;
            }
            if (connected) {
                if (imageUrl) sendImage(imageUrl, tempId);
                if (trimmed) sendText(trimmed, tempId);
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

    // 파일/붙여넣기
    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setPendingImage({ file, previewUrl });
    };
    const onPaste = (e) => {
        const item = Array.from(e.clipboardData.items).find((x) => x.type.startsWith("image/"));
        if (item) {
            const file = item.getAsFile();
            if (file) setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
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
        setText(text.slice(0, start) + emoji + text.slice(end));
    };

    // 날짜 구분자 (SYSTEM 제외)
    const messages = (messagesByRoom[activeId] ?? []).reduce((acc, cur, idx, all) => {
        if (cur.type === "SYSTEM") {
            acc.push(cur);
            return acc;
        }
        const prev = all[idx - 1];
        const prevTs = prev?.type === "SYSTEM" ? null : prev?.ts;
        const needDivider =
            !prevTs ||
            prevTs.getFullYear() !== cur.ts.getFullYear() ||
            prevTs.getMonth() !== cur.ts.getMonth() ||
            prevTs.getDate() !== cur.ts.getDate();
        if (needDivider) acc.push({ __divider: true, label: fmtDateLine(cur.ts), key: `d-${cur.id}` });
        acc.push(cur);
        return acc;
    }, []);

    return (
        <div className={s.wrap}>
            <h2 className={s.title}>채팅</h2>
            <div className={s.box}>
                {/* ===== 좌측 목록 ===== */}
                <aside className={s.list}>
                    <h3 className={s.listTitle}>채팅 목록 {connected ? "(연결됨)" : "(연결 중…)"}</h3>
                    <ScrollArea className={s.ul} component="ul" sx={{ maxHeight: "600px" }}>
                        {rooms.map((r) => {
                            const role = resolveRole(r, me?.id);
                            return (
                                <li
                                    key={r.roomId}
                                    className={`${s.item} ${String(activeId) === String(r.roomId) ? s.active : ""}`}
                                    onClick={() => setActiveId(r.roomId)}
                                >
                                    <img className={s.thumb} src={r.productThumb} alt="" />
                                    <div className={s.itemMain}>
                                        <div className={s.top}>
                                            <span className={s.name}>{r.counterpartyName}</span>
                                            <span className={s.time}>{r.lastAt ? fmtHHMM(new Date(r.lastAt)) : "-"}</span>
                                        </div>
                                        <div className={s.productRow}>
                                            <span className={s.product}>{r.productTitle}</span>
                                            {role && (
                                                <span
                                                    className={`${s.roleBadge} ${
                                                        role === "판매자" ? s.roleSeller : s.roleBuyer
                                                    }`}
                                                >
                          {role}
                        </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ScrollArea>
                </aside>

                {/* ===== 우측 채팅 ===== */}
                <section className={s.room}>
                    {/* 상단 헤더: 상품/상대/내 역할 */}
                    {activeChat && (
                        <div className={s.roomHeader}>
                            <img className={s.roomThumb} src={activeChat.productThumb} alt="" />
                            <div className={s.roomMeta}>
                                <div className={s.roomTitleRow}>
                                    <span className={s.roomProduct}>{activeChat.productTitle}</span>
                                    {myRole && (
                                        <span
                                            className={`${s.roleBadge} ${
                                                myRole === "판매자" ? s.roleSeller : s.roleBuyer
                                            }`}
                                        >
                      {myRole}
                    </span>
                                    )}
                                </div>
                                <div className={s.roomSub}>
                                    상대: <strong>{otherName}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 메시지 영역 */}
                    <ScrollArea ref={scrollerRef} className={s.messages} sx={{ maxHeight: "600px" }}>
                        {messages.map((m) =>
                            m.__divider ? (
                                <div key={m.key} className={s.dateDivider}>
                                    {m.label}
                                </div>
                            ) : m.type === "SYSTEM" ? (
                                <div key={m.id} className={s.systemNotice}>
                                    <span className={s.systemBadge}>SYSTEM</span>
                                    <p className={s.systemText}>{m.text}</p>
                                </div>
                            ) : (
                                <div key={m.id} className={`${s.msg} ${m.fromMe ? s.me : s.other}`}>
                                    {!m.fromMe && (
                                        <div className={s.senderRow}>
                                            <img className={s.avatar} src={otherAvatar} alt="" />
                                            <span className={s.senderName}>{m.senderName}</span>
                                        </div>
                                    )}
                                    <div className={s.bubbleRow}>
                                        {m.imageUrl ? (
                                            <img
                                                className={s.image}
                                                src={m.imageUrl}
                                                alt=""
                                                onLoad={() => scrollToBottom(false)} // 이미지 지연 로드시 보정
                                            />
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

                    {/* 입력 바 */}
                    <form
                        className={s.inputBar}
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // window로 버블링 방지
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
                                        <img
                                            src={pendingImage.previewUrl}
                                            alt=""
                                            onLoad={() => scrollToBottom(false)}
                                        />
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
                                            e.stopPropagation(); // window로 버블링 방지
                                            doSendMessage();
                                        }
                                    }}
                                    rows={1}
                                />
                            </div>
                        </div>

                        <button className={s.sendBtn} type="submit" disabled={!text.trim() && !pendingImage}>
                            보내기
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}

/** ---------- 서버 DTO → UI ---------- */
function mapMessageToUi(m, me, otherName, otherAvatar) {
    const rawType = (m.type || "").toUpperCase();
    const isSystem = rawType === "SYSTEM" || m.senderId === 0 || m.isSystem === true;

    if (isSystem) {
        return {
            id: m.messageId ?? `sys-${m.roomId || "r"}-${m.time || Date.now()}`,
            type: "SYSTEM",
            text:
                m.content ||
                m.text ||
                "안전한 거래를 위해 개인정보를 포함한 내용은 채팅에서 삼가해주세요.",
            ts: m.time ? new Date(m.time) : new Date(0),
            fromMe: false,
            senderName: "system",
            avatar: null,
            read: true,
        };
    }

    const type = rawType || (m.imageUrl ? "IMAGE" : "TEXT");
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
