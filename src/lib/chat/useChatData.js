"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
    fetchRooms, fetchMe, fetchMessages,
    sendMessageRest, uploadChatImage, markReadUpTo, fetchLastSeen,
} from "@/lib/chat/api";
import {
    createSystemIntro, mapMessageToUi, resolveRole, withDateDividers,
    formatKRW,
} from "./chat-utils";
import { oldestRealMessageId } from "./chat-utils";
import { useChatSocket } from "@/lib/chat/useChatSocket";

/** 원화 정규화 */
function coercePriceToWon(raw) {
    if (raw == null) return null;
    if (typeof raw === "string") {
        const onlyNum = raw.replace(/[^0-9]/g, "");
        if (!onlyNum) return null;
        const n = Number(onlyNum);
        return Number.isFinite(n) ? n : null;
    }
    if (typeof raw === "number") {
        if (!Number.isFinite(raw) || raw <= 0) return null;
        return Math.round(raw);
    }
    return null;
}

/** 서버 DTO -> 프론트 공통 모델 정규화 (S3 URL 그대로 사용) */
function normalizeRoomDto(raw, meId) {
    if (!raw) return null;

    const productTitle =
        raw.productTitle ?? raw.title ?? raw.product?.title ?? raw.itemTitle ?? null;

    // ✅ 서버에서 준 S3 절대경로가 있으면 그대로 사용
    // (필드명 후보들을 최대한 포괄)
    const productThumb =
        raw.productThumb ??
        raw.productImage ??
        raw.imageUrl ??
        raw.thumb ??
        raw.product?.thumbUrl ??
        raw.product?.imageUrl ??
        null;

    // 가격 후보 (서버 표시용 문자열/숫자 모두 허용)
    const priceCandidates = [
        raw.displayPrice,
        raw.productPrice,
        raw.price,
        raw.product_price,
        raw.product?.price,
        raw.priceWon,
        raw.priceKRW,
        raw.price_krw,
        raw.product?.priceWon,
        raw.product?.priceKRW,
    ];
    let productPrice = null;
    for (const c of priceCandidates) {
        const won = coercePriceToWon(c);
        if (won != null) { productPrice = won; break; }
    }
    if (productPrice == null) {
        const cents =
            raw.price_cents ?? raw.product?.price_cents ?? raw.priceCents ?? null;
        if (cents != null && Number.isFinite(Number(cents))) {
            const won = Math.round(Number(cents) / 100);
            productPrice = won > 0 ? won : null;
        }
    }

    const productStatus =
        raw.statusBadge ?? raw.productStatus ?? raw.status ?? raw.product_status ?? raw.product?.status ?? null;

    const sellerId =
        raw.sellerId ?? raw.seller_id ?? raw.product?.sellerId ?? raw.seller?.id ?? null;
    const buyerId =
        raw.buyerId ?? raw.buyer_id ?? raw.product?.buyerId ?? raw.buyer?.id ?? null;

    const computedIsSeller =
        meId != null && sellerId != null
            ? Number(meId) === Number(sellerId)
            : (typeof raw.isSeller === "boolean" ? raw.isSeller : undefined);

    const role =
        raw.myRole ??
        raw.role ??
        (computedIsSeller === true ? "판매자" : computedIsSeller === false ? "구매자" : undefined);

    const counterpartyName =
        raw.counterpartyName ?? raw.counterparty ?? raw.partnerName ?? raw.otherName ??
        raw.opponentName ??
        (meId != null && sellerId != null
            ? (Number(meId) === Number(sellerId) ? raw.buyerName : raw.sellerName)
            : raw.userName) ?? "상대";

    // ✅ 상대 프로필도 서버가 주는 값을 우선 사용 (없으면 빈 문자열)
    const counterpartyProfile =
        raw.counterpartyProfile ?? raw.partnerProfile ?? raw.otherProfile ??
        raw.avatar ?? raw.avatarUrl ?? "";

    const unread = Number(raw.unread ?? raw.unreadCount ?? 0) || 0;
    const lastAt = raw.lastAt ?? raw.lastTime ?? raw.lastMessageTime ?? raw.updatedAt ?? null;
    const lastMessage = raw.lastMessage ?? raw.preview ?? raw.lastText ?? raw.lastContent ?? null;

    return {
        ...raw,
        roomId: raw.roomId ?? raw.id ?? raw.chatRoomId,
        productTitle,
        productThumb,   // ← S3 URL 사용
        productPrice,
        productStatus,
        sellerId,
        buyerId,
        counterpartyName,
        counterpartyProfile, // ← S3 URL 사용(있다면)
        unread,
        lastAt,
        lastMessage,
        isSeller: typeof computedIsSeller === "boolean" ? computedIsSeller : undefined,
        role: role ?? undefined,
    };
}

