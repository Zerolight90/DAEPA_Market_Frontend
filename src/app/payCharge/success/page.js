'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // ✅ useSearchParams 추가
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // ✅ 아이콘 추가
import Link from 'next/link'; // ✅ Link 추가

export default function PayChargeSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [chargedAmount, setChargedAmount] = useState(null);

    useEffect(() => {
        // URL의 'amount' 쿼리 파라미터 값을 읽어옵니다.
        const amountParam = searchParams.get('amount');
        if (amountParam) {
            const amountNum = parseInt(amountParam);
            if (!isNaN(amountNum)) {
                setChargedAmount(amountNum);
            }
        }
        // amount 파라미터가 없거나 잘못된 경우에 대한 처리 (선택 사항)
        // else {
        //     alert('잘못된 접근입니다.');
        //     router.push('/'); // 메인 페이지로 이동
        // }
    }, [searchParams, router]);

    return (
        <Box
            sx={{
                margin: '100px auto',
                padding: '40px', // 패딩 증가
                maxWidth: '450px', // 너비 약간 증가
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', // 가운데 정렬
                gap: '25px', // 요소 간 간격 증가
                textAlign: 'center', // 텍스트 가운데 정렬
            }}
        >
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} /> {/* 성공 아이콘 */}

            <Typography variant="h4" component="h1" gutterBottom>
                충전 완료! 🎉
            </Typography>

            {chargedAmount !== null ? (
                <Typography variant="h6" component="p">
                    <strong>{chargedAmount.toLocaleString()}원</strong>이 성공적으로 충전되었습니다.
                </Typography>
            ) : (
                <Typography variant="body1" color="textSecondary">
                    충전 금액 정보를 불러오는 중입니다...
                </Typography>
            )}

            <Box sx={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <Button variant="contained" color="primary" onClick={() => router.push('/')}>
                    메인으로 가기
                </Button>
                <Button variant="outlined" color="secondary" onClick={() => router.push('/payCharge')}> {/* 충전 페이지 경로 확인 */}
                    추가 충전하기
                </Button>
            </Box>
        </Box>
    );
}