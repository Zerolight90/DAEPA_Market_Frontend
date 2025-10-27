'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CardMedia from '@mui/material/CardMedia'; // ✅ 이미지 표시용
import Link from 'next/link';

export default function PaySuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [paymentInfo, setPaymentInfo] = useState({
        amount: null,
        orderId: null,
        productName: '상품 정보 로딩 중...', // 임시 상품명
        imageUrl: '/placeholder-image.png', // 임시 이미지 경로
        transactionDate: new Date(), // 현재 시간으로 초기화
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const amountParam = searchParams.get('amount');
        const orderIdParam = searchParams.get('orderId');
        let itemIdFromOrderId = null; // ✅ itemId 저장 변수

        if (amountParam && orderIdParam) {
            const amountNum = parseInt(amountParam);
            if (!isNaN(amountNum)) {
                // TODO: 실제로는 orderIdParam을 사용해 백엔드 API로
                // 상품명(productName)과 이미지 URL(imageUrl)을 조회해야 합니다.
                // 지금은 임시 데이터를 사용합니다.
                setPaymentInfo({
                    amount: amountNum,
                    orderId: orderIdParam,
                    productName: `상품 ${orderIdParam.split('-')[1] || '정보'}`, // orderId에서 상품 ID 추출 (임시)
                    imageUrl: '/default-product.jpg', // 실제 이미지 경로로 대체 필요
                    transactionDate: new Date(), // 실제 거래 시간은 백엔드에서 받아오는 것이 더 정확
                });
            } else {
                // 금액 정보 오류 처리
                console.error("Invalid amount parameter");
            }
        } else {
            // 필수 정보 누락 처리
            console.error("Missing payment parameters");
            // alert('잘못된 접근입니다.');
            // router.push('/');
        }
        setIsLoading(false); // 로딩 완료 (API 호출 시에는 try/finally 안에)

    }, [searchParams, router]);

    return (
        <Box
            sx={{
                margin: '100px auto',
                padding: '40px',
                maxWidth: '500px', // 너비 조정
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px', // 간격 조정
                textAlign: 'center',
            }}
        >
            {isLoading ? (
                <Typography>결제 정보 확인 중...</Typography>
            ) : (
                <>
                    <CheckCircleOutlineIcon color="success" sx={{ fontSize: 50 }} />

                    <Typography variant="h5" component="h1" gutterBottom>
                        결제 완료 🛍️
                    </Typography>

                    {/* 상품 이미지 (임시) */}
                    <CardMedia
                        component="img"
                        sx={{ width: 150, height: 150, objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }}
                        image={paymentInfo.imageUrl}
                        alt="상품 이미지"
                    />

                    {/* 상품명 */}
                    <Typography variant="h6" component="p" sx={{ fontWeight: 'bold' }}>
                        {paymentInfo.productName}
                    </Typography>

                    {/* 거래 가격 */}
                    <Typography variant="body1" component="p">
                        결제 금액: <strong>{(paymentInfo.amount ?? 0).toLocaleString()}원</strong>
                    </Typography>

                    {/* 거래 일시 */}
                    <Typography variant="body2" color="textSecondary">
                        거래 일시: {paymentInfo.transactionDate.toLocaleString('ko-KR')}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                        <Button variant="contained" color="primary" onClick={() => router.push('/')}>
                            메인으로 가기
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={() => router.push('/mypage/buy')}> {/* 구매내역 페이지 경로 */}
                            구매 내역 보기
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
}