// src/app/mypage/buy/page.js
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './buy.module.css';
import Sidebar from '@/components/mypage/sidebar';
import tokenStore from '@/app/store/TokenStore';

const BACKEND_BASE =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE
        ? process.env.NEXT_PUBLIC_API_BASE
        : 'http://localhost:8080';

export default function BuyHistoryPage() {
    const router = useRouter();
    const { accessToken } = tokenStore();
    const [list, setList] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [me, setMe] = useState(null);
    const [selectedDeal, setSelectedDeal] = useState(null);

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
            console.log('📦 /api/deal/myBuy 응답 ===>', data);
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('❌ /api/deal/myBuy error:', e);
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

    function getDSell(item) {
        return item?.dSell ?? item?.d_sell ?? item?.dsell ?? item?.D_SELL ?? null;
    }

    function getDStatus(item) {
        return item?.dStatus ?? item?.d_status ?? item?.dstatus ?? item?.D_STATUS ?? null;
    }

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

    function getBuyerIdx(item) {
        return (
            item?.buyerIdx ??
            item?.buyer_idx ??
            item?.buyerId ??
            item?.buyer_id ??
            null
        );
    }

    function calcBaseStep(item) {
        const dStatus = getDStatus(item);
        const dSell = getDSell(item);

        if (dStatus === 1 || dStatus === 1n) return 3;
        if (dSell === 1 || dSell === 1n) return 2;
        return 1;
    }

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
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${y}.${m}.${day} ${hh}:${mm}`;
    }

    const filtered = useMemo(() => {
        const kw = keyword.toLowerCase().trim();
        const myIdx = me?.uIdx ?? me?.u_idx ?? me?.uid ?? me?.id ?? null;

        return list
            .filter((item) => {
                const buyer = getBuyerIdx(item);
                if (buyer != null && myIdx != null) {
                    return Number(buyer) === Number(myIdx);
                }
                return true;
            })
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
                const orderIdStr = item.orderId ? String(item.orderId) : '';

                return (
                    candidates.some((t) => t.includes(kw)) ||
                    dealIdStr.includes(kw) ||
                    orderIdStr.includes(kw)
                );
            });
    }, [list, keyword, me]);

    function getTradeText(item) {
        const raw = (item?.dDeal ?? item?.ddeal ?? item?.d_deal ?? '').toString().trim();
        const upper = raw.toUpperCase();
        if (upper === 'MEET') return '직거래';
        if (upper === 'DELIVERY') return '택배거래';
        return raw;
    }

    function shouldShowBuyConfirm(item) {
        const dSell = getDSell(item);
        const dBuy = getDBuy(item);
        const dStatus = getDStatus(item);

        if (dStatus === 1 || dStatus === 1n) return false;
        return (dSell === 1 || dSell === 1n) && !(dBuy === 1 || dBuy === 1n);
    }

    async function handleSendClick(dealId, e) {
        if (e) e.stopPropagation();
        const url = `${BACKEND_BASE}/api/delivery/${dealId}/sent`;
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            if (!res.ok) {
                const txt = await res.text();
                alert('배송 보냄 확인 실패\n' + txt);
                return;
            }
            fetchDeals();
        } catch (err2) {
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    async function handleDoneClick(dealId, e) {
        if (e) e.stopPropagation();
        const url = `${BACKEND_BASE}/api/delivery/${dealId}/done`;
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            if (!res.ok) {
                const txt = await res.text();
                alert('처리 중 오류가 발생했습니다.\n' + txt);
                return;
            }
            fetchDeals();
        } catch (err2) {
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    async function handleBuyConfirm(dealId, e) {
        if (e) e.stopPropagation();
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
        } catch (err2) {
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    // ✅ 구매자가 후기 보내기 누를 때
    async function handleReviewClick(deal) {
        const dealId = deal.dealId ?? deal.dIdx;
        if (!dealId) {
            alert('거래번호를 찾을 수 없습니다.');
            return;
        }

        try {
            const res = await fetch(`/api/review/exists?dealId=${dealId}&reType=BUYER`, {
                credentials: 'include',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    alert('이미 작성한 리뷰입니다.');
                    return;
                }
            }
        } catch (e) {
            console.warn('review exists check failed', e);
        }

        // 판매자 idx 찾아서 그쪽으로
        const sellerIdx =
            deal?.sellerIdx ??
            deal?.seller_idx ??
            deal?.sellerId ??
            deal?.seller_id ??
            null;

        if (!sellerIdx) {
            alert('판매자 정보를 찾을 수 없습니다.');
            return;
        }

        router.push(`/mypage/buy/${sellerIdx}?dealId=${dealId}`);
    }

    function Step({ active, label }) {
        return (
            <div className={`${styles.step} ${active ? styles.stepActive : ''}`}>
                <span className={styles.stepDot} />
                <span className={styles.stepLabel}>{label}</span>
            </div>
        );
    }

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

    function getSellerName(item) {
        return item?.sellerNickname ?? item?.seller_nickname ?? '-';
    }

    function getSellerPhone(item) {
        return item?.sellerPhone ?? item?.seller_phone ?? '-';
    }

    const FALLBACK_IMG =
        'https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg';

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

                            const { step4, step5, step6, step7, step8 } = isDelivery
                                ? calcDeliverySteps(item)
                                : {};

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
                            const showAfterDeliveryBtn = isDelivery && currentDv !== null && currentDv === 3;
                            const showReviewBtn = item.showReviewBtn === true;
                            const showBuyConfirmBtn = shouldShowBuyConfirm(item);

                            const thumb =
                                item.productThumb || item.pd_thumb || item.thumbnail || FALLBACK_IMG;

                            return (
                                <article key={item.dealId} className={styles.block}>
                                    <div className={styles.dateRow}>
                                        <span>{formatDate(item.dealEndDate)}</span>
                                        <span className={styles.dot}>|</span>
                                        <span>{tradeText || '거래방식 미정'}</span>
                                    </div>

                                    <div
                                        className={styles.card}
                                        onClick={() => {
                                            setSelectedDeal(item);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') setSelectedDeal(item);
                                        }}
                                    >
                                        <p className={styles.status}>{statusText}</p>

                                        <div className={styles.productRow}>
                                            <div className={styles.thumbBox}>
                                                <img
                                                    src={thumb}
                                                    alt={item.title ?? '상품 썸네일'}
                                                    className={styles.thumbImg}
                                                />
                                            </div>

                                            <div className={styles.prodInfo}>
                                                <p className={styles.prodTitle}>
                                                    {item.title || item.productTitle || item.pdTitle || '(제목 없음)'}
                                                </p>
                                                <p className={styles.prodPrice}>
                                                    {((item.agreedPrice ?? item.pdPrice) || 0).toLocaleString()}원
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.stepBar}>
                                            <SquareStep
                                                active={
                                                    dBuy === 1 ||
                                                    dBuy === 1n ||
                                                    dStatus === 1 ||
                                                    dStatus === 1n
                                                }
                                                label="구매확인"
                                            />

                                            <Step active={baseStep >= 3} label="구매 완료" />

                                            {isDelivery && (
                                                <>
                                                    <SquareStep active={step4} label="배송 보냄 확인" />
                                                    <Step active={step5} label="배송" />
                                                    <Step active={step6} label="대파에서 검수 중" />
                                                    <Step active={step7} label="배송" />
                                                    <SquareStep active={step8} label="후기 보내기" />
                                                </>
                                            )}
                                        </div>

                                        <div className={styles.actions}>
                                            {showBuyConfirmBtn && (
                                                <button
                                                    type="button"
                                                    className={styles.greenBtn}
                                                    onClick={(e) => handleBuyConfirm(item.dealId, e)}
                                                >
                                                    구매확정
                                                </button>
                                            )}

                                            {showSendBtn && (
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    onClick={(e) => handleSendClick(item.dealId, e)}
                                                >
                                                    배송 보냄 확인
                                                </button>
                                            )}

                                            {showAfterDeliveryBtn && (
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    onClick={(e) => handleDoneClick(item.dealId, e)}
                                                >
                                                    배송 완료 확인
                                                </button>
                                            )}

                                            {showReviewBtn && (
                                                <button
                                                    type="button"
                                                    className={styles.greenBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReviewClick(item);
                                                    }}
                                                >
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

            {selectedDeal && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedDeal(null)}
                >
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>구매내역 상세</h2>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setSelectedDeal(null)}
                            >
                                ×
                            </button>
                        </header>

                        <div className={styles.modalBody}>
                            <p className={styles.modalDealNo}>
                                거래번호{' '}
                                <strong>
                                    {selectedDeal.orderId ?? selectedDeal.order_id ?? '-'}
                                </strong>
                            </p>
                            <p className={styles.modalDate}>
                                {formatDate(selectedDeal.dealEndDate ?? selectedDeal.deal_end_date)}
                            </p>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>구매완료</h3>
                                <div className={styles.modalProduct}>
                                    <div className={styles.modalThumb}>
                                        <img
                                            src={
                                                selectedDeal.productThumb ||
                                                selectedDeal.pd_thumb ||
                                                FALLBACK_IMG
                                            }
                                            alt={selectedDeal.title ?? '상품 이미지'}
                                        />
                                    </div>
                                    <div>
                                        <p className={styles.modalProdTitle}>
                                            {selectedDeal.title ??
                                                selectedDeal.productTitle ??
                                                selectedDeal.pdTitle ??
                                                '(제목 없음)'}
                                        </p>
                                        <p className={styles.modalProdPrice}>
                                            {(
                                                (selectedDeal.agreedPrice ?? selectedDeal.pdPrice) ||
                                                0
                                            ).toLocaleString()}
                                            원
                                        </p>
                                    </div>
                                </div>

                                {shouldShowBuyConfirm(selectedDeal) && (
                                    <button
                                        type="button"
                                        className={styles.modalActionBtn}
                                        onClick={(e) => handleBuyConfirm(selectedDeal.dealId, e)}
                                    >
                                        구매확정
                                    </button>
                                )}

                                {/* 모달에서도 후기 보내기 가능하게 할 거면 이거 추가 */}
                                <button
                                    type="button"
                                    className={styles.modalActionBtn}
                                    onClick={() => handleReviewClick(selectedDeal)}
                                >
                                    후기 보내기
                                </button>
                            </div>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>판매자 정보</h3>
                                <div className={styles.modalInfoRow}>
                                    <span>닉네임</span>
                                    <span>{getSellerName(selectedDeal)}</span>
                                </div>
                                <div className={styles.modalInfoRow}>
                                    <span>연락처</span>
                                    <span>{getSellerPhone(selectedDeal)}</span>
                                </div>
                            </div>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>거래정보</h3>
                                <div className={styles.modalInfoRow}>
                                    <span>거래방법</span>
                                    <span>{getTradeText(selectedDeal) || '-'}</span>
                                </div>
                                <div className={styles.modalInfoRow}>
                                    <span>결제일시</span>
                                    <span>
                    {formatDate(
                        selectedDeal.dealEndDate ?? selectedDeal.deal_end_date
                    )}
                  </span>
                                </div>
                            </div>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>결제정보</h3>
                                <div className={styles.modalInfoRow}>
                                    <span>결제금액</span>
                                    <span>
                    {(
                        (selectedDeal.agreedPrice ?? selectedDeal.pdPrice) ||
                        0
                    ).toLocaleString()}
                                        원
                  </span>
                                </div>
                                <div className={styles.modalInfoRow}>
                                    <span>상태</span>
                                    <span>
                    {getDStatus(selectedDeal) === 1 ? '구매완료' : '진행중'}
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
