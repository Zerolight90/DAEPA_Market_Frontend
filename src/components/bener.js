'use client';

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import styles from "./css/bener.module.css";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
const PUBLIC_BANNER_ENDPOINT = `${API_BASE}/api/admin/banners/active`;

export default function Bener() {
    const [slides, setSlides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    const resolveImage = (url) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
        return `${base}${url.startsWith("/") ? url : `/${url}`}`;
    };

    const fetchBanners = async () => {
        try {
            const response = await fetch(PUBLIC_BANNER_ENDPOINT, {
                cache: "no-store"
            });
            if (response.ok) {
                const data = await response.json();
                // 백엔드에서 이미 활성 배너만 반환하므로 추가 필터링 불필요
                // displayOrder로 정렬 (백엔드에서 이미 정렬되어 있지만 확실히 하기 위해)
                const activeBanners = (Array.isArray(data) ? data : [])
                    .sort((a, b) => {
                        const orderA = a.displayOrder ?? 999;
                        const orderB = b.displayOrder ?? 999;
                        return orderA - orderB;
                    })
                    .map(item => ({
                        ...item,
                        image: resolveImage(item.imageUrl),
                        href: null
                    }));
                if (activeBanners.length > 0) {
                    setSlides(activeBanners);
                    setIsLoading(false);
                    return;
                }
            }
            // 배너가 없으면 빈 배열로 설정 (기본 배너 표시 안 함)
            setSlides([]);
        } catch (error) {
            console.error("배너 데이터 로드 실패:", error);
            // 에러 발생 시 빈 배열로 설정
            setSlides([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`fullBleed ${styles.block}`}>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>배너를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (slides.length === 0) {
        return null;
    }

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
