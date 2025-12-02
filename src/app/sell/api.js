// src/app/sell/api.js
import api from "@/lib/api";

export { api };
export const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE}/api`;

export const Endpoints = {
    // 카테고리
    upperCategoriesWithCount: "/category/uppers-with-count",
    upperCategories: "/category/uppers",
    middleCategories: (upperId) => `/category/uppers/${upperId}/middles`,
    lowCategories: (middleId) => `/category/middles/${middleId}/lows`,

    createProduct: "/products/create-multipart",

    // �?    favoriteStatus: (pid) => `/favorites/${pid}`,
    favoriteToggle: (pid) => `/favorites/${pid}/toggle`,
};

export const createProduct = async (formData) => {
    const response = await api.post("/products/create-multipart", formData);
    return response.data;
};
