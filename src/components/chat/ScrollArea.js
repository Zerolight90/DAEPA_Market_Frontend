// components/chat/ScrollArea.js
"use client";
import React from "react";
import { Box, styled } from "@mui/material";

const ScrollAreaBase = styled(Box)(({ theme }) => ({
    overflowY: "auto",
    overscrollBehavior: "contain",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.palette.divider} transparent`,
    "&::-webkit-scrollbar": { width: 8, height: 8 },
    "&::-webkit-scrollbar-thumb": { backgroundColor: theme.palette.divider, borderRadius: 8 },
    "&::-webkit-scrollbar-track": { background: "transparent" },
}));

// ✅ forwardRef로 외부에서 scrollTop/scrollHeight 제어 가능
const ScrollArea = React.forwardRef(function ScrollArea({ children, ...props }, ref) {
    return (
        <ScrollAreaBase ref={ref} {...props}>
            {children}
        </ScrollAreaBase>
    );
});

export default ScrollArea;
