//src/components/product/RightPanelClient.js

"use client";

import { useState } from "react";
import styles from "./RightPanelClient.module.css";
import { useModal } from "@/components/ui/modal/ModalProvider";
import ShareModal from "@/components/product/modals/ShareModal";
import ReportModal from "@/components/product/modals/ReportModal";
// ChatModal은 이번 흐름에선 사용 안 함. 유지하려면 주석 해제해서 쓰세요.
// import ChatModal from "@/components/product/modals/ChatModal";
import BuyModal from "@/components/product/modals/BuyModal";
import BuySecModal from "@/components/product/modals/BuySecModal";

import { useRouter } from "next/navigation";
import { fetchMe, openChatRoom } from "@/lib/chat/api";

export default function RightPanelClient({
                                             itemId,
                                             title,
                                             price,
                                             wishCount = 0,
                                             description = "",
                                             seller,
                                         }) {
    const [wishes, setWishes] = useState(wishCount);
    const [chatLoading, setChatLoading] = useState(false);
    const modal = useModal();
    const router = useRouter();

    const addWish = () => setWishes((v) => v + 1);

    const openShare = () =>
        modal.open(({ id, close }) => <ShareModal id={id} close={close} />);

    const openReport = () =>
        modal.open(({ id, close }) => (
            <ReportModal id={id} close={close} itemId={itemId} />
        ));

    //  채팅하기 (방 생성/재사용 → 채팅 페이지 이동)
    const openChat = async () => {
        if (chatLoading) return;
        try {
            setChatLoading(true);

            // 1) 로그인 확인
            const me = await fetchMe(); // { userId } | null
            if (!me?.userId) {
                router.push(`/login?next=${encodeURIComponent(window.location.href)}`);
                return;
            }

            // 2) 판매자/상품 검증
            if (!seller?.id || !itemId) {
                alert("판매자 또는 상품 정보가 없습니다.");
                return;
            }
            if (Number(seller.id) === Number(me.userId)) {
                alert("내 상품에는 채팅을 시작할 수 없습니다.");
                return;
            }

            // 3) 방 생성/재사용
            const res = await openChatRoom({
                productId: Number(itemId),
                sellerId: Number(seller.id),
            }); // { roomId, created, identifier }

            if (!res?.roomId) {
                alert("채팅방 생성에 실패했습니다.");
                return;
            }

            // 4) 채팅 페이지로 이동
            router.push(`/chat?roomId=${res.roomId}`);
        } catch (e) {
            console.error("openChat failed", e);
            alert(e?.response?.data?.message || "채팅 시작 중 오류가 발생했습니다.");
        } finally {
            setChatLoading(false);
        }
    };

    const openBuy = () =>
        modal.open(({ id, close }) => (
            <BuyModal id={id} close={close} itemId={itemId} title={title} price={price} />
        ));

    const openSecBuy = () => modal.open(({ id, close }) => (
        <BuySecModal id={id} close={close} itemId={itemId} title={title} price={price} />
    ));

    return (
        <>
            <div className={styles.btnRow}>
                <button className={styles.btnWish} onClick={addWish}>
                    찜 {wishes}
                </button>

                <button
                    className={styles.btnChat}
                    onClick={openChat}
                    disabled={chatLoading}
                >
                    {chatLoading ? "연결 중…" : "채팅하기"}
                </button>
            </div>

            <div className={styles.btnRow}>
                <button className={styles.btnBuy} onClick={openBuy}>일반결제 구매</button>
                <button className={styles.btnBuy} onClick={openSecBuy}>안전결제 구매</button>
            </div>

            <div className={styles.safe}>안전결제로 사기 걱정 없이 거래해요</div>

            <div className={styles.utils}>
                <button className={styles.link} onClick={openShare}>공유</button>
                <span className={styles.dot}>·</span>
                <button className={styles.link} onClick={openReport}>신고하기</button>
            </div>
        </>
    );
}
