'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './buy.module.css';
import Sidebar from '@/components/mypage/sidebar';
import api from '@/lib/api'; // 전역 axios 인스턴스 사용

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

export default function BuyHistoryPage() {
    const router = useRouter();

    const [list, setList] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [me, setMe] = useState(null);
    const [selectedDeal, setSelectedDeal] = useState(null);

    // 버튼 로딩 상태(중복 클릭 방지)
    const [pendingDoneId, setPendingDoneId] = useState(null);

    // 언마운트 가드
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // ---------- 키/파싱 유틸 ----------
    function getDealId(item) {
        return item?.dealId ?? item?.dIdx ?? item?.d_idx ?? null;
    }
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
        return item?.buyerIdx ?? item?.buyer_idx ?? item?.buyerId ?? item?.buyer_id ?? null;
    }
    function getDv(item) {
        return safeNum(item?.dvStatus ?? item?.dv_status ?? 0, 0);
    }
    // ck/ch_result: 0=합격, 1=불합격
    function getCkResult(item) {
        const raw =
            item?.ckResult ??
            item?.ck_result ??
            item?.chResult ??
            item?.ch_result ??
            item?.CK_RESULT ??
            null;
        if (raw == null) return null;
        return safeNum(raw, null);
    }

    // ---------- 내 정보 ----------
    useEffect(() => {
        const ac = new AbortController();
        (async () => {
            try {
                const { data } = await api.get('/users/me', {
                    signal: ac.signal,
                });
                if (!mountedRef.current) return;
                setMe(data);
            } catch (error) {
                if (!mountedRef.current) return;
                if (error.name !== 'CanceledError') {
                    setMe(null);
                    // 401 (Unauthorized) 에러 처리
                    if (error.response?.status === 401) {
                        // 로그인 페이지로 리다이렉트 또는 로그인 모달 표시
                        console.log("로그인이 필요합니다.");
                    }
                }
            }
        })();
        return () => ac.abort();
    }, []);

    // ---------- 구매내역 ----------
    async function fetchDeals() {
        try {
            setLoading(true);
            setErr('');
            const { data } = await api.get('/deal/myBuy');
            if (!mountedRef.current) return;
            setList(Array.isArray(data) ? data : []);
        } catch (error) {
            if (!mountedRef.current) return;
            const errorMessage =
                error.response?.data?.message || error.message || '구매내역을 불러오지 못했습니다.';
            setErr(errorMessage);
            setList([]);
            // 401 (Unauthorized) 에러 처리
            if (error.response?.status === 401) {
                console.log("로그인이 필요합니다.");
            }
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }

    useEffect(() => {
        fetchDeals();
    }, []);

    // ---------- 단계 계산 ----------
    // d_status = 1 → "구매 완료" 초록불
    function calcBaseStep(item) {
        const dStatus = getDStatus(item);
        const dSell = getDSell(item);
        if (isTruthyOne(dStatus)) return 3; // 구매 완료
        if (isTruthyOne(dSell)) return 2; // 결제 완료
        return 1; // 구매 중
    }

    // dv_status 흐름:
    // 1 : "배송보냄확인" + 첫 번째 "배송" 초록불
    // 2 : "대파에서 검수 중" 초록불
    // 3 : 두 번째 "배송" 초록불 → 이때 "물건 도착 확인" 버튼 노출
    // 5 : 최종 배송 완료 → "후기 보내기" 버튼 노출
    function calcDeliverySteps(item) {
        const steps = {
            step4: false, // 배송 보냄 확인
            step5: false, // 배송(1)
            step6: false, // 대파에서 검수 중 / 검수 불합격
            step7: false, // 배송(2)
            step8: false, // 후기 보내기
        };
        const baseStep = calcBaseStep(item);
        if (baseStep < 3) return steps; // 구매 완료 전에는 배송 단계 점등 X

        const dv = getDv(item);

        if (dv >= 1) {
            steps.step4 = true;
            steps.step5 = true;
        }
        if (dv >= 2) {
            steps.step6 = true;
        }
        if (dv >= 3) {
            steps.step7 = true;
        }
        if (dv === 5) {
            steps.step8 = true;
        }

        return steps;
    }

    // ---------- 포맷 ----------
    // 타임존 없는 DB 문자열 그대로 포맷 (YYYY.MM.DD HH:mm)
    function formatDate(dateStr) {
        if (!dateStr) return '';

        const m = String(dateStr).match(
            /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/
        );
        if (m) {
            const [, y, mo, d, hh, mm] = m;
            return `${y}.${mo}.${d} ${hh}:${mm}`;
        }

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
        } catch {}

        return String(dateStr).split('.')[0].replace('T', ' ').replace(/-/g, '.').slice(0, 16);
    }

    // ---------- 필터 ----------
    const filtered = useMemo(() => {
        const kw = keyword.toLowerCase().trim();
        const myIdx = me?.uIdx ?? me?.u_idx ?? me?.uid ?? me?.id ?? null;

        return list
            .filter((item) => {
                const buyer = getBuyerIdx(item);
                if (buyer != null && myIdx != null) {
                    return safeNum(buyer) === safeNum(myIdx);
                }
                return true;
            })
            .filter((item) => {
                if (!kw) return true;
                const candidates = [item?.title, item?.productTitle, item?.pdTitle, item?.pd_title]
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
    }, [list, keyword, me]);

    // ---------- 표기 ----------
    function getTradeText(item) {
        const raw = (item?.dDeal ?? item?.ddeal ?? item?.d_deal ?? '').toString().trim();
        const upper = raw.toUpperCase();
        if (upper === 'MEET') return '직거래';
        if (upper === 'DELIVERY') return '택배거래';
        return raw || '거래방식 미정';
    }
    function getSellerName(item) {
        return item?.sellerNickname ?? item?.seller_nickname ?? '-';
    }
    function getSellerPhone(item) {
        return item?.sellerPhone ?? item?.seller_phone ?? '-';
    }

    // d_sell=1 이고 d_buy=0, d_status!=1 → "구매확인" 버튼
    function shouldShowBuyConfirm(item) {
        const dSell = getDSell(item);
        const dBuy = getDBuy(item);
        const dStatus = getDStatus(item);
        if (isTruthyOne(dStatus)) return false;
        return isTruthyOne(dSell) && !isTruthyOne(dBuy);
    }

    // ---------- 액션 ----------
    // 두 번째 "배송"에 초록불(dv_status=3) → "물건 도착 확인" 버튼 → 누르면 dv_status=5
    async function handleDoneClick(dealId, e) {
        if (e) e.stopPropagation();
        if (!dealId) return;
        setPendingDoneId(dealId);
        try {
            await api.patch(`/delivery/${dealId}/done`);
            // dv_status=5 반영 → "물건 도착 확인" 버튼 OFF, 후기 버튼 ON
            await fetchDeals();
        } catch (error) {
            const txt = error.response?.data?.message || error.message || '처리 중 오류가 발생했습니다.';
            alert('처리 중 오류가 발생했습니다.\n' + txt);
            if (error.response?.status === 401) {
                console.log("로그인이 필요합니다.");
            }
        } finally {
            setPendingDoneId((prev) => (prev === dealId ? null : prev));
        }
    }

    // d_sell=1 → "구매확인" 버튼 → 누르면 d_buy=1
    async function handleBuyConfirm(dealId, e) {
        if (e) e.stopPropagation();
        if (!dealId) return;
        try {
            await api.post(`/deal/${dealId}/confirm`);
            await fetchDeals();
        } catch (error) {
            const txt =
                error.response?.data?.message || error.message || '구매확정에 실패했습니다.';
            alert(txt);
            if (error.response?.status === 401) {
                console.log("로그인이 필요합니다.");
            }
        }
    }

    // 후기 보내기 로직(그대로 유지)
    async function handleReviewClick(deal) {
        const dealId = getDealId(deal);
        if (!dealId) {
            alert('거래번호를 찾을 수 없습니다.');
            return;
        }
        try {
            const { data } = await api.get(`/review/exists?dealId=${dealId}&reType=BUYER`);
            if (data?.exists) {
                alert('이미 작성한 리뷰입니다.');
                return;
            }
        } catch (error) {
            // 조회 실패해도 작성 화면 이동은 허용
            if (error.response?.status === 401) {
                console.log("로그인이 필요합니다.");
            }
        }
        const sellerIdx =
            deal?.sellerIdx ?? deal?.seller_idx ?? deal?.sellerId ?? deal?.seller_id ?? null;
        if (!sellerIdx) {
            alert('판매자 정보를 찾을 수 없습니다.');
            return;
        }
        router.push(`/mypage/buy/${sellerIdx}?dealId=${dealId}`);
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
                            const dBuy = getDBuy(item);
                            const dSell = getDSell(item);

                            const statusText = isTruthyOne(dStatus)
                                ? '구매완료'
                                : isTruthyOne(dSell)
                                    ? '결제완료'
                                    : '구매중';

                            const currentDv = getDv(item);
                            const ckResult = getCkResult(item); // 0=합격, 1=불합격
                            const inspectionFailed = ckResult === 1;

                            const dealId = getDealId(item);
                            const cardKey = dealId ?? `i-${idx}`;
                            const thumb =
                                item?.productThumb || item?.pdThumb || item?.thumbnail || FALLBACK_IMG;

                            // 버튼 노출 규칙(목록)
                            // dv_status=3 → "물건 도착 확인" 버튼
                            const showAfterDeliveryBtn = isDelivery && currentDv === 3;
                            // dv_status=5 → "후기 보내기" 버튼
                            const showReviewBtn = isDelivery && currentDv === 5;
                            // d_sell=1, d_buy=0 → "구매확인" 버튼
                            const showBuyConfirmBtn = shouldShowBuyConfirm(item);

                            return (
                                <article key={cardKey} className={styles.block}>
                                    <div className={styles.dateRow}>
                                        <span>
                                            {formatDate(
                                                item?.dealEndDate ?? item?.deal_end_date
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        className={styles.card}
                                        onClick={() => setSelectedDeal(item)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' && setSelectedDeal(item)
                                        }
                                    >
                                        <p className={styles.status}>{statusText}</p>

                                        <div className={styles.productRow}>
                                            <div className={styles.thumbBox}>
                                                <img
                                                    src={thumb}
                                                    alt={
                                                        item?.title ||
                                                        item?.pdTitle ||
                                                        '상품 썸네일'
                                                    }
                                                    className={styles.thumbImg}
                                                    onError={(ev) => {
                                                        if (ev?.currentTarget)
                                                            ev.currentTarget.src =
                                                                FALLBACK_IMG;
                                                    }}
                                                />
                                            </div>

                                            <div className={styles.prodInfo}>
                                                <p className={styles.prodTitle}>
                                                    {item?.title ||
                                                        item?.productTitle ||
                                                        item?.pdTitle ||
                                                        '(제목 없음)'}
                                                </p>
                                                <p className={styles.prodPrice}>
                                                    {fmtPrice(
                                                        item?.agreedPrice ??
                                                        item?.pdPrice
                                                    )}
                                                    원
                                                </p>
                                            </div>
                                        </div>

                                        <div className={styles.stepBar}>
                                            {/* d_sell=1 → 구매확인 버튼, d_buy=1/d_status=1 → 구매확인 단계 초록불 */}
                                            <SquareStep
                                                active={
                                                    isTruthyOne(dBuy) ||
                                                    isTruthyOne(dStatus)
                                                }
                                                label="구매확인"
                                            />
                                            <Step
                                                active={baseStep >= 3}
                                                label="구매 완료"
                                            />
                                            {isDelivery && (
                                                <>
                                                    <SquareStep
                                                        active={step4}
                                                        label="배송 보냄 확인"
                                                    />
                                                    <Step active={step5} label="배송" />
                                                    <Step
                                                        active={step6}
                                                        label={
                                                            inspectionFailed
                                                                ? '검수 불합격'
                                                                : '대파에서 검수 중'
                                                        }
                                                        danger={inspectionFailed}
                                                    />
                                                    <Step
                                                        active={step7}
                                                        label="배송"
                                                    />
                                                    <SquareStep
                                                        active={step8}
                                                        label="후기 보내기"
                                                    />
                                                </>
                                            )}
                                        </div>

                                        <div className={styles.actions}>
                                            {showBuyConfirmBtn && dealId && (
                                                <button
                                                    type="button"
                                                    className={styles.greenBtn}
                                                    onClick={(e) =>
                                                        handleBuyConfirm(
                                                            dealId,
                                                            e
                                                        )
                                                    }
                                                >
                                                    구매확인
                                                </button>
                                            )}

                                            {showAfterDeliveryBtn && dealId && (
                                                <button
                                                    type="button"
                                                    className={styles.grayBtn}
                                                    disabled={
                                                        pendingDoneId === dealId
                                                    }
                                                    onClick={(e) =>
                                                        handleDoneClick(
                                                            dealId,
                                                            e
                                                        )
                                                    }
                                                >
                                                    {pendingDoneId === dealId
                                                        ? '처리 중...'
                                                        : '물건 도착 확인'}
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

            {/* ---------- 상세 모달 ---------- */}
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
                                    {selectedDeal?.orderId ??
                                        selectedDeal?.order_id ??
                                        '-'}
                                </strong>
                            </p>
                            <p className={styles.modalDate}>
                                {formatDate(
                                    selectedDeal?.dealEndDate ??
                                    selectedDeal?.deal_end_date
                                )}
                            </p>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>
                                    {getCkResult(selectedDeal) === 1
                                        ? '검수 불합격'
                                        : '구매상태'}
                                </h3>
                                <div className={styles.modalProduct}>
                                    <img
                                        src={
                                            selectedDeal?.productThumb ||
                                            selectedDeal?.pdThumb ||
                                            selectedDeal?.thumbnail ||
                                            FALLBACK_IMG
                                        }
                                        alt={
                                            selectedDeal?.title ||
                                            selectedDeal?.pdTitle ||
                                            '상품 썸네일'
                                        }
                                        className={styles.modalThumb}
                                        onError={(ev) => {
                                            if (ev?.currentTarget)
                                                ev.currentTarget.src =
                                                    FALLBACK_IMG;
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
                                            {fmtPrice(
                                                selectedDeal?.agreedPrice ??
                                                selectedDeal?.pdPrice
                                            )}
                                            원
                                        </p>
                                    </div>
                                </div>

                                {/* 모달 버튼: 구매확인 / 물건 도착 확인 / 후기 보내기 */}
                                <div
                                    className={styles.actions}
                                    style={{ gap: 8 }}
                                >
                                    {shouldShowBuyConfirm(selectedDeal) &&
                                        getDealId(selectedDeal) && (
                                            <button
                                                type="button"
                                                className={styles.greenBtn}
                                                onClick={(e) =>
                                                    handleBuyConfirm(
                                                        getDealId(
                                                            selectedDeal
                                                        ),
                                                        e
                                                    )
                                                }
                                            >
                                                구매확인
                                            </button>
                                        )}

                                    {getDealId(selectedDeal) &&
                                        getDv(selectedDeal) === 3 && (
                                            <button
                                                type="button"
                                                className={styles.grayBtn}
                                                disabled={
                                                    pendingDoneId ===
                                                    getDealId(selectedDeal)
                                                }
                                                onClick={(e) =>
                                                    handleDoneClick(
                                                        getDealId(
                                                            selectedDeal
                                                        ),
                                                        e
                                                    )
                                                }
                                            >
                                                {pendingDoneId ===
                                                getDealId(selectedDeal)
                                                    ? '처리 중...'
                                                    : '물건 도착 확인'}
                                            </button>
                                        )}

                                    {getDv(selectedDeal) === 5 && (
                                        <button
                                            type="button"
                                            className={styles.greenBtn}
                                            onClick={() =>
                                                handleReviewClick(selectedDeal)
                                            }
                                        >
                                            후기 보내기
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.modalSection}>
                                <h3 className={styles.modalSectionTitle}>
                                    판매자 정보
                                </h3>
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
                                <h3 className={styles.modalSectionTitle}>
                                    거래정보
                                </h3>
                                <div className={styles.modalInfoRow}>
                                    <span>거래방법</span>
                                    <span>{getTradeText(selectedDeal)}</span>
                                </div>
                                <div className={styles.modalInfoRow}>
                                    <span>결제일시</span>
                                    <span>
                                        {formatDate(
                                            selectedDeal?.dealEndDate ??
                                            selectedDeal?.deal_end_date
                                        )}
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
