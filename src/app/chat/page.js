'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// 채팅은 CSR이 자연스럽고, useSearchParams 훅도 있으니 SSR 끔
const MarketChat = dynamic(() => import('@/components/chat/MarketChat'), {
    ssr: false,
});

// 빌드시 SSG 시도를 막고, 항상 요청 시 렌더
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
    return (
        <Suspense fallback={null}>
            <MarketChat />
        </Suspense>
    );
}
