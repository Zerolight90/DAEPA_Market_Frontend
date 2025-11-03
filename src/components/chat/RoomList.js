"use client";
import ScrollArea from "./ScrollArea";
import { fmtHHMM, resolveRole, formatKRW } from "@/lib/chat/chat-utils";
import s from "./MarketChat.module.css";

const safeSrc = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
};

export default function RoomList({ rooms, meId, activeId, onSelect }) {
    return (
        <aside className={s.list}>
            <h3 className={s.listTitle}>채팅 목록</h3>

            <ScrollArea className={s.ul} component="ul" sx={{ maxHeight: "600px" }}>
                {(rooms || []).map((r) => {
                    const role = resolveRole(r, meId); // "판매자" | "구매자" | null
                    const active = String(activeId) === String(r.roomId);
                    const priceText = formatKRW(r.productPrice);
                    const thumb = safeSrc(r.productThumb) || "/images/placeholder.jpg";

                    return (
                        <li
                            key={r.roomId}
                            className={`${s.item} ${active ? s.active : ""}`}
                            onClick={() => onSelect(r.roomId)}
                        >
                            {/* 썸네일 (오버레이 라벨 없음) */}
                            <div className={s.thumbWrap}>
                                <img className={s.thumb} src={thumb} alt="" />
                            </div>

                            {/* 우측 텍스트 */}
                            <div className={s.itemMain}>
                                <div className={s.top}>
                  <span className={s.name}>
                    {r.counterpartyName}
                      {role && (
                          <span
                              className={`${s.rolePill} ${
                                  role === "판매자" ? s.roleSeller : s.roleBuyer
                              }`}
                          >
                        {role}
                      </span>
                      )}
                  </span>

                                    <div className={s.metaRight}>
                                        {Number(r.unread) > 0 && (
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
                                    {priceText && <span className={s.price}>{priceText}</span>}
                                    {r.productStatus && (
                                        <span className={`${s.status} ${s[r.productStatus] || ""}`}>
                      {r.productStatus}
                    </span>
                                    )}
                                </div>

                                {r.lastMessage && (
                                    <div className={s.preview}>{r.lastMessage}</div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ScrollArea>
        </aside>
    );
}