export function useChatData() {
    const search = useSearchParams();
    const initialRoomId = search.get("roomId") ? Number(search.get("roomId")) : null;

    const [me, setMe] = useState(null);
    const [roomList, setRoomList] = useState([]);
    const [activeId, setActiveId] = useState(initialRoomId);
    const [messagesByRoom, setMessagesByRoom] = useState({});

    const [loadingBeforeByRoom, setLoadingBeforeByRoom] = useState({});
    const [hasMoreBeforeByRoom, setHasMoreBeforeByRoom] = useState({});

    const wsCursorRef = useRef(0);
    const defaultPickedRef = useRef(false);
    const lastReadSentByRoomRef = useRef({});
    const readFloorByRoomRef = useRef({});

    // ✅ 기본 아바타/이름 하드코딩 제거 (없으면 빈 값)
    const [otherNameState, setOtherNameState] = useState("상대");
    const [otherAvatarState, setOtherAvatarState] = useState("");
    const otherNameRef = useRef(otherNameState);
    const otherAvatarRef = useRef(otherAvatarState);
    useEffect(() => { otherNameRef.current = otherNameState; }, [otherNameState]);
    useEffect(() => { otherAvatarRef.current = otherAvatarState; }, [otherAvatarState]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetchMe();
                if (res?.userId) {
                    setMe({ id: res.userId, name: `유저${res.userId}`, profile: "" });
                } else setMe(null);
            } catch { setMe(null); }
        })();
    }, []);

    useEffect(() => {
        if (!me?.id) return;
        (async () => {
            try {
                const list = await fetchRooms();
                const normalized = (Array.isArray(list) ? list : [])
                    .map((r) => normalizeRoomDto(r, me.id))
                    .filter(Boolean);

                const deduped = Array.from(new Map(normalized.map(r => [String(r.roomId), r])).values());
                setRoomList(deduped);

                if (!defaultPickedRef.current) {
                    if (!initialRoomId && deduped.length) setActiveId(deduped[0].roomId);
                    defaultPickedRef.current = true;
                }
            } catch {
                setRoomList([]);
            }
        })();
    }, [me?.id, initialRoomId]);

    const rooms = useMemo(() => {
        const map = new Map();
        for (const r of roomList || []) if (r?.roomId) map.set(String(r.roomId), r);
        return Array.from(map.values());
    }, [roomList]);

    const activeChat = useMemo(
        () => rooms.find((r) => String(r.roomId) === String(activeId)),
        [rooms, activeId]
    );

    const myRole = resolveRole(activeChat, me?.id);
    const otherName = activeChat?.counterpartyName ?? "상대";
    const otherAvatar = activeChat?.counterpartyProfile || "";
    useEffect(() => { setOtherNameState(otherName); setOtherAvatarState(otherAvatar); }, [otherName, otherAvatar]);

    const { connected, messages: wsMessages, sendText, sendImage, sendRead, setOnBadge } =
        useChatSocket({ roomId: me?.id ? activeId ?? 0 : 0, me: me ?? undefined, baseUrl: process.env.NEXT_PUBLIC_API_BASE });

    const resolvePeerId = (room, myId, role) => {
        if (!room) return null;
        if (room.counterpartyId) return Number(room.counterpartyId);
        const buyerId = room.buyerId != null ? Number(room.buyerId) : null;
        const sellerId = room.sellerId != null ? Number(room.sellerId) : null;
        if (role === "판매자") return buyerId;
        if (role === "구매자") return sellerId;
        if (sellerId && Number(myId) === sellerId) return buyerId;
        if (buyerId && Number(myId) === buyerId) return sellerId;
        return null;
    };

    useEffect(() => {
        if (!activeId || !me?.id) return;
        wsCursorRef.current = 0;
        (async () => {
            try {
                const size = 30;
                const list = await fetchMessages(activeId, size);

                try {
                    const peerId = resolvePeerId(activeChat, me?.id, myRole);
                    if (peerId) {
                        const res = await fetchLastSeen(activeId, peerId);
                        const peerLastSeen = Number(res?.lastSeenMessageId || 0);
                        readFloorByRoomRef.current[activeId] = Math.max(
                            readFloorByRoomRef.current[activeId] || 0,
                            peerLastSeen
                        );
                    }
                } catch {}

                const floor = readFloorByRoomRef.current[activeId] || 0;
                const mapped = (list || [])
                    .map((m) => mapMessageToUi(m, me, otherName, otherAvatar))
                    .filter((x) => x.type !== "SYSTEM")
                    .map((x) => {
                        const mid = Number(x.id || x.messageId);
                        return (x.fromMe && Number.isFinite(mid) && mid <= floor) ? { ...x, read: true } : x;
                    });

                setMessagesByRoom((prev) => ({ ...prev, [activeId]: [createSystemIntro(activeId), ...mapped] }));
                setHasMoreBeforeByRoom((p) => ({ ...p, [activeId]: (list?.length || 0) === size }));
            } catch {
                setMessagesByRoom((prev) => ({ ...prev, [activeId]: [createSystemIntro(activeId)] }));
                setHasMoreBeforeByRoom((p) => ({ ...p, [activeId]: false }));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId, me?.id]);

    useEffect(() => {
        setOnBadge((badge) => {
            if (!badge || !badge.type) return;
            if (badge.type === "ROOM_BADGE" && badge.roomId != null) {
                setRoomList((prev) =>
                    (prev || []).map((r) =>
                        String(r.roomId) === String(badge.roomId)
                            ? { ...r, unread: Math.max(0, Number(badge.unread ?? 0)) }
                            : r
                    )
                );
            }
        });
    }, [setOnBadge]);

    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null || !me?.id) return;
        const delta = wsMessages.slice(wsCursorRef.current);
        wsCursorRef.current = wsMessages.length;

        setMessagesByRoom((prev) => {
            const cur = [...(prev[activeId] || [])];

            for (const m of delta) {
                const t = (m?.type || "").toUpperCase();

                if (t === "READ") {
                    const readerId = Number(m.readerId);
                    const upTo = Number(m.lastSeenMessageId || 0);
                    if (Number.isFinite(upTo) && readerId && readerId !== Number(me.id)) {
                        const newFloor = Math.max(readFloorByRoomRef.current[activeId] || 0, upTo);
                        readFloorByRoomRef.current[activeId] = newFloor;
                        for (let i = cur.length - 1; i >= 0; i--) {
                            const x = cur[i];
                            if (!x || x.__divider || x.type === "SYSTEM" || !x.fromMe) continue;
                            const mid = Number(x.id || x.messageId);
                            if (Number.isFinite(mid) && mid <= newFloor && !x.read) cur[i] = { ...x, read: true };
                        }
                    }
                    continue;
                }

                const next = mapMessageToUi(m, me, otherNameRef.current, otherAvatarRef.current);
                if (next.__ignore || next.type === "SYSTEM") continue;

                if (m.tempId) {
                    const idx = cur.findIndex((x) => x.tempId === m.tempId);
                    if (idx >= 0) { cur[idx] = { ...next, tempId: undefined }; continue; }
                }
                if (typeof m.messageId === "number" && cur.some((x) => x.id === m.messageId)) continue;

                const floor = readFloorByRoomRef.current[activeId] || 0;
                const mid = Number(next.id || next.messageId);
                cur.push(next.fromMe && Number.isFinite(mid) && mid <= floor ? { ...next, read: true } : next);
            }
            return { ...prev, [activeId]: cur };
        });
    }, [wsMessages, activeId, me?.id]);

    useEffect(() => {
        if (!activeId || !me?.id) return;
        const list = messagesByRoom[activeId] || [];
        const lastId = (() => {
            const ids = list.filter(m => !m?.__divider && m?.type !== "SYSTEM")
                .map(m => Number(m.id || m.messageId)).filter(Number.isFinite);
            return ids.length ? Math.max(...ids) : null;
        })();
        if (!lastId) return;

        const lastSent = lastReadSentByRoomRef.current[activeId] || 0;
        if (lastSent >= lastId) return;
        lastReadSentByRoomRef.current[activeId] = lastId;

        if (connected && typeof sendRead === "function") {
            try { sendRead(lastId); } catch {}
            setRoomList((prev) => (prev || []).map((r) =>
                String(r.roomId) === String(activeId) ? { ...r, unread: 0 } : r
            ));
        } else {
            markReadUpTo(activeId, me.id, lastId).then(() => {
                setRoomList((prev) => (prev || []).map((r) =>
                    String(r.roomId) === String(activeId) ? { ...r, unread: 0 } : r
                ));
            }).catch(() => {});
        }
    }, [messagesByRoom, activeId, me?.id, connected, sendRead]);

    async function sendMessage({ text, file }) {
        if (!me?.id || !activeId) return;
        const trimmed = (text || "").trim();
        if (!trimmed && !file) return;

        const tempId = `tmp-${activeId}-${Date.now()}`;
        const optimistic = {
            id: tempId, tempId, fromMe: true,
            senderName: me.name, avatar: me.profile || "",
            text: trimmed, imageUrl: file ? URL.createObjectURL(file) : null,
            type: file ? "IMAGE" : "TEXT", ts: new Date(), read: false,
        };
        setMessagesByRoom((prev) => ({ ...prev, [activeId]: [...(prev[activeId] || []), optimistic] }));

        try {
            let imageUrl = null;
            if (file) {
                const res = await uploadChatImage(file);
                imageUrl = res?.url || null; // 서버가 돌려주는 S3 URL 사용
            }
            if (connected) {
                if (imageUrl) sendImage(imageUrl, tempId);
                if (trimmed) sendText(trimmed, tempId);
            } else {
                await sendMessageRest(activeId, { text: trimmed, imageUrl, tempId, senderId: me.id });
            }
        } catch (e) {
            console.error("send failed", e);
        }
    }

    async function loadMoreBefore() {
        const roomId = activeId;
        if (!roomId || !me?.id) return;
        if (loadingBeforeByRoom[roomId]) return;
        if (hasMoreBeforeByRoom[roomId] === false) return;

        const cur = messagesByRoom[roomId] || [];
        const before = oldestRealMessageId(cur);
        if (!before) {
            setHasMoreBeforeByRoom((p) => ({ ...p, [roomId]: false }));
            return;
        }

        setLoadingBeforeByRoom((p) => ({ ...p, [roomId]: true }));
        try {
            const size = 30;
            const list = await fetchMessages(roomId, size, before);
            const floor = readFloorByRoomRef.current[roomId] || 0;
            const mapped = (list || [])
                .map((m) => mapMessageToUi(m, me, otherNameRef.current, otherAvatarRef.current))
                .filter((x) => x.type !== "SYSTEM")
                .map((x) => {
                    const mid = Number(x.id || x.messageId);
                    return (x.fromMe && Number.isFinite(mid) && mid <= floor) ? { ...x, read: true } : x;
                });

            setMessagesByRoom((prev) => {
                const curNow = prev[roomId] || [];
                return {
                    ...prev,
                    [roomId]: [
                        ...(curNow[0]?.__systemIntro ? [curNow[0]] : []),
                        ...mapped,
                        ...(curNow[0]?.__systemIntro ? curNow.slice(1) : curNow),
                    ],
                };
            });

            setHasMoreBeforeByRoom((p) => ({ ...p, [roomId]: (list?.length || 0) === size }));
        } catch (e) {
            console.error("loadMoreBefore failed", e);
        } finally {
            setLoadingBeforeByRoom((p) => ({ ...p, [roomId]: false }));
        }
    }

    const rawList = messagesByRoom[activeId] ?? [];
    const messages = withDateDividers(rawList);

    return {
        me, rooms, activeId, setActiveId,
        activeChat, myRole, otherName, otherAvatar,
        connected, messages,
        loadingBefore: loadingBeforeByRoom[activeId] || false,
        hasMoreBefore: hasMoreBeforeByRoom[activeId] ?? false,
        loadMoreBefore,
        sendMessage,
        formatKRW,
    };
}
