// /lib/chat/useChatSocket.js
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createChatClient } from "./stompClient";
import { fetchMessages } from "./api";

/** 백엔드/프론트 필드 통합 */
function normalizeMessage(raw) {
    if (!raw) return null;
    const messageId = raw.messageId ?? raw.cmIdx ?? raw.id ?? raw.cm_id ?? raw.cmidx;
    return {
        messageId,
        roomId: raw.roomId ?? raw.chIdx ?? raw.ch_idx,
        senderId: raw.senderId ?? raw.cmWriter ?? raw.writer ?? null,
        text: raw.content ?? raw.text ?? raw.cmContent ?? raw.cm_content ?? "",
        imageUrl: raw.imageUrl ?? raw.cmUrl ?? raw.cm_url ?? null,
        time: raw.time ?? raw.cmDate ?? raw.cm_date ?? null,
    };
}

/**
 * roomId: number | string
 * me: { id: number, name: string }
 * baseUrl: 백엔드 실제 주소(WS용). 미지정 시 http://<host>:8080 추정
 */
export function useChatSocket({ roomId, me, baseUrl }) {
    const clientRef = useRef(null);
    const subRef = useRef(null);

    const [connected, setConnected] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [messages, setMessages] = useState([]);

    const seenIdsRef = useRef(new Set());
    const liveQueueRef = useRef([]);
    const loadedRef = useRef(false);

    // 방 바뀔 때 초기화
    useEffect(() => {
        setMessages([]);
        setLoaded(false);
        loadedRef.current = false;
        seenIdsRef.current = new Set();
        liveQueueRef.current = [];
    }, [roomId]);

    const activate = useCallback(() => {
        if (clientRef.current) return;

        // WS는 프록시가 안 됨 → 백엔드 실주소 필요
        const urlBase =
            baseUrl ||
            (typeof window !== "undefined"
                ? `${window.location.protocol}//${window.location.hostname}:8080`
                : "http://localhost:8080");

        const c = createChatClient({ baseUrl: urlBase, userId: me.id, displayName: me.name });

        c.onConnect = async () => {
            setConnected(true);

            // 기존 구독 해제
            if (subRef.current) {
                try {
                    subRef.current.unsubscribe();
                } catch (_) {}
                subRef.current = null;
            }

            // 실시간 구독
            subRef.current = c.subscribe(`/sub/chats/${roomId}`, (frame) => {
                try {
                    const msg = normalizeMessage(JSON.parse(frame.body));
                    if (!msg?.messageId) {
                        setMessages((prev) => [...prev, msg]);
                        return;
                    }
                    if (!loadedRef.current) {
                        liveQueueRef.current.push(msg);
                        return;
                    }
                    if (!seenIdsRef.current.has(msg.messageId)) {
                        seenIdsRef.current.add(msg.messageId);
                        setMessages((prev) => [...prev, msg]);
                    }
                } catch (e) {
                    console.error("[STOMP] parse error:", e);
                }
            });

            // 초기 메시지 로드(REST) → 실시간 큐 병합
            try {
                const arr = await fetchMessages(roomId, 30);
                const baseList = (Array.isArray(arr) ? arr : [])
                    .map(normalizeMessage)
                    .filter(Boolean);

                const next = [];
                for (const m of baseList) {
                    if (m.messageId && !seenIdsRef.current.has(m.messageId)) {
                        seenIdsRef.current.add(m.messageId);
                    }
                    next.push(m);
                }
                if (liveQueueRef.current.length) {
                    for (const live of liveQueueRef.current) {
                        if (!live.messageId || !seenIdsRef.current.has(live.messageId)) {
                            if (live.messageId) seenIdsRef.current.add(live.messageId);
                            next.push(live);
                        }
                    }
                }
                liveQueueRef.current = [];
                setMessages(next);
            } catch (err) {
                console.error("[REST] load messages failed:", err);
            } finally {
                setLoaded(true);
                loadedRef.current = true;
            }
        };

        c.onStompError = (e) => console.error("STOMP error", e);
        c.onWebSocketClose = () => setConnected(false);

        c.activate();
        clientRef.current = c;
    }, [roomId, me.id, me.name, baseUrl]);

    const deactivate = useCallback(() => {
        if (subRef.current) {
            try {
                subRef.current.unsubscribe();
            } catch (_) {}
            subRef.current = null;
        }
        if (clientRef.current) {
            try {
                clientRef.current.deactivate();
            } catch (_) {}
            clientRef.current = null;
        }
        setConnected(false);
    }, []);

    useEffect(() => {
        activate();
        return () => deactivate();
    }, [activate, deactivate]);

    const sendText = useCallback(
        (text, tempId) => {
            if (!clientRef.current || !clientRef.current.connected) return;
            clientRef.current.publish({
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

    const sendRead = useCallback(
        (lastSeenMessageId) => {
            if (!clientRef.current || !clientRef.current.connected) return;
            clientRef.current.publish({
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
