'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import styles from './css/bener.module.css';

// 프리셋: 프론트 도메인의 Nginx 프록시만 사용
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';
const PUBLIC_BANNER_ENDPOINT = `${API_BASE}/admin/banners`;

function resolveImage(url) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return url;
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
                    }));

                if (active.length > 0) {
                    setSlides(active);
                    return;
                }
            }

            // fallback (public 폴더)
            setSlides([
                { id: 1, image: '/banners/banner1.jpg' },
                { id: 2, image: '/banners/banner2.jpg' },
                { id: 3, image: '/banners/banner3.jpg' },
            ]);
        } catch (e) {
            console.error('배너 로드 실패:', e);
            setSlides([
                { id: 1, image: '/banners/banner1.jpg' },
                { id: 2, image: '/banners/banner2.jpg' },
                { id: 3, image: '/banners/banner3.jpg' },
            ]);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="fullBleed">
                <div className={styles.block}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner} />
                        <p>배너를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (slides.length === 0) return null;

    return (
        <div className="fullBleed">
            <div className={styles.block}>
                <Swiper
                    modules={[Navigation, Autoplay, Pagination, A11y]}
                    slidesPerView={1}
                    loop={slides.length > 1}
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    className={styles.swiper}
                >
                    {slides.map(s => (
                        <SwiperSlide key={s.id}>
                            <div
                                className={styles.slide}
                                style={{ backgroundImage: `url(${s.image})` }}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}
