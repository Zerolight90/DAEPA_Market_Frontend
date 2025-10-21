"use client";

import { useState } from "react";
import styles from "./ProductGallery.module.css";

export default function ProductGallery({ images = [] }) {
    const safeImages = images.length ? images : ["/images/no-image.png"];
    const [main, setMain] = useState(safeImages[0]);

    return (
        <div className={styles.wrap}>
            <div className={styles.main}>
                <img src={main} alt="메인 이미지" className={styles.mainImg} />
            </div>
            {safeImages.length > 1 && (
                <div className={styles.thumbs}>
                    {safeImages.map((src, i) => (
                        <button
                            key={i}
                            onClick={() => setMain(src)}
                            className={`${styles.tBtn} ${main === src ? styles.active : ""}`}
                            aria-label={`이미지 ${i+1}`}
                        >
                            <img src={src} alt={`thumb-${i}`} className={styles.tImg} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
