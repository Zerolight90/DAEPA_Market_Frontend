// /app/chat/page.js
import { Suspense } from 'react';
import MarketChat from "@/components/chat/MarketChat";
import { CircularProgress, Box, Typography } from "@mui/material";

export default function Page() {
    return (
        <Suspense fallback={
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress />
                <Typography sx={{ml: 2}}>채팅을 불러오는 중...</Typography>
            </Box>
        }>
            <MarketChat />
        </Suspense>
    );
}
