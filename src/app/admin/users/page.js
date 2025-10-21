"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, UserCheck, UserX, Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "../admin.module.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Mock data - 50개 회원 데이터
    const mockUsers = [];
    const names = ["김철수", "이영희", "박민수", "정수진", "최지영", "한민호", "윤서연", "강동현", "임수빈", "송태준"];
    const statuses = ["active", "active", "active", "suspended", "pending"];
    
    for (let i = 1; i <= 50; i++) {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomMannerTemp = (Math.random() * 20 + 20).toFixed(1); // 20~40도
      
      mockUsers.push({
        id: i,
        userId: `user${i.toString().padStart(3, '0')}`,
        name: `${randomName}${i}`,
        email: `user${i}@example.com`,
        phone: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        joinDate: `2024-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        status: randomStatus,
        mannerTemp: parseFloat(randomMannerTemp)
      });
    }
    
    setUsers(mockUsers);
  }, []);

  // 검색이나 필터가 변경될 때 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // 페이지네이션 범위 계산
  const getPageRange = () => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);
      return { start: adjustedStartPage, end: endPage };
    }
    
    return { start: startPage, end: endPage };
  };

  const pageRange = getPageRange();

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className={styles.statusSuccess}>활성</span>;
      case "suspended":
        return <span className={styles.statusError}>정지</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>사용자 관리</h1>
        <p className={styles.pageSubtitle}>등록된 사용자들을 관리하고 모니터링하세요</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="회원 ID, 이름 또는 이메일로 검색..."
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
          <option value="active">활성</option>
          <option value="suspended">정지</option>
          <option value="pending">대기</option>
        </select>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.tableCell}>회원 ID</div>
            <div className={styles.tableCell}>이름</div>
            <div className={styles.tableCell}>이메일</div>
            <div className={styles.tableCell}>전화번호</div>
            <div className={styles.tableCell}>가입일</div>
            <div className={styles.tableCell}>매너온도</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>관리</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {currentUsers.map((user) => (
            <div key={user.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <div className={styles.userId}>
                  {user.userId}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.userName}>
                  {user.name}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.userEmail}>
                  {user.email}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.phoneNumber}>
                  {user.phone}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.joinDate}>
                  {new Date(user.joinDate).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={`${styles.mannerTemp} ${
                  user.mannerTemp >= 40 ? styles.high :
                  user.mannerTemp >= 35 ? styles.medium : styles.low
                }`}>
                  {user.mannerTemp}°C
                </div>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(user.status)}
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button className={`${styles.actionButton} ${styles.blue}`}>
                    상세
                  </button>
                  <button className={`${styles.actionButton} ${styles.gray}`}>
                    수정
                  </button>
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
            <ChevronLeft size={16} />
          </button>

          {/* 페이지 번호들 */}
          {Array.from({ length: pageRange.end - pageRange.start + 1 }, (_, i) => {
            const pageNum = pageRange.start + i;
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
            <ChevronRight size={16} />
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
        {filteredUsers.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}개 표시
      </div>
    </div>
  );
}
