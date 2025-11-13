"use client";

import { useState, useEffect } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import styles from "./payCharge.module.css";
import { api, getApiBaseUrl } from "@/lib/api/client";

const PACKAGES = [
    { id: 1, amount: 100, price: 100 },
    { id: 2, amount: 1000, price: 1000 },
    { id: 3, amount: 10000, price: 10000 },
    { id: 4, amount: 50000, price: 50000 },
];

export default function DaepaChargePage() {
    // 실제로는 백엔드에서 가져오면 됨
    const [myDaepa, setMyDaepa] = useState(0);
    const [isLoading, setIsLoading] = useState(true); // ✅ 잔액 로딩 상태
    const [error, setError] = useState(null); // ✅ 에러 상태

    const [activeTab, setActiveTab] = useState("charge");
    const [amount, setAmount] = useState("");

    function generateUUID() {
           return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                 var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                 return v.toString(16);
               });
         }

    // ✅ 페이지가 로드될 때 잔액을 가져오는 로직
    useEffect(() => {
        const fetchBalance = async () => {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setError("로그인이 필요합니다.");
                setIsLoading(false);
                return;
                }

            try {
                const data = await api("/pay/balance", {
                    headers: {
                    'Authorization': `Bearer ${token}`,
                    },
                });
                setMyDaepa(data.balance);

                } catch (err) {
                     console.error("잔액 조회 실패:", err);
                     setError(err.message);
                     } finally {
                        setIsLoading(false);
                     }
                 };

                 fetchBalance();
             }, []); // 빈 배열을 전달하여 컴포넌트가 처음 마운트될 때 한 번만 실행

    // 공통 결제 함수
    const requestTossPay = async (chargeAmount) => {
        if (!chargeAmount || chargeAmount <= 0) {
            alert("충전 금액이 올바르지 않습니다.");
            return;
        }

        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
        if (!clientKey) {
            alert("Toss client key가 설정되어 있지 않습니다.");
            return;
        }

        const tossPayments = await loadTossPayments(clientKey);
        const successUrl = new URL("/api/charge/success", getApiBaseUrl()).toString();

        try {
            await tossPayments.requestPayment("카드", {
                amount: chargeAmount,
                orderId: `charge-${generateUUID()}`,
                orderName: `대파 ${chargeAmount.toLocaleString()}원 충전`,
                customerName: "대파", // TODO: 실제 로그인 유저 이름으로 교체
                successUrl: successUrl,
                failUrl: `${window.location.origin}/pay/fail`,
            });
        } catch (error) {
            console.error("결제 요청 실패:", error);
            if (error.code !== "USER_CANCEL") {
                alert(`결제 요청 중 오류가 발생했습니다: ${error.message}`);
            }
        }
    };

    // 패키지 버튼 눌렀을 때
    const handlePackageClick = (pkg) => {
        requestTossPay(pkg.price);
    };

    // 직접입력 금액 입력
    const handleAmountChange = (e) => {
        const onlyNum = e.target.value.replace(/[^0-9]/g, "");
        if (!onlyNum) {
            setAmount("");
            return;
        }
        const num = parseInt(onlyNum, 10);
        setAmount(num.toLocaleString());
    };

    // 직접입력 결제
    const handleCustomCharge = () => {
        const chargeAmount = parseInt(amount.replace(/,/g, ""), 10);
        if (isNaN(chargeAmount) || chargeAmount <= 0) {
            alert("올바른 금액을 입력해주세요.");
            return;
        }
        if (chargeAmount > 1_000_000) {
            alert("최대 1,000,000원까지 충전할 수 있습니다.");
            return;
        }
        requestTossPay(chargeAmount);
    };

    return (
        <main className={styles.wrap}>
            {/* 보유 대파 */}
            <section className={styles.balanceBox}>
                <div className={styles.balanceLeft}>
                    <span className={styles.balanceLabel}>보유 중인 대파</span>
                    <strong className={styles.balanceValue}>{myDaepa.toLocaleString()}개</strong>
                </div>
                <p className={styles.balanceHint}>
                    대파를 충전해서 거래 시 편하게 사용하세요.
                </p>
            </section>

            {/* 탭 */}
            <div className={styles.tabs}>
                <button
                    type="button"
                    onClick={() => setActiveTab("charge")}
                    className={`${styles.tabBtn} ${
                        activeTab === "charge" ? styles.tabActive : ""
                    }`}
                >
                    대파충전
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("about")}
                    className={`${styles.tabBtn} ${
                        activeTab === "about" ? styles.tabActive : ""
                    }`}
                >
                    대파란?
                </button>
            </div>

            {activeTab === "charge" ? (
                <>
                    {/* 패키지 목록 */}
                    <section className={styles.panel}>
                        <h2 className={styles.sectionTitle}>대파 패키지</h2>
                        <ul className={styles.packageList}>
                            {PACKAGES.map((pkg) => (
                                <li key={pkg.id} className={styles.packageItem}>
                                    <div className={styles.packageLeft}>
                                        <span className={styles.packageIcon}>💰</span>
                                        <div>
                                            <strong className={styles.packageName}>
                                                대파 {pkg.amount.toLocaleString()}개
                                            </strong>
                                            <p className={styles.packageDesc}>
                                                구매 후 즉시 사용 가능합니다.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.buyBtn}
                                        onClick={() => handlePackageClick(pkg)}
                                    >
                                        {pkg.price.toLocaleString()}원
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* 직접 입력 충전 */}
                    <section className={styles.customChargeBox}>
                        <h3 className={styles.customTitle}>직접 금액 입력해서 충전</h3>
                        <div className={styles.customRow}>
                            <div className={styles.inputWrap}>
                                <span className={styles.inputPrefix}>₩</span>
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="예: 5000"
                                    className={styles.input}
                                    inputMode="numeric"
                                />
                            </div>
                            <button
                                type="button"
                                className={styles.chargeBtn}
                                onClick={handleCustomCharge}
                                disabled={!amount}
                            >
                                충전하기
                            </button>
                        </div>
                        <p className={styles.helper}>
                            최대 1,000,000원까지 충전할 수 있습니다.
                        </p>
                    </section>
                </>
            ) : (
                <section className={styles.panel}>
                    <h2 className={styles.sectionTitle}>대파란?</h2>
                    <p className={styles.desc}>
                        대파는 이 서비스에서 결제/충전 시 사용하는 포인트(캐시) 개념이에요.
                        판매 등록 시 옵션을 열거나, 유료 서비스가 붙을 때 대파를 사용하게
                        됩니다.
                    </p>
                    <ul className={styles.guideList}>
                        <li>충전한 대파는 계정에 즉시 반영됩니다.</li>
                        <li>사용처에 따라 차감 수량이 다를 수 있습니다.</li>
                        <li>이벤트로 받은 대파는 일부 서비스에서만 사용될 수 있습니다.</li>
                    </ul>
                </section>
            )}
        </main>
    );
}
