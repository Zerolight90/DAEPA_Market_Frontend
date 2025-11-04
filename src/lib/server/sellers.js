// src/lib/server/sellers.js
import { api } from "@/lib/api/client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

function normalizeThumb(url) {
    if (!url) return "/no-image.png";
    // /uploads 로 시작하면 백엔드 호스트를 붙여 절대 URL로
    if (url.startsWith("/uploads")) return `${API_BASE}${url}`;
    return url; // S3 등 절대 URL은 그대로
}

/** 판매자 상품 목록: 배열 그대로 리턴(ProductsGrid에 바로 넣기) */
export async function fetchSellerProducts({ sellerId, page = 0, size = 20, sort = "recent" }) {
    const qs = new URLSearchParams({ page: String(page), size: String(size), sort });
    const res = await api(`/sellers/${sellerId}/products?${qs.toString()}`, {
        next: { revalidate: 0 },
    });

    // 백엔드가 [ {id,title,price,thumbnail,status}, ... ] 형태의 배열을 줌
    const arr = Array.isArray(res) ? res : (res?.items ?? []);
    return arr.map((p) => ({
        id: p.id ?? p.pdIdx,
        title: p.title ?? p.pdTitle,
        price: p.price ?? p.pdPrice,
        // ProductsGrid가 'thumbnail' 또는 'image' 중 무엇을 보는지에 따라 둘 다 채워줌
        thumbnail: normalizeThumb(p.thumbnail ?? p.pdThumb),
        image: normalizeThumb(p.thumbnail ?? p.pdThumb),
        location: p.location ?? p.pdLocation ?? null,
        createdAt: p.createdAt ?? p.pdCreate ?? null,
        status: p.status ?? p.pdStatus ?? null,
    }));
}

/** (선택) 판매자 프로필은 없어도 됨 — 필요하면 유지 */
export async function fetchSeller(sellerId) {
    const res = await api(`/sellers/${sellerId}`).catch(() => null);
    if (!res) return { id: sellerId };
    return {
        id: res.id ?? res.uIdx ?? sellerId,
        nickname: res.nickname ?? res.uNickname ?? res.uName ?? "판매자",
        avatarUrl: res.avatarUrl ?? res.uProfile ?? "/images/avatar-default.png",
        freshness: typeof res.uManner === "number" ? Math.max(0, Math.min(100, res.uManner)) : null,
    };
}
