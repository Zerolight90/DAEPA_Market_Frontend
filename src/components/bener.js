// bener.js
'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import styles from './css/bener.module.css';

// ✅ 프론트 도메인 기준으로 반드시 프록시(/api) 경유
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';
const PUBLIC_BANNER_ENDPOINT = `${API_BASE}/admin/banners`;

// 배포/로컬 모두에서 동일하게 동작하도록 이미지 URL 정규화
function resolveImage(url) {
    if (!url) return null;
    // 완전한 URL이면 그대로 사용
    if (url.startsWith('http')) return url;

    // 백엔드가 '/uploads/xxx.jpg' 형태를 주면
    // 프런트 Nginx가 S3로 프록시하므로 그대로 상대경로 유지 (동일 오리진)
    if (url.startsWith('/')) return url;

    // 혹시 'uploads/xxx.jpg' 처럼 앞에 슬래시가 빠진 경우를 보정
    return `/uploads/${url}`;
}

export default function Bener() {
    const [slides, setSlides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    async function fetchBanners() {
        try {
            const res = await fetch(PUBLIC_BANNER_ENDPOINT, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const active = (Array.isArray(data) ? data : [])
                    .filter(b => b.isActive !== false)
                    .sort((a, b) => (a.order ?? a.displayOrder ?? 0) - (b.order ?? b.displayOrder ?? 0))
                    .map(item => ({
                        ...item,
                        image: resolveImage(item.image ?? item.imageUrl),
                        href: null,
                    }));

                if (active.length > 0) {
                    setSlides(active);
                    return;
                }
            }
            // 폴백(퍼블릭 정적 파일) — /public/banners/* 가 있어야 함
            setSlides([
                { id: 1, image: '/banners/banner1.jpg', order: 1, isActive: true },
                { id: 2, image: '/banners/banner2.jpg', order: 2, isActive: true },
                { id: 3, image: '/banners/banner3.jpg', order: 3, isActive: true },
            ]);
        } catch (e) {
            console.error('배너 데이터 로드 실패:', e);
            setSlides([
                { id: 1, image: '/banners/banner1.jpg', order: 1, isActive: true },
                { id: 2, image: '/banners/banner2.jpg', order: 2, isActive: true },
                { id: 3, image: '/banners/banner3.jpg', order: 3, isActive: true },
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className={`fullBleed ${styles.block}`}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner} />
                    <p>배너를 불러오는 중...</p>
                </div>
            </div>
        );
    }
    if (slides.length === 0) return null;

    return (
        <div className={`fullBleed ${styles.block}`}>
            <Swiper
                modules={[Navigation, Autoplay, Pagination, A11y]}
                slidesPerView={1}
                spaceBetween={0}
                loop={slides.length > 1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                className={styles.swiper}
            >
                {slides.map(s => (
                    <SwiperSlide key={s.id}>
                        <div className={styles.slide} style={{ backgroundImage: `url(${s.image})` }} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
