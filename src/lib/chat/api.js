// /lib/chat/api.js
import axios from "axios";

export const http = axios.create({
    baseURL: "/",              // /api/* 는 Next rewrites로 백엔드 프록시
    withCredentials: true,     // 쿠키 전달
});

// /api/auth/me 는 만료/비로그인일 수 있으니 조용히 처리
http.interceptors.response.use(
    (res) => res,
    (err) => {
        const url = err?.config?.url || "";
        if (url.startsWith("/api/auth/me")) {
            return Promise.resolve({ data: null, status: 200, config: err.config });
        }
        return Promise.reject(err);
    }
);

function normRoomId(id) {
    const raw = Array.isArray(id) ? id[0] : String(id);
    return raw.replace(/[^0-9]/g, "");
}

export async function fetchMe() {
    const { data } = await http.get("/api/auth/me");
    return data; // { userId } | null
}

export async function fetchRooms(userId) {
    const params = userId ? { userId } : undefined;
    const { data } = await http.get("/api/chats/my-rooms", { params });
    return data;
}

export async function fetchMessages(roomId, size = 30, before) {
    const rid = normRoomId(roomId);
    const { data } = await http.get(`/api/chats/${rid}/messages`, {
        params: { size, before },
    });
    return data;
}

// 채팅방 생성/재사용
export async function openChatRoom({ productId, sellerId }) {
    const { data } = await http.post("/api/chats/open", { productId, sellerId });
    return data; // { roomId, created, identifier }
}

/** ✅ REST 폴백: 메시지 전송 (WS 미연결시만 사용) */
export async function sendMessageRest(roomId, { text, imageUrl = null, tempId = null, senderId }) {
    const rid = normRoomId(roomId);
    const { data } = await http.post(`/api/chats/${rid}/send`, {
        roomId: Number(rid),
        senderId: Number(senderId),
        text,
        imageUrl,
        tempId,
    });
    return data; // ChatDto.MessageRes
}

/** ✅ REST 폴백: 읽음 포인터 올리기 (WS 미연결시만 사용) */
export async function markReadUpTo(roomId, readerId, upTo) {
    const rid = normRoomId(roomId);
    const { data } = await http.post(`/api/chats/${rid}/read-up-to`, null, {
        params: { upTo },
        headers: readerId ? { "x-user-id": String(readerId) } : undefined,
    });
    return data; // ChatDto.ReadEvent
}

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * WebSocket은 Next rewrite가 프록시하지 못하므로
 * baseUrl에는 반드시 백엔드 실제 주소를 넣어야 함. (예: http://localhost:8080)
 * 단일 도메인 배포면 상대경로 "/ws-stomp" 가능.
 */
export function createChatClient({ baseUrl, userId, displayName }) {
    const clean = (baseUrl || "").replace(/\/+$/, "");
    const wsUrl = clean ? `${clean}/ws-stomp` : "/ws-stomp";

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
        console.warn("[WS ERROR]", evt?.message || evt);
    };

    client.onWebSocketClose = (evt) => {
        console.warn("[WS CLOSE]", evt?.code, evt?.reason);
    };

    return client;
}
