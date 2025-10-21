"use client";

import Link from "next/link";
import { Card, CardContent } from "@mui/material";
import Bener from "@/components/bener";
import styles from "./page.module.css";

export default function Home() {
    const categories = [
        { name: "전자제품", icon: "📱", count: "12,345" },
        { name: "패션/의류", icon: "👕", count: "8,967" },
        { name: "생활/가전", icon: "🏠", count: "6,543" },
        { name: "도서/음반", icon: "📚", count: "4,321" },
        { name: "스포츠/레저", icon: "⚽", count: "3,456" },
        { name: "자동차", icon: "🚗", count: "2,789" },
        { name: "반려동물", icon: "🐕", count: "1,234" },
        { name: "기타", icon: "📦", count: "5,678" },
    ];

    return (
        <>
        <Bener />

            <div className="container">
                <h2 className={styles.categoryTitle}>카테고리</h2>

                <div className={styles.categoryList}>
                    {categories.map((c) => (
                        <Link
                            key={c.name}
                            href={`/category/${encodeURIComponent(c.name)}`}
                            className={styles.cardLink}
                        >
                            <Card variant="outlined" className={styles.categoryCard}>
                                <CardContent>
                                    <div className={styles.categoryIcon}>{c.icon}</div>
                                    <h3 className={styles.categoryName}>{c.name}</h3>
                                    <p className={styles.categoryCount}>{c.count}개</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}
