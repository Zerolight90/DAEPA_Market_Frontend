export const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    (typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8080`
        : "http://localhost:8080");

/** 채팅방 목록 가져오기 */
export async function fetchRooms(userId = 101) {
    const url = new URL(`${API_BASE}/api/chats/my-rooms`);
    url.searchParams.set("userId", String(userId));
    const res = await fetch(url.toString(), { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error(`fetchRooms failed: ${res.status} ${await res.text().catch(()=> "")}`);
    return res.json();
}

/** 특정 roomId의 최근 메시지 가져오기 */
export async function fetchMessages(roomId, size = 30) {
    const url = new URL(`${API_BASE}/api/chats/${roomId}/messages`);
    url.searchParams.set("size", String(size));
    const res = await fetch(url.toString(), { method: "GET", credentials: "include" });
    if (!res.ok) throw new Error(`fetchMessages failed: ${res.status} ${await res.text().catch(()=> "")}`);
    return res.json();
}

/** ✅ 상품 상세 → 채팅하기 버튼 클릭 시 방 생성 or 재사용 */
export async function openOrGetRoom({ buyerId, sellerId, productId, dealId = null }) {
    const res = await fetch(`${API_BASE}/api/chats/open`, {
        method: "POST",
        credentials: "include", // ✅ 쿠키 세션 인증용
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, sellerId, productId, dealId }),
    });
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`openOrGetRoom failed: ${res.status} ${msg}`);
    }
    return res.json(); // { roomId, created, identifier }
}
