/** @type {import('next').NextConfig} */

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
        // ✅ 개발/배포 공통: 프론트엔드의 /api 요청을 백엔드 서버로 강제 연결합니다.
        return [
            {
                source: "/api/:path*",
                destination: `https://api.daepazone.shop/api/:path*`,
            },
            {
                source: "/uploads/:path*",
                destination: `https://api.daepazone.shop/uploads/:path*`,
            },
        ];
    },
};

export default nextConfig;