"use client";

import Link from "next/link";
import styles from "./SellerOtherList.module.css";
import SafeImage from "@/components/ui/image/SafeImage";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface SellerItem {
    id: number | string;
    title?: string;
    img?: string;
}

interface SellerOtherListProps {
    sellerId?: number | string;
    excludeId?: number | string;
    limit?: number;
}

export default function SellerOtherList({ sellerId, excludeId, limit = 12 }: SellerOtherListProps) {
    const [items, setItems] = useState<SellerItem[] | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (!sellerId) {
                if (alive) setItems([]);
                return;
            }
            try {
                const qs = new URLSearchParams();
                qs.set("size", String(limit));
                if (excludeId) qs.set("excludeId", String(excludeId));
                const res = await api.get(`/sellers/${sellerId}/products?${qs.toString()}`);
                if (!alive) return;
                const content = res.data?.content ?? res.data ?? [];
                const mapped: SellerItem[] = (Array.isArray(content) ? content : [])
                    .filter((p: Record<string, unknown>) => String(p.id ?? p.pdIdx) !== String(excludeId))
                    .slice(0, limit)
                    .map((p: Record<string, unknown>) => ({
                        id: (p.pdIdx ?? p.id) as number,
                        title: (p.pdTitle ?? p.title) as string,
                        img: (p.pdThumb ?? p.thumbnail) as string,
                    }));
                setItems(mapped);
            } catch {
                if (alive) setItems([]);
            }
        })();
        return () => { alive = false; };
    }, [sellerId, excludeId, limit]);

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
                        <SafeImage
                            src={it.img ?? ""}
                            alt={it.title ?? ""}
                            fill
                            className={styles.thumb}
                        />
                    </div>
                    <div className={styles.title}>{it.title}</div>
                </Link>
            ))}
        </div>
    );
}
