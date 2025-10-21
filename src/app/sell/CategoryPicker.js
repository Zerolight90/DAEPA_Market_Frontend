"use client";

import { useEffect, useState } from "react";
import { apiFetch, Endpoints } from "./api";
import styles from "./page.module.css";

/** 상→중→하 카테고리 선택
 * 렌더: 엔티티 필드명(upperIdx/middleIdx/lowIdx, upperCt/middleCt/lowCt)
 * 부모로 전달: DTO 필드명(upperId/middleId/lowId)
 */
export default function CategoryPicker({ onChange }) {
    const [uppers, setUppers] = useState([]);
    const [middles, setMiddles] = useState([]);
    const [lows, setLows] = useState([]);

    const [upperSel, setUpperSel] = useState(null);
    const [middleSel, setMiddleSel] = useState(null);
    const [lowSel, setLowSel] = useState(null);

    const [loading, setLoading] = useState({ upper: false, middle: false, low: false });
    const [error, setError] = useState(null);

    // 1) 상위 로드
    useEffect(() => {
        (async () => {
            try {
                setLoading((p) => ({ ...p, upper: true })); setError(null);
                const data = await apiFetch(Endpoints.upperCategories);
                setUppers(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e); setError("대분류를 불러오지 못했습니다.");
                setUppers([]);
            } finally {
                setLoading((p) => ({ ...p, upper: false }));
            }
        })();
    }, []);

    // 2) 상위 선택 → 중위 로드
    useEffect(() => {
        if (!upperSel) { setMiddles([]); setMiddleSel(null); setLows([]); setLowSel(null); return; }
        (async () => {
            try {
                setLoading((p) => ({ ...p, middle: true })); setError(null);
                const data = await apiFetch(Endpoints.middleCategories(upperSel));
                setMiddles(Array.isArray(data) ? data : []);
                setMiddleSel(null); setLows([]); setLowSel(null);
            } catch (e) {
                console.error(e); setError("중분류를 불러오지 못했습니다.");
                setMiddles([]); setMiddleSel(null); setLows([]); setLowSel(null);
            } finally {
                setLoading((p) => ({ ...p, middle: false }));
            }
        })();
    }, [upperSel]);

    // 3) 중위 선택 → 하위 로드
    useEffect(() => {
        if (!middleSel) { setLows([]); setLowSel(null); return; }
        (async () => {
            try {
                setLoading((p) => ({ ...p, low: true })); setError(null);
                const data = await apiFetch(Endpoints.lowCategories(middleSel));
                setLows(Array.isArray(data) ? data : []);
                setLowSel(null);
            } catch (e) {
                console.error(e); setError("소분류를 불러오지 못했습니다.");
                setLows([]); setLowSel(null);
            } finally {
                setLoading((p) => ({ ...p, low: false }));
            }
        })();
    }, [middleSel]);

    // 4) 부모로 DTO 필드명으로 전달
    useEffect(() => {
        onChange?.({ upperId: upperSel, middleId: middleSel, lowId: lowSel });
    }, [upperSel, middleSel, lowSel]);

    return (
        <div className={styles.categoryGrid}>
            {/* 대분류 */}
            <div className={styles.col}>
                <div className={styles.colHeader}>대분류</div>
                <ul className={styles.list}>
                    {loading.upper && <li className={styles.itemMuted}>불러오는 중...</li>}
                    {(uppers ?? []).map((u) => (
                        <li key={u.upperIdx}
                            className={`${styles.item} ${u.upperIdx === upperSel ? styles.itemActive : ""}`}
                            onClick={() => setUpperSel(u.upperIdx)}>
                            {u.upperCt}
                        </li>
                    ))}
                    {!loading.upper && (uppers ?? []).length === 0 && <li className={styles.itemMuted}>데이터 없음</li>}
                </ul>
            </div>

            {/* 중분류 */}
            <div className={styles.col}>
                <div className={styles.colHeader}>중분류</div>
                <ul className={styles.list}>
                    {!upperSel && <li className={styles.itemMuted}>대분류를 먼저 선택하세요</li>}
                    {loading.middle && <li className={styles.itemMuted}>불러오는 중...</li>}
                    {(middles ?? []).map((m) => (
                        <li key={m.middleIdx}
                            className={`${styles.item} ${m.middleIdx === middleSel ? styles.itemActive : ""}`}
                            onClick={() => setMiddleSel(m.middleIdx)}>
                            {m.middleCt}
                        </li>
                    ))}
                    {!!upperSel && !loading.middle && (middles ?? []).length === 0 && <li className={styles.itemMuted}>데이터 없음</li>}
                </ul>
            </div>

            {/* 소분류 */}
            <div className={styles.col}>
                <div className={styles.colHeader}>소분류</div>
                <ul className={styles.list}>
                    {!middleSel && <li className={styles.itemMuted}>중분류를 먼저 선택하세요</li>}
                    {loading.low && <li className={styles.itemMuted}>불러오는 중...</li>}
                    {(lows ?? []).map((l) => (
                        <li key={l.lowIdx}
                            className={`${styles.item} ${l.lowIdx === lowSel ? styles.itemActive : ""}`}
                            onClick={() => setLowSel(l.lowIdx)}>
                            {l.lowCt}
                        </li>
                    ))}
                    {!!middleSel && !loading.low && (lows ?? []).length === 0 && <li className={styles.itemMuted}>데이터 없음</li>}
                </ul>
            </div>

            {/* 오류 메시지 (하단에 한 번만 표시) */}
            {error && <div className={styles.itemMuted} style={{gridColumn: "1 / -1", padding: "6px 4px"}}>{error}</div>}
        </div>
    );
}
