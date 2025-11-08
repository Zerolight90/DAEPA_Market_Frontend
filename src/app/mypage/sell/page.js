'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './sell.module.css';
import Sidebar from '@/components/mypage/sidebar';
import tokenStore from '@/app/store/TokenStore';

export default function SellHistoryPage() {
    const { accessToken } = tokenStore();
    const [list, setList] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    // 목록 가져오기
    async function fetchSell() {
        try {
            setLoading(true);
            setErr('');

            const res = await fetch('/api/deal/mySell', {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
                cache: 'no-store',
            });

            if (!res.ok) {
                const txt = await res.text();
                setErr(txt || '판매내역을 불러오지 못했습니다.');
                setList([]);
                return;
            }

            const data = await res.json();
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr('네트워크 오류가 발생했습니다.');
            setList([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSell();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    // d_sell 여러 형태 대응
    function getDSell(item) {
        return (
            item?.dSell ??
            item?.d_sell ??
            item?.dsell ??
            item?.D_SELL ??
            null
        );
    }

    // d_status 여러 형태 대응
    function getDStatus(item) {
        return (
            item?.dStatus ??
            item?.d_status ??
            item?.dstatus ??
            item?.D_STATUS ??
            null
        );
    }

    // 1=판매중, 2=결제완료, 3=판매완료 (계산은 그대로 두고)
    function calcBaseStep(item) {
        const dStatus = getDStatus(item);
        const dSell = getDSell(item);

        if (dStatus === 1 || dStatus === 1n) return 3;
        if (dSell === 1 || dSell === 1n) return 2;
        return 1;
    }

    // 배송 단계 계산
    function calcDeliverySteps(item) {
        const steps = {
            step4: false, // 배송 보냄 확인
            step5: false, // 배송
            step6: false, // 대파에서 검수 중
            step7: false, // 배송
            step8: false, // 후기 보내기
        };

        const baseStep = calcBaseStep(item);
        // 판매완료(3) 전이면 뒤 단계 안 보여줌
        if (baseStep < 3) return steps;

        const dv = item.dvStatus ?? item.dv_status ?? null;
        const ck = item.ckStatus ?? item.ck_status ?? null;

        // dv = 1 이상 → 배송보냄확인 + 배송
        if (dv != null && dv >= 1) {
            steps.step4 = true;
            steps.step5 = true;
        }
        // dv = 2 → 검수중
        if (dv != null && dv >= 2) {
            steps.step6 = true;
        } else if (ck != null && ck === 0) {
            steps.step6 = true;
        }
        // dv = 3 → 다음 배송
        if (dv != null && dv >= 3) {
            steps.step7 = true;
        }
        // dv = 5 → 후기
        if (dv != null && dv >= 5) {
            steps.step8 = true;
        }

        return steps;
    }

    // 날짜 포맷
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const normalized = String(dateStr).replace(' ', 'T').split('.')[0];
        const d = new Date(normalized);
        if (Number.isNaN(d.getTime())) {
            const only = String(dateStr).split(' ')[0];
            const parts = only.split('-');
            if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`;
            return only;
        }
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}.${m}.${day}`;
    }

    // 검색 필터
    const filtered = useMemo(() => {
        const kw = keyword.toLowerCase();
        return list.filter((item) =>
            (item.title || '').toLowerCase().includes(kw)
        );
    }, [list, keyword]);

    // 거래방식 텍스트
    function getTradeText(item) {
        const raw =
            (item?.dDeal ?? item?.ddeal ?? item?.d_deal ?? '').toString().trim();

        const upper = raw.toUpperCase();
        if (upper === 'MEET') return '직거래';
        if (upper === 'DELIVERY') return '택배거래';
        return raw;
    }

    // 배송 보냄 확인 → dv_status = 1
    async function handleSendClick(dealId) {
        try {
            const res = await fetch(`/api/delivery/${dealId}/sent`, {
                method: 'PATCH',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            if (!res.ok) {
                alert('배송 보냄 확인에 실패했습니다.');
                return;
            }
            fetchSell();
        } catch (e) {
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    // dv_status = 3 → dv_status = 5
    async function handleDoneClick(dealId) {
        try {
            const res = await fetch(`/api/delivery/${dealId}/done`, {
                method: 'PATCH',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            if (!res.ok) {
                alert('처리 중 오류가 발생했습니다.');
                return;
            }
            fetchSell();
        } catch (e) {
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    // 동그라미 스텝
    function Step({ active, label }) {
        return (
            <div className={`${styles.step} ${active ? styles.stepActive : ''}`}>
                <span className={styles.stepDot} />
                <span className={styles.stepLabel}>{label}</span>
            </div>
        );
    }

    // 네모 스텝
    function SquareStep({ active, label }) {
        return (
            <div
                className={`${styles.step} ${styles.stepSquare} ${
                    active ? styles.stepSquareActive : ''
                }`}
            >
                <span className={styles.stepSquareLabel}>{label}</span>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            <main className={styles.content}>
                <header className={styles.topBar}>
                    <h1 className={styles.pageTitle}>판매내역</h1>
                </header>

                <div className={styles.searchRow}>
                    <div className={styles.searchBox}>
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className={styles.searchInput}
                            placeholder="상품명을 입력해주세요."
                        />
                        <span className={styles.searchIcon} aria-hidden>
              🔍
            </span>
                    </div>
                </div>

                {loading && <div className={styles.empty}>불러오는 중...</div>}
                {!loading && err && <div className={styles.empty}>{err}</div>}

                {!loading && !err && (
                    <section className={styles.listArea}>
                        {filtered.map((item) => {
                            const baseStep = calcBaseStep(item);
                            const tradeText = getTradeText(item);

                            const isDelivery =
                                tradeText === '택배거래' ||
                                ((item?.dDeal ?? item?.ddeal ?? item?.d_deal ?? '')
                                    .toString()
                                    .trim()
                                    .toUpperCase() === 'DELIVERY');

                            const {
                                step4,
                                step5,
                                step6,
                                step7,
                                step8,
                            } = isDelivery ? calcDeliverySteps(item) : {};

                            // 위에서 계산은 1~3하지만 화면에서는 판매완료부터만 보여줄 거라
                            const dStatus = getDStatus(item);
                            const dSell = getDSell(item);
                            const statusText =
                                dStatus === 1 || dStatus === 1n
                                    ? '판매완료'
                                    : dSell === 1 || dSell === 1n
                                        ? '결제완료'
                                        : '판매중';

                            const showSendBtn = item.showSendBtn === true;
                            const currentDv = item.dvStatus ?? item.dv_status ?? null;
                            const showAfterDeliveryBtn =
                                isDelivery && currentDv !== null && currentDv === 3;
                            const showReviewBtn = item.showReviewBtn === true;

                            return (
                                <article key={item.dealId} className={styles.block}>
                                    {/* 날짜 + 거래방식 */}
                                    <div className={styles.dateRow}>
                                        <span>{formatDate(item.dealEndDate)}</span>
                                        <span className={styles.dot}>|</span>
                                        <span>{tradeText || '거래방식 미정'}</span>
                                    </div>

                                    <div className={styles.card}>
                                        <p className={styles.status}>{statusText}</p>

                                        <div className={styles.productRow}>
                                            <div className={styles.thumbBox}>
                                                <div className={styles.thumbPlaceholder} />
                                            </div>

                                            <div className={styles.prodInfo}>
                                                <p className={styles.prodTitle}>
                                                    {item.title || '(제목 없음)'}
                                                </p>
                                                <p className={styles.prodPrice}>
                                                    {(
                                                        (item.agreedPrice ?? item.pdPrice) ||
                                                        0
                                                    ).toLocaleString()}
                                                    원
                                                </p>
                                            </div>
                                        </div>

                                        {/* 🔴 여기부터만 보이게: 판매 완료 → ... */}
                                        <div className={styles.stepBar}>
                                            {/* 3. 판매 완료 (앞에 1,2는 안 보이게) */}
                                            <Step active={baseStep >= 3} label="판매 완료" />

                                            {isDelivery && (
                                                <>
                                                    <SquareStep
                                                        active={step4}
                                                        label="배송 보냄 확인"
                                                    />
                                                    <Step active={step5} label="배송" />
                                                    <Step active={step6} label="대파에서 검수 중" />
                                                    <Step active={step7} label="배송" />
                                                    <SquareStep
                                                        active={step8}
                                                        label="후기 보내기"
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {/* 버튼 영역 */}
                                        <div className={styles.actions}>
                                            {showSendBtn && (
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    onClick={() => handleSendClick(item.dealId)}
                                                >
                                                    배송 보냄 확인
                                                </button>
                                            )}

                                            {showAfterDeliveryBtn && (
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    onClick={() => handleDoneClick(item.dealId)}
                                                >
                                                    배송 완료 확인
                                                </button>
                                            )}

                                            {showReviewBtn && (
                                                <button type="button" className={styles.greenBtn}>
                                                    후기 보내기
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div className={styles.empty}>판매내역이 없습니다.</div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}
