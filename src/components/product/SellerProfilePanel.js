// src/components/product/SellerProfilePanel.js
import Image from "next/image";
import Link from "next/link";                   // ✅ 추가
import styles from "./seller-profile-panel.module.css";

function clamp100(v) {
    const n = Number.isFinite(+v) ? +v : 0;
    return Math.max(0, Math.min(100, n));
}

export default function SellerProfilePanel({ seller }) {
    if (!seller) return null;

    const nickname = seller.nickname || seller.name || "판매자";
    const mannerRaw = seller.freshness ?? seller.manner ?? seller.mannerScore;
    const freshness = clamp100(mannerRaw);
    const deals = Number.isFinite(+seller.deals) ? +seller.deals : 0;
    const sellerId = seller.id ?? seller.uIdx ?? seller.uid; // ✅ id 보장

    return (
        <section className={styles.box} aria-label="판매자 정보">
            <div className={styles.row}>
                <div className={styles.avatar}>
                    <Image
                        src={seller.avatarUrl || seller.avatar || "/images/avatar-default.png"}
                        alt=""
                        fill
                        sizes="64px"
                    />
                </div>

                <div className={styles.meta}>
                    <div className={styles.name}>{nickname}</div>
                    <div className={styles.sub}>거래 {deals}회 · 매너 {Number(freshness).toFixed(1)}</div>
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

            <div className={styles.actions}>
                {!!sellerId && (
                    <>
                        <Link className={styles.link} href={`/seller/${sellerId}`} prefetch={false}>
                            상점 보기
                        </Link>
                        <Link className={styles.link} href={`/seller/${sellerId}/reviews`} prefetch={false}>
                            후기 보기
                        </Link>
                    </>
                )}
            </div>
        </section>
    );
}
