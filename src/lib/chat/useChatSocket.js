// /lib/chat/useChatSocket.js
import { useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

/**
 * WebSocket은 Next rewrites가 프록시하지 않음.
 * - 프로덕션(단일 도메인)에서는 상대경로 "/ws-stomp"
 * - 개발/다PC 테스트에서는 NEXT_PUBLIC_API_BASE 사용 + localhost → 현재 호스트 치환
 */
export function useChatSocket({ roomId, me, baseUrl = "" }) {
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);

    const clientRef = useRef(null);
    const subIdRef = useRef(null);
    const currentRoomRef = useRef(null);

    const url = useMemo(() => {
        // 1) 환경변수/prop 우선
        let base = (process.env.NEXT_PUBLIC_API_BASE || baseUrl || "").trim();

        if (typeof window !== "undefined") {
            if (!base) {
                // 단일 도메인 배포라면 상대경로 사용
                return "/ws-stomp";
            }
            try {
                const u = new URL(base);
                // localhost면 접속한 브라우저의 호스트로 치환 (다른 PC 접속 지원)
                if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
                    const proto = window.location.protocol;
                    const host = window.location.hostname;
                    const port = u.port || (proto === "https:" ? "8443" : "8080");
                    base = `${proto}//${host}:${port}`;
                } else {
                    base = `${u.protocol}//${u.hostname}${u.port ? ":" + u.port : ""}`;
                }
            } catch {
                // 무시하고 상대경로로
                return "/ws-stomp";
            }
            return `${base.replace(/\/+$/, "")}/ws-stomp`;
        }
        // SSR 안전 기본값
        return "/ws-stomp";
    }, [baseUrl]);

    // 최초 연결/해제
    useEffect(() => {
        if (clientRef.current) return;

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

    // 방 전환 시 구독 스위치
    useEffect(() => {
        const client = clientRef.current;
        if (!client || !connected) return;

        if (subIdRef.current) {
            try { client.unsubscribe(subIdRef.current); } catch {}
            subIdRef.current = null;
        }

        if (!roomId || Number(roomId) <= 0) {
            currentRoomRef.current = null;
            setMessages([]);
            return;
        }

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
                    if (
                        payload?.roomId != null &&
                        Number(payload.roomId) !== Number(currentRoomRef.current)
                    ) {
                        return;
                    }
                    setMessages((prev) => [...prev, payload]);
                } catch {}
            },
            headers
        );

        if (!subIdRef.current) {
            subIdRef.current = (subscription && subscription.id) || subId;
        }

        return () => {
            try { if (client && subIdRef.current) client.unsubscribe(subIdRef.current); } catch {}
            subIdRef.current = null;
        };
    }, [connected, roomId, me?.id]);

    // 발송 함수
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
