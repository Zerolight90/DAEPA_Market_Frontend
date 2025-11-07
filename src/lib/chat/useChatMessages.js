// src/lib/chat/useChatMessages.js
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { 
    fetchMessages, 
    sendMessageRest, 
    uploadChatImage, 
    markReadUpTo, 
    fetchLastSeen 
} from "@/lib/chat/api";
import { 
    createSystemIntro, 
    mapMessageToUi, 
    withDateDividers, 
    oldestRealMessageId, 
    resolvePeerId 
} from "./chat-utils";
import { useChatSocket } from "@/lib/chat/useChatSocket";

/**
 * 활성화된 채팅방의 메시지 관련 상태 및 로직을 관리하는 훅
 * @param {number | null} activeId - 현재 활성화된 채팅방 ID
 * @param {object | null} me - 현재 로그인한 사용자 정보
 * @param {object | null} activeChat - 현재 활성화된 채팅방 정보
 * @returns {object} 메시지 관련 상태와 핸들러 함수들
 */
export function useChatMessages(activeId, me, activeChat) {

    // --- 상태 (State) ---
    /** @type {[object, function]} 모든 채팅방의 메시지를 저장하는 객체. { [roomId]: messages[] } */
    const [messagesByRoom, setMessagesByRoom] = useState({});
    /** @type {[object, function]} 방별 과거 메시지 로딩 상태. { [roomId]: boolean } */
    const [loadingBefore, setLoadingBefore] = useState({});
    /** @type {[object, function]} 방별 추가 과거 메시지 존재 여부. { [roomId]: boolean } */
    const [hasMoreBefore, setHasMoreBefore] = useState({});
    /** @type {[string | null, function]} 메시지 관련 작업 중 발생하는 에러 */
    const [error, setError] = useState(null);

    // --- Ref ---
    /** @type {React.MutableRefObject<number>} 웹소켓에서 수신한 메시지 처리를 위한 커서 */
    const wsCursorRef = useRef(0);
    /** @type {React.MutableRefObject<object>} 방별 상대방의 마지막 읽음 메시지 ID. { [roomId]: number } */
    const readFloorByRoomRef = useRef({});
    /** @type {React.MutableRefObject<object>} 방별 내가 보낸 마지막 읽음 처리 ID. { [roomId]: number } */
    const lastReadSentByRoomRef = useRef({});

    // --- 웹소켓 연결 (WebSocket Connection) ---
    // `useChatSocket` 훅을 사용하여 웹소켓 연결 및 메시지 수발신 기능 사용
    const { connected, messages: wsMessages, sendText, sendImage, sendRead, setOnBadge, sendLeave } = useChatSocket({
        roomId: me?.id ? activeId ?? 0 : 0,
        me: me ?? undefined,
        baseUrl: process.env.NEXT_PUBLIC_API_BASE,
    });

    // --- 데이터 페칭 (Data Fetching) ---

    // [1] 활성 채팅방 변경 시, 해당 방의 초기 메시지 목록 로드
    useEffect(() => {
        if (!activeId || !me?.id) return;

        // 이미 메시지 데이터가 있으면 다시 로드하지 않음 (캐시 역할)
        if (messagesByRoom[activeId]) return;

        wsCursorRef.current = 0; // 새 방에 들어왔으므로 웹소켓 커서 초기화
        setError(null);

        const loadInitialMessages = async () => {
            try {
                const size = 30; // 한 번에 불러올 메시지 수
                const messageList = await fetchMessages(activeId, size);

                // 상대방의 마지막 읽음 위치를 가져와서 내가 보낸 메시지의 읽음 상태(read)를 업데이트
                try {
                    const peerId = resolvePeerId(activeChat, me.id);
                    if (peerId) {
                        const res = await fetchLastSeen(activeId, peerId);
                        const peerLastSeen = Number(res?.lastSeenMessageId || 0);
                        readFloorByRoomRef.current[activeId] = Math.max(
                            readFloorByRoomRef.current[activeId] || 0,
                            peerLastSeen
                        );
                    }
                } catch (e) {
                    console.warn("상대방 마지막 읽음 위치 조회 실패", e);
                }

                const floor = readFloorByRoomRef.current[activeId] || 0;
                const mapped = (messageList || [])
                    .map((m) => mapMessageToUi(m, me, activeChat?.counterpartyName, activeChat?.counterpartyProfile))
                    .filter((x) => x.type !== "SYSTEM")
                    .map((x) => {
                        const mid = Number(x.id || x.messageId);
                        // 내가 보낸 메시지이고, 상대가 읽은 위치보다 이전 메시지이면 `read: true`로 설정
                        return x.fromMe && Number.isFinite(mid) && mid <= floor
                            ? { ...x, read: true }
                            : x;
                    });

                // 시스템 안내 메시지와 함께 메시지 목록 상태 업데이트
                setMessagesByRoom((prev) => ({
                    ...prev,
                    [activeId]: [createSystemIntro(activeId), ...mapped],
                }));
                // 불러온 메시지 수가 요청한 수와 같으면 더 이전 메시지가 있을 가능성이 있다고 판단
                setHasMoreBefore((p) => ({ ...p, [activeId]: (messageList?.length || 0) === size }));

            } catch (e) {
                console.error("메시지 목록 로딩 실패", e);
                setError("메시지를 불러오는 중 오류가 발생했습니다.");
                setMessagesByRoom((prev) => ({ ...prev, [activeId]: [createSystemIntro(activeId)] }));
                setHasMoreBefore((p) => ({ ...p, [activeId]: false }));
            }
        };

        loadInitialMessages();
    }, [activeId, me?.id, activeChat, messagesByRoom]);


    // [2] 웹소켓을 통해 들어오는 실시간 메시지 처리
    useEffect(() => {
        if (!Array.isArray(wsMessages) || activeId == null || !me?.id) return;

        // wsCursorRef를 이용해 이미 처리한 메시지는 건너뛰고 새로운 메시지만 처리
        const newMessages = wsMessages.slice(wsCursorRef.current);
        wsCursorRef.current = wsMessages.length;

        if (newMessages.length === 0) return;

        setMessagesByRoom((prev) => {
            const currentRoomMessages = [...(prev[activeId] || [])];

            for (const msg of newMessages) {
                const type = (msg?.type || "").toUpperCase();

                // 읽음 이벤트 처리
                if (type === "READ") {
                    const readerId = Number(msg.readerId);
                    const upTo = Number(msg.lastSeenMessageId || 0);
                    // 내가 보낸 메시지에 대한 상대방의 읽음 처리
                    if (Number.isFinite(upTo) && readerId && readerId !== Number(me.id)) {
                        const newFloor = Math.max(readFloorByRoomRef.current[activeId] || 0, upTo);
                        readFloorByRoomRef.current[activeId] = newFloor;
                        // 화면에 있는 메시지들의 `read` 상태 업데이트
                        for (let i = currentRoomMessages.length - 1; i >= 0; i--) {
                            const x = currentRoomMessages[i];
                            if (!x || x.__divider || x.type === "SYSTEM" || !x.fromMe) continue;
                            const mid = Number(x.id || x.messageId);
                            if (Number.isFinite(mid) && mid <= newFloor && !x.read) {
                                currentRoomMessages[i] = { ...x, read: true };
                            }
                        }
                    }
                    continue; // 다음 메시지로
                }

                // 일반 메시지 처리
                const uiMessage = mapMessageToUi(msg, me, activeChat?.counterpartyName, activeChat?.counterpartyProfile);
                if (uiMessage.__ignore || uiMessage.type === "SYSTEM") continue;

                // 낙관적 업데이트: 임시 ID(tempId)가 일치하는 메시지를 실제 서버 메시지로 교체
                if (msg.tempId) {
                    const idx = currentRoomMessages.findIndex((x) => x.tempId === msg.tempId);
                    if (idx >= 0) {
                        currentRoomMessages[idx] = { ...uiMessage, tempId: undefined };
                        continue;
                    }
                }
                // 중복 메시지 방지
                if (typeof msg.messageId === 'number' && currentRoomMessages.some(x => x.id === msg.messageId)) continue;

                currentRoomMessages.push(uiMessage);
            }

            return { ...prev, [activeId]: currentRoomMessages };
        });
    }, [wsMessages, activeId, me?.id, activeChat]);


    // [3] 내가 메시지를 읽었음을 서버에 알림 (읽음 처리)
    useEffect(() => {
        if (!activeId || !me?.id) return;
        
        const currentRoomMessages = messagesByRoom[activeId] || [];
        const lastMessageId = Math.max(...currentRoomMessages
            .filter(m => !m.__divider && m.type !== 'SYSTEM')
            .map(m => Number(m.id || m.messageId))
            .filter(Number.isFinite)
        );

        if (!lastMessageId) return;

        const lastSentId = lastReadSentByRoomRef.current[activeId] || 0;
        if (lastSentId >= lastMessageId) return; // 이미 처리했으면 중복 전송 방지

        lastReadSentByRoomRef.current[activeId] = lastMessageId;

        // 웹소켓 또는 REST API를 통해 읽음 상태 전송
        if (connected && typeof sendRead === 'function') {
            sendRead(lastMessageId);
        } else {
            markReadUpTo(activeId, me.id, lastMessageId).catch(() => {});
        }

    }, [messagesByRoom, activeId, me?.id, connected, sendRead]);


    // --- 콜백 함수 (Callback Functions) ---

    /**
     * 메시지 전송 함수 (텍스트 또는 이미지)
     * @param {{text?: string, file?: File}}
     */
    const sendMessage = useCallback(async ({ text, file }) => {
        if (!me?.id || !activeId) return;
        const trimmedText = (text || "").trim();
        if (!trimmedText && !file) return;

        const tempId = `tmp-${activeId}-${Date.now()}`;
        // [1] 낙관적 업데이트: UI에 임시 메시지를 먼저 표시
        const optimisticMessage = {
            id: tempId,
            tempId,
            fromMe: true,
            senderName: me.name,
            avatar: me.profile || "",
            text: trimmedText,
            imageUrl: file ? URL.createObjectURL(file) : null,
            type: file ? "IMAGE" : "TEXT",
            ts: new Date(),
            read: false,
        };
        setMessagesByRoom(prev => ({
            ...prev,
            [activeId]: [...(prev[activeId] || []), optimisticMessage],
        }));

        // [2] 실제 서버로 데이터 전송
        try {
            let imageUrl = null;
            if (file) {
                const res = await uploadChatImage(file);
                imageUrl = res?.url || null;
            }

            // 웹소켓 또는 REST API를 통해 메시지 전송
            if (connected) {
                if (imageUrl) sendImage(imageUrl, tempId);
                if (trimmedText) sendText(trimmedText, tempId);
            } else {
                await sendMessageRest(activeId, { text: trimmedText, imageUrl, tempId, senderId: me.id });
            }
        } catch (e) {
            console.error("메시지 전송 실패", e);
            setError("메시지 전송에 실패했습니다.");
            // TODO: 실패한 메시지를 UI에서 제거하거나 '실패' 상태로 표시하는 로직 추가
        }
    }, [me, activeId, connected, sendText, sendImage]);


    /**
     * 이전 메시지 더 불러오기 함수 (무한 스크롤)
     */
    const loadMoreBefore = useCallback(async () => {
        if (!activeId || !me?.id || loadingBefore[activeId] || !hasMoreBefore[activeId]) return;

        const currentRoomMessages = messagesByRoom[activeId] || [];
        const before = oldestRealMessageId(currentRoomMessages);
        if (!before) {
            setHasMoreBefore(p => ({ ...p, [activeId]: false }));
            return;
        }

        setLoadingBefore(p => ({ ...p, [activeId]: true }));
        setError(null);
        try {
            const size = 30;
            const messageList = await fetchMessages(activeId, size, before);
            
            const floor = readFloorByRoomRef.current[activeId] || 0;
            const mapped = (messageList || [])
                .map(m => mapMessageToUi(m, me, activeChat?.counterpartyName, activeChat?.counterpartyProfile))
                .filter(x => x.type !== 'SYSTEM')
                .map(x => {
                    const mid = Number(x.id || x.messageId);
                    return x.fromMe && Number.isFinite(mid) && mid <= floor ? { ...x, read: true } : x;
                });

            setMessagesByRoom(prev => {
                const existing = prev[activeId] || [];
                return {
                    ...prev,
                    [activeId]: [
                        ...(existing[0]?.__systemIntro ? [existing[0]] : []),
                        ...mapped,
                        ...(existing[0]?.__systemIntro ? existing.slice(1) : existing),
                    ],
                };
            });
            setHasMoreBefore(p => ({ ...p, [activeId]: (messageList?.length || 0) === size }));

        } catch (e) {
            console.error("이전 메시지 로딩 실패", e);
            setError("이전 메시지를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoadingBefore(p => ({ ...p, [activeId]: false }));
        }
    }, [activeId, me?.id, loadingBefore, hasMoreBefore, messagesByRoom, activeChat]);


    // --- 메모이제이션된 값 (Memoized Values) ---

    /** 날짜 구분선이 포함된, 현재 활성방의 최종 메시지 목록 */
    const messages = useMemo(() => {
        const rawList = messagesByRoom[activeId] ?? [];
        return withDateDividers(rawList);
    }, [messagesByRoom, activeId]);


    // --- 반환 (Return) ---

    return {
        messages,
        sendMessage,
        loadMoreBefore,
        loadingBefore: loadingBefore[activeId] || false,
        hasMoreBefore: hasMoreBefore[activeId] ?? false,
        connected,
        error,
        // `useChatRooms` 훅에서 `sendLeave`를 사용하기 위해 전달
        sendLeave,
        // `MarketChat`에서 `setOnBadge`를 사용하기 위해 전달
        setOnBadge,
    };
}
