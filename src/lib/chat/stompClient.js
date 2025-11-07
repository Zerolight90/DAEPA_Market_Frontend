// stomClient.js
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function createChatClient({ baseUrl = "http://3.34.181.73", userId, displayName }) {
    const clean = baseUrl.replace(/\/+$/, "");
    const wsUrl = `${clean}/ws-stomp`; // Nginx가 프록시함

    const client = new Client({
        brokerURL: undefined, // SockJS 사용
        webSocketFactory: () => new SockJS(wsUrl, null, {
            transports: ["websocket", "xhr-streaming", "xhr-polling"],
            // withCredentials: true, // 쿠키 인증 쓰면 켜고, 서버 CORS/보안 설정 맞춰줘야 함
        }),
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        connectHeaders: {
            "x-user-id": String(userId ?? ""),
            "x-user-name": displayName ?? "",
        },
        debug: process.env.NODE_ENV === "development"
            ? (str) => console.log("[STOMP DEBUG]", str)
            : () => {},
    });

    client.onStompError = (frame) => {
        console.warn("[STOMP ERROR] message:", frame?.headers?.message);
        if (frame?.body) console.warn("[STOMP ERROR] body:", frame.body);
    };
    client.onWebSocketError = (evt) => {
        console.warn("[WS ERROR]", evt?.message || evt);
    };
    client.onWebSocketClose = (evt) => {
        console.warn("[WS CLOSE]", evt?.code, evt?.reason);
    };

    return client;
}
