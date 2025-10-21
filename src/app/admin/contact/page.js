"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Eye, Reply, User, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import styles from "../admin.module.css";

export default function ContactPage() {
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Mock data - 문의 데이터
    const mockInquiries = [];
    const categories = ["general", "technical", "business", "complaint", "suggestion", "other"];
    const statuses = ["pending", "processing", "completed", "closed"];
    const names = ["김철수", "이영희", "박민수", "정수진", "최지영", "한민호", "윤서연", "강동현", "임수빈", "송태준"];
    
    for (let i = 1; i <= 10; i++) {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      mockInquiries.push({
        id: i,
        name: `${randomName}${i}`,
        email: `user${i}@example.com`,
        phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        category: randomCategory,
        subject: `문의 제목 ${i} - ${randomCategory === 'general' ? '일반 문의' : 
                                         randomCategory === 'technical' ? '기술 문의' :
                                         randomCategory === 'business' ? '사업 제휴' :
                                         randomCategory === 'complaint' ? '불만 접수' :
                                         randomCategory === 'suggestion' ? '개선 제안' : '기타'}`,
        message: `안녕하세요. ${randomCategory === 'general' ? '일반적인 문의사항이 있어서 연락드립니다.' :
                                randomCategory === 'technical' ? '기술적인 문제가 발생했습니다.' :
                                randomCategory === 'business' ? '사업 제휴를 제안하고자 합니다.' :
                                randomCategory === 'complaint' ? '불만사항을 접수하고자 합니다.' :
                                randomCategory === 'suggestion' ? '개선사항을 제안하고자 합니다.' : '기타 문의사항이 있습니다.'} 자세한 내용은 연락주시면 설명드리겠습니다.`,
        status: randomStatus,
        createdAt: `2024-12-${Math.floor(Math.random() * 20) + 1}`,
        priority: Math.floor(Math.random() * 3) + 1, // 1: 낮음, 2: 보통, 3: 높음
        hasReply: Math.random() > 0.3
      });
    }
    
    setInquiries(mockInquiries);
  }, []);

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inquiry.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || inquiry.status === filterStatus;
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
      case "processing":
        return <span className={styles.statusSuccess}>처리중</span>;
      case "completed":
        return <span className={styles.statusSuccess}>완료</span>;
      case "closed":
        return <span className={styles.statusError}>종료</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case "general":
        return "일반 문의";
      case "technical":
        return "기술 문의";
      case "business":
        return "사업 제휴";
      case "complaint":
        return "불만 접수";
      case "suggestion":
        return "개선 제안";
      case "other":
        return "기타";
      default:
        return "일반 문의";
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
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Link 
            href="/admin" 
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
            대시보드로 돌아가기
          </Link>
        </div>
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
            placeholder="이름, 이메일 또는 제목으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">전체 상태</option>
          <option value="pending">대기</option>
          <option value="processing">처리중</option>
          <option value="completed">완료</option>
          {/*<option value="closed">종료</option>*/}
        </select>
      </div>

      {/* Inquiries Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.tableCell}>문의번호</div>
            <div className={styles.tableCell}>이름</div>
            <div className={styles.tableCell}>이메일</div>
            <div className={styles.tableCell}>카테고리</div>
            <div className={styles.tableCell}>제목</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>등록일</div>
            <div className={styles.tableCell}>관리</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {currentInquiries.map((inquiry) => (
            <div key={inquiry.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: getPriorityColor(inquiry.priority)
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
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={16} color="#6b7280" />
                  {inquiry.email}
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
              <div className={styles.tableCell}>
                <div style={{ 
                  maxWidth: "200px", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap",
                  fontWeight: "500"
                }}>
                  {inquiry.subject}
                </div>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(inquiry.status)}
              </div>
              <div className={styles.tableCell}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  <Calendar size={14} />
                  {inquiry.createdAt}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button className={`${styles.actionButton} ${styles.blue}`}>
                    <Eye size={16} />
                    상세
                  </button>
                  {inquiry.status !== "completed" && inquiry.status !== "closed" && (
                    <button className={`${styles.actionButton} ${styles.gray}`}>
                      <Reply size={16} />
                      답변
                    </button>
                  )}
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