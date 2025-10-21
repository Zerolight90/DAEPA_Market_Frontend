"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import s from "./MarketChat.module.css";
import { useChatSocket } from "@/lib/chat/useChatSocket";
import { fetchRooms } from "@/lib/chat/api";
import { useSearchParams } from "next/navigation";

// ⬇️ MUI 추가
import { Box, styled } from "@mui/material";

/** 재사용 가능한 MUI 스크롤 영역 */
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

/* ---------- 시간/날짜 유틸 ---------- */
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
    const yo = ["일","월","화","수","목","금","토"][d.getDay()];
    return `${d.getFullYear()}.${pad2(d.getMonth()+1)}.${pad2(d.getDate())} (${yo})`;
};

export default function MarketChat() {
    // URL에서 roomId 추출 (/chat?roomId=###)
    const search = useSearchParams();
    const initialRoomId = search.get("roomId") ? Number(search.get("roomId")) : null;

    // 임시 로그인 유저 (나중에 쿠키/JWT 연동 가능)
    const me = { id: 10, name: "한교동", profile: "/images/avatar-me.png" };


    const [roomList, setRoomList] = useState([]);
    const [activeId, setActiveId] = useState(initialRoomId);
    const [messagesByRoom, setMessagesByRoom] = useState({});
    const [text, setText] = useState("");
    const scrollerRef = useRef(null);

    // 방 목록 로딩
    useEffect(() => {
        (async () => {
            try {
                const list = await fetchRooms(me.id);
                setRoomList(list);
                if (!initialRoomId && list.length && !activeId) {
                    setActiveId(list[0].roomId);
                }
            } catch (e) {
                console.error("load rooms failed", e);
            }
        })();
    }, [me.id, initialRoomId]);

    const activeChat = useMemo(
        () => roomList.find((r) => r.roomId === activeId),
        [roomList, activeId]
    );

    // 상대 프로필/닉네임
    const otherName   = activeChat?.counterpartyName ?? "상대";
    const otherAvatar = activeChat?.counterpartyProfile || "/images/avatar-default.png";

    // WS 훅
    const { connected, loaded, messages: wsMessages, sendText, sendRead } = useChatSocket({
        roomId: activeId ?? 0,
        me,
    });

    // WS 메시지를 화면 상태에 반영
    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null) return;

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
    }, [wsMessages, activeId, me.name, me.profile, otherName, otherAvatar]);

    // 스크롤 하단 고정
    const scrollToBottom = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setTimeout(() => (el.scrollTop = el.scrollHeight), 0);
    };
    useEffect(() => {
        scrollToBottom();
    }, [messagesByRoom[activeId]?.length]);

    const sendMessage = () => {
        const trimmed = text.trim();
        if (!trimmed || !activeId) return;

        // 낙관적 반영
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

        // 실제 전송
        sendText(trimmed, optimistic.id);
        setText("");
    };

    // 읽음 전송
    useEffect(() => {
        if (!connected || !activeId) return;
        const arr = messagesByRoom[activeId] || [];
        const lastOther = [...arr].reverse().find((m) => !m.fromMe);
        if (lastOther && lastOther.id) {
            const asNumber = Number(String(lastOther.id).split("-").pop());
            if (Number.isFinite(asNumber)) sendRead(asNumber);
        }
    }, [connected, activeId, messagesByRoom, sendRead]);

    // 날짜 구분선 삽입된 리스트
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
            <div className={s.box}>
                {/* 좌측: 방 목록 */}
                <aside className={s.list}>
                    <h3 className={s.listTitle}>채팅 목록 {connected ? "(연결됨)" : "(연결 중…)"}</h3>

                    {roomList.length === 0 && <div className={s.empty}>채팅방이 없습니다.</div>}

                    <ScrollArea className={s.ul} component="ul" sx={{ maxHeight: "600px" }}>
                        {roomList.map((r) => (
                            <li
                                key={r.roomId}
                                className={`${s.item} ${activeId === r.roomId ? s.active : ""}`}
                                onClick={() => setActiveId(r.roomId)}
                            >
                                <img className={s.thumb} src={r.productThumb || "/images/placeholder.jpg"} alt="" />
                                <div className={s.itemMain}>
                                    <div className={s.top}>
                                        <span className={s.name}>{r.counterpartyName ?? "-"}</span>
                                        <span className={s.time}>
                                            {r.lastAt ? fmtHHMM(new Date(r.lastAt)) : "-"}
                                        </span>
                                    </div>
                                    <div className={s.productRow}>
                                        <span className={s.product} title={r.productTitle}>{r.productTitle}</span>
                                        <span className={`${s.status} ${
                                            r.statusBadge === "거래완료" ? s.done :
                                                r.statusBadge === "예약중" ? s.reserved : s.progress}`}>
                                            {r.statusBadge}
                                        </span>
                                    </div>
                                    <div className={s.bottom}>
                                        <span className={s.last}>{r.lastMessage ?? ""}</span>
                                        {r.unread > 0 && <span className={s.unread}>{r.unread}</span>}
                                        <span className={`${s.role} ${
                                            r.myRole === "판매자" ? s.seller : s.buyer}`}>{r.myRole}</span>
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
                                    <span className={`${s.role} ${
                                        activeChat.myRole === "판매자" ? s.seller : s.buyer}`}>
                                        {activeChat.myRole}
                                    </span>
                                    <span className={s.dot}>•</span>
                                    <span className={s.roomProduct} title={activeChat.productTitle}>
                                        {activeChat.productTitle}
                                    </span>
                                    <span className={`${s.status} ${
                                        activeChat.statusBadge === "거래완료" ? s.done :
                                            activeChat.statusBadge === "예약중" ? s.reserved : s.progress}`}>
                                        {activeChat.statusBadge}
                                    </span>
                                </div>
                                <img className={s.headerThumb}
                                     src={activeChat.productThumb || "/images/placeholder.jpg"} alt="" />
                            </>
                        ) : (
                            <div className={s.meta}><strong>-</strong></div>
                        )}
                    </header>

                    <ScrollArea ref={scrollerRef} className={s.messages} sx={{ maxHeight: "600px" }}>
                        {!activeId && <div className={s.empty}>방을 선택하세요.</div>}
                        {!!activeId && !loaded && <div className={s.empty}>서버에서 불러오는 중…</div>}

                        {messages.map((m) => m.__divider ? (
                            <div key={m.key} className={s.dateDivider}>{m.label}</div>
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
                        ))}
                    </ScrollArea>

                    {/* 입력 */}
                    <form className={s.inputBar} onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                        <textarea
                            className={s.input}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="메시지를 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈)"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
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
