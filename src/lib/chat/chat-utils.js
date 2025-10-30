// 날짜/문자열 유틸
export const pad2 = (n) => String(n).padStart(2, "0");
const toDate = (v) => (v instanceof Date ? v : new Date(v));
const isToday = (d) => {
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};
export const fmtHHMM = (v) => {
    const d = toDate(v);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
export const fmtDateLine = (v) => {
    const d = toDate(v);
    if (isToday(d)) return "오늘";
    const yo = ["일","월","화","수","목","금","토"][d.getDay()];
    return `${d.getFullYear()}.${pad2(d.getMonth()+1)}.${pad2(d.getDate())} (${yo})`;
};

// 시스템 인트로(클라 전용)
export function createSystemIntro(roomId) {
    return {
        id: `sys-${roomId}`,
        type: "SYSTEM",
        text: "안전한 거래를 위해 개인정보를 포함한 내용은 채팅에서 삼가해주세요.",
        ts: new Date(0),
        fromMe: false,
        senderName: "system",
        avatar: null,
        read: true,
        __systemIntro: true,
    };
}

// 내 역할
export function resolveRole(room, meId) {
    if (room?.sellerId != null) return Number(room.sellerId) === Number(meId) ? "판매자" : "구매자";
    if (typeof room?.isSeller === "boolean") return room.isSeller ? "판매자" : "구매자";
    if (typeof room?.role === "string") return room.role;
    return null;
}

/**
 * 서버 DTO -> UI (빈 버블 방지 버전)
 * - READ/ROOM_BADGE/TOTAL_BADGE 같은 비채팅 이벤트는 __ignore 처리
 * - TEXT/IMAGE만 렌더
 * - 텍스트/이미지 모두 없으면 __ignore
 */
export function mapMessageToUi(m, me, otherName, otherAvatar) {
    const rawType = (m.type || "").toUpperCase();

    // 비채팅 이벤트는 화면에 그리지 않음
    if (["READ", "ROOM_BADGE", "TOTAL_BADGE"].includes(rawType)) {
        return { __ignore: true };
    }

    // 시스템 메시지
    const isSystem = rawType === "SYSTEM" || m.senderId === 0 || m.isSystem === true;
    if (isSystem) {
        return {
            id: m.messageId ?? `sys-${m.roomId || "r"}-${m.time || Date.now()}`,
            type: "SYSTEM",
            text: m.content || m.text || "안전한 거래를 위해 개인정보를 포함한 내용은 채팅에서 삼가해주세요.",
            ts: m.time ? new Date(m.time) : new Date(0),
            fromMe: false,
            senderName: "system",
            avatar: null,
            read: true,
        };
    }

    // 타입 보정: TEXT/IMAGE만 허용
    const type =
        rawType === "TEXT" || rawType === "IMAGE"
            ? rawType
            : (m.imageUrl ? "IMAGE" : "TEXT");

    const fromMe = Number(m.senderId) === Number(me.id);
    const text = m.content || m.text || "";
    const imageUrl = m.imageUrl || null;

    // 텍스트/이미지 모두 없으면 렌더하지 않음
    if (!imageUrl && String(text).trim() === "") {
        return { __ignore: true };
    }

    return {
        id: m.messageId ?? `tmp-echo-${m.roomId || "r"}-${m.time || Date.now()}`,
        type,
        fromMe,
        senderName: fromMe ? me.name : otherName,
        avatar: fromMe ? me.profile : otherAvatar,
        text,
        imageUrl,
        ts: m.time ? new Date(m.time) : new Date(),
        read: false,
    };
}

// 날짜 디바이더 삽입
export function withDateDividers(list) {
    return list.reduce((acc, cur, idx, all) => {
        if (cur.type === "SYSTEM") { acc.push(cur); return acc; }
        const prev = all[idx - 1];
        const prevTs = prev?.type === "SYSTEM" ? null : prev?.ts;
        const needDivider = !prevTs ||
            prevTs.getFullYear() !== cur.ts.getFullYear() ||
            prevTs.getMonth() !== cur.ts.getMonth() ||
            prevTs.getDate() !== cur.ts.getDate();
        if (needDivider) acc.push({ __divider: true, label: fmtDateLine(cur.ts), key: `d-${cur.id}` });
        acc.push(cur);
        return acc;
    }, []);
}

// 무한스크롤용 가장 오래된 실제 메시지 ID
export function oldestRealMessageId(list) {
    const ids = (list || [])
        .filter((m) => !m.__divider && m.type !== "SYSTEM")
        .map((m) => Number(m.id || m.messageId))
        .filter((n) => Number.isFinite(n));
    if (!ids.length) return null;
    return Math.min(...ids);
}
