//src/components/product/RelateProducts.js
import Link from "next/link";
import styles from "./SellerOtherList.module.css"; // 썸네일 스타일 재사용

export default function RelatedProducts({ items = [] }) {
    if (!items.length) return null;
    return (
        <div className={styles.grid}>
            {items.map((it) => (
                <Link key={it.id} href={`/store/${it.id}`} className={styles.card}>
                    <div className={styles.thumbWrap}>
                        <img src={it.img || it.images?.[0]} alt={it.title} className={styles.thumb} />
                    </div>
                    <div className={styles.title}>{it.title}</div>
                </Link>
            ))}
        </div>
    );
}
