export const toKRW = (n) =>
    (Number(n) || 0).toLocaleString("ko-KR") + " 원";

export function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000; // seconds in a year
    if (interval > 1) {
        return Math.floor(interval) + "년 전";
    }
    interval = seconds / 2592000; // seconds in a month
    if (interval > 1) {
        return Math.floor(interval) + "달 전";
    }
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) {
        return Math.floor(interval) + "일 전";
    }
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) {
        return Math.floor(interval) + "시간 전";
    }
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) {
        return Math.floor(interval) + "분 전";
    }
    return "방금 전";
}
