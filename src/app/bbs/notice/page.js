"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, User, Search } from "lucide-react";
import { Pagination } from "@mui/material";
import styles from "../bbs.module.css";

export default function NoticeListPage() {
  const [allNotices, setAllNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const fetchAllNotices = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: 0,
          size: 1000, // Fetch a large number of notices to simulate fetching all
          sort: "nIdx,desc",
        }).toString();

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/public/notices?${queryParams}`);
        if (!res.ok) throw new Error("공지 목록을 불러오지 못했습니다.");
        
        const responseData = await res.json();
        setAllNotices(responseData.content || []);
      } catch (err) {
        console.error("공지 목록 조회 실패:", err);
        setError("공지사항을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllNotices();
  }, []);

  useEffect(() => {
    let notices = [...allNotices];

    if (selectedCategory !== "all") {
      notices = notices.filter(notice => convertCategory(notice.ncategory) === selectedCategory);
    }

    if (searchTerm) {
      notices = notices.filter(notice =>
        (notice.nsubject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notice.ncontent || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotices(notices);
    setPage(1);
  }, [allNotices, searchTerm, selectedCategory]);

  const handleSearch = () => {
    setSearchTerm(inputValue);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const convertCategory = (num) => {
    switch (num) {
      case 1: return "공지사항";
      case 2: return "업데이트";
      case 3: return "안내";
      case 4: return "이벤트";
      default: return "기타";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "공지사항":
        return { bg: "#fee2e2", color: "#dc2626" };
      case "이벤트":
        return { bg: "#dbeafe", color: "#2563eb" };
      case "업데이트":
        return { bg: "#dcfce7", color: "#16a34a" };
      case "점검":
        return { bg: "#fef3c7", color: "#d97706" };
      default:
        return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const totalPages = Math.ceil(filteredNotices.length / rowsPerPage);
  const currentNotices = filteredNotices.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", fontSize: "1.125rem", color: "#64748b" }}>
          공지사항을 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <p style={{ color: "#ef4444", textAlign: "center" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>공지사항</h1>
        <p className={styles.pageSubtitle}>
          DAEPA Market의 새로운 소식과 정보를 확인하세요.
        </p>
      </div>

      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="all">전체</option>
          <option value="공지사항">공지사항</option>
          <option value="업데이트">업데이트</option>
          <option value="안내">안내</option>
          <option value="이벤트">이벤트</option>
        </select>
        <div className={styles.searchInputContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="공지사항 검색..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
        </div>
        <button onClick={handleSearch} className={styles.searchButton}>
          검색
        </button>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: "80px 120px 1fr 120px 120px" }}>
          <div>No</div>
          <div>카테고리</div>
          <div>제목</div>
          <div>작성자</div>
          <div>날짜</div>
        </div>
        <div className={styles.tableBody}>
          {currentNotices.length === 0 ? (
            <div className={styles.tableRow} style={{ justifyContent: "center", padding: "2rem" }}>
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            currentNotices.map((notice) => {
                  const noticeTextStyle = { color: notice.nfix === 1 ? 'gray' : 'inherit' };
                  const categoryStyle = getCategoryColor(convertCategory(notice.ncategory));
                  return (
                    <Link
                      href={`/bbs/notice/${notice.nidx}`}
                      key={notice.nidx}
                      className={`${styles.tableRow} ${notice.nfix === 1 ? styles.pinnedNoticeBg : ''}`}
                      style={{ gridTemplateColumns: "80px 120px 1fr 120px 120px" }}
                    >
                      <div style={noticeTextStyle}>{notice.nidx}</div>
                      <div>
                        <span
                          style={{
                            backgroundColor: categoryStyle.bg,
                            color: categoryStyle.color,
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.75rem",
                            fontWeight: "600"
                          }}
                        >
                          {convertCategory(notice.ncategory)}
                        </span>
                      </div>
                      <div className={styles.textAlignLeft} style={noticeTextStyle}>
                        {notice.nsubject}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                        <User size={14} />
                        <span style={noticeTextStyle}>{notice.adminNick}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                        <Calendar size={14} />
                        <span style={noticeTextStyle}>{new Date(notice.ndate).toLocaleDateString("ko-KR")}</span>
                      </div>
                    </Link>
                  );
            })
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </div>
      )}
    </div>
  );
}
