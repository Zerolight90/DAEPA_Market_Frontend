import Image from "next/image";
import styles from "./seller-profile-panel.module.css";

export default function SellerProfilePanel({ seller }) {
    if (!seller) return null;
    const manner = Number(seller.manner ?? 0).toFixed(1);

    return (
        <section className={styles.box} aria-label="판매자 정보">
            <div className={styles.row}>
                <div className={styles.avatar}>
                    <Image src={seller.avatarUrl || "/images/avatar-default.png"} alt="" fill sizes="64px" />
                </div>
                <div className={styles.meta}>
                    <div className={styles.name}>{seller.nickname || "판매자"}</div>
                    <div className={styles.sub}>거래 {seller.deals ?? 0} · 매너 {manner}</div>
                    {seller.since && <div className={styles.since}>{seller.since}</div>}
                </div>
            </div>

            <div className={styles.actions}>
                <a className={styles.link} href={`/seller/${seller.id}`}>상점 보기</a>
                <a className={styles.link} href={`/seller/${seller.id}/products`}>다른 상품</a>
            </div>
        </section>
    );
}
