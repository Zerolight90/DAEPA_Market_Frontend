"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import ScrollArea from "./ScrollArea";
import { fmtHHMM } from "@/lib/chat/chat-utils";
import s from "./MarketChat.module.css";
import ImageLightbox from "./ImageLightbox";

export default function MessageList({
                                        messages,
                                        otherName,
                                        otherAvatar,
                                        hasMoreBefore,
                                        loadingBefore,
                                        loadMoreBefore,
                                    }) {
    const scrollerRef = useRef(null);
    const wasAtBottomRef = useRef(true);
    const [tick, setTick] = useState(0);

    // 라이트박스 상태
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxSrcs, setLightboxSrcs] = useState([]);

    // 이미지 목록 추출 (메시지 배열로부터)
    useEffect(() => {
        const imgs = (messages || [])
            .filter((m) => m && m.imageUrl)
            .map((m) => m.imageUrl);
        setLightboxSrcs(imgs);
    }, [messages]);

    // 라이트박스 열기
    const openLightbox = (src) => {
        const idx = lightboxSrcs.indexOf(src);
        setLightboxIndex(idx >= 0 ? idx : 0);
        setLightboxOpen(true);
    };
    const closeLightbox = () => setLightboxOpen(false);

    // 🔒 경계 처리: 더 이상 못 가면 멈춤
    const showPrev = () => {
        setLightboxIndex((prev) => Math.max(0, prev - 1));
    };
    const showNext = () => {
        setLightboxIndex((prev) =>
            Math.min(lightboxSrcs.length - 1, prev + 1)
        );
    };

    // 스크롤 유틸
    const isNearBottom = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return true;
        const threshold = 40;
        return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    }, []);

    const scrollToBottom = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.scrollTop = el.scrollHeight;
            });
        });
    }, []);

    useEffect(() => {
        const atBottom = wasAtBottomRef.current;
        if (atBottom) scrollToBottom();
    }, [messages?.length, scrollToBottom, tick]);

    const onScroll = async () => {
        const el = scrollerRef.current;
        if (!el) return;
        const threshold = 60;
        if (el.scrollTop <= threshold && hasMoreBefore && !loadingBefore) {
            const prevHeight = el.scrollHeight;
            const prevTop = el.scrollTop;
            await loadMoreBefore();
            requestAnimationFrame(() => {
                const newHeight = el.scrollHeight;
                const delta = newHeight - prevHeight;
                el.scrollTop = prevTop + delta;
            });
        }
        wasAtBottomRef.current = isNearBottom();
    };

    const handleImageLoad = () => {
        if (isNearBottom()) {
            scrollToBottom();
            setTick((t) => t + 1);
        }
    };

    // 안전한 key 생성
    const safeKey = (idx, m) =>
        m?.key ??
        m?.id ??
        m?.messageId ??
        m?.tempId ??
        `${m?.type || "msg"}-${idx}-${m?.ts || m?.time || ""}`;

    return (
        <>
            <ScrollArea ref={scrollerRef} className={s.messages} onScroll={onScroll}>
                {loadingBefore && <div className={s.topLoader}>불러오는 중…</div>}

                {(messages || []).map((m, idx) =>
                    m?.__divider ? (
                        <div key={m.key ?? safeKey(idx, m)} className={s.dateDivider}>
                            {m.label}
                        </div>
                    ) : m?.type === "SYSTEM" ? (
                        <div key={safeKey(idx, m)} className={s.systemNotice}>
                            <span className={s.systemBadge}>SYSTEM</span>
                            <p className={s.systemText}>{m.text}</p>
                        </div>
                    ) : (
                        <div key={safeKey(idx, m)} className={`${s.msg} ${m.fromMe ? s.me : s.other}`}>
                            {!m.fromMe && (
                                <div className={s.senderRow}>
                                    <img className={s.avatar} src={otherAvatar} alt="" />
                                    <span className={s.senderName}>{otherName}</span>
                                </div>
                            )}

                            <div className={s.bubbleRow}>
                                {m.fromMe && m.read && <span className={s.readInline}>읽음</span>}

                                {m.imageUrl ? (
                                    // ✅ 이미지 동일 사이즈 박스
                                    <div
                                        className={s.imageBox}
                                        role="button"
                                        onClick={() => openLightbox(m.imageUrl)}
                                        title="이미지 크게 보기"
                                    >
                                        <img
                                            className={s.image}
                                            src={m.imageUrl}
                                            alt=""
                                            onLoad={handleImageLoad}
                                            onError={handleImageLoad}
                                            draggable={false}
                                        />
                                    </div>
                                ) : (
                                    <p className={s.bubble}>{m.text}</p>
                                )}

                                <span className={s.timeSmall}>{fmtHHMM(m.ts)}</span>
                            </div>
                        </div>
                    )
                )}
            </ScrollArea>

            {/* 라이트박스 */}
            <ImageLightbox
                open={lightboxOpen}
                images={lightboxSrcs}
                currentIndex={lightboxIndex}
                onClose={closeLightbox}
                onPrev={showPrev}
                onNext={showNext}
            />
        </>
    );
}
