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

    // 정렬
    const sortInQuery = searchParams.get("sort");
    const activeSort = sortInQuery || currentSort || "recent";

    // 가격
    const minInQuery = searchParams.get("min") || "";
    const maxInQuery = searchParams.get("max") || "";
    const [minPrice, setMinPrice] = useState(minInQuery);
    const [maxPrice, setMaxPrice] = useState(maxInQuery);

    // 거래방식 (MEET, DELIVERY)
    const dDealInQuery = searchParams.get("dDeal") || "";
    const [dealType, setDealType] = useState(dDealInQuery);

    // 판매완료 제외
    const excludeSoldInQuery = searchParams.get("excludeSold") === "true";
    const [excludeSold, setExcludeSold] = useState(excludeSoldInQuery);

    // 쿼리 -> state 동기화
    useEffect(() => {
        setMinPrice(minInQuery);
        setMaxPrice(maxInQuery);
    }, [minInQuery, maxInQuery]);

    useEffect(() => {
        setDealType(dDealInQuery);
    }, [dDealInQuery]);

    useEffect(() => {
        setExcludeSold(excludeSoldInQuery);
    }, [excludeSoldInQuery]);

    // 정렬 변경
    const setSort = (value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "recent") params.delete("sort");
        else params.set("sort", value);
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // 가격 적용
    const applyPriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (minPrice) params.set("min", minPrice);
        else params.delete("min");
        if (maxPrice) params.set("max", maxPrice);
        else params.delete("max");
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // 거래방식 적용
    const applyDealType = (code) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!code) params.delete("dDeal");
        else params.set("dDeal", code);
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // 판매완료 제외 토글
    const toggleExcludeSold = () => {
        const params = new URLSearchParams(searchParams.toString());
        const next = !excludeSold;
        if (next) params.set("excludeSold", "true");
        else params.delete("excludeSold");
        params.delete("page");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // 링크 빌드
    const buildHrefForMid = (midId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (midId) params.set("mid", String(midId));
        else params.delete("mid");
        params.delete("low");
        params.delete("page");
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    const buildHrefForLow = (lowId) => {
        const params = new URLSearchParams(searchParams.toString());
        if (selected?.mid) params.set("mid", String(selected.mid));
        if (lowId) params.set("low", String(lowId));
        else params.delete("low");
        params.delete("page");
        const qs = params.toString();
        return `${pathname}${qs ? `?${qs}` : ""}`;
    };

    const buildHrefForUpper = (name) => `/category/${encodeURIComponent(name)}`;

    return (
        <div className={styles.wrap}>
            <div className={styles.inner}>
                {/* 상단 */}
                <div className={styles.topBar}>
                    <div>
                        <h2 className={styles.title}>검색 결과</h2>
                        <div className={styles.breadcrumbs}>
                            <Link href="/">홈</Link>
                            <span className={styles.sep}>›</span>
                            <span>{categoryName || "전체"}</span>
                        </div>
                    </div>
                    <div className={styles.sortChips}>
                        <button
                            className={`${styles.chip} ${
                                activeSort === "recent" ? styles.chipActive : ""
                            }`}
                            onClick={() => setSort("recent")}
                        >
                            최신순
                        </button>
                        <button
                            className={`${styles.chip} ${
                                activeSort === "price_asc" ? styles.chipActive : ""
                            }`}
                            onClick={() => setSort("price_asc")}
                        >
                            가격 낮은 순
                        </button>
                        <button
                            className={`${styles.chip} ${
                                activeSort === "price_desc" ? styles.chipActive : ""
                            }`}
                            onClick={() => setSort("price_desc")}
                        >
                            가격 높은 순
                        </button>
                    </div>
                </div>

                {/* 표 영역 */}
                <div className={styles.table}>
                    {/* 1. 카테고리 줄 */}
                    <div className={styles.row}>
                        <div className={styles.th}>
                            카테고리
                        </div>
                        {/* ✅ 여기만 catTd로 바꿔서 세로 정렬 */}
                        <div className={styles.catTd}>
                            {/* 대분류 */}
                            {upperList?.length > 0 && (
                                <div className={styles.catLine}>
                                    {upperList.map((u) => {
                                        const label = u.name ?? u.upperCt;
                                        const isActive = label === categoryName;
                                        return (
                                            <Link
                                                key={u.id ?? u.upperIdx ?? label}
                                                href={buildHrefForUpper(label)}
                                                className={`${styles.catPill} ${
                                                    isActive ? styles.catPillActive : ""
                                                }`}
                                            >
                                                {label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* 중분류 */}
                            {middleList?.length > 0 && (
                                <div className={styles.catLine}>
                                    {middleList.map((m) => {
                                        const id = m.id ?? m.middleId;
                                        const name = m.name ?? m.middleCt;
                                        const active =
                                            String(selected?.mid ?? "") === String(id);
                                        return (
                                            <Link
                                                key={id}
                                                href={buildHrefForMid(id)}
                                                className={`${styles.catPill} ${
                                                    active ? styles.catPillActive : ""
                                                }`}
                                                prefetch={false}
                                            >
                                                {name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* 소분류: 중분류 선택돼 있을 때만 한 줄 아래로 */}
                            {!!selected?.mid && lowList?.length > 0 && (
                                <div className={styles.catLineSub}>
                                    {lowList.map((l) => {
                                        const id = l.id ?? l.lowId;
                                        const name = l.name ?? l.lowCt;
                                        const active =
                                            String(selected?.low ?? "") === String(id);
                                        return (
                                            <Link
                                                key={id}
                                                href={buildHrefForLow(id)}
                                                className={`${styles.catPill} ${
                                                    active ? styles.catPillActive : ""
                                                }`}
                                                prefetch={false}
                                            >
                                                {name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. 가격 줄 */}
                    <div className={styles.row}>
                        <div className={styles.th}>가격</div>
                        <div className={styles.td}>
                            <input
                                type="number"
                                className={styles.priceInput}
                                placeholder="최소 가격"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                            <span className={styles.tilde}>~</span>
                            <input
                                type="number"
                                className={styles.priceInput}
                                placeholder="최대 가격"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                            <button className={styles.applyBtn} onClick={applyPriceFilter}>
                                적용
                            </button>
                        </div>
                    </div>

                    {/* 3. 옵션 줄 */}
                    <div className={styles.row}>
                        <div className={styles.th}>옵션</div>
                        <div className={styles.td}>
                            <button
                                type="button"
                                onClick={() => applyDealType("")}
                                className={`${styles.optionBtn} ${
                                    dealType === "" ? styles.optionSelected : ""
                                }`}
                            >
                                <span className={styles.optionIcon} />
                                전체
                            </button>
                            <button
                                type="button"
                                onClick={() => applyDealType("MEET")}
                                className={`${styles.optionBtn} ${
                                    dealType === "MEET" ? styles.optionSelected : ""
                                }`}
                            >
                                <span className={styles.optionIcon} />
                                직거래
                            </button>
                            <button
                                type="button"
                                onClick={() => applyDealType("DELIVERY")}
                                className={`${styles.optionBtn} ${
                                    dealType === "DELIVERY" ? styles.optionSelected : ""
                                }`}
                            >
                                <span className={styles.optionIcon} />
                                택배거래
                            </button>
                            <button
                                type="button"
                                onClick={toggleExcludeSold}
                                className={`${styles.optionBtn} ${
                                    excludeSold ? styles.optionSelected : ""
                                }`}
                            >
                                <span className={styles.optionIcon} />
                                판매완료 제외
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
