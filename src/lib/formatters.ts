export const toKRW = (n: number | string | undefined | null): string =>
    (Number(n) || 0).toLocaleString("ko-KR") + " 원";

export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "년 전";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "달 전";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "일 전";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "시간 전";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "분 전";

    return "방금 전";
}
