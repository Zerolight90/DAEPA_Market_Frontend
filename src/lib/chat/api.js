// /lib/chat/api.js
import axios from "axios";

// Next rewrite가 /api/chats/** 를 백엔드로 프록시함
const http = axios.create({
    baseURL: "",
    withCredentials: false,
});

// roomId가 ["9021"]처럼 들어오는 경우 대비
function normRoomId(id) {
    const raw = Array.isArray(id) ? id[0] : String(id);
    const digits = raw.replace(/[^0-9]/g, "");
    return digits;
}

export async function fetchRooms(userId) {
    const { data } = await http.get("/api/chats/my-rooms", { params: { userId } });
    return data;
}

export async function fetchMessages(roomId, size = 30, before) {
    const rid = normRoomId(roomId);
    const { data } = await http.get(`/api/chats/${rid}/messages`, {
        params: { size, before },
    });
    return data;
}

export async function markRead(roomId, userId) {
    const rid = normRoomId(roomId);
    await http.post(`/api/chats/${rid}/read`, null, { params: { userId } });
}
