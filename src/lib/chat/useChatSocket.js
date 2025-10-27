// /lib/chat/useChatSocket.js
import { useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export function useChatSocket({ roomId, me, baseUrl = "" }) {
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]); // 현재 방의 WS 이벤트만 저장

    const clientRef = useRef(null);
    const subIdRef = useRef(null);
    const currentRoomRef = useRef(null);

    const url = useMemo(() => {
        const origin = (baseUrl || "").replace(/\/+$/, "");
        return `${origin}/ws-stomp`;
    }, [baseUrl]);

    // 1) 최초 연결/해제 (중복 activate 방지 가드)
    useEffect(() => {
        if (clientRef.current) return; // ✅ 이미 연결되어 있으면 재활성화 금지

        const client = new Client({
            brokerURL: undefined, // SockJS 사용
            webSocketFactory: () => new SockJS(url),
            reconnectDelay: 3000,
            connectHeaders: me?.id ? { "x-user-id": String(me.id) } : {},
            debug: () => {},
            onConnect: () => setConnected(true),
            onStompError: () => setConnected(false),
            onWebSocketClose: () => setConnected(false),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            try {
                if (clientRef.current && subIdRef.current) {
                    clientRef.current.unsubscribe(subIdRef.current);
                }
            } catch {}
            try {
                clientRef.current?.deactivate();
            } catch {}
            clientRef.current = null;
            subIdRef.current = null;
            currentRoomRef.current = null;
            setConnected(false);
            setMessages([]);
        };
    }, [url, me?.id]);

    // 2) 방이 바뀔 때: 이전 구독 해제 → 새 방 구독
    useEffect(() => {
        const client = clientRef.current;
        if (!client || !connected) return;

        // 이전 구독 해제
        if (subIdRef.current) {
            try {
                client.unsubscribe(subIdRef.current);
            } catch {}
            subIdRef.current = null;
        }

        // 유효하지 않은 roomId면 리셋
        if (!roomId || Number(roomId) <= 0) {
            currentRoomRef.current = null;
            setMessages([]);
            return;
        }

        // 새 방으로 초기화
        currentRoomRef.current = Number(roomId);
        setMessages([]);

        const dest = `/sub/chats/${roomId}`;
        const subId = `sub-${roomId}-${Date.now()}`;
        subIdRef.current = subId;

        const headers = me?.id ? { "x-user-id": String(me.id) } : {};

        const subscription = client.subscribe(
            dest,
            (frame) => {
                try {
                    const payload = JSON.parse(frame.body);
                    // 다른 방 메시지는 무시
                    if (
                        payload?.roomId != null &&
                        Number(payload.roomId) !== Number(currentRoomRef.current)
                    ) {
                        return;
                    }
                    setMessages((prev) => [...prev, payload]);
                } catch {
                    // ignore
                }
            },
            headers
        );

        if (!subIdRef.current) {
            subIdRef.current = (subscription && subscription.id) || subId;
        }

        return () => {
            try {
                if (client && subIdRef.current) client.unsubscribe(subIdRef.current);
            } catch {}
            subIdRef.current = null;
        };
    }, [connected, roomId, me?.id]);

    // 3) 발송 함수
    const sendText = (text, tempId) => {
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
    };

    const sendRead = (lastSeenMessageId) => {
        const client = clientRef.current;
        if (!client || !connected || !roomId || !me?.id) return;

        const body = JSON.stringify({
            type: "READ",
            roomId: Number(roomId),
            readerId: Number(me.id),
            lastSeenMessageId: lastSeenMessageId ?? null,
        });

        client.publish({
            destination: `/app/chats/${roomId}/read`,
            headers: {
                "content-type": "application/json",
                ...(me?.id ? { "x-user-id": String(me.id) } : {}),
            },
            body,
        });
    };

    return { connected, messages, sendText, sendRead };
}
