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
                                             seller,
                                             soldOut = false,   // 서버에서 주는 기존 값
                                             dealState = null,  // d_sell 그대로 (1:완료, 2:거래중)
                                         }) {
    const [wishes, setWishes] = useState(wishCount);
    const [chatLoading, setChatLoading] = useState(false);
    const [me, setMe] = useState(null);

    const modal = useModal();
    const router = useRouter();

    // 내 정보
    useEffect(() => {
        (async () => {
            try {
                const m = await fetchMe();
                setMe(m);
            } catch {
                // not logged in
            }
        })();
    }, []);

    const myId =
        me?.userId ?? me?.id ?? me?.uIdx ?? me?.u_idx ?? null;
    const sellerId =
        seller?.id ?? seller?.uIdx ?? seller?.u_idx ?? null;
    const isOwner = myId && sellerId && String(myId) === String(sellerId);

    // 판매자 화면에서의 진짜 판매완료 판단(완료일 때만 잠금)
    const isReallySoldForOwner = soldOut || dealState === 1;
    // 구매자(타인)에게는 거래중(2)도 잠금처럼 보이게
    const isSoldLikeForOthers = soldOut || dealState === 1 || dealState === 2;

    const [localSoldOut, setLocalSoldOut] = useState(soldOut || dealState === 1);

    // 현재 페이지 URL (모달 공유용)
    const currentUrl =
        typeof window !== "undefined" ? window.location.href : "";

    // ────────────── 모달 열기 ──────────────
     const openShare = () =>
           modal.open(({ id, close }) => (
                 <ShareModal
       open={true}
           onClose={close}
           title={title}
           url={currentUrl}
               // image={...}
             />
           ));

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

    // 채팅
    const openChat = async () => {
        if (chatLoading) return;
        try {
            setChatLoading(true);

            const meInfo = me || (await fetchMe());
            const myUid =
                meInfo?.userId ?? meInfo?.id ?? meInfo?.uIdx ?? meInfo?.u_idx;

            if (!myUid) {
                alert("로그인 후 이용해주세요.");
                router.push(`/sing/login?next=${encodeURIComponent("/chat")}`);
                return;
            }

            if (!sellerId || !itemId) {
                alert("판매자 또는 상품 정보가 없습니다.");
                return;
            }

            if (String(sellerId) === String(myUid)) {
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

    // 오너 전용
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
            setLocalSoldOut(true);
            router.refresh?.();
        } else {
            alert("판매완료 처리에 실패했습니다.");
        }
    };

    // ───────────────── 렌더링 ─────────────────

    // 1) 내가 올린 상품
    if (isOwner) {
        // 1-1) 내가 올린 건데 진짜 팔린 상태(d_sell=1)
        if (isReallySoldForOwner || localSoldOut) {
            return (
                <>
                    <div className={styles.btnRow}>
                        <button
                            className={styles.btnChat}
                            disabled
                            style={{ cursor: "default", opacity: 0.9 }}
                        >
                            이미 판매한 상품입니다.
                        </button>
                    </div>
                    <div className={styles.utils}>
                        <button className={styles.link} onClick={openShare}>
                            공유하기
                        </button>
                    </div>
                </>
            );
        }

        // 1-2) 내가 올린 건데 d_sell=2 (거래중) → 원래 버튼 그대로
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
                        공유하기
                    </button>
                </div>
            </>
        );
    }

    // 2) 다른 사람이 보는 화면 + 잠겨 있는 상태(d_sell=1 or 2)
    if (isSoldLikeForOthers) {
        return (
            <>
                <div className={styles.btnRow}>
                    <button
                        className={styles.btnChat}
                        onClick={openChat}
                        disabled={chatLoading}
                    >
                        {chatLoading ? "연결 중…" : "채팅하기"}
                    </button>
                </div>
                <div className={styles.utils}>
                    <button className={styles.link} onClick={openShare}>
                        공유하기
                    </button>
                    <span className={styles.dot}>.</span>
                    <button className={styles.link} onClick={openReport}>
                        신고하기
                    </button>
                </div>
            </>
        );
    }

    // 3) 다른 사람이 보는 화면 + 정상 판매중
    return (
        <>
            <div className={styles.btnRow}>
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
                    공유하기
                </button>
                <span className={styles.dot}>.</span>
                <button className={styles.link} onClick={openReport}>
                    신고하기
                </button>
            </div>
        </>
    );
}
