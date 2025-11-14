'use client';

import { useEffect, useState } from 'react';
import styles from './settlement.module.css';
import Sidebar from '@/components/mypage/sidebar';
import tokenStore from '@/app/store/TokenStore';

export default function SettlementPage() {
    const { accessToken } = tokenStore();
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [list, setList] = useState([]);

    // 정산 내역 가져오기
    useEffect(() => {
        async function fetchDeals() {
            try {
                setLoading(true);

                const res = await fetch('/api/deal/safe', {
                    headers: accessToken
                        ? { Authorization: `Bearer ${accessToken}` }
                        : {},
                    credentials: 'include',
                    cache: 'no-store',
                });

                if (!res.ok) {
                    const txt = await res.text();
                    setErr(txt || '불러오기에 실패했습니다.');
                    setList([]);
                    return;
                }

                const data = await res.json();
                // data: [{ productTitle, agreedPrice, dealDate }]
                setList(Array.isArray(data) ? data : []);
                setErr('');
            } catch (e) {
                setErr('네트워크 오류가 발생했습니다.');
                setList([]);
            } finally {
                setLoading(false);
            }
        }

        fetchDeals();
    }, [accessToken]);

    // 날짜 예쁘게
    const formatDate = (d) => {
        if (!d) return '';
        // ISO 형태면 0~10, DB Timestamp 문자열이어도 앞 10글자는 YYYY-MM-DD일 거라 동일하게 처리
        return String(d).slice(0, 10).replace(/-/g, '.');
    };

    return (
        <div className={styles.wrapper}>
            {/* 왼쪽 사이드바 */}
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            {/* 오른쪽 컨텐츠 */}
            <main className={styles.content}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>안심결제 정산내역</h1>
                    <p className={styles.subText}>
                        최근 1년 이내의 정산 내역만 노출됩니다.
                    </p>
                </header>

                {loading ? (
                    <div className={styles.empty}>로딩 중…</div>
                ) : err ? (
                    <div className={styles.empty}>{err}</div>
                ) : list.length === 0 ? (
                    <div className={styles.empty}>정산 내역이 없습니다.</div>
                ) : (
                    <section className={styles.cardList}>
                        {list.map((item, idx) => (
                            <article
                                key={
                                    'settle-' +
                                    (item.dealDate ?? 'no-date') +
                                    '-' +
                                    idx
                                }
                                className={styles.card}
                            >
                                <div className={styles.cardTop}>
                                    <h2 className={styles.cardTitle}>
                                        {item.productTitle || '상품명 없음'}
                                    </h2>
                                    <span className={styles.amount}>
                                        {(item.agreedPrice || 0).toLocaleString()}
                                        원
                                    </span>
                                </div>
                                <p className={styles.date}>
                                    {formatDate(item.dealDate)}
                                </p>
                            </article>
                        ))}
                    </section>
                )}
            </main>
        </div>
    );
}
