// src/lib/api/products.js
import { api } from "./client";

/**
 * 상품 상세: 백엔드 ProductDetailDTO -> 프론트에서 쓰기 쉬운 형태로 변환
 */
export const fetchProduct = async (id) => {
    // 백엔드: GET /api/products/{id}
    const res = await api(`/products/${id}`, { next: { revalidate: 0 } });
    if (!res) return null;

    // 이미지 배열
    const images = Array.isArray(res.images) ? res.images : [];

    // 상품 상태 (0=중고, 1=새상품)
    let condition = null;
    if (typeof res.pdStatus === "number") {
        condition = res.pdStatus === 0 ? "중고상품" : "새상품";
    }

    // 🔥 거래방식 여러 이름으로 들어오는 거 전부 커버
    // 지금 백엔드 JSON에선 "ddeal" 로 내려오니까 그걸 반드시 포함시켜야 함
    const rawDeal = (
        res.dDeal ??       // camel
        res.ddeal ??       // ← 실제로 오는 이름
        res.d_deal ??      // snake
        res.deal ??        // 짧게
        res.tradeMethod ?? // 혹시 프론트에서 보낼 때 이렇게
        res.dealType ??    // 다른 API 스타일
        ""
    )
        .toString()
        .trim()
        .toUpperCase();

    let dealType = null;
    if (rawDeal === "DELIVERY") {
        dealType = "택배거래";
    } else if (rawDeal === "MEET") {
        dealType = "만나서 직거래";
    }

    // 직거래 위치 (지금은 상품 위치랑 같게)
    const meetLocation = res.location || res.pdLocation || null;

    return {
        id: res.pdIdx,
        title: res.pdTitle,
        price: res.pdPrice,
        description: res.pdContent,
        location: res.pdLocation,
        thumbnail: res.pdThumb,
        images,
        createdAt: res.pdCreate,

        // ⭐ 판매자 - 컴포넌트가 nickname / avatarUrl 을 먼저 보는 구조라 이렇게 맞춤
        // 🟢 판매자
        seller: {
            id: res.sellerId,
            nickname: res.sellerName,
            name: res.sellerName,
            avatarUrl: res.sellerAvatar ?? "/images/avatar-default.png",
            // 🟢 여기! 백엔드가 내려준 sellerManner 사용
            manner: typeof res.sellerManner === "number" ? res.sellerManner : 0,
            deals: res.sellerDeals ?? 0,
        },

        // 카테고리
        category: res.upperName || res.category || null,
        mid: res.middleName || res.mid || null,
        sub: res.lowName || res.sub || null,

        // 거래/상태
        condition,     // "중고상품" / "새상품"
        dealType,      // "택배거래" / "만나서 직거래"
        meetLocation,  // 직거래 위치 (없으면 null)
    };
};

/**
 * 연관상품
 */
export const fetchRelated = async (id, limit = 10) => {
    const list = await api(`/products/${id}/related?limit=${limit}`, {
        next: { revalidate: 60 },
    });

    if (!Array.isArray(list)) return [];
    return list.map((p) => ({
        id: p.pdIdx ?? p.id,
        title: p.pdTitle ?? p.title,
        price: p.pdPrice ?? p.price,
        thumbnail: p.pdThumb ?? p.thumbnail,
        location: p.pdLocation ?? p.location,
        createdAt: p.pdCreate ?? p.createdAt,
    }));
};

/**
 * 판매자의 다른 상품
 */
export const fetchSellerItems = async (sellerId, excludeId, limit = 8) => {
    const list = await api(
        `/sellers/${sellerId}/products?exclude=${excludeId}&limit=${limit}`,
        { next: { revalidate: 60 } }
    );

    if (!Array.isArray(list)) return [];
    return list.map((p) => ({
        id: p.pdIdx ?? p.id,
        title: p.pdTitle ?? p.title,
        price: p.pdPrice ?? p.price,
        thumbnail: p.pdThumb ?? p.thumbnail,
        location: p.pdLocation ?? p.location,
        createdAt: p.pdCreate ?? p.createdAt,
    }));
};
