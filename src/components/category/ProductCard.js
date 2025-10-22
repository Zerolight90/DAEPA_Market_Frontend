"use client";

import Link from "next/link";
import styles from "./ProductCard.module.css";

export default function ProductCard({ item, hrefBase = "/store" }) {
    return (
        <li className={styles.card}>
            <Link href={`${hrefBase}/${item.id}`} className={styles.link}>
                <div className={styles.thumbWrap}>
                    <img
                        src={item.thumbnail || "/no-image.png"}  // ✅ 수정
                        alt={item.title}
                        className={styles.thumb}
                    />
                </div>
                <div className={styles.meta}>
                    <h3 className={styles.name}>{item.title}</h3>
                    <div className={styles.price}>{item.price.toLocaleString()}원</div>
                    <div className={styles.sub}>
                        <span>{item.location}</span>
                        <span className={styles.dot}>•</span>
                        <span>{item.createdAt?.slice(0, 10) ?? ""}</span>
                    </div>
                </div>
            </Link>
        </li>
    );
}
