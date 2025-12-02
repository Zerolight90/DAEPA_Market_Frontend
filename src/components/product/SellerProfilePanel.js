// src/components/product/SellerProfilePanel.js
"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import useSellerHintStore from "@/store/SellerHintStore";
import styles from "./seller-profile-panel.module.css";

function clamp100(v) {
    const n = Number.isFinite(+v) ? +v : 0;
    return Math.max(0, Math.min(100, n));
}

export default function SellerProfilePanel({ seller }) {
    // Always call hooks at the top level
    const remember = useSellerHintStore((s) => s.remember);

    // qs depends on seller, so it needs to be inside useMemo
    const qs = useMemo(() => {
        if (!seller) return ""; // Handle seller being null/undefined
        const nickname = seller.nickname || seller.name || "판매자";
        const freshness = clamp100(seller.freshness ?? seller.manner ?? seller.mannerScore ?? 0);

        const p = new URLSearchParams();
        if (nickname) p.set("nick", nickname);
        if (seller?.avatarUrl) p.set("avatar", seller.avatarUrl);
        if (Number.isFinite(freshness)) p.set("fresh", String(freshness));
        return p.toString();
    }, [seller]); // Depend on seller object

    useEffect(() => {
        if (!seller) return; // Only run if seller is available
        const nickname = seller.nickname || seller.name || "판매자";
        const mannerRaw = seller.freshness ?? seller.manner ?? seller.mannerScore ?? 0;
        const freshness = clamp100(mannerRaw);
        const deals = Number.isFinite(+seller.deals) ? +seller.deals : 0;
        const sellerId = seller.id ?? seller.uIdx ?? seller.uid;

        if (!sellerId) return;
        remember(sellerId, {
            nickname,
            avatarUrl: seller.avatarUrl || null,
            freshness,
            deals,
            since: seller.since ?? null,
        });
    }, [seller, remember]); // Depend on seller object and remember function

    if (!seller) return null; // Now, conditionally render after hooks

    const nickname = seller.nickname || seller.name || "판매자";
    const mannerRaw = seller.freshness ?? seller.manner ?? seller.mannerScore ?? 0;
    const freshness = clamp100(mannerRaw);
    const deals = Number.isFinite(+seller.deals) ? +seller.deals : 0;
    const sellerId = seller.id ?? seller.uIdx ?? seller.uid;
    const hasAvatar = !!seller.avatarUrl;
    const avatarSrc = seller.avatarUrl || "/images/avatar-default.png";

    const storeHref = qs ? `/seller/${sellerId}?${qs}` : `/seller/${sellerId}`;
    const reviewsHref = qs ? `/seller/${sellerId}/reviews?${qs}` : `/seller/${sellerId}/reviews`;

    return (
        <section className={styles.box} aria-label="판매자 정보">
            <div className={styles.row}>
                <div className={styles.avatar}>
                    {hasAvatar ? (
                        <img src={avatarSrc} alt="" className={styles.avatarImg} />
                    ) : (
                        <div className={styles.avatarFallback} />
                    )}
                </div>

                <div className={styles.meta}>
                    <div className={styles.name}>{nickname}</div>
                    {seller.since && <div className={styles.since}>{seller.since}</div>}
                </div>
            </div>

            {/* 신선도 게이지 */}
            <div className={styles.freshWrap}>
                <div className={styles.freshHead}>
                    <span className={styles.freshLabel}>신선도</span>
                    <span className={styles.freshNow}>{freshness.toFixed(0)}</span>
                    <span className={styles.freshMax}>/ 100</span>
                </div>
                <div
                    className={styles.freshBar}
                    role="progressbar"
                    aria-valuenow={freshness}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div className={styles.freshFill} style={{ width: `${freshness}%` }} />
                </div>
            </div>

            {/* ✅ 후기 페이지에서도 항상 보이도록 유지 */}
            <div className={styles.actions}>
                {!!sellerId && (
                    <>
                        <Link className={styles.link} href={storeHref} prefetch={false}>
                            상점 보기
                        </Link>
                        <Link className={styles.link} href={reviewsHref} prefetch={false}>
                            후기 보기
                        </Link>
                    </>
                )}
            </div>
        </section>
    );
}
