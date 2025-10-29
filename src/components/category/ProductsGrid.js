"use client";

import ProductCard from "@/components/category/ProductCard";
import styles from "./ProductsGrid.module.css";

/**
 * 외부에서 className 넘기면 그리드 스타일 교체 가능
 * (카테고리 page.module.css의 .grid를 재사용 가능)
 */
export default function ProductsGrid({ items = [], className }) {
    const list = Array.isArray(items) ? items : [];
    return (
        <ul className={className ?? styles.grid}>
            {list.map((item) => (
                <ProductCard key={`pd-${String(item.id)}`} item={item} />
            ))}
        </ul>
    );
}
