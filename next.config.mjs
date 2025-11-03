// next.config.mjs
/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_BASE

const nextConfig = {
    async rewrites() {
        if (!BACKEND) return []; // 값이 없으면 프록시 비활성화(빌드 통과)
        return [
            { source: '/api/:path*',     destination: `${BACKEND}/api/:path*` },
            { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
        ];
    },
};

export default nextConfig;


//const nextConfig = {
// 필요 시 끄기/켜기 옵션들
// reactStrictMode: true,

//    async rewrites() {
//      return [
// ✅ 백엔드의 모든 /api 경로를 프록시
//        { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },

// (선택) 업로드 이미지를 백엔드에서 서빙할 때
//      { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
// ];
// },
//};

//export default nextConfig;