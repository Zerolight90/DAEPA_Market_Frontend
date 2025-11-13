/** @type {import('next').NextConfig} */

// 환경 구분
const isProd = process.env.NODE_ENV === 'production';
const DEV_BACKEND = process.env.DEV_BACKEND_URL || 'http://localhost:8080';

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "daepa-s3.s3.ap-northeast-2.amazonaws.com",
                port: "",
                pathname: "/**",
            },
        ],
    },

    async rewrites() {
        // ✅ 배포환경: Nginx가 /api → 백엔드로 프록시하므로 rewrites 사용 안 함
        if (isProd) return [];

        // ✅ 개발환경: Next가 /api → localhost:8080 으로 프록시
        return [
            {
                source: "/api/:path*",
                destination: `${DEV_BACKEND}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
