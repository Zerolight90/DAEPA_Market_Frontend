// 서버 컴포넌트 (여기엔 'use client' 쓰지 마세요)
import { Suspense } from 'react';
import MarketChat from '@/components/chat/MarketChat';

// 정적 프리렌더 방지 + 요청 시 렌더
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
    return (
        <Suspense fallback={null}>
            <MarketChat />
        </Suspense>
    );
}
