"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./FilterBar.module.css";

export default function FilterBar({ categoryName }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "recent";

    const setSort = (value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "recent") params.delete("sort");
        else params.set("sort", value);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                <div className={styles.breadcrumbs}>
                    <Link href="/">홈</Link>
                    <span className={styles.sep}>/</span>
                    <strong>{categoryName}</strong>
                </div>

                <div className={styles.actions}>
                    <button
                        className={`${styles.chip} ${currentSort === "recent" ? styles.active : ""}`}
                        onClick={() => setSort("recent")}
                    >
                        최신순
                    </button>
                    <button
                        className={`${styles.chip} ${currentSort === "price_asc" ? styles.active : ""}`}
                        onClick={() => setSort("price_asc")}
                    >
                        가격↑
                    </button>
                    <button
                        className={`${styles.chip} ${currentSort === "price_desc" ? styles.active : ""}`}
                        onClick={() => setSort("price_desc")}
                    >
                        가격↓
                    </button>
                </div>
            </div>
        </div>
    );
}
