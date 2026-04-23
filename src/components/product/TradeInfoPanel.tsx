// src/components/product/TradeInfoPanel.js
import styles from "./TradeInfoPanel.module.css";

export default function TradeInfoPanel({
                                           item,
                                           condition,
                                           dealType,
                                           meetLocation,
                                       }: {
    item?: any;
    condition?: any;
    dealType?: any;
    meetLocation?: any;
}) {
    const _dealType =
        dealType ??
        item?.dealType ??
        "거래 방식 미지정";

    const _condition =
        condition ??
        item?.condition ??
        "상품 상태 미지정";

    return (
        <div className={styles.box} aria-label="거래 정보">
            {/* 거래 방식 */}
            <div className={styles.row}>
                <span className={styles.icon}>📦</span>
                <span className={styles.label}>거래 방식</span>
                <span className={styles.value}>{_dealType}</span>
            </div>

            {/* 상품 상태 */}
            <div className={styles.row}>
                <span className={styles.icon}>
                    {_condition === "새상품" ? "🎁" : "♻️"}
                </span>
                <span className={styles.label}>상품 상태</span>
                <span className={styles.badge}>{_condition}</span>
            </div>
        </div>
    );
}
