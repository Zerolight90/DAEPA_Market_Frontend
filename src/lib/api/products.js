// src/lib/api/products.js
import { api } from "./client";

/**
 * 상품 상세: 백엔드 ProductDetailDTO -> 프론트에서 쓰기 쉬운 형태로 변환
 */
export const fetchProduct = async (id) => {
    // 백엔드: GET /api/products/{id}
    const res = await api(`/products/${id}`, { next: { revalidate: 0 } });
    if (!res) return null;

    // 1) 백엔드에서 온 원본 전체를 일단 살려둔다
    //    (여기에 dsell, dstatus, ddeal 이 이미 들어있음)
    const raw = { ...res };

    // 이미지 배열
    const images = Array.isArray(res.images) ? res.images : [];

    // 상품 상태 (0=중고, 1=새상품)
    let condition = null;
    if (typeof res.pdStatus === "number") {
        condition = res.pdStatus === 0 ? "중고상품" : "새상품";
    }

    // 거래방식 여러 이름 커버
    const rawDeal = (
        res.dDeal ??
        res.ddeal ??
        res.d_deal ??
        res.deal ??
        res.tradeMethod ??
        res.dealType ??
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

    const meetLocation = res.location || res.pdLocation || null;

    return {
        // 2) 먼저 원본을 펼쳐서 dsell/dstatus/ddeal 안 날아가게 한다
        ...raw,

        // 3) 그다음 프론트에서 쓰기 좋은 이름을 덧씌운다
        id: res.pdIdx,
        title: res.pdTitle,
        price: res.pdPrice,
        description: res.pdContent,
        location: res.pdLocation,
        thumbnail: res.pdThumb,
        images,
        createdAt: res.pdCreate,

        // 판매자
        seller: {
            id: res.sellerId,
            nickname: res.sellerName,
            name: res.sellerName,
            avatarUrl: res.sellerAvatar ?? "/images/avatar-default.png",
            manner: typeof res.sellerManner === "number" ? res.sellerManner : 0,
            deals: res.sellerDeals ?? 0,
        },

        // 카테고리
        category: res.upperName || res.category || null,
        mid: res.middleName || res.mid || null,
        sub: res.lowName || res.sub || null,

        // 거래/상태
        condition,
        dealType,
        meetLocation,
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
        ...p, // ← 백엔드 원본 필드들(dsell, dstatus 등) 모두 보존

        id: p.pdIdx,
        title: p.pdTitle,
        price: p.pdPrice,
        thumbnail: p.pdThumb,
        location: p.pdLocation,
        createdAt: p.pdCreate,
    }));

};
