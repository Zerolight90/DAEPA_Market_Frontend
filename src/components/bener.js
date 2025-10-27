'use client';

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import styles from "./css/bener.module.css";

export default function Bener() {
    const [slides, setSlides] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            // 관리자 페이지에서 설정한 배너 데이터를 가져옴
            const response = await fetch("/api/banners");
            if (response.ok) {
                const data = await response.json();
                // 활성 상태인 배너만 필터링하고 순서대로 정렬
                const activeBanners = data
                    .filter(banner => banner.isActive !== false)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));
                setSlides(activeBanners);
            } else {
                // API가 없을 경우 기본 배너 데이터 사용
                setSlides([
                    { id: 1, title: "", subtitle: "", image: "/banners/banner1.jpg", href: "/event/1", order: 1, isActive: true },
                    { id: 2, title: "", subtitle: "", image: "/banners/banner2.jpg", href: "/event/2", order: 2, isActive: true },
                    { id: 3, title: "", subtitle: "", image: "/banners/banner3.jpg", href: "/event/3", order: 3, isActive: true },
                ]);
            }
        } catch (error) {
            console.error("배너 데이터 로드 실패:", error);
            // 오류 시 기본 배너 데이터 사용
            setSlides([
                { id: 1, title: "", subtitle: "", image: "/banners/banner1.jpg", href: "/event/1", order: 1, isActive: true },
                { id: 2, title: "", subtitle: "", image: "/banners/banner2.jpg", href: "/event/2", order: 2, isActive: true },
                { id: 3, title: "", subtitle: "", image: "/banners/banner3.jpg", href: "/event/3", order: 3, isActive: true },
            ]);
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
                    <SwiperSlide key={s.id} aria-label={s.title}>
                        <div className={styles.slide} style={{ backgroundImage: `url(${s.image})` }}>
                            <div className={styles.overlay} />
                            <div className={styles.inner}>
                                {s.title && <h2 className={styles.title}>{s.title}</h2>}
                                {s.subtitle && <p className={styles.subtitle}>{s.subtitle}</p>}
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
