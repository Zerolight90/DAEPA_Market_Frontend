"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import styles from './AddressChangeModal.module.css';
import { api } from "@/lib/api/client";
// api 인터셉터가 Authorization 헤더를 자동으로 첨부 — localStorage 토큰 읽기 불필요

interface Address {
    locKey: number;
    locTitle: string;
    locName?: string;
    locNum?: string;
    locCode?: string;
    locAddress: string;
    locDetail?: string;
    locDefault?: boolean;
}

interface AddressChangeModalProps {
    id: string;
    close: () => void;
    onAddressSelect: (address: Address) => void;
}

export default function AddressChangeModal({ id, close, onAddressSelect }: AddressChangeModalProps) {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 주소 목록을 불러오는 함수
    const fetchAddresses = async () => {
        setLoading(true);
        setError(null);
        try {
            // api 인터셉터가 Authorization 헤더를 자동으로 첨부합니다
            const res = await api.get<Address[]>("/sign/locations");
            setAddresses(res.data);
        } catch (err) {
            setError("주소 목록을 불러오는 데 실패했습니다.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트가 마운트될 때 주소 목록을 불러온다
    useEffect(() => {
        fetchAddresses();
    }, []);

    // '선택' 버튼 핸들러
    const handleSelectAddress = (address: Address) => {
        onAddressSelect(address);
        close();
    };

    // '기본으로 설정' 버튼 핸들러
    const handleSetDefault = async (locationId: number) => {
        try {
            // api 인터셉터가 Authorization 헤더를 자동으로 첨부합니다
            await api.put(`/sign/location/${locationId}/update`);
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
                                        {!addr.locDefault && (
                                            <span className={styles.defaultBadge}>기본 배송지</span>
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
