// src/lib/api/products.js
import { api } from "./client";

/** 상세: 백엔드 ProductDetailDTO -> 프론트 모델로 매핑 */
export const fetchProduct = async (id) => {
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
    // 지금 백엔드 JSON에선 "ddeal" 이라서 그걸 꼭 넣어야 함
    const rawDeal = (
        res.dDeal ??       // 우리가 원래 예상한 이름
        res.ddeal ??       // ← 실제로 오는 이름
        res.d_deal ??      // snake_case
        res.deal ??        // 혹시 줄여서
        res.tradeMethod ?? // 프론트에서 보냈던 이름
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

    // 직거래 위치
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

        // ⭐ 판매자 - 컴포넌트가 nickname / avatarUrl 을 먼저 봄
        seller: {
            id: res.sellerId,
            nickname: res.sellerName,               // ← 이걸로 화면에 이름 나오게
            name: res.sellerName,                   // 혹시 다른 데서 name으로 쓸 수도 있으니까
            avatarUrl: res.sellerAvatar ?? "/images/avatar-default.png",
            // 아직 백엔드가 안 주는 값들은 기본값
            deals: res.sellerDeals ?? 0,
            manner: res.sellerManner ?? 0,
        },

        // 카테고리
        category: res.upperName || res.category || null,
        mid: res.middleName || res.mid || null,
        sub: res.lowName || res.sub || null,

        // 거래/상태
        condition,     // "중고상품" / "새상품"
        dealType,      // "택배거래" / "만나서 직거래"
        meetLocation,  // "서울 ..." 또는 null
    };
};

/** 연관상품: 그대로 쓰거나, 필요한 경우 프론트 키로 변환 */
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

/** 판매자 다른 상품 */
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
