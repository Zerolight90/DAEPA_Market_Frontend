/** @type {import('next').NextConfig} */

// =================================================================
// CI/CD 환경 변수 체크
// 배포 빌드 시 필수 환경 변수가 없으면 빌드를 중단시켜
// 잘못된 설정으로 배포되는 것을 방지합니다.
// =================================================================
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_API_BASE) {
    throw new Error('!!! [FATAL] NEXT_PUBLIC_API_BASE is not defined. Build failed.');
  }
  if (!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
    throw new Error('!!! [FATAL] NEXT_PUBLIC_TOSS_CLIENT_KEY is not defined. Build failed.');
  }
}

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
            {
                source: "/uploads/:path*",
                destination: `${DEV_BACKEND}/uploads/:path*`,
            },
        ];
    },
};

export default nextConfig;
