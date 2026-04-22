"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@mui/material";
import Banner from "@/components/banner";
import styles from "./page.module.css";
import api from "@/lib/api";
import ProductRowSection from "@/components/product/ProductRowSection";

const CATEGORY_ICONS = ["📱", "👕", "🏠", "📚", "⚽", "🚗", "🐕", "📦"];

export default function Home() {
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/category/uppers-with-count");
                const mapped = data.map((u, idx) => ({
                    id: u.upperIdx,
                    name: u.upperCt,
                    icon: CATEGORY_ICONS[idx % CATEGORY_ICONS.length],
                    count: u.productCount ?? 0,
                }));
                setCategories(mapped);
            } catch (e) {
                // 카테고리 로딩 실패 시 빈 목록으로 graceful degradation
            }
        })();
    }, []);

    return (
        <>
            <Banner />

            <div className="container">
                <h2 className={styles.categoryTitle}>카테고리</h2>

                <div className={styles.categoryList}>
                    {categories.map((c) => (
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
                                        {c.count > 0 ? `${c.count}개` : "상품 준비중"}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <ProductRowSection title="전체 보기" sort="recent" link="/all" />
                <ProductRowSection title="찜이 많은 상품" sort="favorite" link="/all?sort=favorite" />
            </div>
        </>
    );
}
