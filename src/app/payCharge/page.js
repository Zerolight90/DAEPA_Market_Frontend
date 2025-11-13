// 'use client'
//
// import { useState } from 'react'; // ✅ useState 추가
// import { loadTossPayments } from '@tosspayments/payment-sdk';
// import { v4 as uuidv4 } from 'uuid';
// import Box from '@mui/material/Box'; // Material UI (MUI) 컴포넌트 추가
// import TextField from '@mui/material/TextField';
// import Button from '@mui/material/Button';
// import Typography from '@mui/material/Typography';
// import InputAdornment from '@mui/material/InputAdornment';
//
// export default function ChargeComponent() {
//   // 충전 금액을 관리할 상태 추가
//   const [amount, setAmount] = useState('');
//
//   const handleCharge = async () => {
//     // 입력된 금액 유효성 검사 (콤마 제거 후 숫자로 변환)
//     const chargeAmount = parseInt(amount.replace(/,/g, ''));
//     if (isNaN(chargeAmount) || chargeAmount <= 0) {
//       alert('올바른 충전 금액을 입력해주세요.');
//       return;
//     }
//     if (chargeAmount > 1000000) { // 충전 금액 상한 제한
//       alert('최대 충전 가능 금액은 1,000,000원입니다.');
//       return;
//     }
//
//     // .env 파일에서 토스 클라이언트 키 받아오기
//     const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
//
//     // 결제/주문 토스페이먼츠 API 호출
//     tossPayments.requestPayment('카드', {
//       // 상태에서 금액 가져오기
//       amount: chargeAmount,
//       orderId: `charge-${uuidv4()}`,
//       // 주문명 동적 생성
//       orderName: `대파 페이 ${chargeAmount.toLocaleString()}원 충전`,
//       customerName: '대파', // 실제 유저 이름으로 변경 필요
//       successUrl: `http://localhost:8080/api/charge/success`,
//       failUrl: `${window.location.origin}/pay/fail`,
//     }).catch(error => {
//       // 결제창 호출 실패 또는 사용자 취소 시 에러 처리
//       console.error("결제 요청 실패:", error);
//       if (error.code !== 'USER_CANCEL') {
//         alert(`결제 요청 중 오류가 발생했습니다: ${error.message}`);
//       }
//     });
//   };
//
//   // 금액 입력 시 숫자 및 콤마 처리
//   const handleAmountChange = (event) => {
//     const value = event.target.value.replace(/[^0-9]/g, ''); // 숫자 외 입력 제거
//     if (value === '') {
//       setAmount('');
//       return;
//     }
//     const numValue = parseInt(value, 10);
//     if (!isNaN(numValue)) {
//       setAmount(numValue.toLocaleString()); // 콤마 추가
//     }
//   };
//
//   return (
//       // Material UI Box로 감싸고 스타일 추가
//       <Box
//           sx={{
//             margin: '100px auto', // 상하 100px, 좌우 자동 (가운데 정렬)
//             padding: '30px',
//             maxWidth: '400px', // 최대 너비 지정
//             border: '1px solid #e0e0e0',
//             borderRadius: '8px',
//             boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '20px', // 요소 간 간격
//           }}
//       >
//         <Typography variant="h5" component="h3" gutterBottom>
//           대파 페이 충전 💰
//         </Typography>
//
//         {/* ✅ Material UI TextField 사용 */}
//         <TextField
//             label="충전할 금액"
//             variant="outlined"
//             fullWidth // 너비 100%
//             value={amount}
//             onChange={handleAmountChange}
//             placeholder="금액 입력"
//             InputProps={{
//               startAdornment: <InputAdornment position="start">₩</InputAdornment>,
//               inputMode: 'numeric', // 모바일에서 숫자 키패드 표시
//             }}
//             helperText="충전할 금액을 숫자로 입력해주세요."
//         />
//
//         {/* ✅ Material UI Button 사용 */}
//         <Button
//             variant="contained"
//             color="primary"
//             size="large"
//             onClick={handleCharge}
//             // ✅ 금액이 입력되지 않으면 버튼 비활성화
//             disabled={!amount || parseInt(amount.replace(/,/g, '')) <= 0}
//         >
//           충전하기
//         </Button>
//       </Box>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { v4 as uuidv4 } from "uuid";
import styles from "./payCharge.module.css";

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

    // ✅ 페이지가 로드될 때 잔액을 가져오는 로직
    useEffect(() => {
        const fetchBalance = async () => {
            // ❗️ 실제 프로젝트에서는 토큰을 저장소(예: 쿠키, 로컬 스토리지)에서 가져와야 합니다.
            // 아래는 예시이며, 프로젝트의 인증 방식에 맞게 수정이 필요합니다.
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setError("로그인이 필요합니다.");
                setIsLoading(false);
                return;
                }

            try {
                const response = await fetch('http://localhost:8080/api/pay/balance', {
                    headers: {
                    'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '잔액을 불러오는 데 실패했습니다.');
                    }

                const data = await response.json();
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

        try {
            await tossPayments.requestPayment("카드", {
                amount: chargeAmount,
                orderId: `charge-${uuidv4()}`,
                orderName: `대파 ${chargeAmount.toLocaleString()}원 충전`,
                customerName: "대파", // TODO: 실제 로그인 유저 이름으로 교체
                successUrl: `http://localhost:8080/api/charge/success`,
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
