"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import styles from './AddressChangeModal.module.css';

export default function AddressChangeModal({ id, close, onAddressSelect }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

    // 주소 목록을 불러오는 함수
    const fetchAddresses = async () => {
        setLoading(true);
        setError(null);
        try {
            // localStorage에서 토큰을 가져옵니다. (실제 저장 위치에 맞게 수정 필요)
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/sing/locations`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAddresses(data);
            } else {
                throw new Error('서버에서 주소 목록을 가져오지 못했습니다.');
            }
        } catch (err) {
            setError("주소 목록을 불러오는 데 실패했습니다.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트가 마운트될 때 주소 목록을 불러옵니다.
    useEffect(() => {
        fetchAddresses();
    }, []);

    // '선택' 버튼 핸들러
    const handleSelectAddress = (address) => {
        onAddressSelect(address); // 부모 컴포넌트의 상태 업데이트
        close(); // 모달 닫기
    };

    // '기본으로 설정' 버튼 핸들러
    const handleSetDefault = async (locationId) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/sing/location/${locationId}/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('기본 배송지 설정에 실패했습니다.');
            }

            // 성공 시, 주소 목록을 다시 불러와 '대표 배송지' 배지를 업데이트
            await fetchAddresses();

        } catch (err) {
            alert("기본 배송지 설정에 실패했습니다.");
            console.error(err);
        }
    };

    return (
        <BaseModal id={id} close={close} title="배송지 변경">
            <div className={styles.modalContent}>
                {loading && <div className={styles.loading}>로딩 중...</div>}
                {error && <div className={styles.error}>{error}</div>}

                {!loading && !error && (
                    <ul className={styles.addressList}>
                        {addresses.map((addr) => (
                            <li key={addr.locKey} className={styles.addressItem}>
                                <div className={styles.addressInfo}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className={styles.addressTitle}>{addr.locTitle}</span>
                                        {/* 백엔드에서 false가 대표 배송지이므로 !addr.locDefault 로 변경 */}
                                        {!addr.locDefault && (
                                            <span className={styles.defaultBadge}>대표 배송지</span>
                                        )}
                                    </div>
                                    <p>{addr.locName} | {addr.locNum}</p>
                                    <p>[{addr.locCode}] {addr.locAddress}</p>
                                    <p>{addr.locDetail}</p>
                                </div>
                                <div className={styles.itemActions}>
                                    <button
                                        onClick={() => handleSelectAddress(addr)}
                                        className={styles.selectBtn}
                                    >
                                        선택
                                    </button>
                                    <button
                                        onClick={() => handleSetDefault(addr.locKey)}
                                        className={styles.setDefaultBtn}
                                        // 이미 대표 배송지이면 비활성화
                                        disabled={!addr.locDefault}
                                    >
                                        기본으로 설정
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className={styles.footer}>
                    <button onClick={close} className={styles.closeBtn}>닫기</button>
                </div>
            </div>
        </BaseModal>
    );
}
