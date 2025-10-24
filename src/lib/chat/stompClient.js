import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * WebSocket은 Next rewrite가 프록시하지 못하므로
 * baseUrl에는 반드시 백엔드 실제 주소를 넣어야 함. (예: http://localhost:8080)
 */
export function createChatClient({ baseUrl, userId, displayName }) {
    const clean = (baseUrl || "").replace(/\/+$/, "");
    const wsUrl = `${clean}/ws-stomp`;

    const client = new Client({
        brokerURL: undefined, // SockJS 사용
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: 3000,
        connectHeaders: {
            "x-user-id": String(userId ?? ""),   // ✅ 서버가 이 값으로 유저 식별
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
        if (!evt || (typeof evt === "object" && Object.keys(evt).length === 0)) {
            console.warn("[WS WARN] websocket error event (empty)");
            return;
        }
        console.warn("[WS ERROR]", evt?.message || evt);
    };

    client.onWebSocketClose = (evt) => {
        console.warn("[WS CLOSE]", evt?.code, evt?.reason);
    };

    return client;
}
