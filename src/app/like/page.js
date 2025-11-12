"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductsGrid from "@/components/category/ProductsGrid";
import useTokenStore from "@/app/store/TokenStore";

// ✅ 배포/로컬 둘 다 안전하게
const API_BASE =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_API_BASE
        ? process.env.NEXT_PUBLIC_API_BASE
        : (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080");

export default function MyLikePage() {
    const router = useRouter();
    const accessToken = useTokenStore((s) => s.accessToken);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const headers = {};
                if (accessToken) {
                    headers.Authorization = `Bearer ${accessToken}`;
                }

                const res = await fetch(`${API_BASE}/api/favorites`, {
                    credentials: "include",
                    headers,
                });

                // 백엔드가 비로그인일 때 [] 주도록 이미 바꿔놨으니
                // 여기서 401 뜨면 그냥 로그인으로 보내고 끝
                if (res.status === 401) {
                    router.push(`/login?next=${encodeURIComponent("/like")}`);
                    return;
                }

                if (!res.ok) {
                    console.error("[GET /api/favorites] HTTP", res.status);
                    setItems([]);
                    return;
                }

                const data = await res.json();

                // ✅ 여기서 S3 주소는 그대로 쓰고, 상대경로만 /uploads 붙임
                const mapped = (Array.isArray(data) ? data : []).map((p) => {
                    const id = p.id ?? p.pdIdx;
                    const rawImg = p.imageUrl || p.thumbnail || p.pdThumb || null;

                    let thumbnail;
                    if (!rawImg) {
                        // 기본 이미지
                        thumbnail = "https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg";
                    } else if (
                        rawImg.startsWith("http://") ||
                        rawImg.startsWith("https://")
                    ) {
                        // ✅ S3 같은 절대경로는 그대로
                        thumbnail = rawImg;
                    } else if (rawImg.startsWith("/uploads/")) {
                        // 이미 업로드 경로면 그대로
                        thumbnail = rawImg;
                    } else {
                        // 예전처럼 파일명만 온 경우
                        thumbnail = `/uploads/${rawImg}`;
                    }

                    return {
                        id,
                        title: p.title ?? p.pdTitle ?? "",
                        price: Number(p.price ?? p.pdPrice ?? 0),
                        thumbnail,
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
    }, [router, accessToken]);

    return (
        <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px" }}>
            <header
                style={{ marginBottom: 16, display: "flex", alignItems: "baseline", gap: 12 }}
            >
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>찜한 상품</h1>
                <span style={{ color: "#666" }}>
                    {loading ? "불러오는 중…" : `총 ${items.length}개`}
                </span>
            </header>

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
                <ProductsGrid items={items} />
            )}
        </main>
    );
}
