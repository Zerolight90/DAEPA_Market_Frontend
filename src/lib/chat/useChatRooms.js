// src/lib/chat/useChatRooms.js
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { fetchRooms, leaveRoomRest, fetchMe } from "@/lib/chat/api";
import { normalizeRoomDto } from "./chat-utils";

/**
 * 채팅방 목록과 관련된 상태 및 로직을 관리하는 훅
 * @param {object} me - 현재 로그인한 사용자 정보 객체
 * @returns {object} 채팅방 관련 상태와 핸들러 함수들
 */
export function useChatRooms(me) {
    const search = useSearchParams();
    const initialRoomId = search.get("roomId") ? Number(search.get("roomId")) : null;

    // --- 상태 (State) ---

    /** @type {[Array<object>, function]} 채팅방 전체 목록 */
    const [rooms, setRooms] = useState([]);
    /** @type {[number | null, function]} 현재 활성화된 채팅방 ID */
    const [activeId, setActiveId] = useState(initialRoomId);
    /** @type {[string | null, function]} 데이터 로딩 중 발생하는 에러 메시지 */
    const [error, setError] = useState(null);
    /** @type {[boolean, function]} 데이터 로딩 상태 */
    const [loading, setLoading] = useState(true);

    // --- Ref ---
    const defaultPickedRef = useRef(false); // 최초 방 선택 로직이 실행되었는지 여부

    // --- 데이터 페칭 (Data Fetching) ---

    // [1] 방 목록 가져오기
    useEffect(() => {
        // 로그인한 사용자 정보가 없으면 중단
        if (!me?.id) {
            setLoading(false);
            return;
        }

        const loadRooms = async () => {
            setLoading(true);
            setError(null);
            try {
                const roomList = await fetchRooms(me.id);
                // 서버에서 받은 데이터를 프론트엔드 모델에 맞게 정규화
                const normalized = (Array.isArray(roomList) ? roomList : [])
                    .map((r) => normalizeRoomDto(r, me.id))
                    .filter(Boolean);

                // roomId를 기준으로 중복 제거
                const deduped = Array.from(
                    new Map(normalized.map((r) => [String(r.roomId), r])).values()
                );
                setRooms(deduped);

                // 최초 진입 시, URL에 특정 roomId가 없으면 목록의 첫 번째 방을 활성화
                if (!defaultPickedRef.current) {
                    if (!initialRoomId && deduped.length) {
                        setActiveId(deduped[0].roomId);
                    }
                    defaultPickedRef.current = true;
                }
            } catch (e) {
                console.error("채팅방 목록을 불러오는 데 실패했습니다.", e);
                setError("채팅방 목록을 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        loadRooms();
    }, [me?.id, initialRoomId]);


    // --- 메모이제이션된 값 (Memoized Values) ---

    /** 현재 활성화된 채팅방의 상세 정보 */
    const activeChat = useMemo(
        () => rooms.find((r) => String(r.roomId) === String(activeId)),
        [rooms, activeId]
    );
    
    // --- 반환 (Return) ---

    return {
        rooms,
        setRooms, // 방 나가기 처리를 위해 외부로 노출
        activeId,
        setActiveId,
        activeChat,
        loading,
        error,
    };
}


/**
 * 현재 로그인한 사용자 정보를 가져오는 간단한 훅
 * @returns {{me: object | null, loading: boolean}}
 */
export function useMe() {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetchMe();
                // SNS 로그인 사용자는 userId가 없을 수 있으므로, 백엔드 응답에 따라 유연하게 대처 필요
                // 현재는 userId가 있는 경우만 사용자 정보를 설정함 (기존 로직 유지)
                if (res?.userId) {
                    setMe({ id: res.userId, name: `유저${res.userId}`, profile: "" });
                } else {
                    setMe(null);
                }
            } catch {
                setMe(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return { me, loading };
}
