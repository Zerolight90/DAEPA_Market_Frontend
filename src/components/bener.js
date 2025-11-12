'use client';

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import styles from "./css/bener.module.css";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
const PUBLIC_BANNER_ENDPOINT = `${API_BASE}/api/admin/banners`;

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
                const activeBanners = (Array.isArray(data) ? data : [])
                    .filter(banner => banner.isActive !== false)
                    .sort((a, b) => (a.order ?? a.displayOrder ?? 0) - (b.order ?? b.displayOrder ?? 0))
                    .map(item => ({
                        ...item,
                        image: resolveImage(item.image ?? item.imageUrl),
                        href: null
                    }));
                if (activeBanners.length > 0) {
                    setSlides(activeBanners);
                    return;
                }
            }
            setSlides([
                { id: 1, title: "", subtitle: "", image: "/banners/banner1.jpg", href: "/event/1", order: 1, isActive: true },
                { id: 2, title: "", subtitle: "", image: "/banners/banner2.jpg", href: "/event/2", order: 2, isActive: true },
                { id: 3, title: "", subtitle: "", image: "/banners/banner3.jpg", href: "/event/3", order: 3, isActive: true },
            ]);
        } catch (error) {
            console.error("배너 데이터 로드 실패:", error);
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
                    <SwiperSlide key={s.id}>
                        <div className={styles.slide} style={{ backgroundImage: `url(${s.image})` }} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
