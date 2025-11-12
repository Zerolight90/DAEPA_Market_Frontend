// src/app/seller/[sellerId]/reviews/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import SellerProfilePanel from "@/components/product/SellerProfilePanel";
import useSellerHintStore from "@/store/SellerHintStore";
import styles from "./reviews.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

const initListState = {
    items: [],
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
    loading: false,
    err: "",
    initialized: false,
};

export default function SellerReceivedReviewsPage() {
    const { sellerId } = useParams();
    const router = useRouter();
    const sp = useSearchParams();

    const [list, setList] = useState(initListState);

    // ① 캐시/쿼리 힌트로 즉시 노출
    const hint = useSellerHintStore((s) => s.getHint(sellerId));
    const hintFromQS = {
        nickname: sp.get("nick") || undefined,
        avatarUrl: sp.get("avatar") || undefined,
        freshness: sp.get("fresh") ? Number(sp.get("fresh")) : undefined,
    };
    const initialSeller =
        hint ||
        (hintFromQS.nickname || hintFromQS.avatarUrl
            ? { id: sellerId, ...hintFromQS }
            : { id: sellerId, nickname: "판매자", avatarUrl: null, freshness: 0 });

    const [seller, setSeller] = useState(initialSeller);

    async function fetchReviews(targetId, page = 0, append = false) {
        try {
            setList((s) => ({ ...s, loading: true, err: "" }));
            const url = `${API_BASE}/api/review/user/${targetId}?page=${page}&size=${list.size}`;
            const res = await fetch(url, { credentials: "include", cache: "no-store" });
            if (!res.ok) {
                const txt = await res.text();
                setList((s) => ({
                    ...s,
                    err: txt || "불러오기에 실패했습니다.",
                    loading: false,
                    initialized: true,
                }));
                return;
            }
            const data = await res.json();
            setList((s) => ({
                ...s,
                items: append ? [...s.items, ...data.content] : data.content,
                page: data.page,
                size: data.size,
                totalPages: data.totalPages,
                totalElements: data.totalElements,
                loading: false,
                err: "",
                initialized: true,
            }));
        } catch {
            setList((s) => ({
                ...s,
                err: "네트워크 오류가 발생했습니다.",
                loading: false,
                initialized: true,
            }));
        }
    }

    // ② 헤더 프로필은 서버 데이터로 보정
    async function fetchSellerHeader(targetId) {
        try {
            const res = await fetch(`${API_BASE}/api/users/${targetId}`, {
                credentials: "include",
                cache: "no-store",
            });
            if (!res.ok) return;
            const u = await res.json();
            setSeller((prev) => ({
                id: u.uIdx ?? targetId,
                nickname: u.unickname ?? u.uname ?? prev?.nickname ?? "판매자",
                avatarUrl: u.uProfile ?? prev?.avatarUrl ?? null,
                freshness: Number(u.uManner ?? u.manner ?? prev?.freshness ?? 0) || 0,
                deals: u.deals ?? prev?.deals ?? 0,
                since: u.uDate ?? prev?.since ?? null,
            }));
        } catch {
            /* 조용히 무시: 힌트 그대로 유지 */
        }
    }

    // ✅ sellerId 변경 시: 힌트 즉시 반영 → 서버 재요청
    useEffect(() => {
        if (!sellerId) return;
        setList(initListState);
        setSeller(
            hint ||
            (hintFromQS.nickname || hintFromQS.avatarUrl
                ? { id: sellerId, ...hintFromQS }
                : { id: sellerId, nickname: "판매자", avatarUrl: null, freshness: 0 })
        );
        fetchSellerHeader(sellerId);
        fetchReviews(sellerId, 0, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sellerId]);

    const canMore = useMemo(
        () => list.page + 1 < list.totalPages && !list.loading,
        [list.page, list.totalPages, list.loading]
    );

    return (
        <main className={styles.page}>
            <div className={styles.profilePanelWrap}>
                <SellerProfilePanel seller={seller} />
            </div>

            <h1 className={styles.title}>판매자 후기</h1>
            <p className={styles.sub}>
                판매자 {seller?.nickname ?? sellerId} 가 받은 후기
            </p>

            {list.loading && list.items.length === 0 && (
                <div className={styles.empty}>불러오는 중...</div>
            )}
            {!list.loading && list.err && (
                <div className={styles.empty}>{list.err}</div>
            )}

            {!list.loading && !list.err && (
                <section className={styles.listArea}>
                    {list.items.map((row) => (
                        <article
                            key={row.reIdx}
                            className={`${styles.card} ${styles.cardClickable}`}
                        >
                            <div className={styles.cardHead}>
                <span className={styles.badge}>
                  {row.reType === "BUYER" ? "구매자 후기" : "판매자 후기"}
                </span>
                                <span className={styles.time}>
                  {String(row.reUpdate ?? row.reCreate)
                      .replace("T", " ")
                      .slice(0, 19)}
                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.thumbBox}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={
                                            row.productThumb ||
                                            "https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg"
                                        }
                                        alt="상품"
                                        className={styles.thumbImg}
                                    />
                                </div>

                                <div className={styles.info}>
                                    <div className={styles.itemTitle}>
                                        {row.productTitle || "(제목 없음)"}
                                    </div>
                                    <div className={styles.metaRow}>
                    <span className={styles.starsSmall}>
                      {Array.from({ length: 5 }).map((_, i) => (
                          <span
                              key={i}
                              className={`${styles.star} ${
                                  i < (row.reStar || 0) ? styles.filled : ""
                              }`}
                          >
                          ★
                        </span>
                      ))}
                    </span>
                                        <span className={styles.pipe}>|</span>
                                        <span className={styles.nick}>
                      작성자: {row.writerNickname || "-"}
                    </span>
                                    </div>
                                    <p className={styles.contentText}>
                                        {row.reContent || ""}
                                    </p>
                                </div>
                            </div>
                        </article>
                    ))}

                    {list.items.length === 0 && (
                        <div className={styles.empty}>받은 후기가 없습니다.</div>
                    )}

                    {canMore && (
                        <button
                            type="button"
                            className={styles.moreBtn}
                            onClick={() => fetchReviews(sellerId, list.page + 1, true)}
                            disabled={list.loading}
                        >
                            {list.loading ? "불러오는 중..." : "더보기"}
                        </button>
                    )}
                </section>
            )}

            <div style={{ textAlign: "center", marginTop: 24 }}>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className={styles.backBtn}
                >
                    ← 판매자 상점으로 돌아가기
                </button>
            </div>
        </main>
    );
}
