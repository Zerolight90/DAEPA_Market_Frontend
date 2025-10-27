"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Calendar, User, Filter } from "lucide-react";
import Link from "next/link";
import styles from "../admin.module.css";

export default function NoticePage() {
  const [notices, setNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/notices");
        if (!res.ok) throw new Error("공지 목록 불러오기 실패");

        const data = await res.json();

        // 백엔드 DTO -> UI 구조로 변환
        const mapped = data.map(n => ({
          id: n.nidx,
          title: n.nsubject,
          content: n.ncontent,
          author: "관리자",     // 관리자 닉네임
          category: convertCategory(n.ncategory), // 숫자 그대로 (UI 변환 필요)
          createdAt: n.ndate,
        }));

        setNotices(mapped);
      } catch (err) {
        console.error(err);
        alert("공지 목록을 가져오는 중 오류가 발생했습니다.");
      }
    };

    fetchNotices();
  }, []);


  const filteredNotices = notices.filter(notice => {
    const matchesSearch =
        (notice.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notice.content ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
        selectedCategory === "all" || notice.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>공지사항 관리</h1>
        <p className={styles.pageSubtitle}>
          대파마켓의 공지사항은 관리자만 작성이 가능합니다.
        </p>
      </div>

      {/* Search and Filter */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="공지사항 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">전체</option>
            <option value="공지">공지</option>
            <option value="업데이트">업데이트</option>
            <option value="안내">안내</option>
            <option value="이벤트">이벤트</option>
          </select>
          <Link href="/admin/notice/create" style={{ textDecoration: "none" }}>
            <button 
              className={styles.createButton}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                background: "#2E8B57",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3)",
                fontSize: "0.875rem"
              }}
            >
              공지사항 작성
            </button>
          </Link>
        </div>
      </div>

      {/* Notice List */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader} style={{ paddingLeft: "20px" }}>
          <h3 className={styles.tableTitle}>공지사항 목록</h3>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
            총 {filteredNotices.length}개
          </span>
        </div>

        <div className={styles.noticeList}>
          {filteredNotices.map((notice) => {
            const categoryStyle = getCategoryColor(notice.category);
            return (
              <div 
                key={notice.id} 
                className={styles.noticeItem}
                style={{ cursor: "pointer" }}
                onClick={() => window.location.href = `/admin/notice/${notice.id}`}
              >
                <div className={styles.noticeHeader}>
                  <div className={styles.noticeTitle}>
                    {notice.isImportant && (
                      <span className={styles.importantBadge}>중요</span>
                    )}
                    <h4 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600", color: "#1e293b" }}>
                      {notice.title}
                    </h4>
                  </div>
                  <div className={styles.noticeMeta}>
                    <span 
                      className={styles.categoryBadge}
                      style={{ 
                        backgroundColor: categoryStyle.bg, 
                        color: categoryStyle.color 
                      }}
                    >
                      {notice.category}
                    </span>
                  </div>
                </div>
                
                <div className={styles.noticeContent}>
                  <p style={{ color: "#64748b", lineHeight: "1.6", margin: "0.5rem 0" }}>
                    {notice.content}
                  </p>
                </div>
                
                <div className={styles.noticeFooter}>
                  <div className={styles.noticeInfo}>
                    <div className={styles.authorInfo}>
                      <User size={14} />
                      <span>{notice.author}</span>
                    </div>
                    <div className={styles.dateInfo}>
                      <Calendar size={14} />
                      <span>{notice.createdAt}</span>
                    </div>
                  </div>
                  <div className={styles.noticeActions}>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/admin/notice/edit/${notice.id}`;
                      }}
                    >
                      <Edit size={16} />
                      수정
                    </button>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("이 공지사항을 삭제하시겠습니까?")) {
                          // 삭제 로직 구현
                          console.log("삭제:", notice.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
