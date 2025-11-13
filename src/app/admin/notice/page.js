"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Calendar, User, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import styles from "../admin.module.css";
import { api } from "@/lib/api/client";

export default function NoticePage() {
  const [notices, setNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await api("/admin/notices");

        // 백엔드 DTO -> UI 구조로 변환
        const mapped = data.map(n => ({
          id: n.nidx,
          title: n.nsubject,
          content: n.ncontent,
          author: n.adminNick,
          category: convertCategory(n.ncategory),
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

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotices = filteredNotices.slice(startIndex, endIndex);

  // 검색/필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

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

      {/* Notice Cards */}
      <div style={{
        background: "white",
        borderRadius: "1rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "1.5rem 2rem",
          borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(to right, #f8fafc, #ffffff)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "0.25rem"
            }}>
              공지사항 목록
            </h3>
            <p style={{
              margin: 0,
              fontSize: "0.875rem",
              color: "#64748b"
            }}>
              총 <strong style={{ color: "#3b82f6", fontWeight: "600" }}>{filteredNotices.length}개</strong>의 공지사항이 있습니다
            </p>
          </div>
        </div>

        {currentNotices.length === 0 ? (
          <div style={{ 
            padding: "4rem 2rem", 
            textAlign: "center", 
            color: "#64748b",
            fontSize: "1rem"
          }}>
            공지사항이 없습니다.
          </div>
        ) : (
          <div style={{ padding: "2rem" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1.5rem"
            }}>
              {currentNotices.map((notice) => {
                const categoryStyle = getCategoryColor(notice.category);
                const contentPreview = notice.content.length > 200 
                  ? notice.content.substring(0, 200) + "..." 
                  : notice.content;
                
                return (
                  <div 
                    key={notice.id} 
                    style={{
                      background: "white",
                      borderRadius: "1rem",
                      border: "1px solid #e2e8f0",
                      padding: "2rem",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                      height: "100%",
                      minHeight: "400px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                    onClick={() => window.location.href = `/admin/notice/${notice.id}`}
                  >
                    {/* 카테고리 배지 */}
                    <div style={{ marginBottom: "1rem" }}>
                      <span 
                        style={{ 
                          backgroundColor: categoryStyle.bg, 
                          color: categoryStyle.color,
                          padding: "0.375rem 0.75rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          display: "inline-block"
                        }}
                      >
                        {notice.category}
                      </span>
                    </div>

                    {/* 제목 */}
                    <h4 style={{ 
                      margin: "0 0 0.75rem 0", 
                      fontSize: "1.125rem", 
                      fontWeight: "700", 
                      color: "#1e293b",
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {notice.title}
                    </h4>
                    
                    {/* 내용 미리보기 */}
                    <p style={{ 
                      color: "#64748b", 
                      lineHeight: "1.8", 
                      margin: "0 0 1.5rem 0",
                      fontSize: "0.9375rem",
                      flex: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "140px"
                    }}>
                      {contentPreview}
                    </p>
                    
                    {/* 작성자 및 날짜 */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid #f1f5f9"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.75rem",
                        color: "#64748b"
                      }}>
                        <User size={14} />
                        <span>{notice.author}</span>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontSize: "0.75rem",
                        color: "#64748b"
                      }}>
                        <Calendar size={14} />
                        <span>{notice.createdAt}</span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "auto"
                    }}>
                      <button 
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          background: "#f0f9ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.375rem",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#dbeafe";
                          e.currentTarget.style.borderColor = "#93c5fd";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#f0f9ff";
                          e.currentTarget.style.borderColor = "#bfdbfe";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/admin/notice/edit/${notice.id}`;
                        }}
                      >
                        <Edit size={14} />
                        수정
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          background: "#fef2f2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.375rem",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fee2e2";
                          e.currentTarget.style.borderColor = "#fca5a5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fef2f2";
                          e.currentTarget.style.borderColor = "#fecaca";
                        }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;

                          try {
                            await api(`/admin/notices/${notice.id}`, {
                              method: "DELETE",
                            });

                            alert("삭제가 완료되었습니다.");

                            setNotices(prev => prev.filter(n => n.id !== notice.id));

                          } catch (err) {
                            console.error(err);
                            alert("삭제 중 오류 발생");
                          }
                        }}
                      >
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                padding: "2rem 0 0 0",
                marginTop: "2rem",
                borderTop: "1px solid #f1f5f9"
              }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: currentPage === 1 ? "#f3f4f6" : "white",
                    color: currentPage === 1 ? "#9ca3af" : "#374151",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }
                  }}
                >
                  <ChevronLeft size={16} />
                  이전
                </button>

                <div style={{
                  display: "flex",
                  gap: "0.25rem"
                }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: "0.5rem 0.75rem",
                        background: currentPage === page ? "#3b82f6" : "white",
                        color: currentPage === page ? "white" : "#374151",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.5rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: currentPage === page ? "600" : "500",
                        transition: "all 0.2s",
                        minWidth: "2.5rem"
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== page) {
                          e.currentTarget.style.background = "#f9fafb";
                          e.currentTarget.style.borderColor = "#d1d5db";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== page) {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.borderColor = "#e2e8f0";
                        }
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: currentPage === totalPages ? "#f3f4f6" : "white",
                    color: currentPage === totalPages ? "#9ca3af" : "#374151",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages) {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== totalPages) {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }
                  }}
                >
                  다음
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}