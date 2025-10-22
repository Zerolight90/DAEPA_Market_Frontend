"use client";

import ProductCard from "@/components/category/ProductCard";
import styles from "./ProductsGrid.module.css";

// ✅ 방어적으로 items / products 둘 다 지원 + key 안전 처리
export default function ProductsGrid({ items, products }) {
    const list = items ?? products ?? [];
    if (!Array.isArray(list) || list.length === 0) {
        return <div className={styles.empty}>아직 등록된 매물이 없어요.</div>;
    }

    return (
        <ul className={styles.grid}>
            {list.map((it) => (
                <ProductCard key={it.id ?? it.pdIdx} item={it} />
            ))}
        </ul>
    );
}
