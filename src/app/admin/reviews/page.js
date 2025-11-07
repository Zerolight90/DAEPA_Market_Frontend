"use client";

import { useState, useEffect } from "react";
import { Search, Star, Trash2, Eye, X, Package, Calendar, User } from "lucide-react";
import styles from "../admin.module.css";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/reviews");
        if (!res.ok) throw new Error("리뷰 목록 로딩 실패");

        const data = await res.json();

        setReviews(
            data.map(r => ({
              id: r.id,
              product: r.product,
              buyer: r.buyer,
              seller: r.seller,
              rating: r.rating,
              comment: r.comment,
              date: r.date,
              type: (r.type || r.reviewType || (r.writer === r.buyer ? "BUY" : "SELL") || "BUY").toLowerCase()
            }))
        );
      } catch (err) {
        console.error("리뷰 불러오기 오류:", err);
        alert("리뷰 데이터를 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchReviews();
  }, []);


  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? styles.starFilled : styles.starEmpty}
      />
    ));
  };

  const handleDelete = async (review) => {
    if (!confirm("이 후기를 삭제하시겠습니까?")) return;

    try {
      // realId가 없을 경우 id를 숫자만 추출해서 사용
      const realId = review.realId ?? Number(String(review.id).replace(/[^\d]/g, ""));
      const typePrefix = review.type?.toLowerCase() === "sell" ? "S" : "B";

      const res = await fetch(`http://localhost:8080/api/admin/reviews/${typePrefix}-${realId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("후기 삭제 실패");

      // 프론트 리스트에서도 삭제 반영
      setReviews((prev) => prev.filter((r) => r.id !== review.id));

      // 모달 열려 있으면 닫기
      if (isModalOpen && selectedReview?.id === review.id) {
        setIsModalOpen(false);
        setSelectedReview(null);
      }

      alert("후기가 삭제되었습니다.");
    } catch (err) {
      console.error(err);
      alert("후기 삭제 중 오류가 발생했습니다.");
    }
  };


  const openModal = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReview(null);
  };

  const renderStarsLarge = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={24}
        fill={index < rating ? "#fbbf24" : "none"}
        color={index < rating ? "#fbbf24" : "#d1d5db"}
      />
    ));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>거래 후기 관리</h1>
        <p className={styles.pageSubtitle}>사용자들이 작성한 거래 후기를 검토하고 관리하세요</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="거래 정보, 구매자, 판매자, 후기로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 2.5fr 1fr 120px" }}>
            <div className={styles.tableCell}>거래 정보</div>
            <div className={styles.tableCell}>구매자</div>
            <div className={styles.tableCell}>판매자</div>
            <div className={styles.tableCell} style={{ paddingRight: "1rem" }}>별점</div>
            <div className={styles.tableCell}>구분</div>
            <div className={styles.tableCell} style={{ paddingLeft: "1rem" }}>후기</div>
            <div className={styles.tableCell}>작성일</div>
            <div className={styles.tableCell} style={{ textAlign: "center" }}>관리</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredReviews.map((review) => (
            <div key={review.id} className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr 0.9fr 0.7fr 0.8fr 2.5fr 1fr 120px" }}>
              <div className={styles.tableCell}>
                <div className={styles.reviewInfo}>
                  <div className={styles.productTitle}>{review.product}</div>
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {review.buyer}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {review.seller}
                </div>
              </div>
              <div className={styles.tableCell} style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", paddingRight: "1rem" }}>
                <div className={styles.ratingContainer} style={{ display: "flex", alignItems: "center", gap: "0.125rem" }}>
                  {renderStars(review.rating)}
                </div>
              </div>
              <div className={styles.tableCell}>
                <span style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  backgroundColor: review.type === "buy" || !review.type ? "#dbeafe" : "#fef3c7",
                  color: review.type === "buy" || !review.type ? "#1e40af" : "#92400e"
                }}>
                  {review.type === "sell" ? "판매후기" : "구매후기"}
                </span>
              </div>
              <div className={styles.tableCell} style={{ paddingLeft: "1rem" }}>
                <div className={styles.commentPreview} style={{
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }} title={review.comment}>
                  {review.comment}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>
                  {new Date(review.date).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className={styles.tableCell} style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                <button
                  onClick={() => openModal(review)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f0f9ff";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <Eye size={16} color="#3b82f6" />
                </button>
                <button
                  onClick={() => handleDelete(review)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fef2f2";
                    e.currentTarget.style.borderColor = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Detail Modal */}
      {isModalOpen && selectedReview && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <h2>거래 후기 상세</h2>
              <button
                onClick={closeModal}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.375rem",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody} style={{ padding: 0 }}>
              {/* 헤더 섹션 */}
              <div style={{
                padding: "2rem",
                borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #f8fafc, #e2e8f0)"
              }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    <Package size={20} color="#64748b" />
                    <h2 style={{
                      margin: 0,
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#1e293b"
                    }}>
                      {selectedReview.product}
                    </h2>
                  </div>
                </div>

                {/* 메타 정보 */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "2rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #e5e7eb"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <User size={18} color="#64748b" />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>구매자</div>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedReview.buyer}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <User size={18} color="#64748b" />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>판매자</div>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedReview.seller}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Calendar size={18} color="#64748b" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>작성일</div>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {new Date(selectedReview.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      backgroundColor: selectedReview.type === "sell" ? "#fef3c7" : "#dbeafe",
                      color: selectedReview.type === "sell" ? "#92400e" : "#1e40af"
                    }}>
                      {selectedReview.type === "sell" ? "판매후기" : "구매후기"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 후기 내용 */}
              <div style={{
                padding: "3rem"
              }}>
                {/* 별점 */}
                <div style={{
                  marginBottom: "2rem",
                  paddingBottom: "2rem",
                  borderBottom: "1px solid #f1f5f9"
                }}>
                  <div style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    marginBottom: "0.75rem",
                    fontWeight: 600
                  }}>
                    별점
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {renderStarsLarge(selectedReview.rating)}
                    <span style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#1e293b",
                      marginLeft: "0.5rem"
                    }}>
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>

                {/* 후기 내용 */}
                <div>
                  <div style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    marginBottom: "0.75rem",
                    fontWeight: 600
                  }}>
                    후기 내용
                  </div>
                  <div style={{
                    fontSize: "1.0625rem",
                    lineHeight: "1.8",
                    color: "#374151",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    padding: "1.5rem",
                    background: "#f9fafb",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb"
                  }}>
                    {selectedReview.comment}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                onClick={closeModal}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#f1f5f9",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: "0.875rem"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#f1f5f9";
                }}
              >
                닫기
              </button>
              <button
                onClick={() => {handleDelete(selectedReview);}}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontSize: "0.875rem"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#dc2626";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#ef4444";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <Trash2 size={16} />
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

