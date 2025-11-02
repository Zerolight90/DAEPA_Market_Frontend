// src/components/product/SellerProfilePanel.js
import Image from "next/image";
import styles from "./seller-profile-panel.module.css";

export default function SellerProfilePanel({ seller }) {
    if (!seller) return null;

    const name =
        seller.nickname ||
        seller.name ||
        seller.uName ||    // 혹시 다른 API에서 올 때
        "판매자";

    const avatar =
        seller.avatarUrl ||
        seller.avatar ||
        "/images/avatar-default.png";

    const manner = Number(seller.manner ?? 0).toFixed(1);
    const deals = seller.deals ?? 0;

    return (
        <section className={styles.box} aria-label="판매자 정보">
            <div className={styles.row}>
                <div className={styles.avatar}>
                    <Image src={avatar} alt={name} fill sizes="64px" />
                </div>
                <div className={styles.meta}>
                    <div className={styles.name}>{name}</div>
                    <div className={styles.sub}>
                        거래 {deals}회 · 매너 {manner}
                    </div>
                    {seller.since && <div className={styles.since}>{seller.since}</div>}
                </div>
            </div>

            <div className={styles.actions}>
                {seller.id ? (
                    <>
                        <a className={styles.link} href={`/seller/${seller.id}`}>
                            상점 보기
                        </a>
                        <a className={styles.link} href={`/seller/${seller.id}/products`}>
                            다른 상품
                        </a>
                    </>
                ) : (
                    <span className={styles.link} style={{ opacity: 0.4 }}>
            판매자 정보 없음
          </span>
                )}
            </div>
        </section>
    );
}
