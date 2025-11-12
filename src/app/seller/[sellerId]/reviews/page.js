"use client";

import styles from "./reviews.module.css";

const MOCK_USER = {
    name: "당근당근",
    location: "역삼동",
    manner: 41.7,
    saleCount: 100,
    reviewCount: 10,
};

const MOCK_REVIEWS = [
    {
        id: 1,
        writer: "젤리곰",
        role: "구매자",
        region: "대치2동",
        time: "1개월 전",
        content: "옷 잘 받았습니다. 감사합니다. 행복한 명절 되세요!",
        thumbnail:
            "https://images.unsplash.com/photo-1585386959984-a4155223f3b4?w=200&h=200&fit=crop",
    },
    {
        id: 2,
        writer: "재릭",
        role: "구매자",
        region: "양평읍",
        time: "6개월 전",
        content: "너무 맘에들어요~^^",
        thumbnail:
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop",
    },
    {
        id: 3,
        writer: "대복맘",
        role: "구매자",
        region: "양평읍",
        time: "6개월 전",
        content:
            "생각지도 않게 장갑까지 주셔서 아들과 잘 사용할게요. 감사해요.",
        thumbnail:
            "https://images.unsplash.com/photo-1514986888952-8cd320577b68?w=200&h=200&fit=crop",
    },
    {
        id: 4,
        writer: "짱구네",
        role: "구매자",
        region: "양평읍",
        time: "11개월 전",
        content: "감사합니다~~",
    },
    {
        id: 5,
        writer: "서은빠",
        role: "구매자",
        region: "운정동",
        time: "2년 전",
        content: "잘받았습니다~",
    },
];

export default function ReviewsPage() {
    return (
        <div className={styles.page}>
            {/* 상단 프로필 영역 */}
            <header className={styles.header}>
                <div className={styles.userBox}>
                    <div className={styles.avatar} aria-hidden />
                    <div>
                        <div className={styles.userName}>{MOCK_USER.name}</div>
                        <div className={styles.userLocation}>{MOCK_USER.location}</div>
                    </div>
                </div>

                <div className={styles.mannerBox}>
                    <div className={styles.mannerRow}>
                        <span className={styles.mannerValue}>{MOCK_USER.manner}℃</span>
                        <span className={styles.mannerEmoji}>😊</span>
                    </div>
                    <div className={styles.mannerLabel}>신선도</div>
                    <div className={styles.mannerBar}>
                        <div
                            className={styles.mannerFill}
                            style={{ width: Math.min(MOCK_USER.manner, 100) + "%" }}
                        />
                    </div>
                </div>
            </header>

            {/* 탭 */}
            <div className={styles.tabs}>
                <button className={styles.tab}>
                    판매 물품 <span>({MOCK_USER.saleCount})</span>
                </button>
                <button className={`${styles.tab} ${styles.activeTab}`}>
                    거래 후기 <span>({MOCK_USER.reviewCount})</span>
                </button>
            </div>

            {/* 리뷰 목록 */}
            <ul className={styles.reviewList}>
                {MOCK_REVIEWS.map((r) => (
                    <li key={r.id} className={styles.reviewItem}>
                        <div className={styles.reviewLeft}>
                            <div className={styles.reviewAvatar} aria-hidden />
                            <div>
                                <div className={styles.reviewTop}>
                                    <span className={styles.reviewWriter}>{r.writer}</span>
                                    <span className={styles.reviewMeta}>
                    {r.role} · {r.region} · {r.time}
                  </span>
                                </div>
                                <p className={styles.reviewContent}>{r.content}</p>
                            </div>
                        </div>
                        {r.thumbnail ? (
                            <img
                                src={r.thumbnail}
                                alt="거래 상품"
                                className={styles.thumbnail}
                            />
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    );
}
