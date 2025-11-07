"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Star, Calendar, User, Package, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "../../admin.module.css";

export default function ReviewDetailPage() {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchReview = async () => {
      try {
        // TODO: 실제 API 연결 시 주석 해제
        // const res = await fetch(`http://localhost:8080/api/admin/reviews/${params.id}`);
        // if (!res.ok) throw new Error("후기 불러오기 실패");
        // const data = await res.json();
        // setReview(data);

        // 임시 더미 데이터
        const mockReviews = [
          {
            id: 1,
            product: "아이폰 15 Pro 256GB",
            buyer: "김철수",
            seller: "이영희",
            rating: 5,
            comment: "정말 좋은 상품이었습니다. 빠른 배송과 정확한 설명에 만족합니다. 상품 상태도 설명과 동일했고, 포장도 매우 신경써서 잘 되어있었습니다. 다음에도 이 판매자와 거래하고 싶네요!",
            date: "2024-01-15",
            status: "approved",
            helpful: 12
          },
          {
            id: 2,
            product: "나이키 에어맥스 270",
            buyer: "박민수",
            seller: "정수진",
            rating: 4,
            comment: "상품 상태가 설명과 조금 달랐지만 전반적으로 만족합니다. 배송도 빠르고 소통도 원활했습니다.",
            date: "2024-01-20",
            status: "pending",
            helpful: 8
          },
          {
            id: 3,
            product: "맥북 프로 14인치 M2",
            buyer: "최영수",
            seller: "김철수",
            rating: 1,
            comment: "상품이 설명과 완전히 달랐습니다. 환불 요청합니다. 배송도 늦었고, 상품 상태가 매우 나쁩니다.",
            date: "2024-01-18",
            status: "reported",
            helpful: 3
          }
        ];

        const foundReview = mockReviews.find(r => r.id === Number(params.id));
        if (!foundReview) {
          throw new Error("후기를 찾을 수 없습니다.");
        }
        setReview(foundReview);
      } catch (err) {
        console.error(err);
        alert("후기를 불러오는 중 오류가 발생했습니다.");
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
      // TODO: 실제 API 연결 시 주석 해제
      // const res = await fetch(`http://localhost:8080/api/admin/reviews/${params.id}`, {
      //   method: "DELETE"
      // });
      // if (!res.ok) throw new Error("후기 삭제 실패");
      
      alert("후기가 삭제되었습니다.");
      router.push("/admin/reviews");
    } catch (err) {
      console.error(err);
      alert("후기 삭제 중 오류가 발생했습니다.");
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
