"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "../../bbs.module.css"; // Reusing admin styles for now

export default function NoticeDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchNotice = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/notices/${id}`);
        if (!res.ok) throw new Error("공지사항을 불러오지 못했습니다.");
        const data = await res.json();

        setNotice({
          id: data.nidx,
          title: data.nsubject,
          content: data.ncontent,
          author: data.adminNick,
          category: convertCategory(data.ncategory),
          createdAt: data.ndate,
          imageUrl: data.nimg,
        });
      } catch (err) {
        console.error("공지사항 조회 실패:", err);
        alert("공지사항을 불러오는 중 오류가 발생했습니다.");
      }
    };

    fetchNotice();
  }, [id]);

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

  if (!notice) {
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

  const categoryStyle = getCategoryColor(notice.category);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Link 
            href="/bbs/notice" 
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
              <span 
                style={{ 
                  backgroundColor: categoryStyle.bg, 
                  color: categoryStyle.color,
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "600"
                }}
              >
                {notice.category}
              </span>
            </div>
            <h1 className={styles.pageTitle} style={{ marginBottom: "0.5rem" }}>{notice.title}</h1>
            <div style={{ display: "flex", gap: "1.5rem", color: "#64748b", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <User size={14} />
                <span>{notice.author}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={14} />
                <span>{notice.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {notice.imageUrl && (
            <div style={{ padding: "3rem 3rem 0 3rem" }}>
                <img src={notice.imageUrl} alt="공지사항 이미지" style={{ maxWidth: '100%', borderRadius: '0.5rem' }} />
            </div>
        )}
        <div style={{ 
          padding: "3rem", 
          fontSize: "1rem", 
          lineHeight: "1.8", 
          color: "#374151",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {notice.content}
        </div>
      </div>
    </div>
  );
}
