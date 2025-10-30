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
                // ✅ 상품 개수 포함된 상위 카테고리 목록 가져오기
                const data = await apiFetch(Endpoints.upperCategoriesWithCount);
                console.log("카테고리 with count:", data);

                // ✅ 백엔드 DTO 기반으로 매핑
                const mapped = data.map((u, idx) => ({
                    id: u.upperIdx,
                    name: u.upperCt,
                    icon: pickIcon(idx),
                    count: u.productCount ?? 0, // ← 여기서 상품 개수
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
                                        {typeof c.count === "number" && c.count > 0
                                            ? `${c.count}개`
                                            : "상품 준비중"}
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
