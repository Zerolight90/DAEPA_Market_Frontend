'use client';

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, A11y } from "swiper/modules";
import styles from "./css/banner.module.css";
import api from "@/lib/api";

export default function Banner() {
    const [slides, setSlides] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBanners();
    }, []);

    const resolveImage = (url: string | null | undefined) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        return url.startsWith("/") ? url : `/${url}`;
    };

    const fetchBanners = async () => {
        try {
            const { data } = await api.get("/admin/banners/active");
            const activeBanners = (Array.isArray(data) ? data : [])
                .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
                .map(item => ({
                    ...item,
                    image: resolveImage(item.imageUrl),
                    href: null,
                }));
            setSlides(activeBanners);
        } catch {
            setSlides([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.block}>
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
        <div className={styles.block}>
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
