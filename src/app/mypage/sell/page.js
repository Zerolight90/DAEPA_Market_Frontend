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

    useEffect(() => {
        let ignore = false;

        async function fetchSell() {
            try {
                setLoading(true);
                setErr('');

                const res = await fetch('/api/deal/mySell', {
                    headers: accessToken
                        ? { Authorization: `Bearer ${accessToken}` }
                        : {},
                    credentials: 'include',
                    cache: 'no-store',
                });

                if (!res.ok) {
                    const txt = await res.text();
                    if (!ignore) {
                        setErr(txt || '판매내역을 불러오지 못했습니다.');
                        setList([]);
                    }
                    return;
                }

                const data = await res.json();
                if (!ignore) {
                    setList(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                if (!ignore) {
                    setErr('네트워크 오류가 발생했습니다.');
                    setList([]);
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchSell();
        return () => {
            ignore = true;
        };
    }, [accessToken]);

    // 1=판매중, 2=결제완료, 3=판매완료
    // 나머지 4~8 단계는 아직 백엔드 값이 없으니 3에서 멈추게 해놓고 표시만 해둔다.
    function calcBaseStep(item) {
        if (item.dStatus === 1 || item.dStatus === 1n) return 3;
        if (item.dSell === 1 || item.dSell === 1n) return 2;
        return 1;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const only = dateStr.split('T')[0];
        const parts = only.split('-');
        if (parts.length === 3) {
            return `${parts[0]}.${parts[1]}.${parts[2]}`;
        }
        return only;
    }

    const filtered = useMemo(() => {
        const kw = keyword.toLowerCase();
        return list.filter((item) =>
            (item.title || '').toLowerCase().includes(kw)
        );
    }, [list, keyword]);

    // MEET / DELIVERY
    function getTradeType(item) {
        const type = item.dDeal ? String(item.dDeal).trim().toUpperCase() : '';
        if (type === 'MEET') return '직거래';
        if (type === 'DELIVERY') return '택배거래';
        return '';
    }

    // 스텝 하나 렌더 (원형)
    function Step({ active, label }) {
        return (
            <div className={`${styles.step} ${active ? styles.stepActive : ''}`}>
                <span className={styles.stepDot} />
                <span className={styles.stepLabel}>{label}</span>
            </div>
        );
    }

    // 스텝 하나 렌더 (네모 버튼)
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
                            // 기본 1~3단계는 백엔드 값으로
                            const baseStep = calcBaseStep(item);
                            // 지금은 3 이후 서버 값이 없으니 3까지만 활성화
                            // 나중에 배송 보냄 확인을 누르면 이 값을 4로 올리는 식으로 확장하면 됨
                            const activeStep = baseStep; // 추후 상태 생기면 여기서 조정

                            const tradeType = getTradeType(item);

                            // 화면 왼쪽 상태 텍스트는 기본 1~3까지만
                            const statusText =
                                activeStep === 3
                                    ? '판매완료'
                                    : activeStep === 2
                                        ? '결제완료'
                                        : '판매중';

                            return (
                                <article key={item.dealId} className={styles.block}>
                                    {/* 날짜줄 */}
                                    <div className={styles.dateRow}>
                                        <span>{formatDate(item.productEndDate)}</span>
                                        {tradeType && (
                                            <>
                                                <span className={styles.dot}>|</span>
                                                <span>{tradeType}</span>
                                            </>
                                        )}
                                        <button
                                            className={styles.closeBtn}
                                            aria-label="닫기"
                                            type="button"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* 본문 카드 */}
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

                                        {/* 진행바: 8단계 버전 */}
                                        <div className={styles.stepBar}>
                                            {/* 1. 판매 중 */}
                                            <Step
                                                active={activeStep >= 1}
                                                label="판매 중"
                                            />
                                            {/* 2. 결제 완료 */}
                                            <Step
                                                active={activeStep >= 2}
                                                label="결제 완료"
                                            />
                                            {/* 3. 판매 완료 */}
                                            <Step
                                                active={activeStep >= 3}
                                                label="판매 완료"
                                            />
                                            {/* 4. 배송 보냄 확인 (버튼) */}
                                            <SquareStep
                                                active={activeStep >= 4}
                                                label="배송 보냄 확인"
                                            />
                                            {/* 5. 배송 */}
                                            <Step
                                                active={activeStep >= 5}
                                                label="배송"
                                            />
                                            {/* 6. 검수 */}
                                            <Step
                                                active={activeStep >= 6}
                                                label="대파에서 검수 중"
                                            />
                                            {/* 7. 배송 */}
                                            <Step
                                                active={activeStep >= 7}
                                                label="배송"
                                            />
                                            {/* 8. 후기 보내기 (버튼) */}
                                            <SquareStep
                                                active={activeStep >= 8}
                                                label="후기 보내기"
                                            />
                                        </div>

                                        {/* 별도 버튼은 안 달아도 됨. 마지막 네모가 버튼이니까 */}
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
