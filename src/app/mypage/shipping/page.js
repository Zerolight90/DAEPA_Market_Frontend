'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './shipping.module.css';
import Sidebar from '@/components/mypage/sidebar';
import api from '@/lib/api'; // 전역 axios 인스턴스 사용

export default function ShippingPage() {
    // sent: 보낸 택배, received: 받은 택배
    const [mode, setMode] = useState('sent');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            setErr('');
            setItems([]); // 모드 바뀔 때 깔끔하게

            // 모드별 엔드포인트
            const url =
                mode === 'sent'
                    ? '/delivery/sent'
                    : '/delivery/received';

            try {
                const res = await api.get(url);

                const data = res.data;

                // 공통 normalize
                const normalized = Array.isArray(data)
                    ? data.map(function (row, idx) {
                        return {
                            // ✅ mode까지 섞어서 key 절대 안 겹치게
                            key:
                                'ship-' +
                                mode +
                                '-' +
                                (row.dealId ?? 'x') +
                                '-' +
                                (row.deliveryId ?? idx),
                            title:
                                row.productTitle ||
                                '배송건 #' + (row.dealId ?? ''),
                            price: typeof row.agreedPrice === 'number'
                                ? row.agreedPrice
                                : 0,
                            date: row.dvDate ?? row.dv_date ?? null, // 아직 DTO에 날짜 없음
                            deliveryStatus: row.deliveryStatus,
                            checkStatus: row.checkStatus,
                            checkResult: row.checkResult,
                            locKey: row.locKey,
                        };
                    })
                    : [];

                if (alive) {
                    setItems(normalized);
                }
            } catch (e) {
                if (alive) {
                    setErr(e.response?.data?.message || e.message || '네트워크 오류가 발생했습니다.');
                    setItems([]);
                    if (e.response?.status === 401) {
                        console.log("로그인이 필요합니다.");
                    }
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [mode]);

    const empty = useMemo(
        function () {
            return !loading && !err && items.length === 0;
        },
        [loading, err, items],
    );

    // 날짜 예쁘게 (나중에 서버에서 내려주면 여기만 쓰면 됨)
    function formatDate(str) {
        if (!str) return '';
        return String(str).slice(0, 10);
    }

    // 배송 상태 텍스트: dv_status
    // 0: 배송전 ,1:배송중, 2: 검수배송완료, 3: 검수 후 배송, 4:반품(검수결과: 1) 5: 배송완료
    function deliveryStatusText(s) {
        switch (s) {
            case 0:
                return '배송 전';
            case 1:
                return '배송 중';
            case 2:
                return '검수 배송 완료';
            case 3:
                return '검수 후 배송';
            case 4:
                return '반품';
            case 5:
                return '배송 완료';
            default:
                return '알 수 없음';
        }
    }

    // 검수 상태 + 결과 표시
    function checkText(ckStatus, ckResult) {
        if (ckStatus == null) return '검수 정보 없음';
        if (ckStatus === 0) return '검수 중';
        if (ckStatus === 1) {
            if (ckResult == null) return '검수 완료';
            if (ckResult === 0) return '검수 완료 (합격)';
            if (ckResult === 1) return '검수 완료 (불합격)';
        }
        return '검수 정보 없음';
    }

    return (
        <div className={styles.wrapper}>
            {/* 왼쪽 사이드바 */}
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            {/* 오른쪽 본문 */}
            <main className={styles.content}>
                {/* 제목 */}
                <header className={styles.headerRow}>
                    <h1 className={styles.pageTitle}>택배 내역</h1>
                </header>

                {/* 보낸/받은 토글 */}
                <div className={styles.segmentRow}>
                    <button
                        type="button"
                        className={
                            mode === 'sent'
                                ? styles.segmentActive
                                : styles.segment
                        }
                        onClick={function () {
                            setMode('sent');
                        }}
                    >
                        보낸 택배
                    </button>
                    <button
                        type="button"
                        className={
                            mode === 'received'
                                ? styles.segmentActive
                                : styles.segment
                        }
                        onClick={function () {
                            setMode('received');
                        }}
                    >
                        받은 택배
                    </button>
                </div>

                {/* 리스트 영역 */}
                {loading ? (
                    <div className={styles.emptyWrap}>
                        <div className={styles.spinner} aria-hidden />
                        <p className={styles.emptyText}>불러오는 중…</p>
                    </div>
                ) : err ? (
                    <div className={styles.emptyWrap}>
                        <p className={styles.emptyText}>{err}</p>
                    </div>
                ) : empty ? (
                    <div className={styles.emptyWrap}>
                        <p className={styles.emptyText}>
                            최근 {mode === 'sent' ? '보낸' : '받은'} 택배가 없습니다.
                        </p>
                    </div>
                ) : (
                    <ul className={styles.cardList}>
                        {items.map(function (it) {
                            return (
                                <li key={it.key} className={styles.card}>
                                    <div className={styles.cardTop}>
                                        <h2 className={styles.cardTitle}>
                                            {it.title}
                                        </h2>
                                        <span
                                            className={
                                                it.deliveryStatus === 5
                                                    ? styles.badgeGreen
                                                    : styles.badgeGray
                                            }
                                        >
                                            {deliveryStatusText(
                                                it.deliveryStatus,
                                            )}
                                        </span>
                                    </div>

                                    <div className={styles.cardBody}>
                                        {/* 검수 상태 */}
                                        <p className={styles.metaLine}>
                                            검수 :{' '}
                                            {checkText(
                                                it.checkStatus,
                                                it.checkResult,
                                            )}
                                        </p>
                                        {/* 실거래가 */}
                                        <p className={styles.metaLine}>
                                            결제 금액 :{' '}
                                            {it.price
                                                ? it.price.toLocaleString() +
                                                '원'
                                                : '-'}
                                        </p>
                                        {/* 날짜는 아직 없음 */}
                                        <p className={styles.metaLine}>
                                            배송일자 :{' '}
                                            {it.date
                                                ? formatDate(it.date)
                                                : '-'}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>
        </div>
    );
}
