// /lib/chat/api.js
import axios from "axios";

export const http = axios.create({
    baseURL: "",            // Next.js rewrites로 /api/* → 백엔드 프록시
    withCredentials: true,  // 쿠키(ACCESS_TOKEN) 전달
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
    // 기대 형태: { userId: 7, authenticated: true } 또는 null
    return data;
}

export async function fetchRooms(userId) {
    // 백엔드가 쿠키에서 유저를 읽는 경우 userId 파라미터는 생략 가능
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
    // 응답: { roomId: number, created: boolean, identifier: string }
    return data;
}
