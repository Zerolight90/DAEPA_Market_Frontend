'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CardMedia from '@mui/material/CardMedia';
import { CircularProgress } from "@mui/material";
import api from "@/lib/api"; // 전역 axios 인스턴스 사용

function PaySuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [paymentInfo, setPaymentInfo] = useState({
        amount: null,
        orderId: null,
        productName: '상품 정보 로딩 중...',
        imageUrl: '/placeholder-image.png',
        transactionDate: new Date(),
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');

        if (!paymentKey || !orderId || !amount) {
            setError("결제 정보가 올바르지 않습니다. (paymentKey, orderId, amount 확인 필요)");
            setIsLoading(false);
            return;
        }

        const confirmPayment = async () => {
            try {
                // 1. 백엔드에 결제 승인 요청을 보냅니다.
                await api.post('/pay/confirm', {
                    paymentKey,
                    orderId,
                    amount: parseInt(amount),
                });

                // 2. 결제 승인이 성공하면 상품 정보를 가져옵니다.
                const parts = orderId.split('-');
                const itemIdFromOrderId = (parts.length >= 2 && parts[0] === 'product') ? parts[1] : null;

                if (!itemIdFromOrderId) {
                    throw new Error("주문 ID 형식이 올바르지 않습니다.");
                }

                const { data: productData } = await api.get(`/products/${itemIdFromOrderId}`);

                setPaymentInfo({
                    amount: parseInt(amount),
                    orderId,
                    productName: productData.pdTitle || `상품 ${itemIdFromOrderId}`,
                    imageUrl: productData.pdThumb || '/default-product.jpg',
                    transactionDate: new Date(),
                });

            } catch (err) {
                console.error("결제 처리 또는 상품 정보 로딩 실패:", err);
                setError(err.response?.data?.message || err.message || "결제 처리 중 오류가 발생했습니다.");
                if (err.response?.status === 401) {
                }
            } finally {
                setIsLoading(false);
            }
        };

        confirmPayment();

    }, [searchParams]);

    return (
        <Box
            sx={{
                margin: '100px auto',
                padding: '40px',
                maxWidth: '500px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                textAlign: 'center',
            }}
        >
            {isLoading ? (
                <>
                    <CircularProgress />
                    <Typography>결제 정보 확인 및 처리 중...</Typography>
                </>
            ) : error ? (
                <>
                    <ErrorOutlineIcon color="error" sx={{ fontSize: 50 }} />
                    <Typography variant="h5" component="h1" gutterBottom>
                        결제 처리 실패
                    </Typography>
                    <Typography variant="body1" color="error">
                        {error}
                    </Typography>
                    <Button variant="outlined" onClick={() => router.push('/')} sx={{ mt: 2 }}>
                        메인으로 가기
                    </Button>
                </>
            ) : (
                <>
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 50 }} />
                    <Typography variant="h5" component="h1" gutterBottom>
                        결제 완료 🛍️
                    </Typography>
                    <CardMedia
                        component="img"
                        sx={{ width: 150, height: 150, objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }}
                        image={paymentInfo.imageUrl}
                        alt="상품 이미지"
                    />
                    <Typography variant="h6" component="p" sx={{ fontWeight: 'bold' }}>
                        {paymentInfo.productName}
                    </Typography>
                    <Typography variant="body1" component="p">
                        결제 금액: <strong>{(paymentInfo.amount ?? 0).toLocaleString()}원</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        거래 일시: {paymentInfo.transactionDate.toLocaleString('ko-KR')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                        <Button variant="contained" color="primary" onClick={() => router.push('/')}>
                            메인으로 가기
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={() => router.push('/mypage/buy')}>
                            구매 내역 보기
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
}

export default function PaySuccessPage() {
    return (
        <Suspense
            fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>페이지를 불러오는 중...</Typography>
                </Box>
            }
        >
            <PaySuccessContent />
        </Suspense>
    );
}
