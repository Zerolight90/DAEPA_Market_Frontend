// components/chat/MessageList.js
"use client";
import { useEffect, useRef } from "react";
import ScrollArea from "./ScrollArea";
import { fmtHHMM } from "@/lib/chat/chat-utils";
import s from "./MarketChat.module.css";

export default function MessageList({
                                        messages,
                                        otherName,
                                        otherAvatar,
                                        hasMoreBefore,
                                        loadingBefore,
                                        loadMoreBefore,
                                    }) {
    const scrollerRef = useRef(null);

    // 하단 고정 (새 메시지 도착/전송 시)
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [messages?.length]);

    // ✅ 맨 위 근처에서 이전 로드 + 스크롤 위치 보정
    const onScroll = async () => {
        const el = scrollerRef.current;
        if (!el) return;
        const threshold = 60; // px
        if (el.scrollTop <= threshold && hasMoreBefore && !loadingBefore) {
            const prevHeight = el.scrollHeight;
            const prevTop = el.scrollTop;
            await loadMoreBefore(); // 상단 prepend
            // 다음 프레임에 보정
            requestAnimationFrame(() => {
                const newHeight = el.scrollHeight;
                const delta = newHeight - prevHeight;
                el.scrollTop = prevTop + delta; // 동일한 메시지 위치 유지
            });
        }
    };

    return (
        <ScrollArea ref={scrollerRef} className={s.messages} onScroll={onScroll}>
            {loadingBefore && (
                <div className={s.topLoader}>불러오는 중…</div>
            )}

            {messages.map((m) =>
                m.__divider ? (
                    <div key={m.key} className={s.dateDivider}>
                        {m.label}
                    </div>
                ) : m.type === "SYSTEM" ? (
                    <div key={m.id} className={s.systemNotice}>
                        <span className={s.systemBadge}>SYSTEM</span>
                        <p className={s.systemText}>{m.text}</p>
                    </div>
                ) : (
                    <div key={m.id} className={`${s.msg} ${m.fromMe ? s.me : s.other}`}>
                        {!m.fromMe && (
                            <div className={s.senderRow}>
                                <img className={s.avatar} src={otherAvatar} alt="" />
                                <span className={s.senderName}>{otherName}</span>
                            </div>
                        )}

                        {/* ✅ 말풍선 줄: (내 메시지일 때) [읽음]이 왼쪽에 붙고, 시간은 오른쪽에 배치 */}
                        <div className={s.bubbleRow}>
                            {m.fromMe && m.read && (
                                <span className={s.readInline}>읽음</span>
                            )}

                            {m.imageUrl ? (
                                <img className={s.image} src={m.imageUrl} alt="" />
                            ) : (
                                <p className={s.bubble}>{m.text}</p>
                            )}

                            <span className={s.timeSmall}>{fmtHHMM(m.ts)}</span>
                        </div>
                    </div>
                )
            )}
        </ScrollArea>
    );
}
