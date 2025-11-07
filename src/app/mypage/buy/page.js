'use client';

import { useState } from 'react';
import styles from './buy.module.css';
import Sidebar from '@/components/mypage/sidebar';

export default function SellHistoryPage() {
    // 화면에 쓸 더미 데이터
    const [list] = useState([
        {
            id: 101,
            date: '2025.11.04',
            tradeType: '직거래',
            status: '구매완료',
            title: '스타벅스 아이스 클래식 밀크티 T',
            price: 5000,
            thumb: '', // 없으면 빈 박스로 처리
            step: 3, // 1=결제완료, 2=주문확인, 3=판매완료
        },
        {
            id: 102,
            date: '2025.10.30',
            tradeType: '다른곳거래',
            status: '구매완료',
            title: '스타벅스 아이스 클래식 밀크티 T',
            price: 50000,
            thumb: '',
            step: 3,
        },
        {
            id: 103,
            date: '2025.10.30',
            tradeType: '직거래',
            status: '구매완료',
            title: '강아지 그림',
            price: 12000,
            thumb: '',
            step: 2,
        },
    ]);

    const [keyword, setKeyword] = useState('');

    // 검색어로 필터
    const filtered = list.filter((item) =>
        item.title.toLowerCase().includes(keyword.toLowerCase())
    );

    return (
        <div className={styles.wrapper}>
            {/* 왼쪽 사이드바 */}
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            {/* 오른쪽 컨텐츠 */}
            <main className={styles.content}>
                {/* 상단 바 */}
                <header className={styles.topBar}>
                    <h1 className={styles.pageTitle}>구매내역</h1>
                </header>

                {/* 검색 + 필터행 */}
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

                {/* 목록 */}
                <section className={styles.listArea}>
                    {filtered.map((item) => (
                        <article key={item.id} className={styles.block}>
                            {/* 날짜줄 */}
                            <div className={styles.dateRow}>
                                <span>{item.date}</span>
                                <span className={styles.dot}>|</span>
                                <span>{item.tradeType}</span>
                                <button className={styles.closeBtn} aria-label="닫기">
                                    ×
                                </button>
                            </div>

                            {/* 본문 카드 */}
                            <div className={styles.card}>
                                <p className={styles.status}>{item.status}</p>

                                <div className={styles.productRow}>
                                    {/* 썸네일 */}
                                    <div className={styles.thumbBox}>
                                        {item.thumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.thumb} alt={item.title} className={styles.thumb} />
                                        ) : (
                                            <div className={styles.thumbPlaceholder} />
                                        )}
                                    </div>

                                    {/* 상품정보 */}
                                    <div className={styles.prodInfo}>
                                        <p className={styles.prodTitle}>{item.title}</p>
                                        <p className={styles.prodPrice}>
                                            {item.price.toLocaleString()}원
                                        </p>
                                    </div>
                                </div>

                                {/* 진행바 */}
                                <div className={styles.stepBar}>
                                    <div
                                        className={`${styles.step} ${
                                            item.step >= 1 ? styles.stepActive : ''
                                        }`}
                                    >
                                        <span className={styles.stepDot} />
                                        <span className={styles.stepLabel}>결제완료</span>
                                    </div>
                                    <div
                                        className={`${styles.step} ${
                                            item.step >= 2 ? styles.stepActive : ''
                                        }`}
                                    >
                                        <span className={styles.stepDot} />
                                        <span className={styles.stepLabel}>주문확인</span>
                                    </div>
                                    <div
                                        className={`${styles.step} ${
                                            item.step >= 3 ? styles.stepActive : ''
                                        }`}
                                    >
                                        <span className={styles.stepDot} />
                                        <span className={styles.stepLabel}>판매완료</span>
                                    </div>
                                </div>

                                {/* 버튼 */}
                                <button type="button" className={styles.reviewBtn}>
                                    후기 보내기
                                </button>
                            </div>
                        </article>
                    ))}

                    {filtered.length === 0 && (
                        <div className={styles.empty}>구매내역이 없습니다.</div>
                    )}
                </section>
            </main>
        </div>
    );
}
