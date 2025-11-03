'use client';

import { useEffect, useState, useMemo } from 'react';
import styles from './shipping.module.css';
import Sidebar from '@/components/mypage/sidebar';
import tokenStore from '@/app/store/TokenStore';

export default function ShippingPage() {
    const { accessToken } = tokenStore();

    // 상단 필터: 보낸/받은
    const [mode, setMode] = useState('sent'); // 'sent' | 'received'
    // 데이터
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // 데모용 fetch (백엔드 연결 시 이 부분만 바꾸면 됨)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                // 실제 연결 시:
                // const res = await fetch(`/api/shipping?mode=${mode}`, {
                //   headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                //   credentials: 'include',
                // });
                // const data = res.ok ? await res.json() : [];

                // 데모: 항상 빈 목록
                const data = [];
                if (mounted) setItems(data);
            } catch {
                if (mounted) setItems([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [mode, accessToken]);

    const empty = useMemo(() => !loading && items.length === 0, [loading, items]);

    return (
        <div className={styles.wrapper}>
            {/* 좌측 사이드바 */}
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            {/* 우측 본문 */}
            <main className={styles.content}>
                {/* 상단 탭(디자인용) */}
                <header className={styles.topTabs}>
                    {/*<button className={styles.tab} disabled>택배 신청</button>*/}
                    <button className={`${styles.tab} ${styles.tabActive}`} aria-current="page">
                        택배 내역
                    </button>
                </header>

                {/* 필터: 보낸/받은 */}
                <div className={styles.segmentRow}>
                    <button
                        type="button"
                        className={`${styles.segment} ${mode === 'sent' ? styles.segmentActive : ''}`}
                        onClick={() => setMode('sent')}
                    >
                        보낸 택배
                    </button>
                    <button
                        type="button"
                        className={`${styles.segment} ${mode === 'received' ? styles.segmentActive : ''}`}
                        onClick={() => setMode('received')}
                    >
                        받은 택배
                    </button>
                </div>

                {/* 리스트 */}
                {loading ? (
                    <div className={styles.emptyWrap}>
                        <div className={styles.spinner} aria-hidden />
                        <p className={styles.emptyText}>불러오는 중…</p>
                    </div>
                ) : empty ? (
                    <div className={styles.emptyWrap}>
                        <div className={styles.bubble} aria-hidden>…</div>
                        <p className={styles.emptyText}>최근 배송 내역이 없습니다.</p>
                    </div>
                ) : (
                    <ul className={styles.list}>
                        {items.map((it) => (
                            <li key={it.id} className={styles.card}>
                                <div className={styles.cardRow}>
                                    <strong className={styles.cardTitle}>{it.title}</strong>
                                    <span className={styles.badge}>{it.statusLabel}</span>
                                </div>
                                <div className={styles.metaRow}>
                                    <span>운송장: {it.trackingNo}</span>
                                    <span>택배사: {it.carrier}</span>
                                    <span>보낸 날짜: {it.sentAt}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}
