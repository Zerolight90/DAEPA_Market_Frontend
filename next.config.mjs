// next.config.mjs
/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_BASE

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
        if (!BACKEND) return []; // 값이 없으면 프록시 비활성화(빌드 통과)
        return [
            { source: '/api/:path*',     destination: `${BACKEND}/api/:path*` },
        ];
    },
};

export default nextConfig;


