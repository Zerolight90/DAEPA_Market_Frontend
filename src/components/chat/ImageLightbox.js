// components/chat/ImageLightbox.js
"use client";
import { Dialog, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useEffect, useMemo } from "react";

export default function ImageLightbox({
                                          open,
                                          images = [],
                                          currentIndex = 0,
                                          onClose,
                                          onPrev,
                                          onNext,
                                      }) {
    // 안전한 인덱스(끝에서 더 못 가게 클램프)
    const safeIndex = useMemo(() => {
        if (!Array.isArray(images) || images.length === 0) return 0;
        return Math.min(Math.max(currentIndex, 0), images.length - 1);
    }, [images, currentIndex]);

    const src = images[safeIndex] || "";
    const canPrev = safeIndex > 0;
    const canNext = safeIndex < images.length - 1;

    // ← → ESC 키 지원 (끝에서는 더 안움직임)
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === "ArrowLeft" && canPrev) onPrev?.();
            if (e.key === "ArrowRight" && canNext) onNext?.();
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, canPrev, canNext, onPrev, onNext, onClose]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    bgcolor: "rgba(0,0,0,0.85)",
                    boxShadow: "none",
                    overflow: "hidden",
                },
            }}
        >
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "80vw",
                    minHeight: "80vh",
                }}
            >
                {/* 닫기 */}
                <IconButton
                    aria-label="닫기"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        color: "white",
                        background: "rgba(0,0,0,0.25)",
                        "&:hover": { background: "rgba(0,0,0,0.4)" },
                        zIndex: 5,
                    }}
                >
                    <CloseIcon />
                </IconButton>

                {/* 이전 */}
                {images.length > 1 && (
                    <IconButton
                        aria-label="이전"
                        onClick={() => canPrev && onPrev?.()}
                        disabled={!canPrev}
                        sx={{
                            position: "absolute",
                            left: 16,
                            color: "white",
                            background: "rgba(0,0,0,0.25)",
                            "&:hover": { background: "rgba(0,0,0,0.4)" },
                            opacity: canPrev ? 1 : 0.35,
                            zIndex: 5,
                        }}
                    >
                        <ArrowBackIosNewIcon />
                    </IconButton>
                )}

                {/* 다음 */}
                {images.length > 1 && (
                    <IconButton
                        aria-label="다음"
                        onClick={() => canNext && onNext?.()}
                        disabled={!canNext}
                        sx={{
                            position: "absolute",
                            right: 16,
                            color: "white",
                            background: "rgba(0,0,0,0.25)",
                            "&:hover": { background: "rgba(0,0,0,0.4)" },
                            opacity: canNext ? 1 : 0.35,
                            zIndex: 5,
                        }}
                    >
                        <ArrowForwardIosIcon />
                    </IconButton>
                )}

                {/* 이미지 */}
                <img
                    src={src}
                    alt=""
                    style={{
                        maxWidth: "90vw",
                        maxHeight: "90vh",
                        objectFit: "contain",
                        borderRadius: "6px",
                        display: "block",
                        userSelect: "none",
                    }}
                    draggable={false}
                />
            </div>
        </Dialog>
    );
}
