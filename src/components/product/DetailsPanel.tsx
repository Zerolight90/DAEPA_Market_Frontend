//src/components/product/DetailsPanel.js
import styles from "./Details-panel.module.css";
import SafetyTips from "@/components/ui/SafetyTips";

function unique(arr = []) { return Array.from(new Set(arr.filter(Boolean))); }

export default function DetailsPanel({ item }) {
    const chips = unique([item.category, item.mid, item.sub, ...(item.tags || [])]);
    const descLines = (item.description || "상세 설명이 없습니다.").split("\n").filter(Boolean);

    return (
        <section className={styles.panel}>
            {chips.length > 0 && (
                <div className={styles.chips}>
                    {chips.map((t, i) => <span key={`${t}-${i}`} className={styles.chip}>#{t}</span>)}
                </div>
            )}
            <div className={styles.desc}>
                {descLines.map((line, i) => <p key={i}>{line}</p>)}
            </div>
            <SafetyTips />
        </section>
    );
}
