//lib/chat/useChatSocket.js
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

    // 최신 값 유지용 ref (onConnect 클로저 stale 방지)
    const meIdRef = useRef(null);
    const roomIdRef = useRef(null);

    // 구독 핸들
    const roomSubRef = useRef(null);
    const badgeSubRef = useRef(null);

    // 외부 콜백 저장
    const onMsgRef = useRef(() => {});
    const onBadgeRef = useRef(() => {});
    const setOnServerMessage = useCallback((fn) => { onMsgRef.current = fn || (() => {}); }, []);
    const setOnBadge        = useCallback((fn) => { onBadgeRef.current = fn || (() => {}); }, []);

    // 최신 값 동기화
    useEffect(() => { meIdRef.current = me?.id ?? null; }, [me?.id]);
    useEffect(() => { roomIdRef.current = roomId ? Number(roomId) : null; }, [roomId]);

    const url = resolveWsUrl(baseUrl);

    /** 안전 구독/해제 유틸 */
    const safeUnsub = (subRef) => {
        try { subRef.current?.unsubscribe(); } catch {}
        subRef.current = null;
    };

    const subscribeBadge = useCallback(() => {
        const client = clientRef.current;
        const myId = meIdRef.current;
        if (!client || !client.connected || !myId) return;

        // 기존 구독 해제 후 재구독
        safeUnsub(badgeSubRef);

        const dest = `/sub/users/${myId}/chat-badge`;
        const headers = { "x-user-id": String(myId) };

        badgeSubRef.current = client.subscribe(dest, (frame) => {
            try {
                const badge = JSON.parse(frame.body);
                onBadgeRef.current?.(badge);
            } catch {}
        }, headers);
    }, []);

    const subscribeRoom = useCallback(() => {
        const client = clientRef.current;
        const rid = roomIdRef.current;
        const myId = meIdRef.current;
        if (!client || !client.connected || !rid) return;

        // 기존 구독 해제 후 재구독
        safeUnsub(roomSubRef);

        const dest = `/sub/chats/${rid}`;
        const headers = myId ? { "x-user-id": String(myId) } : {};
        roomSubRef.current = client.subscribe(dest, (frame) => {
            try {
                const payload = JSON.parse(frame.body);
                if (payload?.roomId != null && Number(payload.roomId) !== Number(roomIdRef.current)) {
                    return; // 다른 방 이벤트 무시
                }
                setMessages((prev) => [...prev, payload]);
                onMsgRef.current?.(payload);
            } catch {}
        }, headers);
    }, []);

    // 초기 연결/해제
    useEffect(() => {
        if (clientRef.current) return;

        const client = new Client({
            brokerURL: undefined,                    // SockJS 사용
            webSocketFactory: () => new SockJS(url),
            reconnectDelay: 3000,
            heartbeatIncoming: HEARTBEAT_MS,
            heartbeatOutgoing: HEARTBEAT_MS,
            connectHeaders: me?.id ? { "x-user-id": String(me.id) } : {},
            debug: () => {},
            onConnect: () => {
                setConnected(true);
                // 연결된 직후에만 구독 시작 (여기서만 subscribe 호출)
                subscribeBadge();
                subscribeRoom();
            },
            onStompError: () => setConnected(false),
            onWebSocketClose: () => setConnected(false),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            // 정리
            safeUnsub(roomSubRef);
            safeUnsub(badgeSubRef);
            try { clientRef.current?.deactivate(); } catch {}
            clientRef.current = null;
            setConnected(false);

        };
    }, [url, me?.id, subscribeBadge, subscribeRoom]);

    // roomId 변경 시: 연결돼 있으면 재구독
    useEffect(() => {
        const client = clientRef.current;
        if (!client || !client.connected) return;
        subscribeRoom();
    }, [roomId, subscribeRoom]);

    // me.id 변경 시: 연결돼 있으면 배지/룸 모두 재구독
    useEffect(() => {
        const client = clientRef.current;
        if (!client || !client.connected) return;
        subscribeBadge();
        subscribeRoom();
    }, [me?.id, subscribeBadge, subscribeRoom]);

    /** 발행 유틸: 연결 확인 필수 */
    const publishJson = useCallback((destination, body) => {
        const client = clientRef.current;
        if (!client || !client.connected) return; // 미연결이면 무시
        client.publish({
            destination,
            headers: {
                "content-type": "application/json",
                ...(meIdRef.current ? { "x-user-id": String(meIdRef.current) } : {}),
            },
            body: JSON.stringify(body),
        });
    }, []);

    const sendLeave = useCallback(() => {
        const rid = roomIdRef.current, uid = meIdRef.current;
        if (!rid || !uid) return;
        publishJson(`/app/chats/${rid}/leave`, { roomId: Number(rid) });
    }, [publishJson]);

    const sendText = useCallback((text, tempId) => {
        const rid = roomIdRef.current, uid = meIdRef.current;
        if (!rid || !uid) return;
        publishJson(`/app/chats/${rid}/send`, {
            roomId: Number(rid),
            senderId: Number(uid),
            text,
            imageUrl: null,
            tempId: tempId || null,
        });
    }, [publishJson]);

    const sendImage = useCallback((imageUrl, tempId) => {
        const rid = roomIdRef.current, uid = meIdRef.current;
        if (!rid || !uid) return;
        publishJson(`/app/chats/${rid}/send`, {
            roomId: Number(rid),
            senderId: Number(uid),
            text: null,
            imageUrl,
            tempId: tempId || null,
        });
    }, [publishJson]);

    const sendRead = useCallback((lastSeenMessageId) => {
        const rid = roomIdRef.current, uid = meIdRef.current;
        if (!rid || !uid || !lastSeenMessageId) return;
        publishJson(`/app/chats/${rid}/read`, {
            type: "READ",
            roomId: Number(rid),
            readerId: Number(uid),
            lastSeenMessageId,
        });
    }, [publishJson]);

    return {
        connected,
        messages,
        sendText,
        sendImage,
        sendRead,
        setOnServerMessage,
        setOnBadge,
        sendLeave,
    };
}
