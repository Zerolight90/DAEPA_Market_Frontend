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