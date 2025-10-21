'use client';

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import styles from "./css/bener.module.css";

export default function Bener() {
    const slides = [
        { id: 1, title: "", subtitle: "", image: "/banners/banner1.jpg", href: "/event/1" },
        { id: 2, title: "", subtitle: "", image: "/banners/banner2.jpg", href: "/event/2" },
        { id: 3, title: "", subtitle: "", image: "/banners/banner3.jpg", href: "/event/3" },
    ];

    return (

        <div className={`fullBleed ${styles.block}`}>
            <Swiper
                modules={[Navigation, Autoplay, Pagination, A11y]}
                slidesPerView={1}
                spaceBetween={0}
                loop
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
