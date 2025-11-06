// next.config.mjs
/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_BASE;

const nextConfig = {
    async rewrites() {
        if (!BACKEND) return [];
        return [
            { source: '/api/:path*',     destination: `${BACKEND}/api/:path*` },
            { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
            // (선택) 헬스체크를 Next로도 보고싶으면:
            { source: '/actuator/:path*', destination: `${BACKEND}/actuator/:path*` },
        ];
    },
};

export default nextConfig;


