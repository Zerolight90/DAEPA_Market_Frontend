// next.config.mjs
/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_BASE

const nextConfig = {
    output: 'standalone',
    eslint: { ignoreDuringBuilds: true },      // 빌드 시 ESLint 에러 무시
    // 필요하면 타입체크도 임시로 무시 가능(권장X)
    // typescript: { ignoreBuildErrors: true },

    async rewrites() {
        return [
            // ✅ 백엔드의 모든 /api 경로를 프록시
            { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },

            // (선택) 업로드 이미지를 백엔드에서 서빙할 때
            { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
        ];
    },
};

export default nextConfig;
