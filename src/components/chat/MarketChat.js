// components/chat/MarketChat.js
"use client";
import s from "./MarketChat.module.css";
import { useChatData } from "@/lib/chat/useChatData";
import RoomList from "./RoomList";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

export default function MarketChat() {
    const {
        me, rooms, activeId, setActiveId,
        activeChat, myRole, otherName, otherAvatar,
        connected, messages, sendMessage,
        // ✅ 추가
        hasMoreBefore, loadingBefore, loadMoreBefore,
    } = useChatData();

    return (
        <div className={s.wrap}>
            <h2 className={s.title}>채팅</h2>
            <div className={s.box}>
                <RoomList rooms={rooms} meId={me?.id} activeId={activeId} onSelect={setActiveId} />

                <section className={s.room}>
                    {activeChat && (
                        <div className={s.roomHeader}>
                            <img className={s.roomThumb} src={activeChat.productThumb} alt="" />
                            <div className={s.roomMeta}>
                                <div className={s.roomTitleRow}>
                                    <span className={s.roomProduct}>{activeChat.productTitle}</span>
                                    {myRole && <span className={`${s.roleBadge} ${myRole === "판매자" ? s.roleSeller : s.roleBuyer}`}>{myRole}</span>}
                                </div>
                                <div className={s.roomSub}>상대: <strong>{otherName}</strong></div>
                            </div>
                        </div>
                    )}

                    <MessageList
                        messages={messages}
                        otherName={otherName}
                        otherAvatar={otherAvatar}
                        // ✅ 상단 무한스크롤 연결
                        hasMoreBefore={hasMoreBefore}
                        loadingBefore={loadingBefore}
                        loadMoreBefore={loadMoreBefore}
                    />
                    <InputBar onSend={sendMessage} />
                </section>
            </div>
        </div>
    );
}
