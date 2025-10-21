"use client";

import Link from "next/link";
import styles from "./SellerOtherList.module.css";
import SafeImage from "@/components/ui/image/SafeImage";
import { useEffect, useMemo, useState } from "react";
import { fetchSellerItems } from "@/lib/api/products";
// 🔁 목업 폴백
import { ALL_ITEMS } from "@/lib/mockItems";

export default function SellerOtherList({ sellerId, excludeId, limit = 12 }) {
    const [items, setItems] = useState(null); // null=로딩, []=없음

    // 목업 폴백 데이터
    const mock = useMemo(() => {
        if (!sellerId) return [];
        return ALL_ITEMS
            .filter((it) => String(it.seller?.id) === String(sellerId) && String(it.id) !== String(excludeId))
            .slice(0, limit);
    }, [sellerId, excludeId, limit]);

    useEffect(() => {
        let alive = true;
        (async () => {
            // API가 설정돼 있지 않으면 곧장 목업 폴백
            const hasApi = !!process.env.NEXT_PUBLIC_API_BASE;
            if (!hasApi) {
                if (alive) setItems(mock);
                return;
            }
            // API 시도
            try {
                const data = await fetchSellerItems(sellerId, excludeId, limit);
                if (!alive) return;
                // API가 비었으면 목업으로
                if (!Array.isArray(data) || data.length === 0) setItems(mock);
                else setItems(data);
            } catch (e) {
                if (alive) setItems(mock);
            }
        })();
        return () => { alive = false; };
    }, [sellerId, excludeId, limit, mock]);

    // 로딩 스켈레톤
    if (items === null) {
        return (
            <div className={styles.grid}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={styles.card} aria-hidden>
                        <div className={styles.thumbWrap} style={{ background: "#eee" }} />
                        <div className={styles.title} style={{ height: 14, background: "#eee", borderRadius: 6 }} />
                    </div>
                ))}
            </div>
        );
    }

    if (!items.length) return null;

    return (
        <div className={styles.grid}>
            {items.map((it) => (
                <Link key={it.id} href={`/store/${it.id}`} className={styles.card}>
                    <div className={styles.thumbWrap}>
                        <SafeImage src={it.img || it.images?.[0] || "/images/placeholder.png"} alt={it.title} className={styles.thumb} />
                    </div>
                    <div className={styles.title}>{it.title}</div>
                </Link>
            ))}
        </div>
    );
}
