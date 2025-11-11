'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './buy.module.css';
import Sidebar from '@/components/mypage/sidebar';
import tokenStore from '@/app/store/TokenStore';

export default function BuyHistoryPage() {
    const { accessToken } = tokenStore();
    const [list, setList] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [me, setMe] = useState(null); // ✅ 내 정보

    // 1) 내 정보 가져오기
    useEffect(() => {
        if (!accessToken) {
            setMe(null);
            return;
        }

        (async () => {
            try {
                const res = await fetch('/api/users/me', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: 'include',
                });
                if (res.ok) {
                    setMe(await res.json());
                } else {
                    setMe(null);
                }
            } catch (e) {
                setMe(null);
            }
        })();
    }, [accessToken]);

    // 2) 내 구매 목록 가져오기
    async function fetchDeals() {
        try {
            setLoading(true);
            setErr('');

            const res = await fetch('/api/deal/myBuy', {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
                cache: 'no-store',
            });

            if (!res.ok) {
                const txt = await res.text();
                setErr(txt || '구매내역을 불러오지 못했습니다.');
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
        if (!accessToken) return;
        fetchDeals();
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

    // d_buy / b_buy 여러 형태 대응
    function getDBuy(item) {
        return (
            item?.dBuy ??
            item?.bBuy ??
            item?.d_buy ??
            item?.b_buy ??
            item?.DBuy ??
            item?.B_BUY ??
            null
        );
    }

    // ✅ buyer_idx 여러 형태 대응
    function getBuyerIdx(item) {
        return (
            item?.buyerIdx ??
            item?.buyer_idx ??
            item?.buyerId ??
            item?.buyer_id ??
            null
        );
    }

    // 1=판매중, 2=결제완료, 3=판매완료 (여기서는 구매 쪽 표현으로 씀)
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
            step4: false,
            step5: false,
            step6: false,
            step7: false,
            step8: false,
        };

        const baseStep = calcBaseStep(item);
        if (baseStep < 3) return steps;

        const dv = item.dvStatus ?? item.dv_status ?? null;
        const ck = item.ckStatus ?? item.ck_status ?? null;

        if (dv != null && dv >= 1) {
            steps.step4 = true;
            steps.step5 = true;
        }
        if (dv != null && dv >= 2) {
            steps.step6 = true;
        } else if (ck != null && ck === 0) {
            steps.step6 = true;
        }
        if (dv != null && dv >= 3) {
            steps.step7 = true;
        }
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

    // ✅ 여기서 "내가 구매자"인 것만 남기고, 거기서 검색어까지 적용
    const filtered = useMemo(() => {
        const kw = keyword.toLowerCase().trim();

        const myIdx =
            me?.uIdx ??
            me?.u_idx ??
            me?.uid ??
            me?.id ??
            null;

        return list
            // 1) 내가 산 거래만
            .filter((item) => {
                const buyer = getBuyerIdx(item);

                if (buyer != null && myIdx != null) {
                    return Number(buyer) === Number(myIdx);
                }

                // 응답에 buyer가 아예 없으면 일단 보여주기
                return true;
            })
            // 2) 검색어 적용 (title, productTitle, pdTitle, dealId 다 걸기)
            .filter((item) => {
                if (!kw) return true;

                const candidates = [
                    item.title,
                    item.productTitle,
                    item.pdTitle,
                    item.pd_title,
                ]
                    .filter(Boolean)
                    .map((v) => String(v).toLowerCase());

                const dealIdStr = item.dealId ? String(item.dealId) : '';

                return (
                    candidates.some((t) => t.includes(kw)) ||
                    dealIdStr.includes(kw)
                );
            });
    }, [list, keyword, me]);

    // 거래방식 텍스트
    function getTradeText(item) {
        const raw =
            (item?.dDeal ?? item?.ddeal ?? item?.d_deal ?? '').toString().trim();

        const upper = raw.toUpperCase();
        if (upper === 'MEET') return '직거래';
        if (upper === 'DELIVERY') return '택배거래';
        return raw;
    }

    // ✅ 구매확인 버튼 노출 조건
    // 1) 판매자(d_sell) = 1
    // 2) 내 d_buy != 1
    // 3) d_status != 1 (이미 최종 완료면 버튼 안 뜸)
    function shouldShowBuyConfirm(item) {
        const dSell = getDSell(item);
        const dBuy = getDBuy(item);
        const dStatus = getDStatus(item);

        if (dStatus === 1 || dStatus === 1n) return false;
        return (dSell === 1 || dSell === 1n) && !(dBuy === 1 || dBuy === 1n);
    }

    // 배송 보냄 확인
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
            fetchDeals();
        } catch (e) {
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    // 배송 완료 확인
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
            fetchDeals();
        } catch (e) {
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    // ✅ 구매확정 호출
    async function handleBuyConfirm(dealId) {
        try {
            const res = await fetch(`/api/deal/${dealId}/confirm`, {
                method: 'POST',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            if (!res.ok) {
                const txt = await res.text();
                alert(txt || '구매확정에 실패했습니다.');
                return;
            }
            fetchDeals();
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
                    <h1 className={styles.pageTitle}>구매내역</h1>
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

                            const dStatus = getDStatus(item);
                            const dBuy = getDBuy(item);
                            const dSell = getDSell(item);

                            const statusText =
                                dStatus === 1 || dStatus === 1n
                                    ? '구매완료'
                                    : dSell === 1 || dSell === 1n
                                        ? '결제완료'
                                        : '구매중';

                            const showSendBtn = item.showSendBtn === true;
                            const currentDv = item.dvStatus ?? item.dv_status ?? null;
                            const showAfterDeliveryBtn =
                                isDelivery && currentDv !== null && currentDv === 3;
                            const showReviewBtn = item.showReviewBtn === true;

                            const showBuyConfirmBtn = shouldShowBuyConfirm(item);

                            return (
                                <article key={item.dealId} className={styles.block}>
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
                                                    {item.title ||
                                                        item.productTitle ||
                                                        item.pdTitle ||
                                                        '(제목 없음)'}
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

                                        {/* ✅ 스텝바 */}
                                        <div className={styles.stepBar}>
                                            {/* ✅ 여기 새로 추가: 구매확인 네모칸 */}
                                            <SquareStep
                                                active={
                                                    dBuy === 1 ||
                                                    dBuy === 1n ||
                                                    dStatus === 1 ||
                                                    dStatus === 1n
                                                }
                                                label="구매확인"
                                            />



                                            {/* 기본: 구매 완료 */}
                                            <Step active={baseStep >= 3} label="구매 완료" />



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

                                        {/* 버튼들 */}
                                        <div className={styles.actions}>
                                            {/* ✅ 구매확정 버튼: d_status=1 이면 안 나옴 */}
                                            {showBuyConfirmBtn && (
                                                <button
                                                    type="button"
                                                    className={styles.greenBtn}
                                                    onClick={() => handleBuyConfirm(item.dealId)}
                                                >
                                                    구매확정
                                                </button>
                                            )}

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
                            <div className={styles.empty}>구매내역이 없습니다.</div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}
