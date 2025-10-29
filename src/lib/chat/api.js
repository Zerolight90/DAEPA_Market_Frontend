// src/lib/chat/api.js
import axios from "axios";

export const http = axios.create({
    baseURL: "/",
    withCredentials: true,
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
    return data;
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

export async function openChatRoom({ productId, sellerId }) {
    const { data } = await http.post("/api/chats/open", { productId, sellerId });
    return data; // { roomId, created, identifier }
}

/** ✅ 이미지 업로드(멀티파트) → { url } — 인자로 "File"만 넘겨주세요! */
export async function uploadChatImage(file) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await http.post("/api/chats/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data; // { url, ... }
}

/** ✅ REST 폴백: 메시지 전송 */
export async function sendMessageRest(roomId, { text, imageUrl = null, tempId = null, senderId }) {
    const rid = normRoomId(roomId);
    const { data } = await http.post(`/api/chats/${rid}/send`, {
        roomId: Number(rid),
        senderId: Number(senderId),
        text: text ?? null,
        imageUrl,
        tempId,
    });
    return data;
}

/** ✅ REST 폴백: 읽음 포인터 */
export async function markReadUpTo(roomId, readerId, upTo) {
    const rid = normRoomId(roomId);
    const { data } = await http.post(
        `/api/chats/${rid}/read-up-to`,
        null,
        {
            params: { upTo },
            headers: readerId ? { "x-user-id": String(readerId) } : undefined,
        }
    );
    return data;
}
