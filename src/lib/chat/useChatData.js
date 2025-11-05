// src/lib/chat/useChatData.js
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
    fetchRooms,
    fetchMe,
    fetchMessages,
    sendMessageRest,
    uploadChatImage,
    markReadUpTo,
    fetchLastSeen,
    leaveRoomRest,
} from "@/lib/chat/api";
import {
    createSystemIntro,
    mapMessageToUi,
    resolveRole,
    withDateDividers,
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

    // 서버가 주는 S3 절대경로를 우선 사용
    const productThumb =
        raw.productThumb ??
        raw.productImage ??
        raw.imageUrl ??
        raw.thumb ??
        raw.product?.thumbUrl ??
        raw.product?.imageUrl ??
        null;

    // 가격 보정
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
        if (won != null) {
            productPrice = won;
            break;
        }
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
        raw.statusBadge ??
        raw.productStatus ??
        raw.status ??
        raw.product_status ??
        raw.product?.status ??
        null;

    const sellerId =
        raw.sellerId ?? raw.seller_id ?? raw.product?.sellerId ?? raw.seller?.id ?? null;
    const buyerId =
        raw.buyerId ?? raw.buyer_id ?? raw.product?.buyerId ?? raw.buyer?.id ?? null;

    const computedIsSeller =
        meId != null && sellerId != null
            ? Number(meId) === Number(sellerId)
            : typeof raw.isSeller === "boolean"
                ? raw.isSeller
                : undefined;

    const role =
        raw.myRole ??
        raw.role ??
        (computedIsSeller === true ? "판매자" : computedIsSeller === false ? "구매자" : undefined);

    const counterpartyName =
        raw.counterpartyName ??
        raw.counterparty ??
        raw.partnerName ??
        raw.otherName ??
        raw.opponentName ??
        (meId != null && sellerId != null
            ? Number(meId) === Number(sellerId)
                ? raw.buyerName
                : raw.sellerName
            : raw.userName) ??
        "상대";

    const counterpartyProfile =
        raw.counterpartyProfile ??
        raw.partnerProfile ??
        raw.otherProfile ??
        raw.avatar ??
        raw.avatarUrl ??
        "";

    const unread = Number(raw.unread ?? raw.unreadCount ?? 0) || 0;
    const lastAt = raw.lastAt ?? raw.lastTime ?? raw.lastMessageTime ?? raw.updatedAt ?? null;
    const lastMessage = raw.lastMessage ?? raw.preview ?? raw.lastText ?? raw.lastContent ?? null;

    return {
        ...raw,
        roomId: raw.roomId ?? raw.id ?? raw.chatRoomId,
        productTitle,
        productThumb,
        productPrice,
        productStatus,
        sellerId,
        buyerId,
        counterpartyName,
        counterpartyProfile,
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

    // 상대 표시용 상태
    const [otherNameState, setOtherNameState] = useState("상대");
    const [otherAvatarState, setOtherAvatarState] = useState("");
    const otherNameRef = useRef(otherNameState);
    const otherAvatarRef = useRef(otherAvatarState);
    useEffect(() => {
        otherNameRef.current = otherNameState;
    }, [otherNameState]);
    useEffect(() => {
        otherAvatarRef.current = otherAvatarState;
    }, [otherAvatarState]);

    // 내 정보
    useEffect(() => {
        (async () => {
            try {
                const res = await fetchMe();
                if (res?.userId) {
                    setMe({ id: res.userId, name: `유저${res.userId}`, profile: "" });
                } else setMe(null);
            } catch {
                setMe(null);
            }
        })();
    }, []);

    // 방 목록
    useEffect(() => {
        if (!me?.id) return;
        (async () => {
            try {
                const list = await fetchRooms();
                const normalized = (Array.isArray(list) ? list : [])
                    .map((r) => normalizeRoomDto(r, me.id))
                    .filter(Boolean);

                const deduped = Array.from(
                    new Map(normalized.map((r) => [String(r.roomId), r])).values()
                );
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
    useEffect(() => {
        setOtherNameState(otherName);
        setOtherAvatarState(otherAvatar);
    }, [otherName, otherAvatar]);

    const {
        connected,
        messages: wsMessages,
        sendText,
        sendImage,
        sendRead,
        setOnBadge,
        sendLeave,
    } = useChatSocket({
        roomId: me?.id ? activeId ?? 0 : 0,
        me: me ?? undefined,
        baseUrl: process.env.NEXT_PUBLIC_API_BASE,
    });

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

    // 방 진입 시 메시지 로딩 + 상대 읽음 포인터 반영
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
                        return x.fromMe && Number.isFinite(mid) && mid <= floor
                            ? { ...x, read: true }
                            : x;
                    });

                setMessagesByRoom((prev) => ({
                    ...prev,
                    [activeId]: [createSystemIntro(activeId), ...mapped],
                }));
                setHasMoreBeforeByRoom((p) => ({
                    ...p,
                    [activeId]: (list?.length || 0) === size,
                }));
            } catch {
                setMessagesByRoom((prev) => ({
                    ...prev,
                    [activeId]: [createSystemIntro(activeId)],
                }));
                setHasMoreBeforeByRoom((p) => ({ ...p, [activeId]: false }));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId, me?.id]);

    // 배지(방별 unread) 실시간 반영
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

    // WS 수신 처리 (메시지/읽음/나가기)
    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null || !me?.id) return;
        const delta = wsMessages.slice(wsCursorRef.current);
        wsCursorRef.current = wsMessages.length;

        setMessagesByRoom((prev) => {
            const cur = [...(prev[activeId] || [])];

            for (const m of delta) {
                const t = (m?.type || "").toUpperCase();

                // 읽음 이벤트
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
                            if (Number.isFinite(mid) && mid <= newFloor && !x.read) {
                                cur[i] = { ...x, read: true };
                            }
                        }
                    }
                    continue;
                }

                // 나가기 이벤트
                if (t === "LEAVE") {
                    const actorId = Number(m.actorId);
                    const roomId = Number(m.roomId);

                    if (actorId === Number(me.id) && roomId === Number(activeId)) {
                        // 내가 나간 방이면 목록에서 제거하고 다른 방으로 이동
                        setRoomList((prevRooms) => prevRooms.filter((r) => String(r.roomId) !== String(roomId)));
                        setMessagesByRoom((prevMsg) => {
                            const copy = { ...prevMsg };
                            delete copy[roomId];
                            return copy;
                        });
                        // 현재 roomList는 아직 setState 반영 전일 수 있으므로 rooms 대신 prevRooms로 계산하는 게 안전하지만,
                        // 여기서는 간단히 첫 남은 방으로 이동 처리
                        const remaining = (rooms || []).filter((r) => String(r.roomId) !== String(roomId));
                        setActiveId(remaining[0]?.roomId ?? null);
                    } else {
                        // 상대가 나감 → 시스템 노트 한 줄
                        setMessagesByRoom((prevMsg) => {
                            const list = [...(prevMsg[activeId] || [])];
                            list.push({
                                id: `leave-${roomId}-${m.time || Date.now()}`,
                                type: "SYSTEM",
                                text: "상대가 방을 나갔습니다.",
                                ts: new Date(),
                                fromMe: false,
                                read: true,
                            });
                            return { ...prevMsg, [activeId]: list };
                        });
                    }
                    continue;
                }

                // 일반 메시지
                const next = mapMessageToUi(m, me, otherNameRef.current, otherAvatarRef.current);
                if (next.__ignore || next.type === "SYSTEM") continue;

                // tempId 매칭(낙관적 전송 치환)
                if (m.tempId) {
                    const idx = cur.findIndex((x) => x.tempId === m.tempId);
                    if (idx >= 0) {
                        cur[idx] = { ...next, tempId: undefined };
                        continue;
                    }
                }
                // 중복 방지
                if (typeof m.messageId === "number" && cur.some((x) => x.id === m.messageId)) continue;

                const floor = readFloorByRoomRef.current[activeId] || 0;
                const mid = Number(next.id || next.messageId);
                cur.push(next.fromMe && Number.isFinite(mid) && mid <= floor ? { ...next, read: true } : next);
            }

            return { ...prev, [activeId]: cur };
        });
    }, [wsMessages, activeId, me?.id, rooms]);

    // 내가 본 마지막 메시지 → 읽음 전송 (WS 우선, REST 폴백)
    useEffect(() => {
        if (!activeId || !me?.id) return;
        const list = messagesByRoom[activeId] || [];
        const lastId = (() => {
            const ids = list
                .filter((m) => !m?.__divider && m?.type !== "SYSTEM")
                .map((m) => Number(m.id || m.messageId))
                .filter(Number.isFinite);
            return ids.length ? Math.max(...ids) : null;
        })();
        if (!lastId) return;

        const lastSent = lastReadSentByRoomRef.current[activeId] || 0;
        if (lastSent >= lastId) return;
        lastReadSentByRoomRef.current[activeId] = lastId;

        if (connected && typeof sendRead === "function") {
            try {
                sendRead(lastId);
            } catch {}
            setRoomList((prev) =>
                (prev || []).map((r) =>
                    String(r.roomId) === String(activeId) ? { ...r, unread: 0 } : r
                )
            );
        } else {
            markReadUpTo(activeId, me.id, lastId)
                .then(() => {
                    setRoomList((prev) =>
                        (prev || []).map((r) =>
                            String(r.roomId) === String(activeId) ? { ...r, unread: 0 } : r
                        )
                    );
                })
                .catch(() => {});
        }
    }, [messagesByRoom, activeId, me?.id, connected, sendRead]);

    // 메시지 전송(텍스트/이미지)
    async function sendMessage({ text, file }) {
        if (!me?.id || !activeId) return;
        const trimmed = (text || "").trim();
        if (!trimmed && !file) return;

        const tempId = `tmp-${activeId}-${Date.now()}`;
        const optimistic = {
            id: tempId,
            tempId,
            fromMe: true,
            senderName: me.name,
            avatar: me.profile || "",
            text: trimmed,
            imageUrl: file ? URL.createObjectURL(file) : null,
            type: file ? "IMAGE" : "TEXT",
            ts: new Date(),
            read: false,
        };
        setMessagesByRoom((prev) => ({
            ...prev,
            [activeId]: [...(prev[activeId] || []), optimistic],
        }));

        try {
            let imageUrl = null;
            if (file) {
                const res = await uploadChatImage(file);
                imageUrl = res?.url || null; // 서버가 돌려주는 S3 URL
            }
            if (connected) {
                if (imageUrl) sendImage(imageUrl, tempId);
                if (trimmed) sendText(trimmed, tempId);
            } else {
                await sendMessageRest(activeId, {
                    text: trimmed,
                    imageUrl,
                    tempId,
                    senderId: me.id,
                });
            }
        } catch (e) {
            console.error("send failed", e);
        }
    }

    // 과거 더 불러오기(무한 스크롤)
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
                    return x.fromMe && Number.isFinite(mid) && mid <= floor
                        ? { ...x, read: true }
                        : x;
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

            setHasMoreBeforeByRoom((p) => ({
                ...p,
                [roomId]: (list?.length || 0) === size,
            }));
        } catch (e) {
            console.error("loadMoreBefore failed", e);
        } finally {
            setLoadingBeforeByRoom((p) => ({ ...p, [roomId]: false }));
        }
    }

    /** ✅ 방 나가기 (UI 낙관적 업데이트 + WS/REST 발행) */
    async function leaveActiveRoom() {
        if (!activeId || !me?.id) return;

        const roomId = activeId;

        // 남는 방 중 다음 활성화할 방 미리 계산
        const remaining = (roomList || []).filter((r) => String(r.roomId) !== String(roomId));
        const nextRoomId = remaining[0]?.roomId ?? null;

        // 목록/메시지 낙관적 갱신
        setRoomList(remaining);
        setMessagesByRoom((prev) => {
            const copy = { ...prev };
            delete copy[roomId];
            return copy;
        });
        setActiveId(nextRoomId);

        try {
            if (connected && typeof sendLeave === "function") {
                // WS: 서버가 x-user-id로 actor 식별 → /sub/chats/{roomId}로 LEAVE 브로드캐스트
                sendLeave();
            } else {
                // REST 폴백
                await leaveRoomRest(roomId, me.id);
            }
        } catch (e) {
            console.error("leave failed", e);
            // 실패 시 최소한 포커스만 원복 (필요하다면 roomList 롤백 로직도 추가 가능)
            setActiveId(roomId);
        }
    }

    const rawList = messagesByRoom[activeId] ?? [];
    const messages = withDateDividers(rawList);

    return {
        me,
        rooms,
        activeId,
        setActiveId,
        activeChat,
        myRole,
        otherName,
        otherAvatar,
        connected,
        messages,
        loadingBefore: loadingBeforeByRoom[activeId] || false,
        hasMoreBefore: hasMoreBeforeByRoom[activeId] ?? false,
        loadMoreBefore,
        sendMessage,
        formatKRW,
        leaveActiveRoom, // ← 버튼에서 이 함수 호출
    };
}
