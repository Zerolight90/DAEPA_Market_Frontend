"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./CategoryMatrix.module.css";

export default function CategoryMatrix({
                                           bigName,
                                           data,
                                           bigList = [],
                                           currentMid,
                                           currentSub,
                                           hrefBuilder,
                                       }) {
    const router = useRouter();

    const makeHref =
        hrefBuilder ||
        ((big, mid, sub) => {
            const base = `/category/${encodeURIComponent(big)}`;
            const qs = new URLSearchParams();
            if (mid) qs.set("mid", mid);
            if (sub) qs.set("sub", sub);
            const q = qs.toString();
            return q ? `${base}?${q}` : base;
        });

    const onChangeBig = (e) => {
        const next = e.target.value;
        router.push(makeHref(next)); // mid/sub 초기화
    };

    return (
        <div className={styles.wrap}>
            {/* breadcrumb + selector */}
            <div className={styles.breadcrumb}>
                <Link href="/" className={styles.home}>홈</Link>
                <span className={styles.sep}>›</span>

                {/* ✨ 대카테고리 드롭다운 스위처 */}
                <select className={styles.selector} value={bigName} onChange={onChangeBig}>
                    {bigList.map((b) => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>

                {data?.countsText && (
                    <span className={styles.countsText}>{data.countsText}</span>
                )}
            </div>

            {/* 전체보기 */}
            <div className={styles.headerRow}>
                <Link href={makeHref(bigName)} className={styles.allLink}>
                    전체보기 <span className={styles.arrow}>›</span>
                </Link>
            </div>

            {/* 매트릭스 (2행 x 4열) */}
            <div className={styles.matrix}>
                {chunk(data.children || [], 4).map((row, rIdx) => (
                    <div key={rIdx} className={styles.row}>
                        {row.map((mid) => {
                            const isMidActive = currentMid === mid.name;
                            return (
                                <div key={mid.name} className={styles.cell}>
                                    <div className={styles.midHeader}>
                                        <Link
                                            href={makeHref(bigName, mid.name)}
                                            className={`${styles.midLink} ${isMidActive ? styles.activeMid : ""}`}
                                        >
                                            {mid.name}
                                        </Link>
                                    </div>

                                    <div className={styles.smallList}>
                                        {(mid.children || []).map((s) => {
                                            const isSmallActive = isMidActive && currentSub === s.name;
                                            return (
                                                <Link
                                                    key={s.name}
                                                    href={makeHref(bigName, mid.name, s.name)}
                                                    className={`${styles.smallLink} ${isSmallActive ? styles.activeSmall : ""}`}
                                                >
                                                    {s.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {Array.from({ length: Math.max(0, 4 - row.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className={`${styles.cell} ${styles.empty}`} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}
