"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Sidebar from "@/components/mypage/sidebar";
import styles from "./review.module.css";
import api from "@/lib/api"; // 전역 axios 인스턴스 사용

export default function SellerWriteReviewPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const targetUserId = params.userId; // 후기 받는 사람(구매자)
    const dealId = searchParams.get("dealId");

    const [star, setStar] = useState(5);
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleStarClick = (value) => {
        setStar(value);
    };

    async function handleSubmit(e) {
        e.preventDefault();

        if (!dealId) {
            alert("dealId가 없어 리뷰를 저장할 수 없습니다.");
            return;
        }

        try {
            setSubmitting(true);

            // 1) 중복 확인
            const { data: existsResponse } = await api.get(
                `/review/exists?dealId=${dealId}&reType=SELLER`
            );

            if (existsResponse.exists) {
                alert("이미 작성한 리뷰입니다.");
                return;
            }

            // 2) 실제 저장
            await api.post("/reviews", {
                dIdx: Number(dealId),
                reStar: Number(star),
                reContent: content,
                reType: "SELLER", // 판매자가 구매자에게
            });

            alert("후기가 등록되었습니다.");
            router.back();
        } catch (error) {
            console.error("리뷰 저장 실패:", error);
            const errorMessage = error.response?.data?.message || error.message || "리뷰 저장에 실패했습니다.";
            alert(errorMessage);
            if (error.response?.status === 401) {
                alert("로그인이 필요합니다.");
                router.push("/login");
            }
        }
        finally {
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.wrapper}>
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            <main className={styles.content}>
                <header className={styles.topBar}>
                    <h1 className={styles.pageTitle}>판매 후기 쓰기</h1>
                </header>

                <section className={styles.card}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* 별점 */}
                        <label className={styles.field}>
                            <span className={styles.label}>별점</span>
                            <div className={styles.stars}>
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <span
                                        key={value}
                                        className={`${styles.star} ${
                                            value <= star ? styles.filled : ""
                                        }`}
                                        onClick={() => handleStarClick(value)}
                                    >
                    ★
                  </span>
                                ))}
                                <span className={styles.starValue}>{star} / 5</span>
                            </div>
                        </label>

                        {/* 후기 내용 */}
                        <label className={styles.field}>
                            <span className={styles.label}>후기 내용</span>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={5}
                                className={styles.textarea}
                                placeholder="거래는 어떠셨나요? 자세히 작성해주시면 도움이 됩니다."
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={styles.submitBtn}
                        >
                            {submitting ? "저장 중..." : "후기 등록"}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
}
