"use client";

import { useState } from "react";
import styles from "./RightPanelClient.module.css";
import { useModal } from "@/components/ui/modal/ModalProvider";
import ShareModal from "@/components/product/modals/ShareModal";
import ReportModal from "@/components/product/modals/ReportModal";
import ChatModal from "@/components/product/modals/ChatModal";
import BuyModal from "@/components/product/modals/BuyModal";
import BuySecModal from "@/components/product/modals/BuySecModal";

export default function RightPanelClient({ itemId, title, price, wishCount = 0, description = "", seller }) {
    const [wishes, setWishes] = useState(wishCount);
    const modal = useModal();

    const addWish = () => setWishes((v) => v + 1);

    const openShare = () => modal.open(({ id, close }) => (
        <ShareModal id={id} close={close} />
    ));

    const openReport = () => modal.open(({ id, close }) => (
        <ReportModal id={id} close={close} itemId={itemId} />
    ));


    const openChat = () => modal.open(({ id, close }) => (
        <ChatModal id={id} close={close} seller={seller} />
    ));

    const openBuy = () => modal.open(({ id, close }) => (
        <BuyModal id={id} close={close} itemId={itemId} title={title} price={price} />
    ));

    const openSecBuy = () => modal.open(({ id, close }) => (
        <BuySecModal id={id} close={close} itemId={itemId} title={title} price={price} />
    ));

    return (
        <>
            <div className={styles.btnRow}>
                <button className={styles.btnWish} onClick={addWish}>찜 {wishes}</button>
                <button className={styles.btnChat} onClick={openChat}>채팅하기</button>
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
