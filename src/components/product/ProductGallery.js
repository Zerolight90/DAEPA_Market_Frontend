// src/components/product/ProductGallery.js
"use client";

import { useState } from "react";
import styles from "./ProductGallery.module.css";

export default function ProductGallery({
                                           images = [],
                                           soldOut = false,
                                           dealState, // ← 상품 상세에서 d_sell 그대로 넘겨주면 여기서 판단
                                       }) {
    const safeImages = images.length ? images : ["/images/no-image.png"];
    const [main, setMain] = useState(safeImages[0]);

    // soldOut boolean 이 있으면 그걸 우선, 없으면 dealState 로 판단
    const sellNum = typeof dealState === "number" ? dealState : null;
    const isSold = soldOut || sellNum === 1;
    const isTrading = !soldOut && sellNum === 2;

    return (
        <div className={styles.wrap} style={{ position: "relative" }}>
            <div className={styles.main}>
                <img
                    src={main}
                    alt="메인 이미지"
                    className={styles.mainImg}
                    style={{
                        filter: isSold || isTrading ? "brightness(0.45)" : "none",
                        transition: "filter .15s",
                    }}
                />

                {(isSold || isTrading) && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0.45)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 18,
                            borderRadius: 12,
                            gap: 6,
                        }}
                    >
                        <div
                            style={{
                                width: 50,
                                height: 50,
                                borderRadius: "50%",
                                border: "2px solid #fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 22,
                            }}
                        >
                            ✓
                        </div>
                        <div>{isSold ? "판매완료" : "판매 중"}</div>
                    </div>
                )}
            </div>

            {safeImages.length > 1 && (
                <div className={styles.thumbs}>
                    {safeImages.map((src, i) => (
                        <button
                            key={i}
                            onClick={() => setMain(src)}
                            className={`${styles.tBtn} ${
                                main === src ? styles.active : ""
                            }`}
                            aria-label={`이미지 ${i + 1}`}
                        >
                            <img src={src} alt={`thumb-${i}`} className={styles.tImg} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
