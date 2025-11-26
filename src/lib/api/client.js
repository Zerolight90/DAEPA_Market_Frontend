// src/lib/api/client.js

// 이 파일은 다른 API 유틸리티와의 호환성을 위해 유지됩니다.
// 새 코드는 @/lib/api에서 직접 'api' 인스턴스를 가져와 사용해야 합니다.
import api from '@/lib/api';

// api 인스턴스를 그대로 다시 내보냅니다.
// 이제 이 인스턴스는 요청 시 자동으로 인증 토큰을 포함합니다.
export { api };

// getApiBaseUrl는 더 이상 필요하지 않습니다. api 인스턴스에 baseURL이 설정되어 있습니다.
/** @deprecated */
export function getApiBaseUrl() {
    return api.defaults.baseURL;
}