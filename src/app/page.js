"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@mui/material";
import Bener from "@/components/bener";
import styles from "./page.module.css";
import { apiFetch, Endpoints } from "../app/sell/api";  // ✅ 경로 맞게 수정

export default function Home() {
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                // ✅ DB에서 상위 카테고리 목록 가져오기
                const data = await apiFetch(Endpoints.upperCategories);
                // data는 [{ upperIdx, upperCt }, ...] 형태로 반환됨
                const mapped = data.map((u, idx) => ({
                    id: u.upperIdx,
                    name: u.upperCt,
                    icon: pickIcon(idx),   // 아래 함수로 아이콘 매칭
                    count: "-",            // (추후 상품 개수 API로 대체 가능)
                }));
                setCategories(mapped);
            } catch (e) {
                console.error("카테고리 불러오기 실패:", e);
            }
        })();
    }, []);

    // ✅ 카테고리별 기본 아이콘 매칭 함수 (인덱스 기준)
    const pickIcon = (i) => {
        const icons = ["📱", "👕", "🏠", "📚", "⚽", "🚗", "🐕", "📦"];
        return icons[i % icons.length];
    };

    return (
        <>
            <Bener />

            <div className="container">
                <h2 className={styles.categoryTitle}>카테고리</h2>

                <div className={styles.categoryList}>
                    {(categories ?? []).map((c) => (
                        <Link
                            key={c.id}
                            href={`/category/${encodeURIComponent(c.name)}`}
                            className={styles.cardLink}
                        >
                            <Card variant="outlined" className={styles.categoryCard}>
                                <CardContent>
                                    <div className={styles.categoryIcon}>{c.icon}</div>
                                    <h3 className={styles.categoryName}>{c.name}</h3>
                                    <p className={styles.categoryCount}>
                                        {c.count === "-" ? "상품 준비중" : `${c.count}개`}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}
