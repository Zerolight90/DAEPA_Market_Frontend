"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./FilterBar.module.css";

/**
 * FilterBar
 * - 상단 브레드크럼 + 정렬칩 + (추가) 카테고리 칩
 * - middleList: [{id, name, count?}]
 * - lowList:    [{id, name, count?}]
 * - selected:   { mid, low }
 * - categoryName: 상단 타이틀(upper 이름)
 */
export default function FilterBar({
                                      categoryName,
                                      middleList = [],
                                      lowList = [],
                                      selected = { mid: null, low: null },
                                  }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "recent";

    // 정렬칩 변경
    const setSort = (value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "recent") params.delete("sort");
        else params.set("sort", value);
        params.delete("page"); // 정렬 바꾸면 페이지 리셋
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // 카테고리 칩용 URL 생성기
    const buildHrefForMid = (midId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (midId) params.set("mid", String(midId));
        else params.delete("mid");
        params.delete("low");  // mid 선택 시 low 초기화
        params.delete("page"); // 페이지 리셋
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    const buildHrefForLow = (lowId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (selected?.mid) params.set("mid", String(selected.mid)); // mid 유지
        if (lowId) params.set("low", String(lowId));
        else params.delete("low");
        params.delete("page"); // 페이지 리셋
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                {/* 좌측: 브레드크럼 + (추가) 카테고리 칩 */}
                <div className={styles.left}>
                    <div className={styles.breadcrumbs}>
                        <Link href="/">홈</Link>
                        <span className={styles.sep}>/</span>
                        <strong>{categoryName}</strong>
                    </div>

                    {/* 중간 카테고리 칩: 항상 표시, 선택 유지 */}
                    {middleList?.length > 0 && (
                        <div className={styles.pillsRow}>
                            {middleList.map((m) => {
                                const active = String(selected?.mid ?? "") === String(m.id);
                                return (
                                    <Link
                                        key={m.id}
                                        href={buildHrefForMid(m.id)}
                                        className={`${styles.pill} ${active ? styles.active : ""}`}
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

                    {/* 하위 카테고리 칩: mid 선택 시에만 표시 (middle은 위에 계속 유지됨) */}
                    {!!selected?.mid && lowList?.length > 0 && (
                        <div className={styles.pillsRow}>
                            {lowList.map((l) => {
                                const active = String(selected?.low ?? "") === String(l.id);
                                return (
                                    <Link
                                        key={l.id}
                                        href={buildHrefForLow(l.id)}
                                        className={`${styles.pill} ${active ? styles.active : ""}`}
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

                {/* 우측: 정렬칩 */}
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
