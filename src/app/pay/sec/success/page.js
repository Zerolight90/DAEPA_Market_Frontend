'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CardMedia from '@mui/material/CardMedia';
import Link from 'next/link';
import { CircularProgress } from "@mui/material";
import * as PropTypes from "prop-types";
import api from "@/lib/api"; // 전역 axios 인스턴스 사용

function ErrorOutlineIcon(props) {
    return null;
}
ErrorOutlineIcon.propTypes = {
    color: PropTypes.string,
    sx: PropTypes.shape({ fontSize: PropTypes.number })
};

function SecPaySuccessContent() {
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
    const [error, setError] = useState(null);

    useEffect(() => {
        const amountParam = searchParams.get('amount');
        const orderIdParam = searchParams.get('orderId');
        let itemIdFromOrderId = null;

        if (orderIdParam) {
            const parts = orderIdParam.split('-');
            if (parts.length >= 2 && parts[0] === 'product') {
                itemIdFromOrderId = parts[1];
            }
        }

        if (!amountParam || !orderIdParam || !itemIdFromOrderId) {
            setError("잘못된 결제 정보입니다.");
            setIsLoading(false);
            return;
        }

        const amountNum = parseInt(amountParam);
        if (isNaN(amountNum)) {
            setError("금액 정보가 올바르지 않습니다.");
            setIsLoading(false);
            return;
        }

        const fetchProductDetails = async () => {
            try {
                const { data: productData } = await api.get(`/products/${itemIdFromOrderId}`);

                setPaymentInfo({
                    amount: amountNum,
                    orderId: orderIdParam,
                    productName: productData.pdTitle || `상품 ${itemIdFromOrderId}`,
                    imageUrl: productData.pdThumb || '/default-product.jpg',
                    transactionDate: new Date(),
                });

            } catch (err) {
                console.error("상품 정보 로딩 실패:", err);
                setError(err.response?.data?.message || err.message);
                setPaymentInfo(prev => ({
                    ...prev,
                    amount: amountNum,
                    orderId: orderIdParam,
                    productName: `상품 ${itemIdFromOrderId || '정보'} (정보 로드 실패)`,
                    imageUrl: '/default-product.jpg',
                    transactionDate: new Date(),
                }));
                if (err.response?.status === 401) {
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductDetails();

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
                    <Typography>결제 정보 확인 중...</Typography>
                </>
            ) : error ? (
                <>
                    <ErrorOutlineIcon color="error" sx={{ fontSize: 50 }} />
                    <Typography variant="h5" component="h1" gutterBottom>
                        오류 발생
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
        <Suspense fallback={
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress />
                <Typography sx={{ml: 2}}>페이지를 불러오는 중...</Typography>
            </Box>
        }>
            <SecPaySuccessContent/>
        </Suspense>
    );
}