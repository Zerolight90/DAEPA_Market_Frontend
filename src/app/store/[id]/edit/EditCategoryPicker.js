"use client";

import { useEffect, useState } from "react";
import styles from "@/app/sell/page.module.css";

/**
 * 수정 전용 카테고리 픽커
 * - 처음에 받은 initialUpperId/middleId/lowId 로 선택을 세팅
 * - 이후에는 유저 클릭만 따라감
 * - 바깥으로는 { upperId, middleId, lowId } 를 넘김
 */
export default function EditCategoryPicker({
                                               initialUpperId,
                                               initialMiddleId,
                                               initialLowId,
                                               onChange,
                                           }) {
    const [uppers, setUppers] = useState([]);
    const [middles, setMiddles] = useState([]);
    const [lows, setLows] = useState([]);

    const [upperSel, setUpperSel] = useState(null);
    const [middleSel, setMiddleSel] = useState(null);
    const [lowSel, setLowSel] = useState(null);

    const [loading, setLoading] = useState({
        upper: false,
        middle: false,
        low: false,
    });

    // 1) 대분류 불러오기 + 초기값 적용
    useEffect(() => {
        (async () => {
            try {
                setLoading((p) => ({ ...p, upper: true }));
                const res = await fetch("/api/category/uppers", {
                    credentials: "include",
                });
                const data = res.ok ? await res.json() : [];
                setUppers(Array.isArray(data) ? data : []);

                // 초기값 있으면 대분류부터 세팅
                if (initialUpperId) {
                    setUpperSel(initialUpperId);
                }
            } catch (e) {
                console.error(e);
                setUppers([]);
            } finally {
                setLoading((p) => ({ ...p, upper: false }));
            }
        })();
    }, [initialUpperId]);

    // 2) 대분류 선택되면 중분류 로드 + 초기 중분류 반영
    useEffect(() => {
        if (!upperSel) {
            setMiddles([]);
            setMiddleSel(null);
            setLows([]);
            setLowSel(null);
            return;
        }

        (async () => {
            try {
                setLoading((p) => ({ ...p, middle: true }));
                const res = await fetch(`/api/category/uppers/${upperSel}/middles`, {
                    credentials: "include",
                });
                const data = res.ok ? await res.json() : [];
                setMiddles(Array.isArray(data) ? data : []);

                // 처음 들어왔을 때만 initialMiddleId 를 반영
                if (initialMiddleId) {
                    const exists = data.some((m) => m.middleIdx === initialMiddleId);
                    if (exists) {
                        setMiddleSel(initialMiddleId);
                    } else {
                        setMiddleSel(null);
                        setLows([]);
                        setLowSel(null);
                    }
                } else {
                    // 초기값이 없으면 그냥 선택 안 된 상태
                    setMiddleSel((prev) =>
                        data.some((m) => m.middleIdx === prev) ? prev : null
                    );
                }
            } catch (e) {
                console.error(e);
                setMiddles([]);
                setMiddleSel(null);
                setLows([]);
                setLowSel(null);
            } finally {
                setLoading((p) => ({ ...p, middle: false }));
            }
        })();
        // initialMiddleId 는 "처음" 값이라 여기 넣어도 되고,
        // 부모에서 안 바꾸기 때문에 루프 안 생김
    }, [upperSel, initialMiddleId]);

    // 3) 중분류 선택되면 소분류 로드 + 초기 소분류 반영
    useEffect(() => {
        if (!middleSel) {
            setLows([]);
            setLowSel(null);
            return;
        }

        (async () => {
            try {
                setLoading((p) => ({ ...p, low: true }));
                const res = await fetch(`/api/category/middles/${middleSel}/lows`, {
                    credentials: "include",
                });
                const data = res.ok ? await res.json() : [];
                setLows(Array.isArray(data) ? data : []);

                if (initialLowId) {
                    const exists = data.some((l) => l.lowIdx === initialLowId);
                    if (exists) {
                        setLowSel(initialLowId);
                    } else {
                        setLowSel(null);
                    }
                } else {
                    setLowSel((prev) =>
                        data.some((l) => l.lowIdx === prev) ? prev : null
                    );
                }
            } catch (e) {
                console.error(e);
                setLows([]);
                setLowSel(null);
            } finally {
                setLoading((p) => ({ ...p, low: false }));
            }
        })();
    }, [middleSel, initialLowId]);

    // 4) 부모로 알리기
    // onChange 를 의존성에 안 넣어서 무한루프 방지
    useEffect(() => {
        onChange?.({
            upperId: upperSel,
            middleId: middleSel,
            lowId: lowSel,
        });
    }, [upperSel, middleSel, lowSel]); // ← onChange 빼기

    return (
        <div className={styles.categoryGrid}>
            {/* 대분류 */}
            <div className={styles.col}>
                <div className={styles.colHeader}>대분류</div>
                <ul className={styles.list}>
                    {loading.upper && (
                        <li className={styles.itemMuted}>불러오는 중...</li>
                    )}
                    {(uppers ?? []).map((u) => (
                        <li
                            key={u.upperIdx}
                            className={`${styles.item} ${
                                u.upperIdx === upperSel ? styles.itemActive : ""
                            }`}
                            onClick={() => {
                                setUpperSel(u.upperIdx);
                            }}
                        >
                            {u.upperCt}
                        </li>
                    ))}
                    {!loading.upper && (uppers ?? []).length === 0 && (
                        <li className={styles.itemMuted}>데이터 없음</li>
                    )}
                </ul>
            </div>

            {/* 중분류 */}
            <div className={styles.col}>
                <div className={styles.colHeader}>중분류</div>
                <ul className={styles.list}>
                    {!upperSel && (
                        <li className={styles.itemMuted}>대분류를 먼저 선택하세요</li>
                    )}
                    {loading.middle && (
                        <li className={styles.itemMuted}>불러오는 중...</li>
                    )}
                    {(middles ?? []).map((m) => (
                        <li
                            key={m.middleIdx}
                            className={`${styles.item} ${
                                m.middleIdx === middleSel ? styles.itemActive : ""
                            }`}
                            onClick={() => {
                                setMiddleSel(m.middleIdx);
                            }}
                        >
                            {m.middleCt}
                        </li>
                    ))}
                    {!!upperSel &&
                        !loading.middle &&
                        (middles ?? []).length === 0 && (
                            <li className={styles.itemMuted}>데이터 없음</li>
                        )}
                </ul>
            </div>

            {/* 소분류 */}
            <div className={styles.col}>
                <div className={styles.colHeader}>소분류</div>
                <ul className={styles.list}>
                    {!middleSel && (
                        <li className={styles.itemMuted}>중분류를 먼저 선택하세요</li>
                    )}
                    {loading.low && (
                        <li className={styles.itemMuted}>불러오는 중...</li>
                    )}
                    {(lows ?? []).map((l) => (
                        <li
                            key={l.lowIdx}
                            className={`${styles.item} ${
                                l.lowIdx === lowSel ? styles.itemActive : ""
                            }`}
                            onClick={() => {
                                setLowSel(l.lowIdx);
                            }}
                        >
                            {l.lowCt}
                        </li>
                    ))}
                    {!!middleSel &&
                        !loading.low &&
                        (lows ?? []).length === 0 && (
                            <li className={styles.itemMuted}>데이터 없음</li>
                        )}
                </ul>
            </div>
        </div>
    );
}
