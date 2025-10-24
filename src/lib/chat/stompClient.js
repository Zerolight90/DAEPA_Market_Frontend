// /lib/chat/stompClient.js
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/** WebSocket은 프록시가 안 되므로 baseUrl에 백엔드 실제 주소 필요(예: http://localhost:8080) */
export function createChatClient({ baseUrl, userId, displayName }) {
    const clean = (baseUrl || "").replace(/\/+$/, "");
    const wsUrl = `${clean}/ws-stomp`;

    const client = new Client({
        brokerURL: undefined,                 // SockJS 사용
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: 3000,
        connectHeaders: {
            "x-user-id": String(userId ?? ""),
            "x-user-name": displayName ?? "",
        },
        debug:
            process.env.NODE_ENV === "development"
                ? (str) => console.log("[STOMP]", str)
                : () => {},
    });

    client.onStompError = (frame) => {
        console.warn("[STOMP ERROR]", frame?.headers?.message);
        if (frame?.body) console.warn("[STOMP ERROR BODY]", frame.body);
    };
    client.onWebSocketError = (evt) => {
        console.warn("[WS ERROR]", evt?.message || evt);
    };
    client.onWebSocketClose = (evt) => {
        console.warn("[WS CLOSE]", evt?.code, evt?.reason);
    };

    return client;
}
