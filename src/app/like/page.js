"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductsGrid from "@/components/category/ProductsGrid"; // ✅ 컴포넌트로 올바르게 import

export default function MyLikePage() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/favorites", { credentials: "include" });

                // 401 → 로그인 페이지로 유도
                if (res.status === 401) {
                    alert("로그인이 필요합니다.");
                    router.push(`/sing/login?next=${encodeURIComponent("/like")}`);
                    return;
                }

                if (!res.ok) {
                    console.error("[/api/favorites] HTTP", res.status);
                    setItems([]);
                    return;
                }

                const data = await res.json();

                // 표준 카드 아이템 형태로 매핑
                const mapped = (Array.isArray(data) ? data : []).map((p) => {
                    const id = p.id ?? p.pdIdx;
                    const image = p.imageUrl || null;
                    return {
                        id,
                        title: p.title ?? p.pdTitle ?? "",
                        price: Number(p.price ?? p.pdPrice ?? 0),
                        thumbnail: image
                            ? (image.startsWith("/uploads/") ? image : `/uploads/${image}`)
                            : "/no-image.png",
                        location: p.location ?? "",
                        createdAt: p.createdAt ?? "",
                    };
                });

                setItems(mapped);
            } catch (e) {
                console.error("[/api/favorites] fetch error:", e);
                setItems([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [router]);

    return (
        <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px" }}>
            <header style={{ marginBottom: 16, display: "flex", alignItems: "baseline", gap: 12 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>찜한 상품</h1>
                <span style={{ color: "#666" }}>
          {loading ? "불러오는 중…" : `총 ${items.length}개`}
        </span>
            </header>

            {/* 로딩/빈 상태 처리 */}
            {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
                    불러오는 중…
                </div>
            ) : items.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
                    아직 찜한 상품이 없어요.
                    <div style={{ marginTop: 12 }}>
                        <button
                            onClick={() => router.push("/store")}
                            style={{
                                padding: "10px 16px",
                                borderRadius: 10,
                                border: "1px solid #ddd",
                                background: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            상품 둘러보기
                        </button>
                    </div>
                </div>
            ) : (
                // ✅ 기존 카테고리에서 쓰던 그리드 컴포넌트 재사용
                <ProductsGrid items={items} />
            )}
        </main>
    );
}
