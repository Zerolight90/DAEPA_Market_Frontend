// src/lib/api/products.js
import { api } from "./client";

function normalizeImageUrl(raw) {
    if (!raw) return null;

    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        if (/^https?:\/\//i.test(trimmed)) return trimmed; // 절대 URL
        if (trimmed.startsWith("/")) return trimmed; // /uploads/.. 등
        return `/uploads/${trimmed}`;
    }

    if (typeof raw === "object") {
        const candidate =
            raw.url ??
            raw.imageUrl ??
            raw.imgUrl ??
            raw.path ??
            raw.location ??
            raw.link ??
            null;
        return normalizeImageUrl(candidate);
    }

    return null;
}

/**
 * 상품 상세: 백엔드 ProductDetailDTO -> 프론트에서 쓰기 쉬운 상태로 변환
 */
export const fetchProduct = async (id) => {
    // 백엔드 GET /api/products/{id}
    const { data: res } = await api.get(`/products/${id}`, { next: { revalidate: 0 } });
    if (!res) return null;

    // 1) 백엔드에서 온 원본 객체를 그대로 보존한다
    //    (거기에 dsell, dstatus, ddeal 같은 값도 들어있음)
    const raw = { ...res };

    // 이미지 배열
    const imagesRaw = Array.isArray(res.images) ? res.images : [];
    const images = imagesRaw
        .map((img) => normalizeImageUrl(img))
        .filter(Boolean);

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
        dealType = "만나서직거래";
    }

    const meetLocation = res.location || res.pdLocation || null;

    return {
        // 2) 먼저 원본을 깔아줘서 dsell/dstatus/ddeal 모두 가져간다
        ...raw,

        // 3) 그다음 프론트에서 쓰기 좋은 이름으로 입힌다
        id: res.pdIdx,
        title: res.pdTitle,
        price: res.pdPrice,
        description: res.pdContent,
        location: res.pdLocation,
        thumbnail: normalizeImageUrl(res.pdThumb) || normalizeImageUrl(res.thumbnail),
        images,
        createdAt: res.pdCreate,

        // 판매자
        seller: {
            id: res.sellerId,
            nickname: res.sellerName,
            name: res.sellerName,
            avatarUrl:
                normalizeImageUrl(res.sellerAvatar) ||
                normalizeImageUrl(res.sellerAvatarUrl) ||
                "/images/avatar-default.png",
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
 * 관련 상품
 */
export const fetchRelated = async (id, limit = 10) => {
    const { data: list } = await api.get(`/products/${id}/related?limit=${limit}`, {
        next: { revalidate: 60 },
    });

    if (!Array.isArray(list)) return [];
    return list.map((p) => ({
        ...p, // <- 백엔드 원본 필드(dsell, dstatus 등) 모두 보존

        id: p.pdIdx,
        title: p.pdTitle,
        price: p.pdPrice,
        thumbnail: normalizeImageUrl(p.pdThumb) || normalizeImageUrl(p.thumbnail),
        location: p.pdLocation,
        createdAt: p.pdCreate,
        images: Array.isArray(p.images)
            ? p.images.map((img) => normalizeImageUrl(img)).filter(Boolean)
            : [],
    }));
};
