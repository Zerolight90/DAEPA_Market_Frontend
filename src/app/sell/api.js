// src/app/sell/api.js
import api from '@/lib/api'; // 중앙 관리되는 axios 인스턴스를 가져옵니다.

// 기존 Endpoints 객체는 그대로 사용하거나, 필요에 따라 아래 함수들처럼 바꿀 수 있습니다.
export const Endpoints = {
    // ✅ 상위 카테고리 + 상품 개수 포함된 버전
    upperCategoriesWithCount: `/category/uppers-with-count`, // Prefix는 axios 인스턴스에 설정되어 있습니다.

    // 카테고리/상품등록
    upperCategories: `/category/uppers`,
    middleCategories: (upperId) => `/category/uppers/${upperId}/middles`,
    lowCategories: (middleId)   => `/category/middles/${middleId}/lows`,
    
    // 찜 관련
    favoriteStatus: (pid) => `/favorites/${pid}`,          // GET
    favoriteToggle: (pid) => `/favorites/${pid}/toggle`,   // POST
};

/**
 * 상품 등록을 위한 API 함수
 * @param {FormData} formData - 상품 정보와 이미지 파일이 포함된 FormData 객체
 * @returns {Promise<any>}
 */
export const createProduct = async (formData) => {
    // axios는 FormData를 보낼 때 자동으로 'multipart/form-data' 헤더를 설정합니다.
    const response = await api.post('/products/create-multipart', formData);
    return response.data;
};

// 참고: 기존의 apiFetch 함수는 더 이상 필요 없으므로 삭제되었습니다.
// 프로젝트의 다른 부분에서 apiFetch를 사용하고 있었다면,
// 대신 api.get(), api.post() 등을 사용하도록 수정해야 합니다.
