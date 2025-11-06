//MarketChat.js
"use client";
import s from "./MarketChat.module.css";
import { useChatData } from "@/lib/chat/useChatData";
import RoomList from "./RoomList";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import { formatKRW } from "@/lib/chat/chat-utils";

// 빈 문자열을 null 로 바꿔 <img>에 비지 않도록
const safeSrc = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
};

export default function MarketChat() {
    const {
        me, rooms, activeId, setActiveId,
        activeChat, myRole, otherName, otherAvatar,
        connected, messages, sendMessage,
        hasMoreBefore, loadingBefore, loadMoreBefore,
        leaveActiveRoom
    } = useChatData();

    const priceText = activeChat ? formatKRW(activeChat.productPrice) : null;

    const headerThumb =
        safeSrc(activeChat?.productThumb) || "/images/placeholder.jpg";

    return (
        <div className={s.wrap}>
            <h2 className={s.title}>채팅</h2>
            <div className={s.box}>
                {/* 좌측 목록 */}
                <RoomList
                    rooms={rooms}
                    meId={me?.id}
                    activeId={activeId}
                    onSelect={setActiveId}
                />

                {/* 우측 채팅방 */}
                <section className={s.room}>
                    {activeChat && (
                        <div className={s.roomHeader}>
                            <img className={s.roomThumb} src={headerThumb} alt="" />
                            <div className={s.roomMeta}>
                                {/* 상품명 / 가격 */}
                                <div className={s.roomTitleRow}>
                                    <span className={s.roomProduct}>{activeChat.productTitle}</span>
                                    {priceText && <span className={s.price}>{priceText}</span>}
                                </div>

                                {/* 닉네임 + 역할(판매자/구매자) */}
                                <div className={s.roomSub}>
                                    상대: <strong>{otherName}</strong>
                                    {myRole && (
                                        <span
                                            className={`${s.roleBadge} ${
                                                myRole === "판매자" ? s.roleSeller : s.roleBuyer
                                            }`}
                                            style={{ marginLeft: 6 }}
                                        >
                                      {myRole}
                                    </span>
                                    )}
                                    {activeChat?.productStatus && (
                                        <span
                                            className={`${s.statusBadge} ${
                                                activeChat.productStatus === "판매완료" ? s.statusDone : s.statusOn
                                            }`}
                                            style={{ marginLeft: 6 }}
                                        >
                                      {activeChat.productStatus}
                                    </span>
                                    )}
                                </div>
                            </div>
                            {/* ✅ 우측에 나가기 버튼 */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (window.confirm("이 채팅방에서 나가시겠어요? (상대에게는 남아 있을 수 있어요)")) {
                                        leaveActiveRoom();
                                    }
                                }}
                                className={s.leaveBtn}
                                style={{
                                    marginLeft: "auto",
                                    alignSelf: "center",
                                    padding: "6px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #eee",
                                    background: "#fafafa",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                                aria-label="방 나가기"
                            >
                                나가기
                            </button>
                        </div>
                    )}

                    <MessageList
                        messages={messages}
                        otherName={otherName}
                        otherAvatar={
                            safeSrc(otherAvatar) || "/images/profile_img/sangjun.jpg"
                        }
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
