// src/components/product/SellerProfilePanel.js
import Image from "next/image";
import styles from "./seller-profile-panel.module.css";

export default function SellerProfilePanel({ seller }) {
    if (!seller) return null;
    const manner = Number(seller.manner ?? 0).toFixed(1);

    return (
        <section className={styles.shopBox} aria-label="판매자 정보">
            <h3 className={styles.title}>가게 정보</h3>
            <div className={styles.profileRow}>
                <div className={styles.avatar}>
                    <Image
                        src={seller.avatarUrl || "/images/avatar-default.png"}
                        alt={`${seller.nickname} 프로필`}
                        fill
                        sizes="64px"
                        className={styles.avatarImg}
                    />
                </div>
                <div className={styles.meta}>
                    <div className={styles.name}>{seller.nickname || "판매자"}</div>
                    <div className={styles.sub}>
                        거래 {seller.deals ?? 0}회 · 매너 {manner}점
                    </div>
                    {seller.since && (
                        <div className={styles.since}>가입일: {seller.since}</div>
                    )}
                </div>
            </div>

            {/* 평점 게이지 */}
            <div className={styles.mannerWrap}>
                <div className={styles.mannerBar}>
                    <div className={styles.mannerFill} style={{ width: `${manner * 20}%` }} />
                </div>
                <div className={styles.mannerText}>매너지수 {manner}/5.0</div>
            </div>

            <div className={styles.actions}>
                <a className={styles.link} href={`/seller/${seller.id}`}>상점 보기</a>
                <a className={styles.link} href={`/seller/${seller.id}/products`}>다른 상품</a>
            </div>
        </section>
    );
}
