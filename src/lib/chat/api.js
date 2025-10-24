// /lib/chat/api.js
import axios from "axios";

/**
 * REST는 Next rewrites로 /api/* → 백엔드 /api/* 프록시
 * WebSocket은 프록시 불가 → stompClient에서 baseUrl 직접 지정
 */
export const http = axios.create({
    baseURL: "",            // 상대경로(/api/*)
    withCredentials: true,  // 쿠키 인증 대비
});

// /api/auth/me 는 만료/비로그인일 수 있으니 조용히 null 반환
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

// roomId가 ["9021"]처럼 들어오는 경우 대비
function normRoomId(id) {
    const raw = Array.isArray(id) ? id[0] : String(id ?? "");
    return raw.replace(/[^0-9]/g, "");
}

/** 자기 정보 (없으면 null) */
export async function fetchMe() {
    const { data } = await http.get("/api/auth/me");
    return data; // { userId } | null
}

/** 채팅방 목록 */
export async function fetchRooms(userId) {
    const { data } = await http.get("/api/chats/my-rooms", { params: { userId } });
    return data;
}

/** 채팅 메시지 목록 (오래된→최신, ASC) */
export async function fetchMessages(roomId, size = 30, before) {
    const rid = normRoomId(roomId);
    const { data } = await http.get(`/api/chats/${rid}/messages`, {
        params: { size, before },
    });
    return data;
}

/** (미사용이면 지우세요) REST로 읽음 전송 — 현재는 WS 사용 권장 */
// export async function markRead(roomId, userId) {
//   const rid = normRoomId(roomId);
//   await http.post(`/api/chats/${rid}/read`, null, { params: { userId } });
// }
