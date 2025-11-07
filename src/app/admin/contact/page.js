"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Eye, User, Calendar } from "lucide-react";
import Link from "next/link";
import styles from "../admin.module.css";

export default function ContactPage() {
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 헤더와 데이터 행 정렬을 위한 공통 그리드 템플릿 (넓게, 반응형 비율)
  const columnTemplate = "140px 180px 160px 1.2fr 2fr 140px 180px 140px";

  useEffect(() => {
    fetch("http://localhost:8080/api/admin/contact")
        .then(res => res.json())
        .then(data => setInquiries(data))
        .catch(err => console.error(err));
  }, []);

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = (inquiry.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (inquiry.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (inquiry.content ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
        filterCategory === "all" || inquiry.category === Number(filterCategory);
    return matchesSearch && matchesFilter;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInquiries = filteredInquiries.slice(startIndex, endIndex);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className={styles.statusWarning}>대기</span>;
      case "completed":
        return <span className={styles.statusSuccess}>완료</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case 1:
        return "계정/로그인";
      case 2:
        return "거래 관련";
      case 3:
        return "불편 신고";
      case 4:
        return "기타 문의";
      default:
        return "기타";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return "#10b981"; // 초록색
      case 2:
        return "#f59e0b"; // 노란색
      case 3:
        return "#ef4444"; // 빨간색
      default:
        return "#10b981";
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        {/*<div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>*/}
        {/*  <Link */}
        {/*    href="/admin" */}
        {/*    style={{ */}
        {/*      display: "flex", */}
        {/*      alignItems: "center", */}
        {/*      gap: "0.5rem", */}
        {/*      color: "#64748b", */}
        {/*      textDecoration: "none",*/}
        {/*      fontSize: "0.875rem"*/}
        {/*    }}*/}
        {/*  >*/}
        {/*    <ArrowLeft size={16} />*/}
        {/*    대시보드로 돌아가기*/}
        {/*  </Link>*/}
        {/*</div>*/}
        <h1 className={styles.pageTitle}>문의 관리</h1>
        <p className={styles.pageSubtitle}>
          사용자들의 문의사항을 확인하고 답변하세요
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="이름, 제목 또는 내용으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">전체 문의</option>
          <option value={1}>계정/로그인</option>
          <option value={2}>거래 관련</option>
          <option value={3}>불편 신고</option>
          <option value={4}>기타 문의</option>
        </select>
      </div>

      {/* Inquiries Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: columnTemplate }}>
            <div className={styles.tableCell}>문의번호</div>
            <div className={styles.tableCell}>이름</div>
            <div className={styles.tableCell}>문의종류</div>
            <div className={styles.tableCell}>제목</div>
            <div className={styles.tableCell}>내용</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>등록일</div>
            <div className={styles.tableCell}>관리</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {currentInquiries.map((inquiry) => (
            <div key={inquiry.id} className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: columnTemplate }}>
              <div className={styles.tableCell}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: getPriorityColor(inquiry.priority ?? 1)
                  }}></div>
                  #{inquiry.id}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <User size={16} color="#6b7280" />
                  {inquiry.name}
                </div>
              </div>
              <div className={styles.tableCell}>
                <span style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.75rem",
                  backgroundColor: "#f3f4f6",
                  color: "#374151"
                }}>
                  {getCategoryText(inquiry.category)}
                </span>
              </div>
              <div className={styles.tableCell} style={{ minWidth: 0 }}>
                <div
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "500" }}
                  title={inquiry.title || "-"}
                >
                  {inquiry.title || "-"}
                </div>
              </div>
              <div className={styles.tableCell} style={{ minWidth: 0 }}>
                <div
                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b" }}
                  title={inquiry.content || "-"}
                >
                  {inquiry.content || "-"}
                </div>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(inquiry.status)}
              </div>
              <div className={styles.tableCell}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <Calendar size={14} />
                  {inquiry.date}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <Link href={`/admin/contact/${inquiry.id}`} className={`${styles.actionButton} ${styles.blue}`}>
                    <Eye size={16} />
                    답변
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          gap: "0.5rem",
          marginTop: "2rem",
          padding: "1rem"
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              background: currentPage === 1 ? "#f3f4f6" : "white",
              color: currentPage === 1 ? "#9ca3af" : "#374151",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ←
          </button>

          {/* 페이지 번호들 */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  background: currentPage === pageNum ? "#3b82f6" : "white",
                  color: currentPage === pageNum ? "white" : "#374151",
                  cursor: "pointer",
                  minWidth: "2.5rem",
                  fontWeight: currentPage === pageNum ? "600" : "400"
                }}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              background: currentPage === totalPages ? "#f3f4f6" : "white",
              color: currentPage === totalPages ? "#9ca3af" : "#374151",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            →
          </button>
        </div>
      )}

      {/* 페이지 정보 */}
      <div style={{ 
        textAlign: "center", 
        marginTop: "1rem", 
        color: "#64748b", 
        fontSize: "0.875rem" 
      }}>
        {filteredInquiries.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredInquiries.length)}개 표시
      </div>
    </div>
  );
}