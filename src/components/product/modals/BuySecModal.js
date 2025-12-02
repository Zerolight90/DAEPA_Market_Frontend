"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import { useModal } from "@/components/ui/modal/ModalProvider";
import PayWithPointModal from "./SecPayWithPointModal";
import { loadTossPayments } from '@tosspayments/payment-sdk';
import styles from './BuySecModal.module.css';
import AddressChangeModal from "@/components/product/modals/AddressChangeModal";
import { api } from "@/lib/api/client";
import { getSafeLocalStorage, safeGetItem } from "@/lib/safeStorage";

// 안전결제 진행 모달
export default function BuySecModal({ id, close, itemId, title, price }) {
    const [qty, setQty] = useState(1);
    const total = (Number(price) || 0) * qty;
    const modal = useModal();

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressLoading, setAddressLoading] = useState(true);
    const [productImageUrl, setProductImageUrl] = useState('/images/placeholder.jpg');

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    useEffect(() => {
        if (!itemId) return;
        const fetchProductImage = async () => {
            try {
                const data = await api(`/products/${itemId}`);
                if (data && data.pdThumb) setProductImageUrl(data.pdThumb);
            } catch (error) {
                console.error("상품 이미지를 불러오는 데 실패했습니다.", error);
            }
        };
        fetchProductImage();
    }, [itemId]);

    useEffect(() => {
        const fetchDefaultAddress = async () => {
            setAddressLoading(true);
            try {
                const ls = getSafeLocalStorage();
                const token = safeGetItem(ls, 'accessToken');

                const data = await api(`/sing/locations/default`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
                });
                setSelectedAddress(data);
            } catch (error) {
                if (error.status !== 204) {
                    console.error("기본 배송지 불러오기 실패:", error);
                }
                setSelectedAddress(null);
            } finally {
                setAddressLoading(false);
            }
        };
        fetchDefaultAddress();
    }, []);

    const purchase = async () => {
        if (!selectedAddress || !selectedAddress.locKey) {
            alert("배송지를 선택해 주세요.");
            return;
        }
        const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
        const orderId = `product-sec-${itemId}-${generateUUID()}`;

        tossPayments.requestPayment('카드', {
            amount: total,
            orderId: orderId,
            orderName: title || '안심결제 구매',
            customerName: "id",
        }).then(data => {
            const { paymentKey, amount } = data;
            window.location.href =
                `${window.location.origin}/pay/sec/success?paymentKey=${paymentKey}&orderId=${orderId}&amount=${amount}`;
        }).catch(error => {
            if (error.code === 'USER_CANCEL') {
                console.log('사용자가 결제를 취소했습니다');
            } else {
                window.location.href =
                    `${window.location.origin}/pay/sec/fail?message=${error.message}`;
            }
        });
    };

    const openPayWithPointModal = () => {
        modal.open(({ id: newModalId, close: newModalClose }) => (
            <PayWithPointModal
                id={newModalId}
                close={newModalClose}
                itemId={itemId}
                title={title}
                qty={qty}
                price={price}
                selectedAddress={selectedAddress}
                onAddressChange={() => {}}
            />
        ));
    };

    const openAddressModal = () => {
        modal.open(({ id: modalId, close: modalClose }) => (
            <AddressChangeModal
                id={modalId}
                close={modalClose}
                onAddressSelect={(addr) => {
                    setSelectedAddress(addr);
                    modalClose();
                }}
            />
        ));
    };

    return (
        <BaseModal id={id} close={close} title="안심결제 구매">
            <div className={styles.modalContent}>
                <div className={styles.productInfo}>
                    <img src={productImageUrl} alt="상품 이미지" className={styles.productImage} />
                    <div>
                        <div className={styles.productTitle}>{title}</div>
                        <div className={styles.productPrice}>{Number(price).toLocaleString()}원</div>
                    </div>
                </div>

                <div className={styles.row}>
                    <span>수량</span>
                    <div className={styles.qtyBox}>
                        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                        <span>{qty}</span>
                        <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
                    </div>
                </div>

                <div className={styles.row}>
                    <span>배송지</span>
                    <div className={styles.addressBox}>
                        {addressLoading ? (
                            <span>로딩 중...</span>
                        ) : selectedAddress ? (
                            <>
                                <div>{selectedAddress.locTitle}</div>
                                <div>{selectedAddress.locAddress} {selectedAddress.locDetail}</div>
                            </>
                        ) : (
                            <span>기본 배송지를 설정해 주세요.</span>
                        )}
                        <button type="button" className={styles.linkBtn} onClick={openAddressModal}>
                            배송지 변경
                        </button>
                    </div>
                </div>

                <div className={styles.row}>
                    <span>총 결제금액</span>
                    <strong className={styles.total}>{total.toLocaleString()}원</strong>
                </div>

                <div className={styles.buttonRow}>
                    <button className={styles.secondaryBtn} onClick={openPayWithPointModal}>
                        포인트로 결제
                    </button>
                    <button className={styles.primaryBtn} onClick={purchase}>
                        안심결제
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
