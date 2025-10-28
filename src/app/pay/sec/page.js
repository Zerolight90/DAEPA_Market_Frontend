'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CardMedia from '@mui/material/CardMedia'; // ✅ 이미지 표시용
import Link from 'next/link';
import {CircularProgress} from "@mui/material";
import * as PropTypes from "prop-types";

function ErrorOutlineIcon(props) {
    return null;
}
ErrorOutlineIcon.propTypes = {
    color: PropTypes.string,
    sx: PropTypes.shape({fontSize: PropTypes.number})
};

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
    const [error, setError] = useState(null); // 에러 상태 추가

    useEffect(() => {
        const amountParam = searchParams.get('amount');
        const orderIdParam = searchParams.get('orderId');
        let itemIdFromOrderId = null;

        // --- 1. URL 파라미터 유효성 검사 ---
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

        // --- 2. 백엔드 API 호출하여 상품 정보 가져오기 ---
        const fetchProductDetails = async () => {
            try {
                // ✅ 백엔드의 상품 조회 API 호출 (경로 확인 필요)
                const productRes = await fetch(`http://localhost:8080/api/products/${itemIdFromOrderId}`);
                if (!productRes.ok) {
                    throw new Error('상품 정보를 불러오는 데 실패했습니다.');
                }
                const productData = await productRes.json(); // 예: { pdTitle: '상품명', pdThumb: '/image.jpg', ... }

                // ✅ 상태 업데이트 (URL 정보 + API 정보 + 실제 시간)
                setPaymentInfo({
                    amount: amountNum,
                    orderId: orderIdParam,
                    productName: productData.pdTitle || `상품 ${itemIdFromOrderId}`, // API 응답 사용
                    imageUrl: productData.pdThumb || '/default-product.jpg',      // API 응답 사용
                    transactionDate: new Date(), // 백엔드에서 실제 거래 시간을 주는 것이 더 정확
                });

            } catch (err) {
                console.error("상품 정보 로딩 실패:", err);
                setError(err.message);
                // API 호출 실패 시에도 기본 정보는 표시할 수 있도록 설정 (선택 사항)
                setPaymentInfo(prev => ({
                    ...prev,
                    amount: amountNum,
                    orderId: orderIdParam,
                    productName: `상품 ${itemIdFromOrderId || '정보'} (정보 로드 실패)`,
                    imageUrl: '/default-product.jpg',
                    transactionDate: new Date(),
                }));
            } finally {
                setIsLoading(false); // 모든 작업 완료 후 로딩 종료
            }
        };

        fetchProductDetails();

    }, [searchParams]); // searchParams만 의존성 배열에 포함

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
            {/* ✅ 로딩/에러 상태에 따른 UI 분기 */}
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
                // ✅ 성공 시 UI (기존 코드와 유사, paymentInfo 상태 사용)
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