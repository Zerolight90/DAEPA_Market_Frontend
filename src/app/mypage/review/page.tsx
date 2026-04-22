"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/mypage/sidebar";
import styles from "./review.module.css";
import api from "@/lib/api"; // 전역 axios 인스턴스 사용

const FALLBACK_IMG =
    "https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg";

function getThumb(row) {
    return row?.productThumb || row?.pdThumb || row?.thumbnail || FALLBACK_IMG;
}

export default function MyReviewsPage() {
    // "received" | "written"
    const [tab, setTab] = useState("received");

    // 받은 후기 상태
    const [recv, setRecv] = useState({
        items: [],
        page: 0,
        size: 10,
        totalPages: 0,
        totalElements: 0,
        loading: false,
        err: "",
        initialized: false,
    });

    // 작성한 후기 상태
    const [writ, setWrit] = useState({
        items: [],
        page: 0,
        size: 10,
        totalPages: 0,
        totalElements: 0,
        loading: false,
        err: "",
        initialized: false,
    });

    // 공통 fetcher
    async function fetchReviews(kind, page = 0, append = false) {
        const setter = kind === "received" ? setRecv : setWrit;
        const state = kind === "received" ? recv : writ;

        try {
            setter((s) => ({ ...s, loading: true, err: "" }));

            const path =
                kind === "received"
                    ? `/review/received?page=${page}&size=${state.size}`
                    : `/review/written?page=${page}&size=${state.size}`;

            const { data } = await api.get(path);

            setter((s) => ({
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
        } catch (error) {
            setter((s) => ({
                ...s,
                err: error.response?.data?.message || error.message || "네트워크 오류가 발생했습니다.",
                loading: false,
                initialized: true,
            }));
            if (error.response?.status === 401) {
            }
        }
    }

    // 탭 바뀌면 해당 탭 첫 로드
    useEffect(() => {
        if (tab === "received" && !recv.initialized) fetchReviews("received", 0);
        if (tab === "written" && !writ.initialized) fetchReviews("written", 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const activeState = useMemo(
        () => (tab === "received" ? recv : writ),
        [tab, recv, writ]
    );

    function handleMore() {
        if (activeState.loading) return;
        if (activeState.page + 1 >= activeState.totalPages) return;
        fetchReviews(tab, activeState.page + 1, true);
    }

    // ===== 모달 & 편집 =====
    const [selected, setSelected] = useState<any>(null); // 클릭한 리뷰
    const [editMode, setEditMode] = useState(false);
    const [editStar, setEditStar] = useState(5);
    const [editContent, setEditContent] = useState("");
    const [saving, setSaving] = useState(false);

    // 카드 클릭 시 모달 오픈
    function openModal(row) {
        setSelected(row);
        setEditMode(false);
        setEditStar(row.reStar || 5);
        setEditContent(row.reContent || "");
    }

    async function saveEdit() {
        if (!selected) return;

        try {
            setSaving(true);
            await api.put(`/reviews/${selected.reIdx}`, {
                reStar: Number(editStar),
                reContent: editContent,
            });

            // 리스트 & 모달 동기화
            const apply = (arr) =>
                arr.map((r) =>
                    r.reIdx === selected.reIdx
                        ? { ...r, reStar: editStar, reContent: editContent }
                        : r
                );
            setWrit((s) => ({ ...s, items: apply(s.items) }));
            setRecv((s) => ({ ...s, items: apply(s.items) }));
            setSelected((s) =>
                s ? { ...s, reStar: editStar, reContent: editContent } : s
            );

            setEditMode(false);
            alert("수정되었습니다.");
        } catch (error) {
            const txt = error.response?.data?.message || error.message || "수정에 실패했습니다.";
            alert(txt);
            if (error.response?.status === 401) {
            }
        }
        finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.wrapper}>
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            <main className={styles.content}>
                <header className={styles.topBar}>
                    <h1 className={styles.pageTitle}>나의 후기</h1>
                </header>

                {/* 탭 */}
                <div className={styles.tabs}>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${
                            tab === "received" ? styles.tabActive : ""
                        }`}
                        onClick={() => setTab("received")}
                    >
                        받은 후기
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${
                            tab === "written" ? styles.tabActive : ""
                        }`}
                        onClick={() => setTab("written")}
                    >
                        작성한 후기
                    </button>
                </div>

                {/* 리스트 */}
                {activeState.loading && activeState.items.length === 0 && (
                    <div className={styles.empty}>불러오는 중...</div>
                )}
                {!activeState.loading && activeState.err && (
                    <div className={styles.empty}>{activeState.err}</div>
                )}

                {!activeState.loading && !activeState.err && (
                    <section className={styles.listArea}>
                        {activeState.items.map((row) => (
                            <article
                                key={row.reIdx}
                                className={`${styles.card} ${styles.cardClickable}`}
                                onClick={() => openModal(row)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && openModal(row)}
                            >
                                <div className={styles.cardHead}>
                                    <div className={styles.badge}>
                                        {row.reType === "BUYER" ? "구매자 후기" : "판매자 후기"}
                                    </div>
                                    {/* 서버에서 reUpdate(=수정일) 내려줌 */}
                                    <div className={styles.time}>{row.reUpdate}</div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.thumbBox}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getThumb(row)}
                                            alt="상품"
                                            className={styles.thumbImg}
                                        />
                                    </div>

                                    <div className={styles.info}>
                                        <div className={styles.title}>
                                            {row.productTitle || "(제목 없음)"}
                                        </div>

                                        <div className={styles.metaRow}>
                                            <div className={styles.starsSmall}>
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
                                            </div>
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

                        {activeState.items.length === 0 && (
                            <div className={styles.empty}>
                                {tab === "received"
                                    ? "받은 후기가 없습니다."
                                    : "작성한 후기가 없습니다."}
                            </div>
                        )}

                        {activeState.page + 1 < activeState.totalPages && (
                            <button
                                type="button"
                                className={styles.moreBtn}
                                disabled={activeState.loading}
                                onClick={handleMore}
                            >
                                {activeState.loading ? "불러오는 중..." : "더보기"}
                            </button>
                        )}
                    </section>
                )}
            </main>

            {/* ===== 모달 ===== */}
            {selected && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelected(null)}
                    role="button"
                    tabIndex={-1}
                >
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <header className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>거래 후기 상세</h3>
                            <button
                                className={styles.modalClose}
                                onClick={() => setSelected(null)}
                                aria-label="닫기"
                            >
                                ×
                            </button>
                        </header>

                        <div className={styles.modalBody}>
                            {/* 상단 제목/날짜 */}
                            <div className={styles.modalTopRow}>
                                <div className={styles.modalLeftId}>
                                    <span className={styles.cube}>🔶</span>
                                    <span className={styles.modalIdText}>
                    {selected?.productTitle || "(제목 없음)"}
                  </span>
                                </div>
                                <div className={styles.modalRightDate}>
                                    <span className={styles.modalDateLabel}>작성일</span>
                                    <span className={styles.modalDateValue}>
                    {selected?.reUpdate}
                  </span>
                                </div>
                            </div>

                            {/* 대표 이미지 */}
                            <div className={styles.modalHero}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={getThumb(selected)}
                                    alt={selected?.productTitle || "상품 이미지"}
                                    className={styles.modalHeroImg}
                                />
                            </div>

                            {/* 별점 */}
                            <section className={styles.modalStarsRow}>
                                <div className={styles.modalSectionTitle}>별점</div>

                                {!editMode ? (
                                    <div className={styles.starsBig}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span
                                                key={i}
                                                className={`${styles.star} ${
                                                    i < (selected?.reStar || 0) ? styles.filled : ""
                                                }`}
                                            >
                        ★
                      </span>
                                        ))}
                                        <span className={styles.starScore}>
                      {selected?.reStar || 0}/5
                    </span>
                                    </div>
                                ) : (
                                    <div className={styles.starsBig} style={{ cursor: "pointer" }}>
                                        {Array.from({ length: 5 }).map((_, i) => {
                                            const value = i + 1;
                                            return (
                                                <span
                                                    key={value}
                                                    className={`${styles.star} ${
                                                        value <= editStar ? styles.filled : ""
                                                    }`}
                                                    onClick={() => setEditStar(value)}
                                                >
                          ★
                        </span>
                                            );
                                        })}
                                        <span className={styles.starScore}>{editStar}/5</span>
                                    </div>
                                )}
                            </section>

                            {/* 내용 */}
                            <section className={styles.modalContent}>
                                <div className={styles.modalSectionTitle}>후기 내용</div>

                                {!editMode ? (
                                    <div className={styles.modalContentBox}>
                                        {selected?.reContent || ""}
                                    </div>
                                ) : (
                                    <textarea
                                        className={styles.modalTextarea}
                                        rows={4}
                                        maxLength={500}
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        placeholder="후기 내용을 입력하세요 (최대 500자)"
                                    />
                                )}
                            </section>

                            {/* 버튼 */}
                            <div className={styles.modalBtnRow}>
                                {tab === "written" && !editMode && (
                                    <button
                                        type="button"
                                        className={styles.modalPrimaryBtn}
                                        onClick={() => setEditMode(true)}
                                    >
                                        수정하기
                                    </button>
                                )}

                                {tab === "written" && editMode && (
                                    <>
                                        <button
                                            type="button"
                                            className={styles.modalPrimaryBtn}
                                            disabled={saving}
                                            onClick={saveEdit}
                                        >
                                            {saving ? "저장 중..." : "저장"}
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.modalGhostBtn}
                                            onClick={() => {
                                                setEditMode(false);
                                                setEditStar(selected?.reStar || 5);
                                                setEditContent(selected?.reContent || "");
                                            }}
                                        >
                                            취소
                                        </button>
                                    </>
                                )}

                                <button
                                    type="button"
                                    className={styles.modalGhostBtn}
                                    onClick={() => setSelected(null)}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
