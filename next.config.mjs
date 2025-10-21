// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                // 프론트에서 요청하는 경로 (예: /api/sing/join/check_id)
                source: '/api/sing/join/:path*',

                // 실제 백엔드 서버의 경로로 매핑 (예: http://localhost:8080/api/sing/join/check_id)
                destination: 'http://localhost:8080/api/sing/join/:path*',
            },
        ];
    },
};

export default nextConfig;