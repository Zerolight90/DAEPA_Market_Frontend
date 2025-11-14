// src/app/mypage/sell/page.js
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './sell.module.css';
import Sidebar from '@/components/mypage/sidebar';
import tokenStore from '@/app/store/TokenStore';
import { api } from "@/lib/api/client";

const FALLBACK_IMG =
    'https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg';

// ---------- 유틸 ----------
function safeNum(v, def = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
}
function fmtPrice(v) {
    const n = safeNum(v, 0);
    try {
        return n.toLocaleString();
    } catch {
        return String(n);
    }
}
function isTruthyOne(v) {
    return v === 1 || v === 1n || v === '1';
}

export default function SellHistoryPage() {
    const router = useRouter();
    const { accessToken } = tokenStore();

    const [list, setList] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [selectedDeal, setSelectedDeal] = useState(null);

    // 버튼 로딩 상태 (중복 클릭 방지)
    const [pendingSendId, setPendingSendId] = useState(null);
    const [pendingDoneId, setPendingDoneId] = useState(null);
    const [pendingRefundId, setPendingRefundId] = useState(null);

    // 언마운트 가드
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ---------- 키 접근 유틸 ----------
    function getDealId(item) {
        return item?.dealId ?? item?.dIdx ?? item?.d_idx ?? null;
    }
    function getDSell(item) {
        return item?.dSell ?? item?.d_sell ?? item?.dsell ?? item?.D_SELL ?? null;
    }
    function getDStatus(item) {
        return item?.dStatus ?? item?.d_status ?? item?.dstatus ?? item?.D_STATUS ?? null;
    }
    function getDv(item) {
        return safeNum(item?.dvStatus ?? item?.dv_status ?? 0, 0);
    }
    function getCkStatus(item) {
        const raw = item?.ckStatus ?? item?.ck_status ?? item?.CK_STATUS ?? null;
        if (raw == null) return null;
        return safeNum(raw, null);
    }
    // ck_result: 1=합격, 0=불합격
    function getCkResult(item) {
        const raw = item?.ckResult ?? item?.ck_result ?? item?.CK_RESULT ?? null;
        if (raw == null) return null;
        return safeNum(raw, null);
    }

    // ---------- API ----------
    async function fetchSell() {
        try {
            setLoading(true);
            setErr('');
            const data = await api('/deal/mySell', {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
                cache: 'no-store',
            });

            if (!mountedRef.current) return;
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            if (!mountedRef.current) return;
            const errorMessage = e.data?.message || e.message || '판매내역을 불러오지 못했습니다.';
            setErr(errorMessage);
            setList([]);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }

    useEffect(() => {
        if (!accessToken) return;
        fetchSell();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    // ---------- 단계 계산 ----------
    function calcBaseStep(item) {
        const dStatus = getDStatus(item);
        const dSell = getDSell(item);
        if (isTruthyOne(dStatus)) return 3;
        if (isTruthyOne(dSell)) return 2;
        return 1;
    }

    function calcDeliverySteps(item) {
        const steps = {
            step4: false, // 배송 보냄 확인
            step5: false, // 배송(1)
            step6: false, // 대파 검수중 / 또는 불합격 강조 위치
            step7: false, // 배송(2) (검수 후)
            step8: false, // 후기 보내기
        };

        const baseStep = calcBaseStep(item);
        if (baseStep < 3) return steps;

        const dv = getDv(item);

        switch (dv) {
            case 1:
                steps.step4 = true;
                steps.step5 = true;
                break;
            case 2:
                steps.step4 = true;
                steps.step5 = true;
                steps.step6 = true; // 검수 중
                break;
            case 3:
                steps.step4 = true;
                steps.step5 = true;
                steps.step6 = true; // 검수 완료
                steps.step7 = true; // 검수 합격 후 배송(2)
                break;
            case 5:
                steps.step4 = true;
                steps.step5 = true;
                steps.step6 = true;
                steps.step7 = true;
                steps.step8 = true; // 후기 가능
                break;
            default:
                break;
        }

        // 검수 불합격이면(step6 빨간표시), 단계 자체는 점등 유지
        if (getCkResult(item) === 0) steps.step6 = true;

        return steps;
    }

    // ---------- 포맷 ----------
    // 타임존 없는 DB 문자열을 그대로 포맷해서 표시 (YYYY.MM.DD HH:mm)
    function formatDate(dateStr) {
        if (!dateStr) return '';

        // "YYYY-MM-DD HH:mm:ss(.SSS…)" 혹은 "YYYY-MM-DDTHH:mm:ss(.SSS…)" 패턴일 때
        const m = String(dateStr).match(
            /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/
        );
        if (m) {
            const [, y, mo, d, hh, mm] = m;
            return `${y}.${mo}.${d} ${hh}:${mm}`;
        }

        // 그 외(ISO 등)만 최소한으로 Date 사용 (로컬 기준 표시)
        try {
            const d = new Date(String(dateStr).replace(' ', 'T'));
            if (!Number.isNaN(d.getTime())) {
                const yy = d.getFullYear();
                const mo2 = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const hh2 = String(d.getHours()).padStart(2, '0');
                const mm2 = String(d.getMinutes()).padStart(2, '0');
                return `${yy}.${mo2}.${dd} ${hh2}:${mm2}`;
            }
        } catch (_) {}

        // 마지막 안전장치
        return String(dateStr).split('.')[0].replace('T', ' ').replace(/-/g, '.').slice(0, 16);
    }

    // ---------- 필터 ----------
    const filtered = useMemo(() => {
        // 결제 완료 이상만 노출
        const paidOnly = list.filter((item) => isTruthyOne(getDSell(item)));

        const kw = keyword.toLowerCase().trim();
        if (!kw) return paidOnly;

        return paidOnly.filter((item) => {
            const candidates = [
                item?.title,
                item?.productTitle,
                item?.pdTitle,
                item?.pd_title,
            ]
                .filter(Boolean)
                .map((v) => String(v).toLowerCase());

            const dealIdStr = getDealId(item) ? String(getDealId(item)) : '';
            const orderIdStr = item?.orderId ? String(item.orderId) : '';

            return (
                candidates.some((t) => t.includes(kw)) ||
                dealIdStr.includes(kw) ||
                orderIdStr.includes(kw)
            );
        });
    }, [list, keyword]);

    // ---------- 표기 ----------
    function getTradeText(item) {
        const raw = (item?.dDeal ?? item?.ddeal ?? item?.d_deal ?? '').toString().trim();
        const upper = raw.toUpperCase();
        if (upper === 'MEET') return '직거래';
        if (upper === 'DELIVERY') return '택배거래';
        return raw || '거래방식 미정';
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

    // ---------- 액션 ----------
    async function handleSendClick(dealId, e) {
        if (e) e.stopPropagation();
        if (!dealId) return;
        setPendingSendId(dealId);
        try {
            await api(`/delivery/${dealId}/sent`, {
                method: 'PATCH',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            await fetchSell();
        } catch (error) {
            const txt = error.data?.message || error.message || '배송 보냄 확인에 실패했습니다.';
            alert('배송 보냄 확인에 실패했습니다.\n' + txt);
        } finally {
            setPendingSendId((prev) => (prev === dealId ? null : prev));
        }
    }

    async function handleDoneClick(dealId, e) {
        if (e) e.stopPropagation();
        if (!dealId) return;
        setPendingDoneId(dealId);
        try {
            await api(`/delivery/${dealId}/done`, {
                method: 'PATCH',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: 'include',
            });
            // dv_status=5로 갱신되면 재조회 → 버튼 사라지고 후기 버튼만 보이도록
            await fetchSell();
        } catch (error) {
            const txt = error.data?.message || error.message || '처리 중 오류가 발생했습니다.';
            alert('처리 중 오류가 발생했습니다.\n' + txt);
        } finally {
            setPendingDoneId((prev) => (prev === dealId ? null : prev));
        }
    }

    async function handleRefundClick(dealId, e) {
        if (e) e.stopPropagation();
        if (!dealId) return;

        const cancelReason = prompt('환불 사유를 입력해주세요.', '판매자 요청');
        if (cancelReason === null) {
            return;
        }

        setPendingRefundId(dealId);
        try {
            await api(`/${dealId}/payCancel`, {
                method: 'POST',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ cancelReason }),
            });
            alert('환불 처리가 완료되었습니다.');
            await fetchSell();
        } catch (error) {
            const txt = error.data?.message || error.message || '환불 처리 중 오류가 발생했습니다.';
            alert('환불 처리 중 오류가 발생했습니다.\n' + txt);
        } finally {
            setPendingRefundId((prev) => (prev === dealId ? null : prev));
        }
    }

    async function handleReviewClick(deal) {
        const dealId = getDealId(deal);
        if (!dealId) {
            alert('거래번호를 찾을 수 없습니다.');
            return;
        }

        try {
            const data = await api(`/review/exists?dealId=${dealId}&reType=SELLER`, {
                credentials: 'include',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            });
            if (data?.exists) {
                alert('이미 작성한 리뷰입니다.');
                return;
            }
        } catch {
            // 조회 실패해도 이동은 허용 가능
        }

        const buyerIdx =
            deal?.buyerIdx ?? deal?.buyer_idx ?? deal?.buyerId ?? deal?.buyer_id ?? null;
        if (!buyerIdx) {
            alert('구매자 정보를 찾을 수 없습니다.');
            return;
        }
        router.push(`/mypage/sell/${buyerIdx}?dealId=${dealId}`);
    }

    function Step({ active, label, danger = false }) {
        return (
            <div className={`${styles.step} ${active ? styles.stepActive : ''}`}>
                <span
                    className={styles.stepDot}
                    style={
                        danger
                            ? { background: '#ef4444', border: 'none', boxShadow: 'none' }
                            : undefined
                    }
                />
                <span
                    className={styles.stepLabel}
                    style={danger ? { color: '#ef4444', fontWeight: 600 } : undefined}
                >
                    {label}
                </span>
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
                        <span className={styles.searchIcon} aria-hidden>🔍</span>
                    </div>
                </div>

                {loading && <div className={styles.empty}>불러오는 중...</div>}
                {!loading && err && <div className={styles.empty}>{err}</div>}

                {!loading && !err && (
                    <section className={styles.listArea}>
                        {filtered.map((item, idx) => {
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
                            const dSell = getDSell(item);
                            const statusText = isTruthyOne(dStatus)
                                ? '판매완료'
                                : isTruthyOne(dSell)
                                    ? '결제완료'
                                    : '판매중';

                            const currentDv = getDv(item);
                            const ckResult = getCkResult(item); // 1=합격, 0=불합격
                            const inspectionFailed = ckResult === 0;

                            // 버튼 노출 규칙
                            const dealId = getDealId(item);
                            const showSendBtn = item?.showSendBtn === true;

                            // 합격(ck=1) & dv=3 → 배송완료확인 버튼
                            // 불합격(ck=0) → '배송완료 확인'과 '환불처리'
                            const showAfterDeliveryBtn =
                                isDelivery && ((currentDv === 3 && ckResult === 1) || ckResult === 0);

                            // 후기 버튼: dv=5 && 불합격 아님
                            const showReviewBtn = isDelivery && currentDv === 5 && ckResult !== 0;

                            const thumbSrc =
                                item?.productThumb || item?.pdThumb || item?.thumbnail || FALLBACK_IMG;

                            const cardKey = dealId ?? `i-${idx}`;

                            return (
                                <article key={cardKey} className={styles.block}>
                                    <div className={styles.dateRow}>
                                        <span>{formatDate(item?.dealEndDate ?? item?.deal_end_date)}</span>
                                        <span className={styles.dot}>|</span>
                                        <span>{tradeText}</span>
                                    </div>

                                    <div
                                        className={`${styles.card} ${inspectionFailed ? styles.cardDanger : ''}`}
                                        onClick={() => setSelectedDeal(item)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && setSelectedDeal(item)}
                                    >
                                        <p className={styles.status}>{statusText}</p>

                                        <div className={styles.productRow}>
                                            <div className={styles.thumbBox}>
                                                <img
                                                    src={thumbSrc}
                                                    alt={item?.title || item?.pdTitle || '상품 이미지'}
                                                    className={styles.thumbImg}
                                                    onError={(ev) => {
                                                        if (ev?.currentTarget) ev.currentTarget.src = FALLBACK_IMG;
                                                    }}
                                                />
                                            </div>

                                            <div className={styles.prodInfo}>
                                                <p className={styles.prodTitle}>
                                                    {item?.title || item?.productTitle || item?.pdTitle || '(제목 없음)'}
                                                </p>
                                                <p className={styles.prodPrice}>
                                                    {fmtPrice(item?.agreedPrice ?? item?.pdPrice)}원
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.stepBar}>
                                            <Step active={baseStep >= 3} label="판매 완료" />
                                            {isDelivery && (
                                                <>
                                                    <SquareStep active={step4} label="배송 보냄 확인" />
                                                    <Step active={step5} label="배송" />
                                                    <Step
                                                        active={step6}
                                                        label={inspectionFailed ? '검수 불합격' : '대파에서 검수 중'}
                                                        danger={inspectionFailed}
                                                    />
                                                    <Step active={step7 && ckResult === 1} label="배송" />
                                                    <SquareStep active={step8} label="후기 보내기" />
                                                </>
                                            )}
                                        </div>

                                        <div className={styles.actions}>
                                            {showSendBtn && dealId && (
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    disabled={pendingSendId === dealId}
                                                    onClick={(e) => handleSendClick(dealId, e)}
                                                >
                                                    {pendingSendId === dealId ? '처리 중...' : '배송 보냄 확인'}
                                                </button>
                                            )}

                                            {showAfterDeliveryBtn && dealId && (
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    disabled={pendingDoneId === dealId}
                                                    onClick={(e) => handleDoneClick(dealId, e)}
                                                >
                                                    {pendingDoneId === dealId ? '처리 중...' : '배송 완료 확인'}
                                                </button>
                                            )}

                                            {showReviewBtn && dealId && (
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

                                            {inspectionFailed && dealId && (
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    disabled={pendingRefundId === dealId}
                                                    onClick={(e) => handleRefundClick(dealId, e)}
                                                >
                                                    {pendingRefundId === dealId ? '처리 중...' : '환불처리'}
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

            {selectedDeal && (
                <div className={styles.modalOverlay} onClick={() => setSelectedDeal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
                                거래번호 <strong>{selectedDeal?.orderId ?? selectedDeal?.order_id ?? '-'}</strong>
                            </p>
                            <p className={styles.modalDate}>
                                {formatDate(selectedDeal?.dealEndDate ?? selectedDeal?.deal_end_date)}
                            </p>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>
                                    {getCkResult(selectedDeal) === 0 ? '검수 불합격' : '판매완료'}
                                </h3>
                                <div className={styles.modalProduct}>
                                    <img
                                        src={
                                            selectedDeal?.productThumb ||
                                            selectedDeal?.pdThumb ||
                                            selectedDeal?.thumbnail ||
                                            FALLBACK_IMG
                                        }
                                        alt={selectedDeal?.title || selectedDeal?.pdTitle || '상품 이미지'}
                                        className={styles.modalThumb}
                                        onError={(ev) => {
                                            if (ev?.currentTarget) ev.currentTarget.src = FALLBACK_IMG;
                                        }}
                                    />
                                    <div>
                                        <p className={styles.modalProdTitle}>
                                            {selectedDeal?.title ??
                                                selectedDeal?.productTitle ??
                                                selectedDeal?.pdTitle ??
                                                '(제목 없음)'}
                                        </p>
                                        <p className={styles.modalProdPrice}>
                                            {fmtPrice(selectedDeal?.agreedPrice ?? selectedDeal?.pdPrice)}원
                                        </p>
                                    </div>
                                </div>

                                {/* 합격이면 후기, 불합격이면 배송완료확인 + 환불처리 */}
                                {getCkResult(selectedDeal) !== 0 ? (
                                    getDv(selectedDeal) === 5 && (
                                        <button
                                            type="button"
                                            className={styles.modalActionBtn}
                                            onClick={() => handleReviewClick(selectedDeal)}
                                        >
                                            후기 보내기
                                        </button>
                                    )
                                ) : (
                                    <div className={styles.actions} style={{ gap: 8 }}>
                                        {getDealId(selectedDeal) && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    disabled={pendingDoneId === getDealId(selectedDeal)}
                                                    onClick={(e) => handleDoneClick(getDealId(selectedDeal), e)}
                                                >
                                                    {pendingDoneId === getDealId(selectedDeal) ? '처리 중...' : '배송 완료 확인'}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    disabled={pendingRefundId === getDealId(selectedDeal)}
                                                    onClick={(e) => handleRefundClick(getDealId(selectedDeal), e)}
                                                >
                                                    {pendingRefundId === getDealId(selectedDeal) ? '처리 중...' : '환불처리'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
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
                                    <span>{getTradeText(selectedDeal)}</span>
                                </div>
                                <div className={styles.modalInfoRow}>
                                    <span>결제일시</span>
                                    <span>{formatDate(selectedDeal?.dealEndDate ?? selectedDeal?.deal_end_date)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
