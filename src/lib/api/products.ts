// src/lib/api/products.ts
import { api } from "./client";
import type { Product } from "@/types";

type RawImageInput = string | Record<string, unknown> | null | undefined;

function normalizeImageUrl(raw: RawImageInput): string | null {
    if (!raw) return null;

    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith("/")) return trimmed;
        return `/uploads/${trimmed}`;
    }

    if (typeof raw === "object") {
        const candidate =
            (raw.url as RawImageInput) ??
            (raw.imageUrl as RawImageInput) ??
            (raw.imgUrl as RawImageInput) ??
            (raw.path as RawImageInput) ??
            (raw.location as RawImageInput) ??
            (raw.link as RawImageInput) ??
            null;
        return normalizeImageUrl(candidate);
    }

    return null;
}

export interface ProductDetail extends Product {
    description?: string;
    images?: string[];
    condition?: string | null;
    dealType?: string | null;
    meetLocation?: string | null;
    seller?: {
        id: number;
        nickname: string;
        name: string;
        avatarUrl: string;
        manner: number;
        deals: number;
    };
    category?: string | null;
    mid?: string | null;
    sub?: string | null;
    [key: string]: unknown;
}

/**
 * 상품 상세 조회
 */
export const fetchProduct = async (id: number | string): Promise<ProductDetail | null> => {
    const { data: res } = await api.get<Record<string, unknown>>(`/products/${id}`, { next: { revalidate: 0 } } as never);
    if (!res) return null;

    const raw = { ...res };

    const imagesRaw = Array.isArray(res.images) ? res.images : [];
    const images = imagesRaw
        .map((img) => normalizeImageUrl(img as RawImageInput))
        .filter((url): url is string => url !== null);

    let condition: string | null = null;
    if (typeof res.pdStatus === "number") {
        condition = res.pdStatus === 0 ? "중고상품" : "새상품";
    }

    const rawDeal = (
        (res.dDeal as string) ??
        (res.ddeal as string) ??
        (res.d_deal as string) ??
        (res.deal as string) ??
        (res.tradeMethod as string) ??
        (res.dealType as string) ??
        ""
    ).toString().trim().toUpperCase();

    let dealType: string | null = null;
    if (rawDeal === "DELIVERY") dealType = "택배거래";
    else if (rawDeal === "MEET") dealType = "만나서직거래";

    const meetLocation = (res.location as string) || (res.pdLocation as string) || null;

    return {
        ...raw,
        id: res.pdIdx as number,
        title: res.pdTitle as string,
        price: res.pdPrice as number,
        description: res.pdContent as string,
        location: res.pdLocation as string,
        thumbnail: normalizeImageUrl(res.pdThumb as RawImageInput) || normalizeImageUrl(res.thumbnail as RawImageInput) || undefined,
        images,
        createdAt: res.pdCreate as string,
        seller: {
            id: res.sellerId as number,
            nickname: res.sellerName as string,
            name: res.sellerName as string,
            avatarUrl:
                normalizeImageUrl(res.sellerAvatar as RawImageInput) ||
                normalizeImageUrl(res.sellerAvatarUrl as RawImageInput) ||
                "/images/avatar-default.png",
            manner: typeof res.sellerManner === "number" ? res.sellerManner : 0,
            deals: (res.sellerDeals as number) ?? 0,
        },
        category: (res.upperName as string) || (res.category as string) || null,
        mid: (res.middleName as string) || (res.mid as string) || null,
        sub: (res.lowName as string) || (res.sub as string) || null,
        condition,
        dealType,
        meetLocation,
    };
};

/**
 * 관련 상품 조회
 */
export const fetchRelated = async (id: number | string, limit: number = 10): Promise<ProductDetail[]> => {
    const { data: list } = await api.get<unknown[]>(`/products/${id}/related?limit=${limit}`, {
        next: { revalidate: 60 },
    } as never);

    if (!Array.isArray(list)) return [];
    return list.map((p) => {
        const item = p as Record<string, unknown>;
        return {
            ...item,
            id: item.pdIdx as number,
            title: item.pdTitle as string,
            price: item.pdPrice as number,
            thumbnail: normalizeImageUrl(item.pdThumb as RawImageInput) || normalizeImageUrl(item.thumbnail as RawImageInput) || undefined,
            location: item.pdLocation as string,
            createdAt: item.pdCreate as string,
            images: Array.isArray(item.images)
                ? item.images.map((img) => normalizeImageUrl(img as RawImageInput)).filter((url): url is string => url !== null)
                : [],
        };
    });
};
