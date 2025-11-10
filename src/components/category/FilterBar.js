"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./FilterBar.module.css";

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

    // ✅ 가격 쿼리 가져오기
    const minInQuery = searchParams.get("min") || "";
    const maxInQuery = searchParams.get("max") || "";
    const [minPrice, setMinPrice] = useState(minInQuery);
    const [maxPrice, setMaxPrice] = useState(maxInQuery);

    // 쿼리 바뀔 때 input도 반영
    useEffect(() => {
        setMinPrice(minInQuery);
        setMaxPrice(maxInQuery);
    }, [minInQuery, maxInQuery]);

    // 정렬칩 클릭
    const setSort = (value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "recent") params.delete("sort");
        else params.set("sort", value);
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // ✅ 가격 적용 버튼 클릭
    const applyPriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (minPrice) params.set("min", minPrice);
        else params.delete("min");
        if (maxPrice) params.set("max", maxPrice);
        else params.delete("max");
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // 중분류 클릭 시 이동할 href
    const buildHrefForMid = (midId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (midId) params.set("mid", String(midId));
        else params.delete("mid");
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

    const buildHrefForUpper = (name) => {
        return `/category/${encodeURIComponent(name)}`;
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                {/* 상단 제목/빵부스러기 */}
                <div className={styles.headerRow}>
                    <h2 className={styles.title}>검색 결과</h2>
                    <div className={styles.breadcrumbs}>
                        <Link href="/">홈</Link>
                        <span className={styles.sep}>›</span>
                        <span>{categoryName || "전체"}</span>
                    </div>
                </div>

                {/* 표처럼 보이는 영역 */}
                <div className={styles.table}>
                    <div className={styles.row}>
                        <div className={styles.th}>카테고리</div>
                        <div className={styles.td}>
                            {/* 대분류 */}
                            {upperList?.length > 0 && (
                                <div className={styles.block}>
                                    <div className={styles.upperRow}>
                                        {upperList.map((u) => {
                                            const label = u.name ?? u.upperCt;
                                            const isActive =
                                                label === categoryName;
                                            return (
                                                <Link
                                                    key={
                                                        u.id ??
                                                        u.upperIdx ??
                                                        label
                                                    }
                                                    href={buildHrefForUpper(
                                                        label
                                                    )}
                                                    className={`${styles.pill} ${
                                                        isActive
                                                            ? styles.active
                                                            : ""
                                                    }`}
                                                >
                                                    <span
                                                        className={
                                                            styles.pillText
                                                        }
                                                    >
                                                        {label}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 중분류 */}
                            {middleList?.length > 0 && (
                                <div className={styles.block}>
                                    <div className={styles.middleRow}>
                                        {middleList.map((m) => {
                                            const id =
                                                m.id ?? m.middleId;
                                            const name =
                                                m.name ?? m.middleCt;
                                            const active =
                                                String(selected?.mid ?? "") ===
                                                String(id);
                                            return (
                                                <Link
                                                    key={id}
                                                    href={buildHrefForMid(id)}
                                                    className={`${styles.pill} ${
                                                        active
                                                            ? styles.active
                                                            : ""
                                                    }`}
                                                    prefetch={false}
                                                >
                                                    <span
                                                        className={
                                                            styles.pillText
                                                        }
                                                    >
                                                        {name}
                                                    </span>
                                                    {typeof m.count !==
                                                        "undefined" && (
                                                            <span
                                                                className={
                                                                    styles.count
                                                                }
                                                            >
                                                            {m.count}
                                                        </span>
                                                        )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 소분류 */}
                            {!!selected?.mid && lowList?.length > 0 && (
                                <div className={styles.block}>
                                    <div className={styles.lowRow}>
                                        {lowList.map((l) => {
                                            const id = l.id ?? l.lowId;
                                            const name = l.name ?? l.lowCt;
                                            const active =
                                                String(selected?.low ?? "") ===
                                                String(id);
                                            return (
                                                <Link
                                                    key={id}
                                                    href={buildHrefForLow(id)}
                                                    className={`${styles.pill} ${
                                                        active
                                                            ? styles.active
                                                            : ""
                                                    }`}
                                                    prefetch={false}
                                                >
                                                    <span
                                                        className={
                                                            styles.pillText
                                                        }
                                                    >
                                                        {name}
                                                    </span>
                                                    {typeof l.count !==
                                                        "undefined" && (
                                                            <span
                                                                className={
                                                                    styles.count
                                                                }
                                                            >
                                                            {l.count}
                                                        </span>
                                                        )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 오른쪽 정렬칩 + 가격 */}
                        <div className={styles.sortCol}>
                            <div className={styles.sortChips}>
                                <button
                                    className={`${styles.chip} ${
                                        activeSort === "recent"
                                            ? styles.active
                                            : ""
                                    }`}
                                    onClick={() => setSort("recent")}
                                >
                                    최신순
                                </button>
                                <button
                                    className={`${styles.chip} ${
                                        activeSort === "price_asc"
                                            ? styles.active
                                            : ""
                                    }`}
                                    onClick={() => setSort("price_asc")}
                                >
                                    가격 낮은 순
                                </button>
                                <button
                                    className={`${styles.chip} ${
                                        activeSort === "price_desc"
                                            ? styles.active
                                            : ""
                                    }`}
                                    onClick={() => setSort("price_desc")}
                                >
                                    가격 높은 순
                                </button>
                            </div>

                            {/* ✅ 가격 필터 추가 */}
                            <div className={styles.priceFilter}>
                                <input
                                    type="number"
                                    placeholder="최소 가격"
                                    value={minPrice}
                                    onChange={(e) =>
                                        setMinPrice(e.target.value)
                                    }
                                />
                                <span className={styles.tilde}>~</span>
                                <input
                                    type="number"
                                    placeholder="최대 가격"
                                    value={maxPrice}
                                    onChange={(e) =>
                                        setMaxPrice(e.target.value)
                                    }
                                />
                                <button
                                    className={styles.applyBtn}
                                    onClick={applyPriceFilter}
                                >
                                    적용
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
