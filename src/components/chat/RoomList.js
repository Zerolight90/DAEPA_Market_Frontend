// components/chat/RoomList.js
"use client";
import ScrollArea from "./ScrollArea";
import { fmtHHMM, resolveRole } from "@/lib/chat/chat-utils";
import s from "./MarketChat.module.css";

export default function RoomList({ rooms, meId, activeId, onSelect }) {
    return (
        <aside className={s.list}>
            <h3 className={s.listTitle}>채팅 목록</h3>
            <ScrollArea className={s.ul} component="ul" sx={{ maxHeight: "600px" }}>
                {rooms.map((r) => {
                    const role = resolveRole(r, meId); // "판매자" | "구매자" | null
                    const active = String(activeId) === String(r.roomId);

                    return (
                        <li
                            key={r.roomId}
                            className={`${s.item} ${active ? s.active : ""}`}
                            onClick={() => onSelect(r.roomId)}
                        >
                            {/* 썸네일 + 좌상단 역할 라벨 */}
                            <div className={s.thumbWrap}>
                                <img className={s.thumb} src={r.productThumb} alt="" />
                                {role && (
                                    <span
                                        className={`${s.roleTag} ${
                                            role === "판매자" ? s.roleTagSeller : s.roleTagBuyer
                                        }`}
                                        title={`내 역할: ${role}`}
                                    >
                    {role}
                  </span>
                                )}
                            </div>

                            {/* 텍스트 영역 */}
                            <div className={s.itemMain}>
                                <div className={s.top}>
                                    <span className={s.name}>{r.counterpartyName}</span>

                                    {/* 오른쪽 메타: 안읽음 배지 + 시간 */}
                                    <div className={s.metaRight}>
                                        {r.unread > 0 && (
                                            <span
                                                className={`${s.unreadBadge} ${
                                                    role === "판매자" ? s.unreadSeller : s.unreadBuyer
                                                }`}
                                                aria-label={`안읽음 ${r.unread}건`}
                                            >
                        {r.unread > 99 ? "99+" : r.unread}
                      </span>
                                        )}
                                        <span className={s.time}>
                      {r.lastAt ? fmtHHMM(new Date(r.lastAt)) : "-"}
                    </span>
                                    </div>
                                </div>

                                <div className={s.productRow}>
                                    <span className={s.product}>{r.productTitle}</span>
                                </div>

                                {r.lastMessage && <div className={s.preview}>{r.lastMessage}</div>}
                            </div>
                        </li>
                    );
                })}
            </ScrollArea>
        </aside>
    );
}
