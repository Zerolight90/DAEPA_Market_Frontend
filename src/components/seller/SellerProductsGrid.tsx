// src/components/seller/SellerProductsGrid.js
"use client";

import ProductCard from "@/components/category/ProductCard";
import styles from "./SellerProductsGrid.module.css";

export default function SellerProductsGrid({ items = [] }) {
    return (
        <ul className={styles.grid}>
            {items.map((item) => (
                <ProductCard
                    key={item.id ?? item.pdIdx}
                    item={item}
                    hrefBase="/store"   // ← 여기! 네가 원래 쓰던 경로로 맞춤
                />
            ))}
        </ul>
    );
}
