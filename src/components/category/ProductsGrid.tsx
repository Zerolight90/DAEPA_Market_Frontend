"use client";

import ProductCard from "@/components/category/ProductCard";
import styles from "./ProductsGrid.module.css";
import type { Product } from "@/types";

interface ProductsGridProps {
    items?: Product[];
    className?: string;
}

export default function ProductsGrid({ items = [], className }: ProductsGridProps) {
    const list = Array.isArray(items) ? items : [];
    return (
        <ul className={className ?? styles.grid}>
            {list.map((item) => (
                <ProductCard key={`pd-${String(item.id ?? item.pdIdx)}`} item={item} />
            ))}
        </ul>
    );
}
