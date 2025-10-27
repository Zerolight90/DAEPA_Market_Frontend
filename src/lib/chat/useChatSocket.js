// /lib/chat/useChatSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const HEARTBEAT_MS = 10000;

function resolveWsUrl(baseUrl) {
    // baseUrl이 있으면 절대경로, 없으면 상대경로 (/ws-stomp)
    if (!baseUrl && typeof window !== "undefined") return "/ws-stomp";
    if (!baseUrl) return "/ws-stomp";
    try {
        const u = new URL(baseUrl);
        return `${u.protocol}//${u.hostname}${u.port ? ":" + u.port : ""}/ws-stomp`;
    } catch {
        return "/ws-stomp";
    }
}

export function useChatSocket({ roomId, me, baseUrl = "" }) {
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    const clientRef = useRef(null);
    const subRef = useRef(null);
    const currentRoomRef = useRef(null);

    const url = resolveWsUrl(baseUrl);

    const setOnServerMessage = useCallback((fn) => {
        useChatSocket._onMsg = fn || (() => {});
    }, []);
    useChatSocket._onMsg = useChatSocket._onMsg || (() => {});

    // 최초 연결/해제
    useEffect(() => {
        if (clientRef.current) return;

        const client = new Client({
            brokerURL: undefined, // SockJS 사용
            webSocketFactory: () => new SockJS(url),
            reconnectDelay: 3000,
            heartbeatIncoming: HEARTBEAT_MS,
            heartbeatOutgoing: HEARTBEAT_MS,
            connectHeaders: me?.id ? { "x-user-id": String(me.id) } : {},
            debug: () => {},
            onConnect: () => setConnected(true),
            onStompError: () => setConnected(false),
            onWebSocketClose: () => setConnected(false),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            try { if (subRef.current) subRef.current.unsubscribe(); } catch {}
            try { clientRef.current?.deactivate(); } catch {}
            clientRef.current = null;
            subRef.current = null;
            currentRoomRef.current = null;
            setConnected(false);
            setMessages([]);
        };
    }, [url, me?.id]);

    // 방 전환 시 구독 스위치
    useEffect(() => {
        const client = clientRef.current;
        if (!client || !connected) return;

        if (subRef.current) {
            try { subRef.current.unsubscribe(); } catch {}
            subRef.current = null;
        }

        if (!roomId || Number(roomId) <= 0) {
            currentRoomRef.current = null;
            setMessages([]);
            return;
        }

        currentRoomRef.current = Number(roomId);
        setMessages([]);

        const dest = `/sub/chats/${roomId}`;
        const headers = me?.id ? { "x-user-id": String(me.id) } : {};

        const subscription = client.subscribe(dest, (frame) => {
            try {
                const payload = JSON.parse(frame.body);
                if (
                    payload?.roomId != null &&
                    Number(payload.roomId) !== Number(currentRoomRef.current)
                ) return;

                // 훅 내부 state도 유지
                setMessages((prev) => [...prev, payload]);
                // 외부 핸들러 등록돼 있으면 콜백
                useChatSocket._onMsg?.(payload);
            } catch {}
        }, headers);

        subRef.current = subscription;

        return () => {
            try { if (subRef.current) subRef.current.unsubscribe(); } catch {}
            subRef.current = null;
        };
    }, [connected, roomId, me?.id]);

    // 발송 함수
    const sendText = useCallback((text, tempId) => {
        const client = clientRef.current;
        if (!client || !connected || !roomId || !me?.id) return;

        const body = JSON.stringify({
            roomId: Number(roomId),
            senderId: Number(me.id),
            text,
            imageUrl: null,
            tempId: tempId || null,
        });

        client.publish({
            destination: `/app/chats/${roomId}/send`,
            headers: {
                "content-type": "application/json",
                ...(me?.id ? { "x-user-id": String(me.id) } : {}),
            },
            body,
        });
    }, [connected, roomId, me?.id]);

    const sendRead = useCallback((lastSeenMessageId) => {
        const client = clientRef.current;
        if (!client || !connected || !roomId || !me?.id || !lastSeenMessageId) return;

        const body = JSON.stringify({
            type: "READ",
            roomId: Number(roomId),
            readerId: Number(me.id),
            lastSeenMessageId: lastSeenMessageId,
        });

        client.publish({
            destination: `/app/chats/${roomId}/read`,
            headers: {
                "content-type": "application/json",
                ...(me?.id ? { "x-user-id": String(me.id) } : {}),
            },
            body,
        });
    }, [connected, roomId, me?.id]);

    return { connected, messages, sendText, sendRead, setOnServerMessage };
}
