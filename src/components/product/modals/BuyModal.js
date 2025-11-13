"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import { useModal } from "@/components/ui/modal/ModalProvider";
import PayWithPointModal from "./PayWithPointModal";
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { v4 as uuidv4 } from 'uuid';
import styles from './BuyModal.module.css';
import AddressChangeModal from "@/components/product/modals/AddressChangeModal";

// 안심 결제가 아닌 일반 결제 진행하는 모달
export default function BuyModal({ id, close, itemId, title, price }) { // imageUrl prop 제거
    const [qty, setQty] = useState(1);
    const total = (Number(price) || 0) * qty;
    const modal = useModal();

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressLoading, setAddressLoading] = useState(true); // 주소 로딩 상태 추가
    const [productImageUrl, setProductImageUrl] = useState('/images/placeholder.jpg'); // 상품 이미지 URL 상태 추가

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

    function generateUUID() {
           return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                 var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                 return v.toString(16);
               });
         }

    // 상품 이미지 정보를 가져오는 useEffect
    useEffect(() => {
        if (!itemId) return; // itemId가 없으면 실행하지 않음

        const fetchProductImage = async () => {
            try {
                // 백엔드 API에서 상품 정보를 가져옵니다.
                const response = await fetch(`${API_BASE_URL}/api/products/${itemId}`);
                if (!response.ok) {
                    throw new Error('상품 정보를 가져오지 못했습니다.');
                }
                const data = await response.json();
                // pdThumb 필드가 있는지 확인하고 상태를 업데이트합니다.
                if (data && data.pdThumb) {
                    setProductImageUrl(data.pdThumb);
                }
            } catch (error) {
                console.error("상품 이미지를 불러오는 데 실패했습니다.", error);
                // 에러 발생 시 기본 이미지를 유지합니다.
            }
        };

        fetchProductImage();
    }, [itemId]); // itemId가 변경될 때마다 실행

    useEffect(() => {
        // 백엔드 API에서 기본 배송지 정보를 가져오는 함수 호출
        const fetchDefaultAddress = async () => {
            setAddressLoading(true);
            try {
                // localStorage에서 토큰을 가져옵니다. (실제 저장 위치에 맞게 수정 필요)
                const token = localStorage.getItem('accessToken');

                const response = await fetch(`${API_BASE_URL}/api/sing/locations/default`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    if (response.status === 204) { // 204 No Content: 기본 배송지가 없는 경우
                        console.log("기본 배송지가 없습니다.");
                        setSelectedAddress(null);
                    } else {
                        const data = await response.json();
                        setSelectedAddress(data);
                    }
                } else {
                    throw new Error('서버에서 배송지 정보를 가져오지 못했습니다.');
                }
            } catch (error) {
                console.error("기본 배송지를 불러오는 데 실패했습니다.", error);
                setSelectedAddress(null); // 에러 발생 시 주소 정보 초기화
            } finally {
                setAddressLoading(false); // 로딩 상태 종료
            }
        };
        fetchDefaultAddress();
    }, []); // 컴포넌트 마운트 시 1회만 실행

    const purchase = async () => {
        if (!selectedAddress || !selectedAddress.locKey) {
            alert("배송지를 선택해주세요.");
            return;
        }
        // .env 파일에서 토스 클라이언트 키 받아오기
        const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
        // 결제/주문 토스페이먼츠 API 호출
        tossPayments.requestPayment('카드', {
            // 상태에서 금액 가져오기
            amount: total,
            // 거래번호 필요한 값 붙여서 생성
            orderId: `product-${itemId}-${generateUUID()}`,
            // 주문명 동적 생성
            orderName: title || '상품 구매',
            customerName: "id", // TODO: 실제 유저 이름으로 변경 필요
            successUrl: `${API_BASE_URL}/api/pay/success?locKey=${selectedAddress.locKey}`,
            failUrl: `${window.location.origin}/pay/fail`,
        }).catch(error => {
            if (error.code === 'USER_CANCEL') {
                console.log('사용자가 결제를 취소했습니다');
            } else {
                alert(`결제 요청 중 오류가 발생했습니다: ${error.message}`);
            }
        });
    };

    // 대파 페이 결제 모달 열기
    const openPayWithPointModal = () => {
        modal.open(({ id: newModalId, close: newModalClose }) => (
            <PayWithPointModal
                id={newModalId}
                close={newModalClose}
                itemId={itemId}
                title={title}
                qty={qty}
                total={total}
            />
        ));
    };

    const handleChangeAddress = () => {
        modal.open(({ id, close }) => (
            <AddressChangeModal
                id={id}
                close={close}
                onAddressSelect={(newAddress) => {
                    setSelectedAddress(newAddress);
                }}
            />
        ));
    };

    return (
        <BaseModal id={id} close={close} title="일반 결제">
            <div className={styles.modalContent}>
                {/* 상품 정보 섹션 */}
                <div className={styles.productInfo}>
                    <img src={productImageUrl} alt={title} className={styles.productImage} />
                    <div className={styles.productDetails}>
                        <h2 className={styles.productTitle}>{title}</h2>
                        <p className={styles.productPrice}>{(price || 0).toLocaleString()}원</p>
                    </div>
                </div>

                {/* 배송지 정보 섹션 */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>배송지 정보</h3>
                        <button onClick={handleChangeAddress} className={styles.changeBtn}>
                            변경
                        </button>
                    </div>
                    {addressLoading ? (
                        <p>배송지를 불러오는 중입니다...</p>
                    ) : selectedAddress ? (
                        <div className={styles.addressDisplay}>
                            <div className={styles.addressHeader}>
                                <span className={styles.addressTitle}>{selectedAddress.locTitle}</span>
                                {/* 백엔드에서 false가 대표 배송지이므로 !selectedAddress.locDefault 로 변경 */}
                                {!selectedAddress.locDefault && (
                                    <span className={styles.defaultBadge}>대표 배송지</span>
                                )}
                            </div>
                            <p>{selectedAddress.locName}</p>
                            <p>{selectedAddress.locNum}</p>
                            {/* 백엔드 필드명인 locAddress 로 변경 */}
                            <p>[{selectedAddress.locCode}] {selectedAddress.locAddress}</p>
                            <p>{selectedAddress.locDetail}</p>
                        </div>
                    ) : (
                        <p>설정된 배송지가 없습니다. 배송지를 추가해주세요.</p>
                    )}
                </div>

                {/* 수량 및 최종 금액 섹션 */}
                <div className={styles.section}>
                    <div className={styles.quantityControl}>
                        <span className={styles.quantityLabel}>수량</span>
                        <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                            className={styles.quantityInput}
                        />
                    </div>
                    <div className={styles.totalPriceWrapper}>
                        <span className={styles.totalPriceLabel}>최종 결제금액</span>
                        <span className={styles.totalPrice}>{total.toLocaleString()}원</span>
                    </div>
                </div>

                {/* 버튼 그룹 */}
                <div className={styles.buttonGroup}>
                    <button onClick={purchase} className={`${styles.btn} ${styles.btnSecondary}`}>일반 결제</button>
                    <button onClick={openPayWithPointModal} className={`${styles.btn} ${styles.btnSecondary}`}>페이로 결제</button>
                    <button onClick={close} className={`${styles.btn} ${styles.btnGhost}`}>취소</button>
                </div>
            </div>
        </BaseModal>
    );
}
