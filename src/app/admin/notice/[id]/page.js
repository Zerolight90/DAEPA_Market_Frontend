"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Trash2, Calendar, User, Tag } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "../../admin.module.css";

export default function NoticeDetailPage() {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/notices/${params.id}`);
        if (!res.ok) throw new Error("공지사항 불러오기 실패");

        const data = await res.json();
        
        // 백엔드 DTO -> UI 구조로 변환
        const mappedNotice = {
          id: data.nidx,
          title: data.nsubject,
          content: data.ncontent,
          author: "관리자",
          category: convertCategory(data.ncategory),
          createdAt: data.ndate,
          isImportant: data.ncategory === 1, // 공지 카테고리는 중요로 간주
        };

        setNotice(mappedNotice);
      } catch (err) {
        console.error(err);
        alert("공지사항을 불러오는 중 오류가 발생했습니다.");
        router.push("/admin/notice");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNotice();
    }
  }, [params.id, router]);

  const convertCategory = (num) => {
    switch (num) {
      case 1: return "공지";
      case 2: return "업데이트";
      case 3: return "안내";
      case 4: return "이벤트";
      default: return "기타";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "공지":
        return { bg: "#fee2e2", color: "#dc2626" };
      case "업데이트":
        return { bg: "#dbeafe", color: "#2563eb" };
      case "안내":
        return { bg: "#dcfce7", color: "#16a34a" };
      case "이벤트":
        return { bg: "#fef3c7", color: "#d97706" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const handleDelete = async () => {
    if (confirm("이 공지사항을 삭제하시겠습니까?")) {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/notices/${params.id}`, {
          method: "DELETE",
        });
        
        if (res.ok) {
          alert("공지사항이 삭제되었습니다.");
          router.push("/admin/notice");
        } else {
          throw new Error("삭제 실패");
        }
      } catch (err) {
        console.error(err);
        alert("공지사항 삭제 중 오류가 발생했습니다.");
      }
    }
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
          공지사항을 불러오는 중...
        </div>
      </div>
    );
  }

  if (!notice) {
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
          공지사항을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const categoryStyle = getCategoryColor(notice.category);

  return (
    <div className={styles.pageContainer}>
      {/* 헤더 */}
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Link href="/admin/notice" style={{ textDecoration: "none" }}>
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
        <h1 className={styles.pageTitle}>공지사항 상세</h1>
        <p className={styles.pageSubtitle}>
          공지사항의 상세 내용을 확인하고 관리하세요
        </p>
      </div>

      {/* 공지사항 상세 내용 */}
      <div style={{
        background: "white",
        borderRadius: "0.75rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0",
        overflow: "hidden"
      }}>
        {/* 공지사항 헤더 */}
        <div style={{
          padding: "2rem",
          borderBottom: "1px solid #e2e8f0",
          background: "linear-gradient(135deg, #f8fafc, #e2e8f0)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                {notice.isImportant && (
                  <span style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "white",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)"
                  }}>
                    중요
                  </span>
                )}
                <span style={{
                  ...categoryStyle,
                  padding: "0.375rem 0.875rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  {notice.category}
                </span>
              </div>
              <h2 style={{
                margin: 0,
                fontSize: "1.875rem",
                fontWeight: "700",
                color: "#1e293b",
                lineHeight: "1.3"
              }}>
                {notice.title}
              </h2>
            </div>
          </div>
          
          {/* 메타 정보 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            fontSize: "0.875rem",
            color: "#64748b"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={16} />
              <span>{notice.author}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={16} />
              <span>{notice.createdAt}</span>
            </div>
          </div>
        </div>

        {/* 공지사항 내용 */}
        <div style={{ padding: "2rem" }}>
          <div style={{
            fontSize: "1rem",
            lineHeight: "1.7",
            color: "#374151",
            whiteSpace: "pre-wrap"
          }}>
            {notice.content}
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
          <Link href={`/admin/notice/edit/${params.id}`} style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.875rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#2563eb";
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#3b82f6";
              e.target.style.transform = "translateY(0)";
            }}
            >
              <Edit size={16} />
              수정
            </button>
          </Link>
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