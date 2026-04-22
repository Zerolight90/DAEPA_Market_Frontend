// src/components/category/CategoryGrid.jsx
import Link from "next/link";
import styles from "./category.module.css";

/**
 * 공용 카테고리 그리드
 * - items: [{ id, name, count }]
 * - hrefPrefix: "/category/가전?mid=" 처럼 id가 바로 붙는 prefix
 * - query: { mid: '123' } 처럼 추가로 붙일 공통 쿼리
 */
export default function CategoryGrid({ items = [], hrefPrefix = "", query = {} }) {
    const qs = (obj) => {
        const s = new URLSearchParams(obj).toString();
        return s ? `&${s}` : "";
    };

    return (
        <div className={styles.grid}>
            {items.map((it) => (
                <Link
                    key={it.id}
                    href={`${hrefPrefix}${encodeURIComponent(it.id)}${qs(query)}`}
                    className={styles.item}
                >
                    <div className={styles.title}>{it.name}</div>
                    {typeof it.count !== "undefined" && (
                        <div className={styles.count}>{it.count}</div>
                    )}
                </Link>
            ))}
        </div>
    );
}
