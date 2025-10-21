"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Eye, Calendar, User, Filter } from "lucide-react";
import Link from "next/link";
import styles from "../admin.module.css";

export default function NoticePage() {
  const [notices, setNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    // Mock data
    setNotices([
      {
        id: 1,
        title: "대파마켓 서비스 점검 안내",
        content: "더 나은 서비스를 위해 시스템 점검을 진행합니다. 점검 시간: 2024년 1월 25일 오전 2시 ~ 4시",
        author: "관리자",
        category: "공지",
        views: 1234,
        isImportant: true,
        createdAt: "2024-01-20",
        updatedAt: "2024-01-20"
      },
      {
        id: 2,
        title: "신규 기능 업데이트 소식",
        content: "사용자 편의를 위한 새로운 기능들이 추가되었습니다. 채팅 기능, 실시간 알림 등",
        author: "관리자",
        category: "업데이트",
        views: 856,
        isImportant: false,
        createdAt: "2024-01-19",
        updatedAt: "2024-01-19"
      },
      {
        id: 3,
        title: "안전거래 가이드라인",
        content: "안전한 거래를 위한 가이드라인을 안내드립니다. 직거래 시 주의사항 포함",
        author: "관리자",
        category: "안내",
        views: 2341,
        isImportant: true,
        createdAt: "2024-01-18",
        updatedAt: "2024-01-18"
      },
      {
        id: 4,
        title: "이벤트 당첨자 발표",
        content: "신년 이벤트 당첨자를 발표합니다. 당첨자분들께는 개별 연락드리겠습니다.",
        author: "관리자",
        category: "이벤트",
        views: 567,
        isImportant: false,
        createdAt: "2024-01-17",
        updatedAt: "2024-01-17"
      },
      {
        id: 5,
        title: "정기 시스템 업데이트",
        content: "매월 첫째 주 정기 시스템 업데이트가 완료되었습니다.",
        author: "관리자",
        category: "업데이트",
        views: 432,
        isImportant: false,
        createdAt: "2024-01-15",
        updatedAt: "2024-01-15"
      }
    ]);
  }, []);

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || notice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
              <div key={notice.id} className={styles.noticeItem}>
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
                    <div className={styles.viewsInfo}>
                      <Eye size={14} />
                      <span>{notice.views.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={styles.noticeActions}>
                    <button className={styles.actionButton}>
                      <Edit size={16} />
                      수정
                    </button>
                    <button className={styles.actionButton}>
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
