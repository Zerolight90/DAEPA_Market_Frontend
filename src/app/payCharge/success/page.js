'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Link from 'next/link';
import { CircularProgress } from "@mui/material";

function PayChargeSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [chargedAmount, setChargedAmount] = useState(null);

    useEffect(() => {
        const amountParam = searchParams.get('amount');
        if (amountParam) {
            const amountNum = parseInt(amountParam);
            if (!isNaN(amountNum)) {
                setChargedAmount(amountNum);
            }
        }
    }, [searchParams, router]);

    return (
        <Box
            sx={{
                margin: '100px auto',
                padding: '40px',
                maxWidth: '450px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '25px',
                textAlign: 'center',
            }}
        >
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />

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
                <Button variant="outlined" color="secondary" onClick={() => router.push('/payCharge')}>
                    추가 충전하기
                </Button>
            </Box>
        </Box>
    );
}

export default function PayChargeSuccessPage() {
    return (
        <Suspense fallback={
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress />
                <Typography sx={{ml: 2}}>페이지를 불러오는 중...</Typography>
            </Box>
        }>
            <PayChargeSuccessContent />
        </Suspense>
    );
}