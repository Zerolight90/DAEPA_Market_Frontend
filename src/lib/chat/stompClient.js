// stomClient.js
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * 환경 변수에서 WebSocket URL을 가져옵니다.
 * 정의되지 않은 경우, 설정의 중요성을 강조하며 에러를 발생시킵니다.
 */
function getWsUrl() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_BASE;
    if (!wsUrl) {
        throw new Error(
            "환경 변수 `NEXT_PUBLIC_WS_BASE`가 설정되지 않았습니다. " +
            "WebSocket 연결을 위해 .env 파일에 해당 변수를 꼭 설정해주세요. " +
            "(예: `NEXT_PUBLIC_WS_BASE=ws://localhost:8080/ws-stomp`)"
        );
    }
    return wsUrl;
}

export function createChatClient({ userId, displayName }) {
    const wsUrl = getWsUrl();

    const client = new Client({
        brokerURL: undefined, // SockJS를 사용하므로 이 옵션은 사용하지 않습니다.
        webSocketFactory: () => new SockJS(wsUrl, null, {
            transports: ["websocket", "xhr-streaming", "xhr-polling"],
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
