"use client";

import { useEffect, useState } from "react";
import styles from "./RightPanelClient.module.css";
import { useModal } from "@/components/ui/modal/ModalProvider";
import ShareModal from "@/components/product/modals/ShareModal";
import ReportModal from "@/components/product/modals/ReportModal";
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
                                             seller, // { id } or { uIdx } or { u_idx }
                                         }) {
    const [wishes, setWishes] = useState(wishCount);
    const [chatLoading, setChatLoading] = useState(false);
    const [me, setMe] = useState(null); // 로그인 유저 정보
    const modal = useModal();
    const router = useRouter();

    // 1) 로그인 정보 가져오기
    useEffect(() => {
        (async () => {
            try {
                const m = await fetchMe(); // { userId, ... } 형태라고 가정
                setMe(m);
            } catch (e) {
                // 비로그인 상태면 그냥 null 유지
            }
        })();
    }, []);

    // 2) 내 id / 판매자 id 추출 (여러 케이스 방어)
    const myId =
        me?.userId ?? me?.id ?? me?.uIdx ?? me?.u_idx ?? null;

    const sellerId =
        seller?.id ?? seller?.uIdx ?? seller?.u_idx ?? null;

    const isOwner =
        myId && sellerId && String(myId) === String(sellerId);

    // 공통 모달
    const openShare = () =>
        modal.open(({ id, close }) => <ShareModal id={id} close={close} />);

    const openReport = () =>
        modal.open(({ id, close }) => (
            <ReportModal id={id} close={close} itemId={itemId} />
        ));

    const openBuy = () =>
        modal.open(({ id, close }) => (
            <BuyModal id={id} close={close} itemId={itemId} title={title} price={price} />
        ));

    const openSecBuy = () =>
        modal.open(({ id, close }) => (
            <BuySecModal id={id} close={close} itemId={itemId} title={title} price={price} />
        ));

    // 찜
    const addWish = () => setWishes((v) => v + 1);

    // 채팅하기 (내 상품이면 막힘)
    const openChat = async () => {
        if (chatLoading) return;
        try {
            setChatLoading(true);

            const meInfo = me || (await fetchMe());
            if (!meInfo?.userId) {
                router.push(`/login?next=${encodeURIComponent(window.location.href)}`);
                return;
            }

            if (!sellerId || !itemId) {
                alert("판매자 또는 상품 정보가 없습니다.");
                return;
            }

            // 내 상품이면 막기
            if (String(sellerId) === String(meInfo.userId)) {
                alert("내 상품에는 채팅을 시작할 수 없습니다.");
                return;
            }

            const res = await openChatRoom({
                productId: Number(itemId),
                sellerId: Number(sellerId),
            });

            if (!res?.roomId) {
                alert("채팅방 생성에 실패했습니다.");
                return;
            }

            router.push(`/chat?roomId=${res.roomId}`);
        } catch (e) {
            console.error("openChat failed", e);
            alert("채팅 시작 중 오류가 발생했습니다.");
        } finally {
            setChatLoading(false);
        }
    };

    // ────────────────
    // 오너 전용 액션
    // ────────────────
    const handleDelete = async () => {
        if (!confirm("정말로 삭제하시겠습니까?")) return;
        const res = await fetch(`/api/products/${itemId}/delete`, {
            method: "POST",
            credentials: "include",
        });
        if (res.ok) {
            alert("삭제되었습니다.");
            router.push("/");
        } else {
            alert("삭제에 실패했습니다.");
        }
    };

    const handleBump = async () => {
        const res = await fetch(`/api/products/${itemId}/bump`, {
            method: "POST",
            credentials: "include",
        });
        if (res.ok) {
            alert("끌어올리기 완료되었습니다.");
        } else {
            alert("끌어올리기에 실패했습니다.");
        }
    };

    const handleComplete = async () => {
        const res = await fetch(`/api/products/${itemId}/complete`, {
            method: "POST",
            credentials: "include",
        });
        if (res.ok) {
            alert("판매완료 처리되었습니다.");
        } else {
            alert("판매완료 처리에 실패했습니다.");
        }
    };

    // ────────────────
    // 렌더링
    // ────────────────
    if (isOwner) {
        // ✅ 내가 올린 상품일 때
        return (
            <>
                <div className={styles.btnRow}>
                    <button
                        className={styles.btnChat}
                        onClick={() => router.push(`/store/${itemId}/edit`)}
                    >
                        수정
                    </button>
                    <button className={styles.btnWish} onClick={handleDelete}>
                        삭제
                    </button>
                </div>

                <div className={styles.btnRow}>
                    <button className={styles.btnBuy} onClick={handleBump}>
                        끌어올리기
                    </button>
                    <button className={styles.btnBuy} onClick={handleComplete}>
                        판매완료
                    </button>
                </div>

                <div className={styles.utils}>
                    <button className={styles.link} onClick={openShare}>
                        공유
                    </button>
                    <span className={styles.dot}>·</span>
                    <button className={styles.link} onClick={openReport}>
                        신고하기
                    </button>
                </div>
            </>
        );
    }

    // ✅ 일반 사용자일 때 (원래 버튼들)
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
                <button className={styles.btnBuy} onClick={openBuy}>
                    일반결제 구매
                </button>
                <button className={styles.btnBuy} onClick={openSecBuy}>
                    안전결제 구매
                </button>
            </div>

            <div className={styles.safe}>안전결제로 사기 걱정 없이 거래해요</div>

            <div className={styles.utils}>
                <button className={styles.link} onClick={openShare}>
                    공유
                </button>
                <span className={styles.dot}>·</span>
                <button className={styles.link} onClick={openReport}>
                    신고하기
                </button>
            </div>
        </>
    );
}
