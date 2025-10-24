// /components/chat/MarketChat.js
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import s from "./MarketChat.module.css";
import { useChatSocket } from "@/lib/chat/useChatSocket";
import { fetchRooms, fetchMe } from "@/lib/chat/api";
import { useSearchParams } from "next/navigation";
import { Box, styled } from "@mui/material";

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
    return d.getFullYear() === t.getFullYear() &&
        d.getMonth() === t.getMonth() &&
        d.getDate() === t.getDate();
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

export default function MarketChat() {
    const search = useSearchParams();
    const initialRoomId = search.get("roomId") ? Number(search.get("roomId")) : null;

    const [me, setMe] = useState(null);
    const [roomList, setRoomList] = useState([]);
    const [activeId, setActiveId] = useState(initialRoomId);
    const [messagesByRoom, setMessagesByRoom] = useState({});
    const [text, setText] = useState("");
    const scrollerRef = useRef(null);

    const ready = useMemo(() => typeof window !== "undefined", []);

    // 1) 내 정보 로딩
    useEffect(() => {
        if (!ready) return;
        (async () => {
            try {
                const res = await fetchMe(); // { userId, authenticated } | null
                if (res?.userId) {
                    setMe({ id: res.userId, name: `유저${res.userId}`, profile: "/images/profile_img/sangjun.jpg" });
                } else {
                    // 비로그인 개발 편의를 위해 임시(원하면 null로 두고 로그인 유도)
                    setMe({ id: 7, name: "유저7(임시)", profile: "/images/profile_img/sangjun.jpg" });
                }
            } catch {
                setMe({ id: 7, name: "유저7(임시)", profile: "/images/profile_img/sangjun.jpg" });
            }
        })();
    }, [ready]);

    // 2) 방 목록 로딩
    useEffect(() => {
        if (!ready || !me?.id) return;
        (async () => {
            try {
                const list = await fetchRooms(me.id); // 백엔드가 쿠키에서 읽는 경우 me.id 생략 가능
                setRoomList(list);
                if (!initialRoomId && list.length && !activeId) {
                    setActiveId(list[0].roomId);
                }
            } catch (e) {
                console.error("load rooms failed", e);
            }
        })();
    }, [ready, me?.id, initialRoomId, activeId]);

    const activeChat = useMemo(
        () => roomList.find((r) => String(r.roomId) === String(activeId)),
        [roomList, activeId]
    );

    const otherName = activeChat?.counterpartyName ?? "상대";
    const otherAvatar = activeChat?.counterpartyProfile || "/images/profile_img/sangjun.jpg";

    // 3) WS 훅 (me가 준비된 이후에만 연결)
    const { connected, loaded, messages: wsMessages, sendText, sendRead } = useChatSocket({
        roomId: activeId ?? 0,
        me: me || undefined,
        // baseUrl: process.env.NEXT_PUBLIC_BACKEND_ORIGIN, // 필요 시 명시
    });

    // 4) WS 메시지를 화면 상태에 반영
    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null || !me?.id) return;
        setMessagesByRoom((prev) => ({
            ...prev,
            [activeId]: wsMessages.map((m) => {
                const fromMe = Number(m.senderId) === Number(me.id);
                return {
                    id: m.messageId || `${activeId}-${m.time || Date.now()}`,
                    fromMe,
                    senderName: fromMe ? me.name : otherName,
                    avatar: fromMe ? me.profile : otherAvatar,
                    text: m.text || m.content || "",
                    ts: m.time ? new Date(m.time) : new Date(),
                    read: false,
                };
            }),
        }));
    }, [wsMessages, activeId, me?.id, me?.name, me?.profile, otherName, otherAvatar]);

    // 스크롤 하단 고정
    const scrollToBottom = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setTimeout(() => (el.scrollTop = el.scrollHeight), 0);
    };
    useEffect(() => {
        scrollToBottom();
    }, [messagesByRoom[activeId]?.length]);

    // 전송
    const doSendMessage = () => {
        if (!me?.id) return;
        const trimmed = text.trim();
        if (!trimmed || !activeId) return;

        const optimistic = {
            id: `${activeId}-${Date.now()}`,
            fromMe: true,
            senderName: me.name,
            avatar: me.profile,
            text: trimmed,
            ts: new Date(),
            read: false,
        };
        setMessagesByRoom((prev) => ({
            ...prev,
            [activeId]: [...(prev[activeId] || []), optimistic],
        }));

        sendText(trimmed, optimistic.id);
        setText("");
    };

    // 읽음 전송
    useEffect(() => {
        if (!connected || !activeId || !me?.id) return;
        const arr = messagesByRoom[activeId] || [];
        const lastOther = [...arr].reverse().find((m) => !m.fromMe);
        if (lastOther && lastOther.id) {
            const asNumber = Number(String(lastOther.id).split("-").pop());
            if (Number.isFinite(asNumber)) sendRead(asNumber);
        }
    }, [connected, activeId, messagesByRoom, sendRead, me?.id]);

    // 날짜 구분선 포함 리스트
    const messages = (messagesByRoom[activeId] ?? []).reduce((acc, cur, idx, all) => {
        const prev = all[idx - 1];
        const needDivider =
            !prev ||
            prev.ts.getFullYear() !== cur.ts.getFullYear() ||
            prev.ts.getMonth() !== cur.ts.getMonth() ||
            prev.ts.getDate() !== cur.ts.getDate();
        if (needDivider) {
            acc.push({ __divider: true, label: fmtDateLine(cur.ts), key: `d-${cur.id}` });
        }
        acc.push(cur);
        return acc;
    }, []);

    return (
        <div className={s.wrap}>
            <h2 className={s.title}>채팅</h2>

            {!me?.id && (
                <div className={s.box}>
                    <section className={s.room}>
                        <div className={s.empty}>로그인이 필요합니다.</div>
                    </section>
                </div>
            )}

            {!!me?.id && (
                <div className={s.box}>
                    {/* 좌측: 방 목록 */}
                    <aside className={s.list}>
                        <h3 className={s.listTitle}>
                            채팅 목록 {connected ? "(연결됨)" : "(연결 중…)"}
                        </h3>

                        {roomList.length === 0 && <div className={s.empty}>채팅방이 없습니다.</div>}

                        <ScrollArea className={s.ul} component="ul" sx={{ maxHeight: "600px" }}>
                            {roomList.map((r) => (
                                <li
                                    key={r.roomId}
                                    className={`${s.item} ${String(activeId) === String(r.roomId) ? s.active : ""}`}
                                    onClick={() => setActiveId(r.roomId)}
                                >
                                    <img className={s.thumb} src={r.productThumb || "/images/profile_img/sangjun.jpg"} alt="" />
                                    <div className={s.itemMain}>
                                        <div className={s.top}>
                                            <span className={s.name}>{r.counterpartyName ?? "-"}</span>
                                            <span className={s.time}>
                        {r.lastAt ? fmtHHMM(new Date(r.lastAt)) : "-"}
                      </span>
                                        </div>
                                        <div className={s.productRow}>
                      <span className={s.product} title={r.productTitle}>
                        {r.productTitle}
                      </span>
                                            <span
                                                className={`${s.status} ${
                                                    r.statusBadge === "거래완료"
                                                        ? s.done
                                                        : r.statusBadge === "예약중"
                                                            ? s.reserved
                                                            : s.progress
                                                }`}
                                            >
                        {r.statusBadge}
                      </span>
                                        </div>
                                        <div className={s.bottom}>
                                            <span className={s.last}>{r.lastMessage ?? ""}</span>
                                            {r.unread > 0 && <span className={s.unread}>{r.unread}</span>}
                                            <span className={`${s.role} ${r.myRole === "판매자" ? s.seller : s.buyer}`}>
                        {r.myRole}
                      </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ScrollArea>
                    </aside>

                    {/* 우측: 채팅방 */}
                    <section className={s.room}>
                        <header className={s.header}>
                            {activeChat ? (
                                <>
                                    <div className={s.meta}>
                                        <strong className={s.roomName}>{otherName}</strong>
                                        <span className={`${s.role} ${activeChat.myRole === "판매자" ? s.seller : s.buyer}`}>
                      {activeChat.myRole}
                    </span>
                                        <span className={s.dot}>•</span>
                                        <span className={s.roomProduct} title={activeChat.productTitle}>
                      {activeChat.productTitle}
                    </span>
                                        <span
                                            className={`${s.status} ${
                                                activeChat.statusBadge === "거래완료"
                                                    ? s.done
                                                    : activeChat.statusBadge === "예약중"
                                                        ? s.reserved
                                                        : s.progress
                                            }`}
                                        >
                      {activeChat.statusBadge}
                    </span>
                                    </div>
                                    <img className={s.headerThumb} src={activeChat.productThumb || "/images/profile_img/sangjun.jpg"} alt="" />
                                </>
                            ) : (
                                <div className={s.meta}>
                                    <strong>-</strong>
                                </div>
                            )}
                        </header>

                        <ScrollArea ref={scrollerRef} className={s.messages} sx={{ maxHeight: "600px" }}>
                            {!activeId && <div className={s.empty}>방을 선택하세요.</div>}
                            {!!activeId && !loaded && <div className={s.empty}>서버에서 불러오는 중…</div>}

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
                                            <p className={s.bubble}>{m.text}</p>
                                            <span className={s.timeSmall}>{fmtHHMM(m.ts)}</span>
                                        </div>
                                        {m.fromMe && m.read && <span className={s.readText}>읽음</span>}
                                    </div>
                                )
                            )}
                        </ScrollArea>

                        <form
                            className={s.inputBar}
                            onSubmit={(e) => { e.preventDefault(); doSendMessage(); }}
                        >
              <textarea
                  className={s.input}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="메시지를 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈)"
                  onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          doSendMessage();
                      }
                  }}
                  rows={1}
              />
                            <button className={s.sendBtn} type="submit" disabled={!text.trim() || !activeId}>
                                보내기
                            </button>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
