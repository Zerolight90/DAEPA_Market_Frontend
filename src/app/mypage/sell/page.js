'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './sell.module.css';
import Sidebar from '@/components/mypage/sidebar';
import tokenStore from '@/app/store/TokenStore';

// 백엔드 기본 주소
const BACKEND_BASE =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE
        ? process.env.NEXT_PUBLIC_API_BASE
        : 'http://localhost:8080';

// 이미지 없을 때 쓸 기본이미지
const FALLBACK_IMG =
    'https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg';

export default function SellHistoryPage() {
    const { accessToken } = tokenStore();
    const [list, setList] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [selectedDeal, setSelectedDeal] = useState(null);

    // 판매 내역 가져오기
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
                console.warn('❌ /api/deal/mySell not ok:', res.status, txt);
                setErr(txt || '판매내역을 불러오지 못했습니다.');
                setList([]);
                return;
            }

            const data = await res.json();
            console.log('📦 /api/deal/mySell 응답 raw ===>', data);
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('❌ /api/deal/mySell fetch error:', e);
            setErr('네트워크 오류가 발생했습니다.');
            setList([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!accessToken) return;
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
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${y}.${m}.${day} ${hh}:${mm}`;
    }

    // d_sell=1 만 + 검색
    const filtered = useMemo(() => {
        const paidOnly = list.filter((item) => {
            const dSell = getDSell(item);
            return dSell === 1 || dSell === 1n;
        });

        const kw = keyword.toLowerCase().trim();
        if (!kw) return paidOnly;

        return paidOnly.filter((item) => {
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
    }, [list, keyword]);

    function getTradeText(item) {
        const raw =
            (item?.dDeal ?? item?.ddeal ?? item?.d_deal ?? '').toString().trim();

        const upper = raw.toUpperCase();
        if (upper === 'MEET') return '직거래';
        if (upper === 'DELIVERY') return '택배거래';
        return raw;
    }

    // 배송 보냄 확인
    async function handleSendClick(dealId, e) {
        e.stopPropagation();
        const url = `${BACKEND_BASE}/api/delivery/${dealId}/sent`;
        try {
            console.log('📡 배송 보냄 확인 PATCH =>', url);
            const res = await fetch(url, {
                method: 'PATCH',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            if (!res.ok) {
                const txt = await res.text();
                console.warn('❌ 배송 보냄 확인 실패:', res.status, txt);
                alert('배송 보냄 확인에 실패했습니다.\n' + txt);
                return;
            }
            console.log('✅ 배송 보냄 확인 성공');
            fetchSell();
        } catch (e2) {
            console.error('❌ 배송 보냄 확인 중 오류:', e2);
            alert('네트워크 오류가 발생했습니다.');
        }
    }

    // 배송 완료 확인
    async function handleDoneClick(dealId, e) {
        e.stopPropagation();
        const url = `${BACKEND_BASE}/api/delivery/${dealId}/done`;
        try {
            console.log('📡 배송 완료 확인 PATCH =>', url);
            const res = await fetch(url, {
                method: 'PATCH',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            if (!res.ok) {
                const txt = await res.text();
                console.warn('❌ 배송 완료 확인 실패:', res.status, txt);
                alert('처리 중 오류가 발생했습니다.\n' + txt);
                return;
            }
            console.log('✅ 배송 완료 확인 성공');
            fetchSell();
        } catch (e2) {
            console.error('❌ 배송 완료 확인 중 오류:', e2);
            alert('네트워크 오류가 발생했습니다.');
        }
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

    function getBuyerName(deal) {
        return (
            deal?.buyerNickname ??
            deal?.buyer_nickname ??
            deal?.buyerName ??
            deal?.buyer_name ??
            '-'
        );
    }

    function getBuyerPhone(deal) {
        return (
            deal?.buyerPhone ??
            deal?.buyer_phone ??
            deal?.phone ??
            deal?.uPhone ??
            deal?.u_phone ??
            '-'
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

                            // ✅ 여기서 썸네일 후보를 하나로 모아놓자
                            const thumbSrc =
                                item.productThumb ||
                                item.pdThumb ||
                                item.thumbnail ||
                                FALLBACK_IMG;

                            return (
                                <article key={item.dealId} className={styles.block}>
                                    <div className={styles.dateRow}>
                                        <span>{tradeText || '거래방식 미정'}</span>
                                    </div>

                                    <div
                                        className={styles.card}
                                        onClick={() => {
                                            console.log('🟣 선택한 거래 =====');
                                            console.log('dealId:', item.dealId);
                                            console.log('orderId:', item.orderId);
                                            console.log(
                                                '구매자 닉네임:',
                                                item.buyerNickname,
                                                item.buyer_nickname
                                            );
                                            console.log(
                                                '구매자 연락처:',
                                                item.buyerPhone,
                                                item.buyer_phone
                                            );
                                            console.log(
                                                '결제일시(dealEndDate):',
                                                item.dealEndDate,
                                                item.deal_end_date
                                            );
                                            console.log(
                                                '상품금액:',
                                                item.agreedPrice ?? item.pdPrice ?? 0
                                            );
                                            console.log('상품 썸네일:', thumbSrc);
                                            console.log('===========================');
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
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={thumbSrc}
                                                    alt={item.title || item.pdTitle || '상품 이미지'}
                                                    className={styles.thumbImg}
                                                />
                                            </div>

                                            <div className={styles.prodInfo}>
                                                <p className={styles.prodTitle}>
                                                    {item.title ||
                                                        item.productTitle ||
                                                        item.pdTitle ||
                                                        '(제목 없음)'}
                                                </p>
                                                <p className={styles.prodPrice}>
                                                    {(item.agreedPrice ?? item.pdPrice ?? 0).toLocaleString()}
                                                    원
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.stepBar}>
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
                                                    <SquareStep active={step8} label="후기 보내기" />
                                                </>
                                            )}
                                        </div>

                                        <div className={styles.actions}>
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
                                                    onClick={(e) => e.stopPropagation()}
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
                            <div className={styles.empty}>결제된 판매내역이 없습니다.</div>
                        )}
                    </section>
                )}
            </main>

            {/* 상세 모달 */}
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
                            <h2 className={styles.modalTitle}>판매내역 상세</h2>
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
                                    {selectedDeal.orderId ??
                                        selectedDeal.order_id ??
                                        '-'}
                                </strong>
                            </p>
                            <p className={styles.modalDate}>
                                {formatDate(
                                    selectedDeal.dealEndDate ?? selectedDeal.deal_end_date
                                )}
                            </p>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>판매완료</h3>
                                <div className={styles.modalProduct}>
                                    {/* 모달에서도 썸네일 보여주기 */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={
                                            selectedDeal.productThumb ||
                                            selectedDeal.pdThumb ||
                                            selectedDeal.thumbnail ||
                                            FALLBACK_IMG
                                        }
                                        alt={
                                            selectedDeal.title ||
                                            selectedDeal.pdTitle ||
                                            '상품 이미지'
                                        }
                                        className={styles.modalThumb}
                                    />
                                    <div>
                                        <p className={styles.modalProdTitle}>
                                            {selectedDeal.title ??
                                                selectedDeal.productTitle ??
                                                selectedDeal.pdTitle ??
                                                '(제목 없음)'}
                                        </p>
                                        <p className={styles.modalProdPrice}>
                                            {(
                                                (selectedDeal.agreedPrice ??
                                                    selectedDeal.pdPrice) ||
                                                0
                                            ).toLocaleString()}
                                            원
                                        </p>
                                    </div>
                                </div>
                                <button type="button" className={styles.modalActionBtn}>
                                    후기 보내기
                                </button>
                            </div>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>구매자 정보</h3>
                                <div className={styles.modalInfoRow}>
                                    <span>닉네임</span>
                                    <span>{getBuyerName(selectedDeal)}</span>
                                </div>
                                <div className={styles.modalInfoRow}>
                                    <span>연락처</span>
                                    <span>{getBuyerPhone(selectedDeal)}</span>
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
                        selectedDeal.dealEndDate ??
                        selectedDeal.deal_end_date
                    )}
                  </span>
                                </div>
                            </div>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>정산정보</h3>
                                <div className={styles.modalInfoRow}>
                                    <span>상품금액</span>
                                    <span>
                    {(
                        (selectedDeal.agreedPrice ??
                            selectedDeal.pdPrice) ||
                        0
                    ).toLocaleString()}
                                        원
                  </span>
                                </div>
                                <div className={styles.modalInfoRow}>
                                    <span>정산상태</span>
                                    <span>완료</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
