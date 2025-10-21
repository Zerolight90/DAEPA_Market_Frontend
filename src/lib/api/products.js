import { api } from "./client";

/** 서버/클라 공용 API */
export const fetchProduct = (id) =>
    api(`/products/${id}`, { next: { revalidate: 30 } });

export const fetchRelated = (id, limit = 10) =>
    api(`/products/${id}/related?limit=${limit}`, { next: { revalidate: 60 } });

export const fetchSellerItems = (sellerId, excludeId, limit = 8) =>
    api(`/sellers/${sellerId}/products?exclude=${excludeId}&limit=${limit}`, { next: { revalidate: 60 } });
