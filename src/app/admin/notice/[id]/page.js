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
        const res = await fetch(`http://3.34.181.73/api/admin/notices/${params.id}`);
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
      {/* 네비게이션 바 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #e5e7eb"
      }}>
        <Link href="/admin/notice" style={{ textDecoration: "none" }}>
          <button style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            color: "#64748b",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "0.875rem",
            fontWeight: "500",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#16a34a";
            e.currentTarget.style.color = "#16a34a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.color = "#64748b";
          }}
          >
            <ArrowLeft size={18} />
            목록으로 돌아가기
          </button>
        </Link>
      </div>

      {/* 공지사항 카드 */}
      <div style={{
        background: "white",
        borderRadius: "1rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%"
      }}>
        {/* 헤더 섹션 */}
        <div style={{
          padding: "2.5rem 3rem",
          borderBottom: "2px solid #f1f5f9",
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          position: "relative"
        }}>
          {/* 중요 배지 */}
          {notice.isImportant && (
            <div style={{
              position: "absolute",
              top: "1.5rem",
              right: "1.5rem",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "white",
              padding: "0.375rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem"
            }}>
              <span style={{ width: "6px", height: "6px", background: "white", borderRadius: "50%" }}></span>
              중요
            </div>
          )}

          {/* 카테고리 및 제목 */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <span style={{
                background: categoryStyle.bg,
                color: categoryStyle.color,
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <Tag size={14} />
                {notice.category}
              </span>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: "2rem",
              fontWeight: "700",
              color: "#1e293b",
              lineHeight: "1.4",
              letterSpacing: "-0.02em",
              maxWidth: "90%"
            }}>
              {notice.title}
            </h1>
          </div>
          
          {/* 메타 정보 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #f1f5f9"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              fontSize: "0.875rem",
              color: "#64748b",
              fontWeight: "500"
            }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16a34a"
              }}>
                <User size={16} />
              </div>
              <span>{notice.author}</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              fontSize: "0.875rem",
              color: "#64748b",
              fontWeight: "500"
            }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0284c7"
              }}>
                <Calendar size={16} />
              </div>
              <span>{notice.createdAt}</span>
            </div>
          </div>
        </div>

        {/* 본문 내용 */}
        <div style={{ 
          padding: "3rem",
          minHeight: "400px",
          background: "white"
        }}>
          <div style={{
            fontSize: "1.0625rem",
            lineHeight: "1.9",
            color: "#374151",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            maxWidth: "100%",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
          }}>
            {notice.content.split('\n').map((line, index) => (
              <div key={index} style={{ marginBottom: line.trim() ? "1rem" : "0.5rem" }}>
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 영역 */}
        <div style={{
          padding: "2rem 3rem",
          borderTop: "1px solid #f1f5f9",
          background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem"
        }}>
          <Link href={`/admin/notice/edit/${params.id}`} style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.75rem",
              background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
              color: "white",
              border: "none",
              borderRadius: "0.625rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.875rem",
              boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #15803d 0%, #16a34a 100%)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(22, 163, 74, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(22, 163, 74, 0.2)";
            }}
            >
              <Edit size={18} />
              수정하기
            </button>
          </Link>
          <button 
            onClick={handleDelete}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.75rem",
              background: "white",
              color: "#ef4444",
              border: "1px solid #fecaca",
              borderRadius: "0.625rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.875rem",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.borderColor = "#fca5a5";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "#fecaca";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.05)";
            }}
          >
            <Trash2 size={18} />
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}