"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    fetchRooms, fetchMe, fetchMessages,
    sendMessageRest, uploadChatImage, markReadUpTo,
    fetchLastSeen, // ✅ 추가: 상대의 마지막 읽음 위치 조회
} from "@/lib/chat/api";
import {
    createSystemIntro, mapMessageToUi, resolveRole, withDateDividers
} from "./chat-utils";
import { oldestRealMessageId } from "./chat-utils";
import { useChatSocket } from "@/lib/chat/useChatSocket";

export function useChatData() {
    const search = useSearchParams();
    const initialRoomId = search.get("roomId") ? Number(search.get("roomId")) : null;

    const [me, setMe] = useState(null);
    const [roomList, setRoomList] = useState([]);
    const [activeId, setActiveId] = useState(initialRoomId);
    const [messagesByRoom, setMessagesByRoom] = useState({});

    // 상단 무한스크롤 상태
    const [loadingBeforeByRoom, setLoadingBeforeByRoom] = useState({});
    const [hasMoreBeforeByRoom, setHasMoreBeforeByRoom] = useState({});

    const wsCursorRef = useRef(0);
    const defaultPickedRef = useRef(false);

    // 내가 마지막으로 서버에 보낸 읽음 위치(중복 방지)
    const lastReadSentByRoomRef = useRef({}); // { [roomId]: lastSeenId }

    // ✅ 상대방이 읽은 최댓값(=내 메시지에 대한 "읽음" 표시의 플로어)을 방 단위로 기억
    // 이 값 이하의 내 메시지는 언제 로드해도 read: true로 보정한다.
    const readFloorByRoomRef = useRef({}); // { [roomId]: lastSeenId }

    // 상대 표시 안정화
    const [otherNameState, setOtherNameState] = useState("상대");
    const [otherAvatarState, setOtherAvatarState] = useState("/images/profile_img/sangjun.jpg");
    const otherNameRef = useRef(otherNameState);
    const otherAvatarRef = useRef(otherAvatarState);
    useEffect(() => { otherNameRef.current = otherNameState; }, [otherNameState]);
    useEffect(() => { otherAvatarRef.current = otherAvatarState; }, [otherAvatarState]);

    // 사용자 정보
    useEffect(() => {
        (async () => {
            try {
                const res = await fetchMe();
                if (res?.userId) {
                    setMe({ id: res.userId, name: `유저${res.userId}`, profile: "/images/profile_img/sangjun.jpg" });
                } else setMe(null);
            } catch { setMe(null); }
        })();
    }, []);

    // 방 목록
    useEffect(() => {
        if (!me?.id) return;
        (async () => {
            try {
                const list = await fetchRooms();
                const safe = Array.isArray(list) ? list : [];
                setRoomList(safe);
                if (!defaultPickedRef.current) {
                    const deduped = Array.from(new Map(safe.filter(Boolean).map(r => [String(r.roomId), r])).values());
                    if (!initialRoomId && deduped.length) setActiveId(deduped[0].roomId);
                    defaultPickedRef.current = true;
                }
            } catch { setRoomList([]); }
        })();
    }, [me?.id, initialRoomId]);

    const rooms = useMemo(() => {
        const map = new Map();
        for (const r of roomList || []) if (r?.roomId) map.set(String(r.roomId), r);
        return Array.from(map.values());
    }, [roomList]);

    const activeChat = useMemo(() => rooms.find(r => String(r.roomId) === String(activeId)), [rooms, activeId]);
    const myRole = resolveRole(activeChat, me?.id);
    const otherName = activeChat?.counterpartyName ?? "상대";
    const otherAvatar = activeChat?.counterpartyProfile || "/images/profile_img/sangjun.jpg";
    useEffect(() => { setOtherNameState(otherName); setOtherAvatarState(otherAvatar); }, [otherName, otherAvatar]);

    // 소켓 (배지/읽음 발행 지원)
    const {
        connected,
        messages: wsMessages,
        sendText, sendImage, sendRead,
        setOnBadge, // ROOM_BADGE/TOTAL_BADGE 콜백
    } = useChatSocket({
        roomId: me?.id ? activeId ?? 0 : 0,
        me: me ?? undefined,
        baseUrl: process.env.NEXT_PUBLIC_API_BASE,
    });

    // ✅ 유틸: 이 방에서 "상대 userId" 추정 (counterpartyId 우선, 없으면 역할로 계산)
    const resolvePeerId = (room, myId, role) => {
        if (!room) return null;
        if (room.counterpartyId) return Number(room.counterpartyId);
        // 백엔드 DTO에 따라 buyerId/sellerId가 있을 수 있음
        const buyerId = room.buyerId != null ? Number(room.buyerId) : null;
        const sellerId = room.sellerId != null ? Number(room.sellerId) : null;
        if (role === "판매자") return buyerId;
        if (role === "구매자") return sellerId;
        // 마지막 시도: 내가 seller면 상대는 buyer, 반대도 동일 추정
        if (sellerId && Number(myId) === sellerId) return buyerId;
        if (buyerId && Number(myId) === buyerId) return sellerId;
        return null;
    };

    // 초기 메시지 로드
    useEffect(() => {
        if (!activeId || !me?.id) return;
        wsCursorRef.current = 0;
        (async () => {
            try {
                const size = 30;

                // 1) 서버에서 메시지 조회
                const list = await fetchMessages(activeId, size);

                // 2) 먼저 "상대의 마지막 읽음 위치"를 조회하여 방 플로어를 세팅
                let peerLastSeen = 0;
                try {
                    const peerId = resolvePeerId(activeChat, me?.id, myRole);
                    if (peerId) {
                        const res = await fetchLastSeen(activeId, peerId);
                        peerLastSeen = Number(res?.lastSeenMessageId || 0);
                        const prevFloor = readFloorByRoomRef.current[activeId] || 0;
                        readFloorByRoomRef.current[activeId] = Math.max(prevFloor, peerLastSeen);
                    }
                } catch { /* 조회 실패 시 0 유지 */ }

                // 3) 방 플로어를 반영하여 UI 모델 생성
                const floor = readFloorByRoomRef.current[activeId] || 0;
                const mapped = (list || [])
                    .map((m) => mapMessageToUi(m, me, otherName, otherAvatar))
                    .filter(x => x.type !== "SYSTEM")
                    .map((x) => {
                        // 내 메시지이며, id <= floor 면 읽음 고정
                        const mid = Number(x.id || x.messageId);
                        return (x.fromMe && Number.isFinite(mid) && mid <= floor)
                            ? { ...x, read: true }
                            : x;
                    });

                setMessagesByRoom(prev => ({ ...prev, [activeId]: [createSystemIntro(activeId), ...mapped] }));
                setHasMoreBeforeByRoom(prev => ({ ...prev, [activeId]: (list?.length || 0) === size }));
            } catch {
                setMessagesByRoom(prev => ({ ...prev, [activeId]: [createSystemIntro(activeId)] }));
                setHasMoreBeforeByRoom(prev => ({ ...prev, [activeId]: false }));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId, me?.id]); // (activeChat/myRole은 내부에서만 사용)

    // ✅ 배지 실시간 반영
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
            // TOTAL_BADGE는 필요 시 헤더 합계에 사용
        });
    }, [setOnBadge]);

    // ✅ WS 수신 반영: READ 이벤트는 버블로 그리지 않고 "내 메시지" 읽음 표시 갱신 + 플로어 올림
    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null || !me?.id) return;
        const delta = wsMessages.slice(wsCursorRef.current);
        wsCursorRef.current = wsMessages.length;

        setMessagesByRoom(prev => {
            const cur = [...(prev[activeId] || [])];

            for (const m of delta) {
                const mtype = (m?.type || "").toUpperCase();

                // READ 이벤트 처리(상대가 읽었을 때만)
                if (mtype === "READ") {
                    const readerId = Number(m.readerId);
                    const upTo = Number(m.lastSeenMessageId || 0);
                    if (Number.isFinite(upTo) && readerId && readerId !== Number(me.id)) {
                        // 1) 방 읽음 플로어 끌어올림
                        const prevFloor = readFloorByRoomRef.current[activeId] || 0;
                        const newFloor = Math.max(prevFloor, upTo);
                        readFloorByRoomRef.current[activeId] = newFloor;

                        // 2) 현재 리스트에서 내 메시지 중 newFloor 이하를 모두 읽음으로 고정
                        for (let i = cur.length - 1; i >= 0; i--) {
                            const x = cur[i];
                            if (!x || x.__divider || x.type === "SYSTEM") continue;
                            if (!x.fromMe) continue;
                            const mid = Number(x.id || x.messageId);
                            if (Number.isFinite(mid) && mid <= newFloor && !x.read) {
                                cur[i] = { ...x, read: true };
                            }
                        }
                    }
                    continue; // READ는 렌더 안 함
                }

                // 일반 채팅 메시지
                const next = mapMessageToUi(m, me, otherNameRef.current, otherAvatarRef.current);
                if (next.__ignore || next.type === "SYSTEM") continue;

                // 낙관적 업데이트 매칭
                if (m.tempId) {
                    const idx = cur.findIndex(x => x.tempId === m.tempId);
                    if (idx >= 0) { cur[idx] = { ...next, tempId: undefined }; continue; }
                }
                // 중복 방지
                if (typeof m.messageId === "number" && cur.some(x => x.id === m.messageId)) continue;

                // ✅ push 전에 방 플로어 반영(이미 읽은 구간이면 내 메시지 read 고정)
                const floor = readFloorByRoomRef.current[activeId] || 0;
                const mid = Number(next.id || next.messageId);
                const finalNext = (next.fromMe && Number.isFinite(mid) && mid <= floor)
                    ? { ...next, read: true }
                    : next;

                cur.push(finalNext);
            }
            return { ...prev, [activeId]: cur };
        });
    }, [wsMessages, activeId, me?.id]);

    // ✅ 읽음 전송(방 진입/새 메시지 수신 시 최신 메시지까지)
    useEffect(() => {
        if (!activeId || !me?.id) return;
        const list = messagesByRoom[activeId] || [];

        // 최신(가장 큰) 실제 메시지 ID
        const lastId = (() => {
            const ids = list
                .filter((m) => !m?.__divider && m?.type !== "SYSTEM")
                .map((m) => Number(m.id || m.messageId))
                .filter((n) => Number.isFinite(n));
            if (!ids.length) return null;
            return Math.max(...ids);
        })();
        if (!lastId) return;

        const lastSent = lastReadSentByRoomRef.current[activeId] || 0;
        if (lastSent >= lastId) return; // 이미 보낸 위치면 생략
        lastReadSentByRoomRef.current[activeId] = lastId;

        // WS가 연결돼 있으면 WS 읽음 전송 + 낙관적 배지 0
        if (connected && typeof sendRead === "function") {
            try { sendRead(lastId); } catch {}
            setRoomList((prev) =>
                (prev || []).map((r) =>
                    String(r.roomId) === String(activeId) ? { ...r, unread: 0 } : r
                )
            );
        } else {
            // REST 폴백
            markReadUpTo(activeId, me.id, lastId)
                .then(() => {
                    // ✅ 폴백 성공 시에도 방 플로어 유지(상대가 읽은 값은 아님. 내 것이 아님!)
                    // 여기서는 배지 초기화 + 화면 안전 보정만 수행
                    setRoomList((prev) =>
                        (prev || []).map((r) =>
                            String(r.roomId) === String(activeId) ? { ...r, unread: 0 } : r
                        )
                    );
                })
                .catch(() => {});
        }
    }, [messagesByRoom, activeId, me?.id, connected, sendRead]);

    // 전송
    async function sendMessage({ text, file }) {
        if (!me?.id || !activeId) return;
        const trimmed = (text || "").trim();
        if (!trimmed && !file) return;

        const tempId = `tmp-${activeId}-${Date.now()}`;
        const optimistic = {
            id: tempId, tempId, fromMe: true,
            senderName: me.name, avatar: me.profile,
            text: trimmed, imageUrl: file ? URL.createObjectURL(file) : null,
            type: file ? "IMAGE" : "TEXT", ts: new Date(), read: false,
        };
        setMessagesByRoom(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), optimistic] }));

        try {
            let imageUrl = null;
            if (file) {
                const res = await uploadChatImage(file);
                imageUrl = res?.url || null;
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

    // 상단 무한스크롤: 이전 메시지 로드
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

            // ✅ 방 플로어 반영
            const floor = readFloorByRoomRef.current[roomId] || 0;
            const mapped = (list || [])
                .map((m) => mapMessageToUi(m, me, otherNameRef.current, otherAvatarRef.current))
                .filter(x => x.type !== "SYSTEM")
                .map((x) => {
                    const mid = Number(x.id || x.messageId);
                    return (x.fromMe && Number.isFinite(mid) && mid <= floor)
                        ? { ...x, read: true }
                        : x;
                });

            setMessagesByRoom(prev => {
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

    // 파생: 현재 방 메시지(+날짜 디바이더)
    const rawList = messagesByRoom[activeId] ?? [];
    const messages = withDateDividers(rawList);

    return {
        me, rooms, activeId, setActiveId,
        activeChat, myRole, otherName, otherAvatar,
        connected,
        messages,

        loadingBefore: loadingBeforeByRoom[activeId] || false,
        hasMoreBefore: hasMoreBeforeByRoom[activeId] ?? false,
        loadMoreBefore,

        sendMessage,
    };
}
