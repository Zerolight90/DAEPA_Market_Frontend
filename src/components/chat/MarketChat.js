// /components/chat/MarketChat.js
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import s from "./MarketChat.module.css";
import { useChatSocket } from "@/lib/chat/useChatSocket";
import { fetchMe, fetchRooms } from "@/lib/chat/api";
import { useSearchParams } from "next/navigation";
import { Box, styled } from "@mui/material";

// 스크롤 영역
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

// 시간/날짜 유틸
const pad2 = (n) => String(n).padStart(2, "0");
const toDate = (v) => (v instanceof Date ? v : new Date(v));
const isToday = (d) => {
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
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
    // 로그인 사용자: /api/auth/me → 없으면 데모 계정(7)
    const [me, setMe] = useState({ id: 7, name: "유저7", profile: "/images/profile_img/sangjun.jpg" });

    useEffect(() => {
        (async () => {
            const m = await fetchMe();
            if (m?.userId) {
                setMe((prev) => ({ ...prev, id: m.userId }));
            }
        })();
    }, []);

    // URL ?roomId=9021
    const search = useSearchParams();
    const initialRoomId = search.get("roomId") ? Number(search.get("roomId")) : null;

    const [roomList, setRoomList] = useState([]);
    const [activeId, setActiveId] = useState(initialRoomId);
    const scrollerRef = useRef(null);
    const [text, setText] = useState("");

    // 방 목록 로드
    useEffect(() => {
        (async () => {
            try {
                const list = await fetchRooms(me.id);
                setRoomList(list || []);
                if (!initialRoomId && list?.length && !activeId) {
                    setActiveId(list[0].roomId);
                }
            } catch (e) {
                console.error("load rooms failed", e);
            }
        })();
    }, [me.id, initialRoomId, activeId]);

    const activeChat = useMemo(
        () => roomList.find((r) => String(r.roomId) === String(activeId)),
        [roomList, activeId]
    );
    const otherName = activeChat?.counterpartyName ?? "상대";
    const otherAvatar = activeChat?.counterpartyProfile || "/images/profile_img/sangjun.jpg";

    // WS 훅
    const { connected, loaded, messages, sendText, sendRead } = useChatSocket({
        roomId: activeId ?? 0,
        me,
        // baseUrl: 'http://localhost:8080', // 필요 시 강제 지정
    });

    // 날짜 구분선 적용된 메시지
    const decorated = useMemo(() => {
        const src = Array.isArray(messages) ? messages : [];
        const ui = [];
        for (let i = 0; i < src.length; i++) {
            const m = src[i];
            const prev = src[i - 1];
            const curTs = new Date(m.time ?? Date.now());
            const needDivider =
                !prev ||
                new Date(prev.time).getFullYear() !== curTs.getFullYear() ||
                new Date(prev.time).getMonth() !== curTs.getMonth() ||
                new Date(prev.time).getDate() !== curTs.getDate();

            if (needDivider) {
                ui.push({ __divider: true, key: `d-${m.messageId ?? m.tempId ?? i}`, label: fmtDateLine(curTs) });
            }
            ui.push({
                key: m.messageId ?? m.tempId ?? `${activeId}-${i}`,
                fromMe: Number(m.senderId) === Number(me.id),
                senderName: Number(m.senderId) === Number(me.id) ? me.name : otherName,
                avatar: Number(m.senderId) === Number(me.id) ? me.profile : otherAvatar,
                text: m.text || "",
                ts: curTs,
            });
        }
        return ui;
    }, [messages, activeId, me.id, me.name, me.profile, otherName, otherAvatar]);

    // 스크롤 하단 고정
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [decorated.length]);

    // 전송
    const onSubmit = (e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || !activeId) return;
        const tempId = `tmp-${activeId}-${Date.now()}`;
        sendText(trimmed, tempId);
        setText("");
    };

    // 읽음 전송: 화면에 보이는 “상대 메시지” 중 마지막 messageId를 찾아 전송
    useEffect(() => {
        if (!connected || !activeId) return;
        // messages는 정규화된 원본
        const others = [...(messages || [])].filter((m) => Number(m.senderId) !== Number(me.id));
        const last = others.length ? others[others.length - 1] : null;
        if (last?.messageId) {
            sendRead(last.messageId);
        }
    }, [connected, activeId, messages, me.id, sendRead]);

    return (
        <div className={s.wrap}>
            <h2 className={s.title}>채팅</h2>
            <div className={s.box}>
                {/* 좌측: 방 목록 */}
                <aside className={s.list}>
                    <h3 className={s.listTitle}>채팅 목록 {connected ? "(연결됨)" : "(연결 중…)"}</h3>

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
                                        <span className={s.time}>{r.lastAt ? fmtHHMM(new Date(r.lastAt)) : "-"}</span>
                                    </div>
                                    <div className={s.productRow}>
                    <span className={s.product} title={r.productTitle}>
                      {r.productTitle}
                    </span>
                                        <span
                                            className={`${s.status} ${
                                                r.statusBadge === "거래완료" ? s.done : r.statusBadge === "예약중" ? s.reserved : s.progress
                                            }`}
                                        >
                      {r.statusBadge}
                    </span>
                                    </div>
                                    <div className={s.bottom}>
                                        <span className={s.last}>{r.lastMessage ?? ""}</span>
                                        {r.unread > 0 && <span className={s.unread}>{r.unread}</span>}
                                        <span className={`${s.role} ${r.myRole === "판매자" ? s.seller : s.buyer}`}>{r.myRole}</span>
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
                                    <span className={`${s.role} ${activeChat.myRole === "판매자" ? s.seller : s.buyer}`}>{activeChat.myRole}</span>
                                    <span className={s.dot}>•</span>
                                    <span className={s.roomProduct} title={activeChat.productTitle}>
                    {activeChat.productTitle}
                  </span>
                                    <span
                                        className={`${s.status} ${
                                            activeChat.statusBadge === "거래완료" ? s.done : activeChat.statusBadge === "예약중" ? s.reserved : s.progress
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

                        {decorated.map((m) =>
                            m.__divider ? (
                                <div key={m.key} className={s.dateDivider}>
                                    {m.label}
                                </div>
                            ) : (
                                <div key={m.key} className={`${s.msg} ${m.fromMe ? s.me : s.other}`}>
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
                                </div>
                            )
                        )}
                    </ScrollArea>

                    {/* 입력 */}
                    <form
                        className={s.inputBar}
                        onSubmit={onSubmit}
                    >
            <textarea
                className={s.input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="메시지를 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈)"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit(e);
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
        </div>
    );
}
