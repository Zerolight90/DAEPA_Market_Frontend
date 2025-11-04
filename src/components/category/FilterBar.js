// src/components/category/FilterBar.js
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./FilterBar.module.css";

/**
 * FilterBar
 * - 브레드크럼
 * - 중분류/소분류 칩
 * - 오른쪽 정렬칩 (최신순 / 가격↑ / 가격↓)
 */
export default function FilterBar({
                                      categoryName,
                                      middleList = [],
                                      lowList = [],
                                      selected = { mid: null, low: null },
                                      currentSort, // 있어도 되고 없어도 됨. 없으면 searchParams에서 읽음
                                  }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // 현재 정렬은 쿼리에서 우선 읽고, 없으면 prop 사용
    const sortInQuery = searchParams.get("sort");
    const activeSort = sortInQuery || currentSort || "recent";

    // 정렬칩 누르면 쿼리만 바꿈
    const setSort = (value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "recent") params.delete("sort");
        else params.set("sort", value);
        // 정렬 바꾸면 페이지 0으로
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // 중분류 칩 누를 때
    const buildHrefForMid = (midId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (midId) params.set("mid", String(midId));
        else params.delete("mid");
        // mid 바뀌면 low는 초기화
        params.delete("low");
        params.delete("page");
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    // 소분류 칩 누를 때
    const buildHrefForLow = (lowId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (selected?.mid) params.set("mid", String(selected.mid));
        if (lowId) params.set("low", String(lowId));
        else params.delete("low");
        params.delete("page");
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                {/* 좌측 */}
                <div className={styles.left}>
                    {/* 브레드크럼 */}
                    <div className={styles.breadcrumbs}>
                        <Link href="/">홈</Link>
                        <span className={styles.sep}>/</span>
                        <strong>{categoryName}</strong>
                    </div>

                    {/* 중분류 칩 */}
                    {middleList?.length > 0 && (
                        <div className={styles.pillsRow}>
                            {middleList.map((m) => {
                                const active =
                                    String(selected?.mid ?? "") === String(m.id ?? m.middleId);
                                return (
                                    <Link
                                        key={m.id ?? m.middleId}
                                        href={buildHrefForMid(m.id ?? m.middleId)}
                                        className={`${styles.pill} ${
                                            active ? styles.active : ""
                                        }`}
                                        prefetch={false}
                                    >
                                        <span className={styles.pillText}>{m.name}</span>
                                        {typeof m.count !== "undefined" && (
                                            <span className={styles.count}>{m.count}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* 소분류 칩 (중분류 선택돼 있을 때만) */}
                    {!!selected?.mid && lowList?.length > 0 && (
                        <div className={styles.pillsRow}>
                            {lowList.map((l) => {
                                const active =
                                    String(selected?.low ?? "") === String(l.id ?? l.lowId);
                                return (
                                    <Link
                                        key={l.id ?? l.lowId}
                                        href={buildHrefForLow(l.id ?? l.lowId)}
                                        className={`${styles.pill} ${
                                            active ? styles.active : ""
                                        }`}
                                        prefetch={false}
                                    >
                                        <span className={styles.pillText}>{l.name}</span>
                                        {typeof l.count !== "undefined" && (
                                            <span className={styles.count}>{l.count}</span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 우측: 정렬 */}
                <div className={styles.actions}>
                    <button
                        className={`${styles.chip} ${
                            activeSort === "recent" ? styles.active : ""
                        }`}
                        onClick={() => setSort("recent")}
                    >
                        최신순
                    </button>
                    <button
                        className={`${styles.chip} ${
                            activeSort === "price_asc" ? styles.active : ""
                        }`}
                        onClick={() => setSort("price_asc")}
                    >
                        가격 낮은 순
                    </button>
                    <button
                        className={`${styles.chip} ${
                            activeSort === "price_desc" ? styles.active : ""
                        }`}
                        onClick={() => setSort("price_desc")}
                    >
                        가격 높은 순
                    </button>
                </div>
            </div>
        </div>
    );
}
