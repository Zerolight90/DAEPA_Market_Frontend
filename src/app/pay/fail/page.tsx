'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Link from 'next/link';
import { CircularProgress } from "@mui/material";

function PayFailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [failInfo, setFailInfo] = useState({
        message: '결제 처리 중 오류가 발생했습니다.',
        orderId: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const messageParam = searchParams.get('message');
        const orderIdParam = searchParams.get('orderId');

        setFailInfo({
            message: messageParam || "알 수 없는 오류로 결제가 실패했습니다.",
            orderId: orderIdParam || "확인 불가"
        });

        setIsLoading(false);
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
                    <Typography>실패 정보 확인 중...</Typography>
                </>
            ) : (
                <>
                    <ErrorOutlineIcon color="error" sx={{ fontSize: 50 }} />
                    <Typography variant="h5" component="h1" gutterBottom>
                        결제 실패 😥
                    </Typography>
                    <Typography variant="body1" component="p" sx={{ color: 'red', fontWeight: 'bold' }}>
                        {failInfo.message}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        주문 번호: {failInfo.orderId}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        문제가 지속될 경우 고객센터로 문의해주세요.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                        <Button variant="contained" color="primary" onClick={() => router.push('/')}>
                            메인으로 가기
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={() => router.back()}>
                            이전 페이지로
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
}

export default function PayFailPage() {
    return (
        <Suspense fallback={
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress />
                <Typography sx={{ml: 2}}>페이지를 불러오는 중...</Typography>
            </Box>
        }>
            <PayFailContent />
        </Suspense>
    );
}
