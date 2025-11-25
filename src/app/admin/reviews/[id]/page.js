"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Star, Calendar, User, Package, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "../../admin.module.css";
import api from "@/lib/api"; // axios 인스턴스 가져오기

export default function ReviewDetailPage() {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchReview = async () => {
      try {
        // 실제 API 연결
        const response = await api.get(`/admin/reviews/${params.id}`); // axios.get 사용
        const data = response.data;
        setReview(data);
      } catch (err) {
        console.error(err);
        alert("후기를 불러오는 중 오류가 발생했습니다: " + (err.response?.data?.message || err.message));
        router.push("/admin/reviews");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReview();
    }
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!confirm("이 후기를 삭제하시겠습니까?")) return;

    try {
      // 실제 API 연결
      await api.delete(`/admin/reviews/${params.id}`); // axios.delete 사용
      
      alert("후기가 삭제되었습니다.");
      router.push("/admin/reviews");
    } catch (err) {
      console.error(err);
      alert("후기 삭제 중 오류가 발생했습니다: " + (err.response?.data?.message || err.message));
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={24}
        fill={index < rating ? "#fbbf24" : "none"}
        color={index < rating ? "#fbbf24" : "#d1d5db"}
      />
    ));
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          fontSize: "1.125rem",
          color: "#64748b"
        }}>
          후기를 불러오는 중...
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className={styles.pageContainer}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          fontSize: "1.125rem",
          color: "#64748b"
        }}>
          후기를 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* 헤더 */}
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Link href="/admin/reviews" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              color: "#64748b",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f1f5f9";
              e.target.style.borderColor = "#cbd5e1";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f8fafc";
              e.target.style.borderColor = "#e2e8f0";
            }}
            >
              <ArrowLeft size={16} />
              목록으로
            </button>
          </Link>
        </div>
        <h1 className={styles.pageTitle}>거래 후기 상세</h1>
        <p className={styles.pageSubtitle}>
          거래 후기의 상세 내용을 확인하고 관리하세요
        </p>
      </div>

      {/* 후기 상세 내용 */}
      <div style={{
        background: "white",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0",
        overflow: "hidden"
      }}>
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
                {review.product}
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
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{review.buyer}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={18} color="#64748b" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>판매자</div>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{review.seller}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={18} color="#64748b" />
              <div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>작성일</div>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>
                  {new Date(review.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
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
              {renderStars(review.rating)}
              <span style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#1e293b",
                marginLeft: "0.5rem"
              }}>
                {review.rating}/5
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
              {review.comment}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{
          padding: "1.5rem 2rem",
          borderTop: "1px solid #e2e8f0",
          background: "#f8fafc",
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem"
        }}>
          <button
            onClick={handleDelete}
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
  );
}
