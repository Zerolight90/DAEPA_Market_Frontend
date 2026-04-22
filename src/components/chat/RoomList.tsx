//RoomList.js
"use client";
import ScrollArea from "./ScrollArea";
import { fmtHHMM, resolveRole } from "@/lib/chat/chat-utils";
import s from "./MarketChat.module.css";
import Storefront from '@mui/icons-material/Storefront';
import ShoppingCart from '@mui/icons-material/ShoppingCart';

const safeSrc = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
};

export default function RoomList({ rooms, meId, activeId, onSelect }) {
    return (
        <aside className={s.list}>
            <div className={s.listHeader}>
                <h3 className={s.listTitle}>채팅 목록</h3>
                <span className={s.legendItem}>
                    <span className={s.legendSellerColor}></span> 판매자
                </span>
                <span className={s.legendItem}>
                    <span className={s.legendBuyerColor}></span> 구매자
                </span>
            </div>

            <ScrollArea className={s.ul} component="ul" sx={{ maxHeight: "600px" }}>
                {(rooms || []).map((r) => {
                    const role = resolveRole(r, meId); // "판매자" | "구매자" | null
                    const active = String(activeId) === String(r.roomId);
                    const thumb = safeSrc(r.productThumb) || "/images/placeholder.jpg";

                    return (
                        <li
                            key={r.roomId}
                            className={`${s.item} ${active ? s.active : ""} ${role === "판매자" ? s.sellerBg : s.buyerBg}`}
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
                                        {role === '판매자' && <Storefront className={s.roleIcon} />}
                                        {role === '구매자' && <ShoppingCart className={s.roleIcon} />}
                                        {r.counterpartyName}
                                        {r.productStatus && (
                                            <span className={`${s.status} ${s[r.productStatus] || ""}`}>
                                                {r.productStatus}
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
                                    <span className={s.product}>상품명 : {r.productTitle}</span>
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
