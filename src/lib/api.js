import axios from 'axios';

// Axios 인스턴스 생성
const api = axios.create({
  // 백엔드 서버의 주소를 환경 변수에서 가져옵니다.
  // .env.local 파일에 NEXT_PUBLIC_API_URL=https://daepamarket.shop/api 와 같이 설정해야 합니다.
  // 로컬 개발 시에는 NEXT_PUBLIC_API_URL=http://localhost:8080/api 로 설정합니다.
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // 다른 도메인으로 요청을 보낼 때 쿠키를 포함시키기 위한 필수 설정입니다.
  withCredentials: true,
});

/*
  Axios 인터셉터를 사용하여 요청/응답을 전역으로 처리할 수 있습니다.
  예: 토큰 만료 시 리프레시 토큰으로 새로운 액세스 토큰을 요청하는 로직 등
*/

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     // 401 에러 및 재시도 로직 추가 가능
//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       // 여기서 리프레시 토큰으로 새로운 액세스 토큰을 요청하는 로직을 구현할 수 있습니다.
//       // 예: const { data } = await api.post('/auth/refresh');
//       // axios.defaults.headers.common['Authorization'] = 'Bearer ' + data.accessToken;
//       // return api(originalRequest);
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
