// /lib/chat/useChatSocket.js
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createChatClient } from "./stompClient";
import { fetchMessages } from "./api";

/** 서버/클라 필드 정규화 */
function normalizeMessage(raw) {
    if (!raw) return null;
    const messageId =
        raw.messageId ?? raw.cmIdx ?? raw.id ?? raw.cm_id ?? raw.cmidx ?? null;

    return {
        type: raw.type || (raw.imageUrl ? "IMAGE" : "TEXT"),
        messageId,                       // number | null
        tempId: raw.tempId ?? null,      // 낙관적 전송 매칭용
        roomId: raw.roomId ?? raw.chIdx ?? raw.ch_idx,
        senderId: raw.senderId ?? raw.cmWriter ?? raw.writer ?? null,
        text: raw.content ?? raw.text ?? raw.cmContent ?? raw.cm_content ?? "",
        imageUrl: raw.imageUrl ?? raw.cmUrl ?? raw.cm_url ?? null,
        time: raw.time ?? raw.cmDate ?? raw.cm_date ?? null,
    };
}

/**
 * useChatSocket
 * - roomId 변경 시 자동 재구독 + 히스토리 로드
 * - READ 이벤트는 걸러냄(원하면 onRead 콜백으로 외부 전달 가능)
 */
export function useChatSocket({ roomId, me, baseUrl, onRead }) {
    const clientRef = useRef(null);
    const subRef = useRef(null);

    const [connected, setConnected] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [messages, setMessages] = useState([]);

    // 중복방지 + 낙관적 매칭
    const seenIds = useRef(new Set());    // messageId dedupe
    const optimisticMap = useRef(new Map()); // tempId -> index

    /** 클라이언트 활성화(최초 1회) */
    const ensureClient = useCallback(() => {
        if (clientRef.current) return clientRef.current;

        const urlBase =
            baseUrl ||
            (typeof window !== "undefined"
                ? `${window.location.protocol}//${window.location.hostname}:8080`
                : "http://localhost:8080");

        const c = createChatClient({ baseUrl: urlBase, userId: me.id, displayName: me.name });

        c.onConnect = () => setConnected(true);
        c.onStompError = (e) => console.error("STOMP error", e);
        c.onWebSocketClose = () => setConnected(false);

        c.activate();
        clientRef.current = c;
        return c;
    }, [baseUrl, me.id, me.name]);

    /** 구독 교체 + 히스토리 로드 */
    const subscribeRoom = useCallback(
        async (rid) => {
            const c = ensureClient();
            if (!c.connected) {
                // 연결 완료 후 다시 시도하도록 약간 늦게 재귀
                setTimeout(() => subscribeRoom(rid), 200);
                return;
            }

            // 이전 구독 해제
            if (subRef.current) {
                try { subRef.current.unsubscribe(); } catch (_) {}
                subRef.current = null;
            }

            // 상태 초기화
            setMessages([]);
            setLoaded(false);
            seenIds.current = new Set();
            optimisticMap.current = new Map();

            // 실시간 구독
            subRef.current = c.subscribe(`/sub/chats/${rid}`, (frame) => {
                try {
                    const raw = JSON.parse(frame.body);

                    // READ 이벤트는 외부 콜백만 호출하고 리스트에는 넣지 않음
                    if (raw?.type === "READ") {
                        onRead?.(raw);
                        return;
                    }

                    const msg = normalizeMessage(raw);
                    if (!msg) return;

                    // 낙관적 매칭: 서버가 tempId를 되돌려주면 기존(임시) 항목 교체
                    if (msg.tempId && optimisticMap.current.has(msg.tempId)) {
                        const idx = optimisticMap.current.get(msg.tempId);
                        optimisticMap.current.delete(msg.tempId);
                        seenIds.current.add(msg.messageId ?? `temp:${msg.tempId}`);
                        setMessages((prev) => {
                            const next = prev.slice();
                            next[idx] = { ...next[idx], ...msg };
                            return next;
                        });
                        return;
                    }

                    // 일반 dedupe
                    const dedupeKey = msg.messageId ?? `temp:${msg.tempId ?? Math.random()}`;
                    if (seenIds.current.has(dedupeKey)) return;
                    seenIds.current.add(dedupeKey);

                    setMessages((prev) => [...prev, msg]);
                } catch (e) {
                    console.error("[STOMP] parse error:", e);
                }
            });

            // 히스토리(오래된→최신) 로드
            try {
                const arr = await fetchMessages(rid, 30);
                const baseList = (Array.isArray(arr) ? arr : [])
                    .map(normalizeMessage)
                    .filter(Boolean);

                const next = [];
                for (const m of baseList) {
                    const key = m.messageId ?? `temp:${m.tempId ?? Math.random()}`;
                    if (!seenIds.current.has(key)) {
                        seenIds.current.add(key);
                        next.push(m);
                    }
                }
                setMessages(next);
            } catch (err) {
                console.error("[REST] load messages failed:", err);
            } finally {
                setLoaded(true);
            }
        },
        [ensureClient, onRead]
    );

    /** roomId 바뀔 때 재구독 */
    useEffect(() => {
        if (!roomId) return;
        subscribeRoom(roomId);
        return () => {
            if (subRef.current) {
                try { subRef.current.unsubscribe(); } catch (_) {}
                subRef.current = null;
            }
        };
    }, [roomId, subscribeRoom]);

    /** 컴포넌트 unmount 시 클라이언트 정리 */
    useEffect(() => {
        ensureClient();
        return () => {
            if (subRef.current) {
                try { subRef.current.unsubscribe(); } catch (_) {}
                subRef.current = null;
            }
            if (clientRef.current) {
                try { clientRef.current.deactivate(); } catch (_) {}
                clientRef.current = null;
            }
        };
    }, [ensureClient]);

    /** 텍스트 전송 (낙관적 메시지 생성 + tempId 기록) */
    const sendText = useCallback(
        (text, tempId) => {
            const c = clientRef.current;
            if (!c || !c.connected || !roomId) return;

            // 낙관적 반영 (tempId 기준으로 위치 기억)
            const optimistic = {
                type: "TEXT",
                messageId: null,
                tempId,
                roomId,
                senderId: me.id,
                text,
                imageUrl: null,
                time: new Date().toISOString(),
            };
            setMessages((prev) => {
                const idx = prev.length;
                optimisticMap.current.set(tempId, idx);
                return [...prev, optimistic];
            });

            c.publish({
                destination: `/app/chats/${roomId}/send`,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    text,
                    tempId,
                    senderId: me.id,
                }),
            });
        },
        [roomId, me.id]
    );

    /** 읽음 전송 (마지막 상대 메시지 id 등 전달) */
    const sendRead = useCallback(
        (lastSeenMessageId) => {
            const c = clientRef.current;
            if (!c || !c.connected || !roomId) return;
            c.publish({
                destination: `/app/chats/${roomId}/read`,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    type: "READ",
                    roomId,
                    readerId: me.id,
                    lastSeenMessageId,
                }),
            });
        },
        [roomId, me.id]
    );

    return { connected, loaded, messages, sendText, sendRead };
}
