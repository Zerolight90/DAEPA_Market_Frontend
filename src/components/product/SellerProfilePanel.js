// src/components/product/SellerProfilePanel.js
"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import useSellerHintStore from "@/store/SellerHintStore";
import styles from "./seller-profile-panel.module.css";

function clamp100(v) {
    const n = Number.isFinite(+v) ? +v : 0;
    return Math.max(0, Math.min(100, n));
}

export default function SellerProfilePanel({ seller }) {
    if (!seller) return null;

    const nickname = seller.nickname || seller.name || "판매자";
    const mannerRaw = seller.freshness ?? seller.manner ?? seller.mannerScore ?? 0;
    const freshness = clamp100(mannerRaw);
    const deals = Number.isFinite(+seller.deals) ? +seller.deals : 0;
    const sellerId = seller.id ?? seller.uIdx ?? seller.uid;
    const hasAvatar = !!seller.avatarUrl;

    // 최근 본 판매자 힌트 캐시에 저장 → 다음 페이지에서 즉시 사용
    const remember = useSellerHintStore((s) => s.remember);
    useEffect(() => {
        if (!sellerId) return;
        remember(sellerId, {
            nickname,
            avatarUrl: seller.avatarUrl || null,
            freshness,
            deals,
            since: seller.since ?? null,
        });
    }, [sellerId, nickname, freshness, deals, seller?.since, seller?.avatarUrl, remember]);

    // 페이지 전환 시 프로필 정보를 쿼리로 실어 즉시 수화
    const qs = useMemo(() => {
        const p = new URLSearchParams();
        if (nickname) p.set("nick", nickname);
        if (seller?.avatarUrl) p.set("avatar", seller.avatarUrl);
        if (Number.isFinite(freshness)) p.set("fresh", String(freshness));
        return p.toString();
    }, [nickname, seller?.avatarUrl, freshness]);

    const storeHref = qs ? `/seller/${sellerId}?${qs}` : `/seller/${sellerId}`;
    const reviewsHref = qs ? `/seller/${sellerId}/reviews?${qs}` : `/seller/${sellerId}/reviews`;

    return (
        <section className={styles.box} aria-label="판매자 정보">
            <div className={styles.row}>
                <div className={styles.avatar}>
                    {hasAvatar ? (
                        <Image src={seller.avatarUrl} alt="" fill sizes="64px" />
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
