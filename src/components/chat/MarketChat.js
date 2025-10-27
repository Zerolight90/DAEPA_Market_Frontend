"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import s from "./MarketChat.module.css";
import { useChatSocket } from "@/lib/chat/useChatSocket";
import { fetchRooms, fetchMe, fetchMessages, sendMessageRest, markReadUpTo } from "@/lib/chat/api";
import { useSearchParams } from "next/navigation";
import { Box, styled } from "@mui/material";

/** ===== 로그 스위치 ===== */
const LOG = false;
const log = (...a) => LOG && console.log("[CHAT]", ...a);

// ✅ READ 스로틀 간격 (정의 누락으로 발생했던 ReferenceError 방지)
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
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} (${yo})`;
};

export default function MarketChat() {
    const search = useSearchParams();
    const initialRoomId = search.get("roomId") ? Number(search.get("roomId")) : null;

    const [me, setMe] = useState(null); // { id, name, profile } | null
    const [roomList, setRoomList] = useState([]); // 방 목록
    const [activeId, setActiveId] = useState(initialRoomId);
    const [messagesByRoom, setMessagesByRoom] = useState({});
    const [text, setText] = useState("");

    const scrollerRef = useRef(null);

    // WS 이벤트 스트림 커서
    const wsCursorRef = useRef(0);

    // 읽음 중복/과속 방지
    const lastReadSentRef = useRef({}); // { [roomId]: lastId }
    const lastReadSentAtRef = useRef(0);

    const ready = useMemo(() => typeof window !== "undefined", []);

    // 1) 내 정보 로드
    useEffect(() => {
        if (!ready) return;
        (async () => {
            try {
                const res = await fetchMe(); // { userId } | null
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

    // 2) 방 목록 로드 (로그인 상태에서만)
    useEffect(() => {
        if (!ready || !me?.id) return;
        (async () => {
            try {
                const list = await fetchRooms(); // 서버가 쿠키에서 유저 식별
                const safe = Array.isArray(list) ? list : [];
                setRoomList(safe);

                const deduped = Array.from(
                    new Map(safe.filter(Boolean).map((r) => [String(r.roomId), r])).values()
                );
                if (!initialRoomId && deduped.length && !activeId) {
                    setActiveId(deduped[0].roomId);
                }
            } catch (e) {
                console.error("load rooms failed", e);
                setRoomList([]);
            }
        })();
    }, [ready, me?.id, initialRoomId, activeId]);

    // roomId 기준 중복 제거
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
    const otherAvatar = activeChat?.counterpartyProfile || "/images/profile_img/sangjun.jpg";

    // 3) WebSocket (WS 전용, 폴링 없음)
    const { connected, messages: wsMessages, sendText, sendRead, setOnServerMessage } = useChatSocket({
        roomId: me?.id ? (activeId ?? 0) : 0, // 로그인 전에는 0으로 미연결
        me: me ?? undefined,                   // 로그인 전에는 undefined
        baseUrl: process.env.NEXT_PUBLIC_API_BASE,
    });

    // 서버 푸시 메시지 추가 시 커스텀 처리 필요하면 등록 (선택)
    useEffect(() => {
        setOnServerMessage((payload) => {
            // 필요시 글로벌 핸들러 (예: 사운드, 브라우저 알림 등)
        });
    }, [setOnServerMessage]);

    // 방 전환 시: 히스토리 로드 + 커서 리셋
    useEffect(() => {
        if (!activeId || !me?.id) return;
        wsCursorRef.current = 0;

        (async () => {
            try {
                const list = await fetchMessages(activeId, 30 /* size */);
                const mapped = (list || []).map((m) => mapMessageToUi(m, me, otherName, otherAvatar));
                setMessagesByRoom((prev) => ({ ...prev, [activeId]: mapped }));
            } catch (e) {
                console.error("load history failed", e);
                setMessagesByRoom((prev) => ({ ...prev, [activeId]: [] }));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId, me?.id]);

    // WS 메시지 반영 (증분 처리 + READ/SYSTEM 분기 + tempId 치환 + 중복 방지)
    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null || !me?.id) return;

        const delta = wsMessages.slice(wsCursorRef.current);
        wsCursorRef.current = wsMessages.length;

        setMessagesByRoom((prev) => {
            const cur = [...(prev[activeId] || [])];

            for (const m of delta) {
                const msgType = m.type || "TEXT";

                // READ 이벤트
                if (msgType === "READ") {
                    if (Number(m.readerId) !== Number(me.id)) {
                        const upTo = Number(m.lastSeenMessageId);
                        for (let i = 0; i < cur.length; i++) {
                            const it = cur[i];
                            if (it.fromMe && typeof it.id === "number") {
                                if (!Number.isNaN(upTo) && it.id <= upTo && !it.read) {
                                    cur[i] = { ...it, read: true };
                                }
                            }
                        }
                    }
                    continue; // 렌더하지 않음
                }

                const next = mapMessageToUi(m, me, otherName, otherAvatar);

                // 낙관 치환
                if (m.tempId) {
                    const idx = cur.findIndex((x) => x.tempId === m.tempId);
                    if (idx >= 0) {
                        cur[idx] = { ...next, tempId: undefined };
                        continue;
                    }
                }

                // 서버 messageId 중복 guard
                if (typeof m.messageId === "number" && cur.some((x) => x.id === m.messageId)) {
                    continue;
                }

                cur.push(next);
            }

            return { ...prev, [activeId]: cur };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wsMessages, activeId, me?.id]);

    // 스크롤 하단 고정
    const scrollToBottom = () => {
        const el = scrollerRef.current;
        if (!el) return;
        setTimeout(() => (el.scrollTop = el.scrollHeight), 0);
    };
    useEffect(() => {
        scrollToBottom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messagesByRoom[activeId]?.length]);

    // 전송 (낙관 업데이트 + WS/REST 폴백)
    const doSendMessage = async () => {
        if (!me?.id) return;
        const trimmed = text.trim();
        if (!trimmed || !activeId) return;

        const tempId = `tmp-${activeId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const optimistic = {
            id: tempId,
            tempId,
            fromMe: true,
            senderName: me.name,
            avatar: me.profile,
            text: trimmed,
            type: "TEXT",
            ts: new Date(),
            read: false,
        };
        setMessagesByRoom((prev) => ({
            ...prev,
            [activeId]: [...(prev[activeId] || []), optimistic],
        }));

        setText("");

        try {
            if (connected) {
                window.requestAnimationFrame(() => {
                    sendText(trimmed, tempId);
                });
            } else {
                const res = await sendMessageRest(activeId, {
                    text: trimmed,
                    imageUrl: null,
                    tempId,
                    senderId: me.id,
                });

                setMessagesByRoom((prev) => {
                    const cur = [...(prev[activeId] || [])];
                    const idx = cur.findIndex((x) => x.tempId === tempId);
                    const mapped = mapMessageToUi(res, me, otherName, otherAvatar);
                    if (idx >= 0) cur[idx] = { ...mapped, tempId: undefined };
                    else cur.push(mapped);
                    return { ...prev, [activeId]: cur };
                });
            }
        } catch (e) {
            console.error("send failed", e);
            setMessagesByRoom((prev) => {
                const cur = [...(prev[activeId] || [])];
                const idx = cur.findIndex((x) => x.tempId === tempId);
                if (idx >= 0) {
                    cur[idx] = { ...cur[idx], text: `${cur[idx].text} (전송 실패)` };
                }
                return { ...prev, [activeId]: cur };
            });
        }
    };

    // ✅ 읽음 전송 (WS 또는 REST 폴백) — 스로틀 적용
    useEffect(() => {
        if (!activeId || !me?.id) return;

        const arr = messagesByRoom[activeId] || [];
        const lastOtherReal = [...arr]
            .filter((m) => !m.fromMe && typeof m.id === "number" && m.type !== "SYSTEM")
            .pop();

        if (!lastOtherReal) return;

        const prevSent = lastReadSentRef.current[activeId] ?? 0;
        const now = Date.now();
        if (lastOtherReal.id > prevSent && now - (lastReadSentAtRef.current || 0) >= READ_SEND_MINIMUM_INTERVAL) {
            lastReadSentRef.current[activeId] = lastOtherReal.id;
            lastReadSentAtRef.current = now;

            if (connected) {
                sendRead(lastOtherReal.id);
            } else {
                // REST 폴백
                markReadUpTo(activeId, me.id, lastOtherReal.id).catch(() => {});
            }

            // 좌측 목록 배지 0 처리
            setRoomList((prev) =>
                Array.isArray(prev)
                    ? prev.map((r) =>
                        String(r?.roomId) === String(activeId) ? { ...r, unread: 0 } : r
                    )
                    : prev
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, activeId, messagesByRoom, me?.id]);

    // 히스토리 로드 여부로 로딩 표시 제어
    const historyLoaded = useMemo(
        () => activeId != null && Array.isArray(messagesByRoom[activeId]),
        [activeId, messagesByRoom]
    );

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

            {/* 비로그인 UI */}
            {!me?.id && (
                <div className={s.box}>
                    <section className={s.room}>
                        <div className={s.empty}>로그인이 필요합니다.</div>
                    </section>
                </div>
            )}

            {/* 로그인 상태 UI */}
            {!!me?.id && (
                <div className={s.box}>
                    {/* 좌측: 방 목록 */}
                    <aside className={s.list}>
                        <h3 className={s.listTitle}>
                            채팅 목록 {connected ? "(연결됨)" : "(연결 중…)"}
                        </h3>

                        {rooms.length === 0 && <div className={s.empty}>채팅방이 없습니다.</div>}

                        <ScrollArea className={s.ul} component="ul" sx={{ maxHeight: "600px" }}>
                            {rooms.map((r) => (
                                <li
                                    key={`${r.roomId}:${r.counterpartyId ?? "x"}`}
                                    className={`${s.item} ${String(activeId) === String(r.roomId) ? s.active : ""}`}
                                    onClick={() => setActiveId(r.roomId)}
                                >
                                    <img
                                        className={s.thumb}
                                        src={r.productThumb || "/images/profile_img/sangjun.jpg"}
                                        alt=""
                                    />
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
                                    <img
                                        className={s.headerThumb}
                                        src={activeChat.productThumb || "/images/profile_img/sangjun.jpg"}
                                        alt=""
                                    />
                                </>
                            ) : (
                                <div className={s.meta}>
                                    <strong>-</strong>
                                </div>
                            )}
                        </header>

                        <ScrollArea ref={scrollerRef} className={s.messages} sx={{ maxHeight: "600px" }}>
                            {!activeId && <div className={s.empty}>방을 선택하세요.</div>}
                            {!!activeId && !historyLoaded && <div className={s.empty}>서버에서 불러오는 중…</div>}

                            {messages.map((m) =>
                                m.__divider ? (
                                    <div key={m.key} className={s.dateDivider}>
                                        {m.label}
                                    </div>
                                ) : m.type === "SYSTEM" ? (
                                    <div key={m.id} className={s.systemMsg}>
                                        {m.text}
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

                        <form
                            className={s.inputBar}
                            onSubmit={(e) => {
                                e.preventDefault();
                                doSendMessage();
                            }}
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

/** ---------- 유틸: 서버 DTO -> UI 매핑 ---------- **/
function mapMessageToUi(m, me, otherName, otherAvatar) {
    const type = m.type || (m.imageUrl ? "IMAGE" : "TEXT");
    const fromMe = Number(m.senderId) === Number(me.id);
    return {
        id: m.messageId ?? `tmp-echo-${m.roomId || "r"}-${m.time || Date.now()}`,
        type,
        fromMe,
        senderName: fromMe ? me.name : otherName,
        avatar: fromMe ? me.profile : otherAvatar,
        text: m.content || "",
        imageUrl: m.imageUrl || null,
        ts: m.time ? new Date(m.time) : new Date(),
        read: false,
    };
}
