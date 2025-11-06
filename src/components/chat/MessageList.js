//MessageList.js
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import ScrollArea from "./ScrollArea";
import { fmtHHMM } from "@/lib/chat/chat-utils";
import s from "./MarketChat.module.css";
import ImageLightbox from "./ImageLightbox";

const safeSrc = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
};

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

    // 라이트박스
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxSrcs, setLightboxSrcs] = useState([]);

    useEffect(() => {
        const imgs = (messages || [])
            .filter((m) => safeSrc(m?.imageUrl))
            .map((m) => safeSrc(m.imageUrl));
        setLightboxSrcs(imgs);
    }, [messages]);

    const openLightbox = (src) => {
        const idx = lightboxSrcs.indexOf(src);
        setLightboxIndex(idx >= 0 ? idx : 0);
        setLightboxOpen(true);
    };
    const closeLightbox = () => setLightboxOpen(false);
    const showPrev = () => setLightboxIndex((p) => Math.max(0, p - 1));
    const showNext = () =>
        setLightboxIndex((p) => Math.min(lightboxSrcs.length - 1, p + 1));

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

    const avatar = safeSrc(otherAvatar) || "/images/profile_img/sangjun.jpg";

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
                        <div
                            key={safeKey(idx, m)}
                            className={`${s.msg} ${m.fromMe ? s.me : s.other}`}
                        >
                            {!m.fromMe && (
                                <div className={s.senderRow}>
                                    {/* avatar 가 없으면 렌더 자체를 생략 */}
                                    {avatar ? (
                                        <img className={s.avatar} src={avatar} alt="" />
                                    ) : null}
                                    <span className={s.senderName}>{otherName}</span>
                                </div>
                            )}

                            <div className={s.bubbleRow}>
                                {m.fromMe && m.read && (
                                    <span className={s.readInline}>읽음</span>
                                )}

                                {safeSrc(m.imageUrl) ? (
                                    <div
                                        className={s.imageBox}
                                        role="button"
                                        onClick={() => openLightbox(safeSrc(m.imageUrl))}
                                        title="이미지 크게 보기"
                                    >
                                        <img
                                            className={s.image}
                                            src={safeSrc(m.imageUrl)}
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
