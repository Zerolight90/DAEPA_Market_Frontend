import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function createChatClient({ baseUrl, userId, displayName }) {
    const wsUrl = `${baseUrl.replace(/\/+$/, "")}/ws-stomp`;

    const client = new Client({
        brokerURL: undefined,
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: 3000,
        connectHeaders: {
            "x-user-id": String(userId ?? ""),
            "x-user-name": displayName ?? "",
        },
        // 개발 중 로그만 보고, 운영에선 조용히
        debug: process.env.NODE_ENV === "development"
            ? (str) => console.log("[STOMP DEBUG]", str)
            : () => {},
    });

    client.onStompError = (frame) => {
        console.warn("[STOMP ERROR] message:", frame?.headers?.message);
        if (frame?.body) console.warn("[STOMP ERROR] body:", frame.body);
    };

    // ⬇️ 빈 ErrorEvent 때문에 overlay가 뜨는 걸 막음
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
