// src/lib/api/client.ts
// 다른 API 유틸리티와의 호환성을 위해 유지됩니다.
// 새 코드는 @/lib/api에서 직접 'api' 인스턴스를 가져와 사용해야 합니다.
import api from "@/lib/api";

export { api };

/** @deprecated */
export function getApiBaseUrl(): string | undefined {
    return api.defaults.baseURL;
}
