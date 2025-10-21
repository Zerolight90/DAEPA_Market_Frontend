import s from "./SafetyTips.module.css";

export default function SafetyTips() {
    return (
        <div className={s.box}>
            <strong className={s.title}>안전거래 TIP</strong>
            <ul className={s.list}>
                <li>외부 메신저 유도/선입금 요구 시 주의하세요.</li>
                <li>수상한 링크는 클릭하지 말고 안전결제를 이용하세요.</li>
                <li>직거래 시 사람 많은 장소에서 만나고 영수증/작동 여부 확인하세요.</li>
            </ul>
        </div>
    );
}
