"use client";

import { useState, useEffect } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";
import { useModal } from "@/components/ui/modal/ModalProvider";
import PayWithPointModal from "./PayWithPointModal";
import { loadTossPayments } from '@tosspayments/payment-sdk';
import AddressChangeModal from "@/components/product/modals/AddressChangeModal";
import { api } from "@/lib/api/client";

// ─── 공통 인라인 스타일 (PayWithPointModal과 동일하게 통일) ───
const primaryBtn = {
    width: "100%",
    padding: "12px 14px",
    background: "#008c6e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 10,
};
const secondaryBtn = {
    width: "100%",
    padding: "12px 14px",
    background: "#1aab8a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 10,
};
const ghostBtn = {
    width: "100%",
    padding: "11px 14px",
    background: "#fff",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
};
const qtyBtn = {
    width: 32,
    height: 32,
    border: "1px solid #ddd",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
};

export default function BuyModal({ id, close, itemId, title, price }) {
    const [qty, setQty] = useState(1);
    const total = (Number(price) || 0) * qty;
    const modal = useModal();

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [addressLoading, setAddressLoading] = useState(true);
    const [productImageUrl, setProductImageUrl] = useState('/images/placeholder.jpg');

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 상품 이미지 조회
    useEffect(() => {
        if (!itemId) return;
        (async () => {
            try {
                const res = await api.get(`/products/${itemId}`);
                const thumb = res.data?.pdThumb ?? res.data?.thumbnail ?? null;
                if (thumb) setProductImageUrl(thumb);
            } catch (e) {
                console.error("상품 이미지를 불러오는 데 실패했습니다.", e);
            }
        })();
    }, [itemId]);

    // 기본 배송지 조회
    useEffect(() => {
        (async () => {
            setAddressLoading(true);
            try {
                const res = await api.get(`/sign/locations/default`);
                setSelectedAddress(res.data);
            } catch (e) {
                setSelectedAddress(null);
            } finally {
                setAddressLoading(false);
            }
        })();
    }, []);

    const purchase = async () => {
        if (!selectedAddress?.locKey) {
            alert("배송지를 선택해 주세요.");
            return;
        }
        const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
        const orderId = `product-${itemId}-${generateUUID()}`;

        tossPayments.requestPayment('카드', {
            amount: total,
            orderId,
            orderName: title || '상품 구매',
            customerName: "id",
        }).then(({ paymentKey, amount }) => {
            window.location.href =
                `${window.location.origin}/pay/success?paymentKey=${paymentKey}&orderId=${orderId}&amount=${amount}`;
        }).catch((error) => {
            if (error.code !== 'USER_CANCEL') {
                window.location.href =
                    `${window.location.origin}/pay/fail?message=${error.message}`;
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
                total={total}
                productImageUrl={productImageUrl}
                selectedAddress={selectedAddress}
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
        <BaseModal id={id} close={close} title="구매하기">
            {/* 상품 이미지 + 제목 */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <img
                    src={productImageUrl}
                    alt="상품 이미지"
                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                />
                <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                        {Number(price).toLocaleString()}원
                    </div>
                </div>
            </div>

            {/* 수량 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: "#555", fontWeight: 600 }}>수량</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} style={qtyBtn}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>{qty}</span>
                    <button type="button" onClick={() => setQty(q => q + 1)} style={qtyBtn}>+</button>
                </div>
            </div>

            {/* 배송지 */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: "#555", fontWeight: 600 }}>배송지</span>
                    <button
                        type="button"
                        onClick={openAddressModal}
                        style={{
                            background: "none", border: "1px solid #ccc",
                            borderRadius: 6, padding: "4px 10px",
                            fontSize: 12, color: "#555", cursor: "pointer",
                        }}
                    >
                        변경
                    </button>
                </div>
                <div style={{ background: "#f5f5f5", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#444" }}>
                    {addressLoading ? (
                        <span>로딩 중...</span>
                    ) : selectedAddress ? (
                        <>
                            <div style={{ fontWeight: 600 }}>{selectedAddress.locTitle}</div>
                            <div style={{ marginTop: 4, color: "#666" }}>
                                {selectedAddress.locAddress} {selectedAddress.locDetail}
                            </div>
                        </>
                    ) : (
                        <span style={{ color: "#888" }}>기본 배송지를 설정해 주세요.</span>
                    )}
                </div>
            </div>

            {/* 결제금액 */}
            <div style={{ fontSize: 14, color: "#555", fontWeight: 700, marginBottom: 8 }}>
                결제금액: {Number(price).toLocaleString()}원 × {qty}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#008c6e", marginBottom: 20 }}>
                총 결제금액: {total.toLocaleString()}원
            </div>

            {/* 버튼 */}
            <div>
                <button onClick={purchase} style={primaryBtn}>일반결제</button>
                <button onClick={openPayWithPointModal} style={secondaryBtn}>포인트로 결제</button>
                <button onClick={close} style={ghostBtn}>취소</button>
            </div>
        </BaseModal>
    );
}
