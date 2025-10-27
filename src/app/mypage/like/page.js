// src/app/mypage/like/page.js
"use client";

import { useEffect, useState } from "react";
import ProductsGrid from "@/components/category/ProductsGrid";     // ✅ 카테고리와 동일하게 그리드 컴포넌트 사용
import panel from "../mypage.module.css";

export default function MyLikePage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                // 내 찜 목록
                const res = await fetch("/api/favorites", { credentials: "include" });
                if (!res.ok) {
                    console.error("찜 목록 불러오기 실패:", res.status);
                    setItems([]);
                    return;
                }

                const data = await res.json(); // [{ pdIdx, pdTitle, pdPrice, imageUrl }, ...]

                // ✅ 카테고리 페이지와 동일한 카드 item 포맷으로 매핑
                const mapped = (data ?? []).map((p) => ({
                    id: p.pdIdx,
                    title: p.pdTitle ?? "",
                    price: Number(p.pdPrice ?? 0),
                    thumbnail: p.imageUrl ? `/uploads/${p.imageUrl}` : "/no-image.png",
                    location: "",         // 필요 시 서버에서 내려주면 그대로 매핑
                    createdAt: "",        // 필요 시 서버에서 내려주면 그대로 매핑
                }));

                setItems(mapped);
            } catch (e) {
                console.error("찜 목록 호출 중 오류:", e);
                setItems([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <main className={panel.wrap}>
            <section className={panel.content}>
                <div className={panel.panel}>
                    <div className={panel.panelHead}>
                        <h3 className={panel.panelTitle}>찜한 상품</h3>
                    </div>

                    <div className={panel.panelSub}>
            <span className={panel.total}>
              {loading ? "불러오는 중…" : `총 ${items.length}개`}
            </span>
                    </div>

                    {/* ✅ 카테고리 페이지와 동일하게 ProductsGrid로 렌더 */}
                    <ProductsGrid items={items} />
                </div>
            </section>
        </main>
    );
}
