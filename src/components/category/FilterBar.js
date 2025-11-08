"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./FilterBar.module.css";

/**
 * props
 * - categoryName   : 현재 대분류 이름 (브레드크럼용)
 * - upperList      : 대분류 목록 [{ id, name }, ...]
 * - middleList     : 중분류 목록
 * - lowList        : 소분류 목록
 * - selected       : { mid, low }
 * - currentSort    : "recent" | "price_asc" | "price_desc"
 */
export default function FilterBar({
                                      categoryName,
                                      upperList = [],
                                      middleList = [],
                                      lowList = [],
                                      selected = { mid: null, low: null },
                                      currentSort,
                                  }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // 쿼리에 있는 sort가 우선
    const sortInQuery = searchParams.get("sort");
    const activeSort = sortInQuery || currentSort || "recent";

    // 정렬칩 클릭
    const setSort = (value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "recent") params.delete("sort");
        else params.set("sort", value);
        // 정렬 바꾸면 페이지는 0으로
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // 중분류 클릭 시 이동할 href
    const buildHrefForMid = (midId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (midId) params.set("mid", String(midId));
        else params.delete("mid");
        // mid 바뀌면 low 초기화
        params.delete("low");
        params.delete("page");
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    // 소분류 클릭 시 이동할 href
    const buildHrefForLow = (lowId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (selected?.mid) params.set("mid", String(selected.mid));
        if (lowId) params.set("low", String(lowId));
        else params.delete("low");
        params.delete("page");
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    // 대분류는 그냥 /category/[name]
    const buildHrefForUpper = (name) => {
        return `/category/${encodeURIComponent(name)}`;
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>

                {/* 빵부스러기 */}
                <div className={styles.breadcrumbs}>
                    <Link href="/">홈</Link>
                </div>
                {/* 위쪽: 대분류 + 정렬 */}
                <div className={styles.topRow}>
                    <div className={styles.upperRow}>
                        {upperList?.length > 0 &&
                            upperList.map((u) => {
                                const isActive =
                                    u.name === categoryName ||
                                    u.upperCt === categoryName;
                                return (
                                    <Link
                                        key={u.id ?? u.upperIdx ?? u.name}
                                        href={buildHrefForUpper(
                                            u.name ?? u.upperCt
                                        )}
                                        className={`${styles.pill} ${
                                            isActive ? styles.active : ""
                                        }`}
                                    >
                                        <span className={styles.pillText}>
                                            {u.name ?? u.upperCt}
                                        </span>
                                    </Link>
                                );
                            })}
                    </div>

                    {/* 오른쪽 정렬칩 */}
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

                {/* 가운데 줄: 중분류 */}
                {middleList?.length > 0 && (
                    <div className={styles.middleRow}>
                        {middleList.map((m) => {
                            const active =
                                String(selected?.mid ?? "") ===
                                String(m.id ?? m.middleId);
                            return (
                                <Link
                                    key={m.id ?? m.middleId}
                                    href={buildHrefForMid(m.id ?? m.middleId)}
                                    className={`${styles.pill} ${
                                        active ? styles.active : ""
                                    }`}
                                    prefetch={false}
                                >
                                    <span className={styles.pillText}>
                                        {m.name ?? m.middleCt}
                                    </span>
                                    {typeof m.count !== "undefined" && (
                                        <span className={styles.count}>
                                            {m.count}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* 아래 줄: 소분류 (중분류 선택돼 있을 때만) */}
                {!!selected?.mid && lowList?.length > 0 && (
                    <div className={styles.lowRow}>
                        {lowList.map((l) => {
                            const active =
                                String(selected?.low ?? "") ===
                                String(l.id ?? l.lowId);
                            return (
                                <Link
                                    key={l.id ?? l.lowId}
                                    href={buildHrefForLow(l.id ?? l.lowId)}
                                    className={`${styles.pill} ${
                                        active ? styles.active : ""
                                    }`}
                                    prefetch={false}
                                >
                                    <span className={styles.pillText}>
                                        {l.name ?? l.lowCt}
                                    </span>
                                    {typeof l.count !== "undefined" && (
                                        <span className={styles.count}>
                                            {l.count}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
