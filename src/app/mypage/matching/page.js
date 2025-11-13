'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./matching.module.css"; // ✅ 새 CSS 모듈 임포트
import tokenStore from "@/app/store/TokenStore";
import Sidebar from "@/components/mypage/sidebar";

const NOTIFICATIONS_PER_PAGE = 5;

export default function MatchingPage() {
    const { token } = tokenStore();

    // 카테고리 상태
    const [upperCategories, setUpperCategories] = useState([]);
    const [middleCategories, setMiddleCategories] = useState([]);
    const [lowCategories, setLowCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingMiddle, setLoadingMiddle] = useState(false);
    const [loadingLow, setLoadingLow] = useState(false);

    // 사용자 선택값 상태
    const [selectedUpper, setSelectedUpper] = useState('');
    const [selectedMiddle, setSelectedMiddle] = useState('');
    const [selectedLow, setSelectedLow] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // 내 관심 조건 목록 상태
    const [userPicks, setUserPicks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [selectedPick, setSelectedPick] = useState(null);
    const [isNotificationLoading, setIsNotificationLoading] = useState(false);
    const [visibleNotificationsCount, setVisibleNotificationsCount] = useState(NOTIFICATIONS_PER_PAGE);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

    // 내 관심 조건 불러오기
    useEffect(() => {
        const fetchUserPicks = async () => {
            const currentToken = token || localStorage.getItem('accessToken');
            if (!currentToken) {
                setError("로그인이 필요합니다.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/userpicks`, {
                    headers: { 'Authorization': `Bearer ${currentToken}` },
                });
                if (!response.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
                const data = await response.json();
                setUserPicks(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserPicks();
    }, [token]);

    // 상위 카테고리 로드
    useEffect(() => {
        (async () => {
            try {
                setLoadingCategories(true);
                const res = await fetch(`${API_BASE_URL}/category/uppers`);
                const data = await res.json();
                setUpperCategories(data);
            } catch (e) {
                console.error("상위 카테고리 로딩 실패:", e);
            } finally {
                setLoadingCategories(false);
            }
        })();
    }, []);

    // 상위 변경 → 중위 로드
    useEffect(() => {
        if (!selectedUpper) {
            setMiddleCategories([]);
            setLowCategories([]);
            setSelectedMiddle('');
            setSelectedLow('');
            return;
        }
        (async () => {
            setLoadingMiddle(true);
            try {
                const res = await fetch(`${API_BASE_URL}/category/uppers/${selectedUpper}/middles`);
                const data = await res.json();
                setMiddleCategories(data);
            } catch (e) {
                console.error("중위 카테고리 로딩 실패:", e);
            } finally {
                setLoadingMiddle(false);
            }
        })();
    }, [selectedUpper]);

    // 중위 변경 → 하위 로드
    useEffect(() => {
        if (!selectedMiddle) {
            setLowCategories([]);
            setSelectedLow('');
            return;
        }
        (async () => {
            setLoadingLow(true);
            try {
                const res = await fetch(`${API_BASE_URL}/category/middles/${selectedMiddle}/lows`);
                const data = await res.json();
                setLowCategories(data);
            } catch (e) {
                console.error("하위 카테고리 로딩 실패:", e);
            } finally {
                setLoadingLow(false);
            }
        })();
    }, [selectedMiddle]);

    // 삭제
    const handleDelete = async (idToDelete) => {
        if (!confirm('해당 항목을 정말 삭제하시겠습니까?')) return;
        const currentToken = token || localStorage.getItem('accessToken');
        try {
            const res = await fetch(`${API_BASE_URL}/userpicks/${idToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });
            if (!res.ok) throw new Error('삭제에 실패했습니다.');
            setUserPicks(prev => prev.filter(p => p.upIdx !== idToDelete));
        } catch (err) {
            alert(err.message);
        }
    };

    // 추가
    const handleAddPick = async () => {
        const currentToken = token || localStorage.getItem('accessToken');
        if (!selectedUpper || !selectedMiddle || !selectedLow || !minPrice || !maxPrice) {
            alert('모든 값을 입력해주세요.');
            return;
        }
        const upperCategoryLabel = upperCategories.find(c => c.upperIdx === Number(selectedUpper))?.upperCt || '';
        const middleCategoryLabel = middleCategories.find(c => c.middleIdx === Number(selectedMiddle))?.middleCt || '';
        const lowCategoryLabel = lowCategories.find(c => c.lowIdx === Number(selectedLow))?.lowCt || '';

        const newPickData = {
            upperCategory: upperCategoryLabel,
            middleCategory: middleCategoryLabel,
            lowCategory: lowCategoryLabel,
            minPrice: parseInt(minPrice, 10),
            maxPrice: parseInt(maxPrice, 10),
        };

        try {
            const res = await fetch('${API_BASE_URL}/userpicks/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(newPickData),
            });
            if (!res.ok) throw new Error('관심 상품 추가에 실패했습니다.');
            const added = await res.json();
            setUserPicks(prev => [...prev, added]);
            // 입력 필드 초기화
            setSelectedUpper('');
            setSelectedMiddle('');
            setSelectedLow('');
            setMinPrice('');
            setMaxPrice('');
            alert('성공적으로 추가되었습니다.');
        } catch (err) {
            alert(err.message);
        }
    };

    // 알림 모달 열기
    const handleOpenNotificationModal = async (pick) => {
        setSelectedPick(pick);
        setIsModalOpen(true);
        setIsNotificationLoading(true);
        setNotifications([]);
        setVisibleNotificationsCount(NOTIFICATIONS_PER_PAGE);

        const currentToken = token || localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_BASE_URL}/userpicks/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`,
                },
                body: JSON.stringify(pick),
            });
            if (!response.ok) throw new Error('알림을 불러오는 중 오류가 발생했습니다.');
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            alert(error.message);
            setNotifications([]);
        } finally {
            setIsNotificationLoading(false);
        }
    };

    const handleCloseModal = () => setIsModalOpen(false);

    // 알림 삭제
    const handleDeleteNotification = async (productIdToDelete) => {
        const currentToken = token || localStorage.getItem('accessToken');
        try {
            const response = await fetch(`http://localhost:8080/api/alarm/delete/${productIdToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentToken}` },
            });
            if (!response.ok) throw new Error('알림 삭제에 실패했습니다.');
            setNotifications(prev => prev.filter(n => n.productId !== productIdToDelete));
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert(error.message);
        }
    };

    const handleLoadMore = () => setVisibleNotificationsCount(prev => prev + NOTIFICATIONS_PER_PAGE);

    return (
        <div className={styles.wrapper}>
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            <main className={styles.content}>
                <header className={styles.topBar}>
                    <h1 className={styles.pageTitle}>관심 매칭 관리</h1>
                </header>

                {/* 컨트롤 영역 */}
                <div className={styles.searchRow}>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={selectedUpper}
                            onChange={(e) => setSelectedUpper(e.target.value)}
                            disabled={loadingCategories}
                        >
                            <option value="">상위 카테고리</option>
                            {upperCategories.map(c => (
                                <option key={c.upperIdx} value={c.upperIdx}>{c.upperCt}</option>
                            ))}
                        </select>
                        <select
                            className={styles.filterSelect}
                            value={selectedMiddle}
                            onChange={(e) => setSelectedMiddle(e.target.value)}
                            disabled={!selectedUpper || loadingMiddle}
                        >
                            <option value="">중위 카테고리</option>
                            {middleCategories.map(c => (
                                <option key={c.middleIdx} value={c.middleIdx}>{c.middleCt}</option>
                            ))}
                        </select>
                        <select
                            className={styles.filterSelect}
                            value={selectedLow}
                            onChange={(e) => setSelectedLow(e.target.value)}
                            disabled={!selectedMiddle || loadingLow}
                        >
                            <option value="">하위 카테고리</option>
                            {lowCategories.map(c => (
                                <option key={c.lowIdx} value={c.lowIdx}>{c.lowCt}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <input
                            type="number"
                            className={styles.priceInput}
                            placeholder="최소 금액"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <span className={styles.priceSeparator}>~</span>
                        <input
                            type="number"
                            className={styles.priceInput}
                            placeholder="최대 금액"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                        <button type="button" className={styles.greenBtn} onClick={handleAddPick}>
                            추가
                        </button>
                    </div>
                </div>

                {/* 목록 영역 */}
                {isLoading && <div className={styles.empty}>불러오는 중...</div>}
                {!isLoading && error && <div className={styles.empty}>{error}</div>}
                {!isLoading && !error && (
                    <section className={styles.listArea}>
                        {userPicks.length === 0 ? (
                            <div className={styles.empty}>추가된 관심 조건이 없습니다.</div>
                        ) : (
                            userPicks.map((pick) => (
                                <article key={pick.upIdx} className={styles.block}>
                                    <div className={styles.card}>
                                        <span className={styles.pickCategory}>
                                            {pick.upperCategory} &gt; {pick.middleCategory} &gt; {pick.lowCategory}
                                        </span>
                                        <p className={styles.pickPrice}>
                                            {pick.minPrice.toLocaleString()}원 ~ {pick.maxPrice.toLocaleString()}원
                                        </p>
                                        <div className={styles.actions}>
                                            <button
                                                type="button"
                                                className={styles.greenBtn}
                                                onClick={() => handleOpenNotificationModal(pick)}
                                            >
                                                알림 확인
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.grayBtn}
                                                onClick={() => handleDelete(pick.upIdx)}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </section>
                )}
            </main>

            {/* 알림 모달 */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <header className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>새로운 알림</h2>
                            <button type="button" className={styles.modalClose} onClick={handleCloseModal}>×</button>
                        </header>
                        <div className={styles.modalBody}>
                            {isNotificationLoading ? (
                                <div className={styles.empty}>알림을 불러오는 중...</div>
                            ) : notifications.length > 0 ? (
                                <ul className={styles.notificationList}>
                                    {notifications.slice(0, visibleNotificationsCount).map((n) => (
                                        <li key={n.productId} className={styles.notificationItem}>
                                            <span>
                                                <Link href={`/store/${n.productId}`} className={styles.notificationLink}>
                                                    {n.productName}
                                                </Link>
                                                {' '}상품이 등록되었습니다.
                                            </span>
                                            <button
                                                type="button"
                                                className={styles.notificationDeleteBtn}
                                                onClick={() => handleDeleteNotification(n.productId)}
                                            >
                                                ×
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className={styles.empty}>새로운 알림이 없습니다.</div>
                            )}
                            <div className={styles.modalActions}>
                                {notifications.length > visibleNotificationsCount && (
                                    <button type="button" className={styles.grayBtn} onClick={handleLoadMore}>
                                        더보기
                                    </button>
                                )}
                                <button type="button" className={styles.greenBtn} onClick={handleCloseModal}>
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
