"use client";

import ProductCard from "@/components/category/ProductCard";
import styles from "./ProductsGrid.module.css";



export default function ProductsGrid({ items }) {
    if (!items || items.length === 0) {
        return <div className={styles.empty}>아직 등록된 매물이 없어요.</div>;
    }

    return (
        <ul className={styles.grid}>
            {items.map((it) => (
                <ProductCard key={it.id} item={it} />
            ))}
        </ul>
    );
}
