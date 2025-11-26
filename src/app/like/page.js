"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import ProductsGrid from "@/components/category/ProductsGrid";
// import useTokenStore from "@/app/store/TokenStore"; // 더 이상 필요 없음
import api from "@/lib/api"; // 새로운 axios 인스턴스를 가져옵니다.
import styles from "./like.module.css";
import { CircularProgress, Box, Typography } from "@mui/material"; // Suspense fallback을 위해 추가

// ✅ KST 날짜 포맷
function formatKST(dateInput) {
    if (!dateInput) return "";
    const raw = String(dateInput).replace(" ", "T");
    const normalized = raw.includes(".") ? raw.split(".")[0] : raw;
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return String(dateInput).split(" ")[0] || "";
    return d.toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function MyLikePageContent() { // Suspense를 위해 컴포넌트 분리
    const router = useRouter();
    // const accessToken = useTokenStore((s) => s.accessToken); // 더 이상 필요 없음
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                // axios 인스턴스를 사용하여 API 호출
                // 브라우저가 HttpOnly 쿠키를 자동으로 전송하므로 Authorization 헤더는 필요 없습니다.
                const response = await api.get("/favorites");
                const data = response.data; // axios는 응답 데이터를 .data 속성에 담습니다.

                const mapped = (Array.isArray(data) ? data : []).map((p) => {
                    const id = p.id ?? p.pdIdx ?? p.p_idx;

                    // ✅ 백엔드의 여러 날짜 키 대응 (pdCreate 포함)
                    const createdRaw =
                        p.createdAt ??
                        p.created_at ??
                        p.pdCreate ??
                        p.pd_create ??
                        p.createDate ??
                        p.created ??
                        null;

                    const createdAtLabel = formatKST(createdRaw);

                    const rawImg = p.imageUrl || p.thumbnail || p.pdThumb || null;
                    let thumbnail;
                    if (!rawImg) {
                        thumbnail =
                            "https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg";
                    } else if (rawImg.startsWith("http://") || rawImg.startsWith("https://")) {
                        thumbnail = rawImg;
                    } else if (rawImg.startsWith("/uploads/")) {
                        thumbnail = rawImg;
                    } else {
                        thumbnail = `/uploads/${rawImg}`;
                    }

                    return {
                        id,
                        title: p.title ?? p.pdTitle ?? "",
                        price: Number(p.price ?? p.pdPrice ?? 0),
                        thumbnail,
                        location: p.location ?? p.pdLocation ?? "",
                        // ⭐️ 날짜를 카드까지 전달
                        createdAt: createdRaw ?? "",
                        createdAtLabel,
                    };
                });

                setItems(mapped);
            } catch (e) {
                // axios 에러 객체는 e.response에 상세 정보를 담고 있습니다.
                if (e.response?.status === 401) {
                    alert("로그인이 필요합니다.");
                    router.push(`/sing/login?next=${encodeURIComponent("/like")}`);
                    return;
                }
                console.error("[/api/favorites] fetch error:", e.response?.data?.message || e.message);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [router]); // accessToken 의존성 제거

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>찜한 상품</h1>
                <span className={styles.countText}>
          {loading ? "불러오는 중…" : `총 ${items.length}개`}
        </span>
            </header>

            {loading ? (
                <div className={styles.message}>불러오는 중…</div>
            ) : items.length === 0 ? (
                <div className={styles.empty}>
                    아직 찜한 상품이 없어요.
                    <div className={styles.emptyAction}>
                        <button
                            onClick={() => router.push("/store")}
                            className={styles.browseBtn}
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

export default function MyLikePage() {
    return (
        <Suspense
            fallback={
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                    }}
                >
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>찜한 상품을 불러오는 중...</Typography>
                </Box>
            }
        >
            <MyLikePageContent />
        </Suspense>
    );
}
