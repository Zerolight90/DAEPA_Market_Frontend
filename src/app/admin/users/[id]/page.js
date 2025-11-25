"use client";

import { useState, useEffect } from "react"; // use 제거
import {
  ArrowLeft,
  Edit,
  User,
  Calendar,
  MapPin,
  Phone,
  Star,
  ShoppingBag,
  MessageSquare,
  Shield,
  AlertCircle,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import styles from "../../admin.module.css";
import api from "@/lib/api"; // axios 인스턴스 가져오기

export default function UserDetailPage({ params }) {
  const { id } = params; // use(params) 대신 직접 params 사용
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("sell");
  const [reviews, setReviews] = useState({ sell: [], buy: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [pendingManner, setPendingManner] = useState(null);

  const getStatusBadge = (statusNum) => {
    switch (statusNum) {
      case 1:
        return <span className={styles.statusSuccess}>활성</span>;
      case 2:
        return <span className={styles.statusGray}>탈퇴</span>;
      case 3:
        return <span className={styles.statusError}>정지</span>;
      case 9:
        return <span className={styles.statusWarning}>보류</span>;
      default:
        return <span className={styles.statusWarning}>보류</span>;
    }
  };

  const renderStars = (ratingValue) => {
    const numeric = Number(ratingValue);
    const stars = Number.isFinite(numeric) ? Math.round(Math.max(0, Math.min(5, numeric))) : 0;
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={14}
        className={index < stars ? styles.starFilled : styles.starEmpty}
      />
    ));
  };

  const getReviewerName = (review, type) => {
    if (!review) return "-";
    if (review.writerName) return review.writerName;
    if (type === "sell") return review.buyer ?? review.writerName ?? "-";
    return review.seller ?? review.writerName ?? "-";
  };

  const getReviewDate = (review) => {
    if (!review) return "-";
    const value = review.date ?? review.createdAt ?? review.reviewDate ?? review.updatedAt;
    return value ? new Date(value).toLocaleDateString("ko-KR") : "-";
  };

  const getReviewComment = (review) => {
    if (!review) return "-";
    return review.comment ?? review.content ?? review.text ?? "-";
  };

  const getReviewRating = (review) => {
    if (!review) return 0;
    const raw = review.rating ?? review.score ?? review.star ?? review.points;
    return Number(raw ?? 0);
  };

  const getReviewProduct = (review) => {
    if (!review) return "-";
    return review.product ?? review.productName ?? "-";
  };

  const formatReviewDate = (review) => {
    if (!review) return "기록없음";
    const reviewDate = review.date ?? review.createdAt ?? review.reviewDate ?? review.updatedAt;
    if (!reviewDate) return "기록없음";
    
    // 문자열이나 숫자(타임스탬프)일 경우 Date 객체로 변환
    const date = new Date(reviewDate);
    if (isNaN(date.getTime())) return "기록없음";
    
    // YYYY-MM-DD HH:mm:ss 형식으로 포맷
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const getRelativeTime = (review) => {
    if (!review) return "";
    const value = review.date ?? review.createdAt ?? review.reviewDate ?? review.updatedAt;
    if (!value) return "";
    const reviewDate = new Date(value);
    const now = new Date();
    const diffMs = now - reviewDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "1일전";
    if (diffDays < 7) return `${diffDays}일전`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}주전`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}개월전`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}년전`;
  };

  const formatReportDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("ko-KR");
    }
    if (typeof value === "string") return value;
    return "-";
  };

  const getReportTypeLabel = (type) => {
    if (type === null || type === undefined) return "구분 없음";
    switch (type) {
      case 1:
        return "거래 관련";
      case 2:
        return "욕설/비방";
      case 3:
        return "사기 의심";
      default:
        return `유형 ${type}`;
    }
  };

  const handleMannerTempChange = async (change) => {
    if (!user) return;

    const newTemp = (pendingManner ?? user.umanner ?? 0) + change;
    if (newTemp < 0 || newTemp > 100) {
      alert("신선도는 0도에서 100도 사이여야 합니다.");
      return;
    }
    await commitManner(newTemp);
  };

  const commitManner = async (target) => {
    const clamped = Math.min(100, Math.max(0, Math.round(target)));
    setPendingManner(clamped);
    try {
      await api.patch(`/admin/users/${id}/manner`, { umanner: clamped }); // axios.patch 사용

      setUser(prev => ({ ...prev, umanner: clamped }));
    } catch (err) {
      console.error(err);
      alert("신선도 변경 중 오류가 발생했습니다: " + (err.response?.data?.message || err.message));
      setPendingManner(user?.umanner ?? clamped);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // 사용자 상세 정보
        const response = await api.get(`/admin/users/${id}`); // axios.get 사용
        const data = response.data;
        setUser(data);
        setPendingManner(data.umanner ?? 0);

        const userId = Number(data.uidx ?? data.uIdx);
        const sellReviews = Array.isArray(data.reviews)
          ? data.reviews.filter((item) => item.type === "BUYER" && Number(item.sellerId) === userId)
          : [];
        const buyReviews = Array.isArray(data.reviews)
          ? data.reviews.filter((item) => item.type === "SELLER" && Number(item.buyerId) === userId)
          : [];
        setReviews({ sell: sellReviews, buy: buyReviews });
      } catch (err) {
        console.error("데이터 조회 실패:", err);
        alert("사용자 정보를 불러오는 중 오류가 발생했습니다: " + (err.response?.data?.message || err.message));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "1.25rem",
        color: "#64748b"
      }}>
        로딩 중...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "1.25rem",
        color: "#64748b"
      }}>
        사용자 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Link 
            href="/admin/users" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              color: "#64748b", 
              textDecoration: "none",
              fontSize: "0.875rem"
            }}
          >
            <ArrowLeft size={16} />
            목록으로 돌아가기
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        {/* 왼쪽: 사용자 정보 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className={styles.tableContainer}>
            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flex: 1 }}>
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <User size={40} color="#64748b" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#1e293b" }}>{user.uname}</h2>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#64748b" }}>{user.uid}</p>
                  </div>
                </div>
                <Link href={`/admin/users/${id}/edit`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <button 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.75rem 1.5rem",
                      background: "#f0f9ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Edit size={16} />
                    정보 수정
                  </button>
                </Link>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "1.5rem 2rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Shield size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>상태</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{getStatusBadge(user.ustatus)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <MessageSquare size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>닉네임</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{user.unickname || "-"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Calendar size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>가입일</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{new Date(user.udate).toLocaleDateString("ko-KR")}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Calendar size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>생년월일</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                      {user.ubirth ? new Date(user.ubirth).toLocaleDateString("ko-KR") : "-"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <User size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>성별</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>
                      {user.ugender ? (user.ugender === "M" ? "남성" : user.ugender === "F" ? "여성" : user.ugender) : "-"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <AlertCircle size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>신고 횟수</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{(user.reportCount ?? (user.reportHistory ? user.reportHistory.length : 0))}회</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Phone size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>전화번호</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{user.uphone}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <MapPin size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>주소</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{user.ulocation || "-"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 신선도 */}
          <div className={styles.tableContainer}>
            <div style={{ padding: "2rem" }}>
              <h3 style={{
                margin: "0 0 1.5rem 0",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b"
              }}>
                신선도
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "100%",
                    height: "12px",
                    background: "#e2e8f0",
                    borderRadius: "6px",
                    overflow: "hidden",
                    position: "relative"
                  }}
                >
                  <div
                    style={{
                      width: `${pendingManner ?? user.umanner ?? 0}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #34d399, #22c55e)",
                      borderRadius: "6px",
                      transition: "width 0.5s ease"
                    }}
                  ></div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={pendingManner ?? user.umanner ?? 0}
                    onChange={(event) => setPendingManner(Number(event.target.value))}
                    onMouseUp={(event) => commitManner(Number(event.target.value))}
                    onTouchEnd={(event) => commitManner(Number(event.target.value))}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer"
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#16a34a",
                    minWidth: "60px",
                    textAlign: "right"
                  }}
                >
                  {pendingManner ?? user.umanner ?? 0}%
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  onClick={() => handleMannerTempChange(-1)}
                  style={{ padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem" }}>-1</button>
                <button onClick={() => handleMannerTempChange(1)} style={{ padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "0.25rem" }}>+1</button>
              </div>
            </div>
          </div>

          {/* 신고 내역 */}
          <div className={styles.tableContainer}>
            <div style={{ padding: "2rem" }}>
              <h3
                style={{
                  margin: "0 0 1.5rem 0",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#1e293b"
                }}
              >
                신고 내역
              </h3>

              {!user.reportHistory || user.reportHistory.length === 0 ? (
                <div
                  style={{
                    padding: "2rem 0",
                    textAlign: "center",
                    color: "#94a3b8"
                  }}
                >
                  신고된 이력이 없습니다.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {user.reportHistory.map((report, index) => (
                    <div
                      key={`${report.id ?? index}`}
                      style={{
                        paddingBottom: index < user.reportHistory.length - 1 ? "1.5rem" : 0,
                        borderBottom: index < user.reportHistory.length - 1 ? "1px solid #f1f5f9" : "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "#fee2e2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <AlertCircle size={20} color="#dc2626" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "0.25rem" }}>
                            {report.reporter || "익명 신고자"}
                          </div>
                          <div style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                            {formatReportDate(report.date)} · {getReportTypeLabel(report.type)}
                          </div>
                        </div>
                      </div>
                      <p style={{ margin: 0, color: "#374151", lineHeight: 1.6 }}>
                        {report.content || "신고 사유가 입력되지 않았습니다."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 활동 내역 */}
        <div className={styles.tableContainer}>
          <div style={{ borderBottom: "1px solid #e5e7eb", display: "flex" }}>
            <button
              onClick={() => setActiveTab("sell")}
              style={{
                flex: 1,
                padding: "1rem",
                background: activeTab === "sell" ? "white" : "#f9fafb",
                border: "none",
                borderBottom: activeTab === "sell" ? "2px solid #3b82f6" : "2px solid transparent",
                color: activeTab === "sell" ? "#3b82f6" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              판매 후기 ({reviews.sell.length})
            </button>
            <button
              onClick={() => setActiveTab("buy")}
              style={{
                flex: 1,
                padding: "1rem",
                background: activeTab === "buy" ? "white" : "#f9fafb",
                border: "none",
                borderBottom: activeTab === "buy" ? "2px solid #3b82f6" : "2px solid transparent",
                color: activeTab === "buy" ? "#3b82f6" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              구매 후기 ({reviews.buy.length})
            </button>
          </div>

          <div style={{ padding: "2rem", maxHeight: "600px", overflowY: "auto" }}>
            {reviews[activeTab].length === 0 ? (
              <div style={{ textAlign: "center", color: "#64748b", padding: "3rem 0" }}>
                {activeTab === "sell" ? "받은 판매 후기가 없습니다." : "받은 구매 후기가 없습니다."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {reviews[activeTab].map((review, index) => (
                  <div key={index} style={{
                    paddingBottom: "1.5rem",
                    borderBottom: index < reviews[activeTab].length - 1 ? "1px solid #e5e7eb" : "none"
                  }}>
                    {/* 상단: 사용자 정보와 타임스탬프 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <User size={20} color="#64748b" />
                        </div>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>
                          {getReviewerName(review, activeTab)}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
                          {getRelativeTime(review)}
                        </span>
                        <MoreVertical size={16} color="#94a3b8" style={{ cursor: "pointer" }} />
                      </div>
                    </div>

                    {/* 별점 */}
                    <div style={{ marginBottom: "0.75rem" }}>
                      {renderStars(getReviewRating(review))}
                    </div>

                    {/* 리뷰 텍스트 */}
                    <p style={{ 
                      margin: "0 0 1rem 0", 
                      color: "#374151", 
                      lineHeight: "1.6",
                      fontSize: "0.9375rem"
                    }}>
                      {getReviewComment(review)}
                    </p>

                    {/* 하단 회색 박스: 거래 정보 */}
                    <div style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      padding: "0.75rem 1rem",
                      fontSize: "0.875rem",
                      color: "#6b7280"
                    }}>
                      <div style={{ marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: 500, color: "#374151" }}>작성일</span>
                        <span style={{ marginLeft: "0.5rem" }}>{formatReviewDate(review)}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 500, color: "#374151" }}>
                          {activeTab === "sell" ? "구매 상품" : "판매 상품"}
                        </span>
                        <span style={{ margin: "0 0.5rem", color: "#d1d5db" }}>|</span>
                        <span>{getReviewProduct(review) || "기록없음"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}