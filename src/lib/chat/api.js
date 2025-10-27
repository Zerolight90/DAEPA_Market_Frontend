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

/** ✅ REST 폴백: 메시지 전송 */
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

/** ✅ REST 폴백: after 초과 메시지 증분 조회 */
export async function fetchMessagesAfter(roomId, after, size = 50) {
    const rid = normRoomId(roomId);
    const { data } = await http.get(`/api/chats/${rid}/messages-after`, {
        params: { after, size },
    });
    return data; // ChatDto.MessageRes[]
}

/** ✅ REST 폴백: 읽음 포인터 올리기 */
export async function markReadUpTo(roomId, readerId, upTo) {
    const rid = normRoomId(roomId);
    const { data } = await http.post(`/api/chats/${rid}/read-up-to`, null, {
        params: { upTo },
        headers: readerId ? { "x-user-id": String(readerId) } : undefined,
    });
    return data; // ChatDto.ReadEvent
}
