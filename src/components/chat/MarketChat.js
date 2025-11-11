// MarketChat.js
"use client";
import s from "./MarketChat.module.css";
import RoomList from "./RoomList";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import { formatKRW, resolveRole } from "@/lib/chat/chat-utils";
import { useMe, useChatRooms } from "@/lib/chat/useChatRooms";
import { useChatMessages } from "@/lib/chat/useChatMessages";
import { useCallback, useEffect, useState } from "react";
import { leaveRoomRest } from "@/lib/chat/api";
import ExitToApp from '@mui/icons-material/ExitToApp';

// 빈 문자열을 null 로 바꿔 <img>에 비지 않도록
const safeSrc = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
};

/**
 * 채팅 페이지의 메인 컴포넌트.
 * 여러 훅을 조합하여 채팅 시스템의 전체 UI와 로직을 구성합니다.
 */
export default function MarketChat() {
    // --- 훅 호출 순서 바로잡기 ---

    // 1. 현재 사용자 정보 로드
    const { me, loading: meLoading } = useMe();

    // 2. 채팅방 목록 관리 (웹소켓 의존성 없음)
    const { 
        rooms, setRooms, activeId, setActiveId, activeChat, 
        loading: roomsLoading, error: roomsError 
    } = useChatRooms(me);

    // 3. 메시지 및 웹소켓 관리 (`activeId`와 `me`가 필요하므로 `useChatRooms` 이후에 호출)
    const { 
        messages, sendMessage, loadMoreBefore, loadingBefore, hasMoreBefore,
        connected, error: messagesError, sendLeave, setOnBadge 
    } = useChatMessages(activeId, me, activeChat);

    // 4. 에러 상태 통합
    const [error, setError] = useState(null);
    useEffect(() => {
        const newError = roomsError || messagesError;
        if (newError) setError(newError);
    }, [roomsError, messagesError]);

    // --- 로직 재구성 ---

    /**
     * 방 나가기 처리 함수
     * 컴포넌트 레벨에서 `useChatRooms`와 `useChatMessages`의 상태/함수를 모두 사용
     */
    const leaveActiveRoom = useCallback(async () => {
        if (!activeId || !me?.id) return;

        const roomIdToLeave = activeId;

        // [1] UI 낙관적 업데이트
        const remainingRooms = rooms.filter((r) => String(r.roomId) !== String(roomIdToLeave));
        const nextActiveId = remainingRooms[0]?.roomId ?? null;
        setRooms(remainingRooms);
        setActiveId(nextActiveId);

        // [2] 서버에 방 나가기 요청
        try {
            if (connected && typeof sendLeave === "function") {
                sendLeave();
            } else {
                await leaveRoomRest(roomIdToLeave, me.id);
            }
        } catch (e) {
            console.error("방 나가기 처리에 실패했습니다.", e);
            setError("방을 나가는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            // TODO: 실패 시 UI 롤백 (목록 원상복구)
        }
    }, [activeId, me?.id, rooms, setRooms, setActiveId, connected, sendLeave]);


    // --- UI 렌더링 ---

    const priceText = activeChat ? formatKRW(activeChat.productPrice) : null;
    const headerThumb = safeSrc(activeChat?.productThumb) || "/images/placeholder.jpg";
    const myRole = resolveRole(activeChat, me?.id);
    const otherName = activeChat?.counterpartyName ?? "상대";
    const otherAvatar = activeChat?.counterpartyProfile || "";

    if (meLoading || roomsLoading) {
        return <div className={s.wrap}><h2 className={s.title}>채팅</h2><div className={s.loading}>로딩 중...</div></div>;
    }

    if (error) {
        return <div className={s.wrap}><h2 className={s.title}>채팅</h2><div className={s.error}>{error}</div></div>;
    }

    return (
        <div className={s.wrap}>
            <h2 className={s.title}>채팅</h2>
            <div className={s.box}>
                <RoomList rooms={rooms} meId={me?.id} activeId={activeId} onSelect={setActiveId} />
                <section className={s.room}>
                    {activeChat ? (
                        <>
                            <div className={s.roomHeader}>
                                <img className={s.roomThumb} src={headerThumb} alt="상품 이미지" />
                                <div className={s.roomMeta}>
                                    <div className={s.roomTitleRow}>
                                        <span className={s.roomProduct}>{activeChat.productTitle}</span>
                                        {priceText && <span className={s.price}>{priceText}</span>}
                                    </div>
                                    <div className={s.roomSub}>
                                        상대: <strong>{otherName}</strong>
                                        {myRole && (
                                            <span className={`${s.roleBadge} ${myRole === "판매자" ? s.roleSeller : s.roleBuyer}`}>
                                                {myRole}
                                            </span>
                                        )}
                                        {activeChat?.productStatus && (
                                            <span className={`${s.statusBadge} ${activeChat.productStatus === "판매완료" ? s.statusDone : s.statusOn}`}>
                                                {activeChat.productStatus}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm("이 채팅방에서 나가시겠어요? (상대에게는 채팅방이 유지될 수 있습니다)")) {
                                            leaveActiveRoom();
                                        }
                                    }}
                                    className={s.leaveBtn}
                                    aria-label="방 나가기"
                                >
                                    <ExitToApp />
                                </button>
                            </div>

                            <MessageList
                                messages={messages}
                                otherName={otherName}
                                otherAvatar={safeSrc(otherAvatar) || "/images/profile_img/sangjun.jpg"}
                                hasMoreBefore={hasMoreBefore}
                                loadingBefore={loadingBefore}
                                loadMoreBefore={loadMoreBefore}
                            />
                            <InputBar onSend={sendMessage} disabled={!connected} />
                        </>
                    ) : (
                        <div className={s.noRoomSelected}>
                            <p>채팅방을 선택해주세요.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
