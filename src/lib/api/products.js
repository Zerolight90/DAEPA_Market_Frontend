// src/app/lib/api/products.js
import { api } from "./client";

/** 상세: 백엔드 ProductDetailDTO -> 프론트 모델로 매핑 */
export const fetchProduct = async (id) => {
    const res = await api(`/products/${id}`, { next: { revalidate: 0 } });
    if (!res) return null;

    // 백엔드 필드명(pd*)을 프론트에서 쓰기 편한 키로 변환
    return {
        id: res.pdIdx,
        title: res.pdTitle,
        price: res.pdPrice,
        location: res.pdLocation,
        description: res.pdContent,
        thumbnail: res.pdThumb,
        images: Array.isArray(res.images) ? res.images : [],
        createdAt: res.pdCreate,
        seller: {
            id: res.sellerId,
            name: res.sellerName,
            avatar: res.sellerAvatar ?? "/no-image.png",
        },
        // 필요 시 카테고리 정보도 사용
        category: res.category,
        mid: res.mid,
        sub: res.sub,
    };
};

/** 연관상품: 그대로 쓰거나, 필요한 경우 프론트 키로 변환 */
export const fetchRelated = async (id, limit = 10) => {
    const list = await api(`/products/${id}/related?limit=${limit}`, {
        next: { revalidate: 60 },
    });

    // 백엔드가 리스트를 ProductListDTO로 준다면 매핑
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
