// /lib/chat/useChatSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const HEARTBEAT_MS = 10000;

function resolveWsUrl(baseUrl) {
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

    useEffect(() => {
        if (clientRef.current) return;
        const client = new Client({
            brokerURL: undefined,
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
            try { subRef.current?.unsubscribe(); } catch {}
            try { clientRef.current?.deactivate(); } catch {}
            clientRef.current = null;
            subRef.current = null;
            currentRoomRef.current = null;
            setConnected(false);
            setMessages([]);
        };
    }, [url, me?.id]);

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
                if (payload?.roomId != null && Number(payload.roomId) !== Number(currentRoomRef.current)) return;
                setMessages((prev) => [...prev, payload]);
                useChatSocket._onMsg?.(payload);
            } catch {}
        }, headers);

        subRef.current = subscription;
        return () => {
            try { subRef.current?.unsubscribe(); } catch {}
            subRef.current = null;
        };
    }, [connected, roomId, me?.id]);

    const publishJson = useCallback((destination, body) => {
        const client = clientRef.current;
        if (!client || !connected) return;
        client.publish({
            destination,
            headers: { "content-type": "application/json", ...(me?.id ? { "x-user-id": String(me.id) } : {}) },
            body: JSON.stringify(body),
        });
    }, [connected, me?.id]);

    const sendText = useCallback((text, tempId) => {
        if (!connected || !roomId || !me?.id) return;
        publishJson(`/app/chats/${roomId}/send`, {
            roomId: Number(roomId),
            senderId: Number(me.id),
            text,
            imageUrl: null,
            tempId: tempId || null,
        });
    }, [connected, roomId, me?.id, publishJson]);

    /** ✅ 이미지 전송 (이미 업로드 완료된 URL 사용) */
    const sendImage = useCallback((imageUrl, tempId) => {
        if (!connected || !roomId || !me?.id) return;
        publishJson(`/app/chats/${roomId}/send`, {
            roomId: Number(roomId),
            senderId: Number(me.id),
            text: null,
            imageUrl,
            tempId: tempId || null,
        });
    }, [connected, roomId, me?.id, publishJson]);

    const sendRead = useCallback((lastSeenMessageId) => {
        if (!connected || !roomId || !me?.id || !lastSeenMessageId) return;
        publishJson(`/app/chats/${roomId}/read`, {
            type: "READ",
            roomId: Number(roomId),
            readerId: Number(me.id),
            lastSeenMessageId,
        });
    }, [connected, roomId, me?.id, publishJson]);

    return { connected, messages, sendText, sendImage, sendRead, setOnServerMessage };
}
