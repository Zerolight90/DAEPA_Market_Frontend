/** @type {import('next').NextConfig} */
const BACKEND = process.env.NEXT_PUBLIC_API_BASE;

const nextConfig = {
    output: 'standalone',
    eslint: { ignoreDuringBuilds: true },  // ✅ 이 줄 추가

    async rewrites() {
        return [
            { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
            { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
        ];
    },
};

export default nextConfig;
