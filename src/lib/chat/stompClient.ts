import { Client, type StompConfig } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface ChatClientOptions {
    userId: number | string | null | undefined;
    displayName?: string;
}

function getWsUrl(): string {
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

export function createChatClient({ userId, displayName }: ChatClientOptions): Client {
    const wsUrl = getWsUrl();

    const client = new Client({
        brokerURL: undefined,
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
            ? (str: string) => console.log("[STOMP]", str)
            : () => {},
    } as StompConfig);

    client.onStompError = (frame) => {
        console.warn("[STOMP ERROR] message:", frame?.headers?.message);
        if (frame?.body) console.warn("[STOMP ERROR] body:", frame.body);
    };
    client.onWebSocketError = (evt: Event) => {
        console.warn("[WS ERROR]", (evt as ErrorEvent)?.message || evt);
    };
    client.onWebSocketClose = (evt: CloseEvent) => {
        console.warn("[WS CLOSE]", evt?.code, evt?.reason);
    };

    return client;
}
