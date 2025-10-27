"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import styles from "../admin.module.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("http://localhost:8080/api/admin/users");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("회원 목록 조회 실패:", err);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
        user.uname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.ulocation?.toLowerCase().includes(searchTerm.toLowerCase());

    // backend status = number ⇒ convert to string to compare with dropdown
    const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && user.ustatus === 1) ||
        (filterStatus === "suspended" && user.ustatus === 0) ||
        (filterStatus === "pending" && user.ustatus !== 1 && user.ustatus !== 0);

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const getStatusBadge = (statusNum) => {
    if (statusNum === 1) return <span className={styles.statusSuccess}>활성</span>;
    if (statusNum === 0) return <span className={styles.statusError}>정지</span>;
    return <span className={styles.statusWarning}>대기</span>;
  };


  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
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
                placeholder="회원 ID, 이름 또는 주소로 검색..."
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
              <div className={styles.tableCell}>성별</div>
              <div className={styles.tableCell}>주소</div>
              <div className={styles.tableCell}>전화번호</div>
              <div className={styles.tableCell}>가입일</div>
              <div className={styles.tableCell}>매너온도</div>
              <div className={styles.tableCell}>경고횟수</div>
              <div className={styles.tableCell}>상태</div>
              <div className={styles.tableCell}>관리</div>
            </div>
          </div>
          <div className={styles.tableBody}>
            {currentUsers.map((user) => (
                <div key={user.uid} className={styles.tableRow}>
                  <div className={styles.tableCell}>{user.uid}</div>
                  <div className={styles.tableCell}>{user.uname}</div>
                  <div className={styles.tableCell}>{user.ugender}</div>
                  <div className={styles.tableCell}>{user.ulocation ?? "-"}</div>
                  <div className={styles.tableCell}>{user.uphone}</div>
                  <div className={styles.tableCell}>
                    {user.udate ? new Date(user.udate).toLocaleDateString("ko-KR") : "-"}
                  </div>
                  <div className={styles.tableCell}>{user.umanner}°C</div>
                  <div className={styles.tableCell}>{user.uwarn}회</div>
                  <div className={styles.tableCell}>{getStatusBadge(user.ustatus)}</div>
                  <div className={styles.tableCell}>
                    <div className={styles.actionButtons}>
                      <button className={`${styles.actionButton} ${styles.blue}`}>상세</button>
                      <button className={`${styles.actionButton} ${styles.gray}`}>수정</button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <div className={styles.paginationWrapper}>
                {/* First Page */}
                <button
                    className={styles.paginationNavButton}
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="첫 페이지"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Previous Page */}
                <button
                    className={styles.paginationNavButton}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="이전 페이지"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Numbers */}
                {getVisiblePages().map((page, index) => (
                    page === "..." ? (
                        <span key={`dots-${index}`} className={styles.paginationButton} style={{ cursor: 'default' }}>
                          ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
                            onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                    )
                ))}

                {/* Next Page */}
                <button
                    className={styles.paginationNavButton}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    title="다음 페이지"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Last Page */}
                <button
                    className={styles.paginationNavButton}
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="마지막 페이지"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>

            </div>
        )}
      </div>
  );
}
