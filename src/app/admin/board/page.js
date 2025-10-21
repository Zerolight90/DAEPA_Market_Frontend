"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, MessageSquare, Edit, Trash2, Eye } from "lucide-react";
import styles from "../admin.module.css";

export default function BoardPage() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    // Mock data
    setPosts([
      {
        id: 1,
        title: "대파마켓 이용 가이드",
        category: "공지사항",
        author: "관리자",
        date: "2024-01-15",
        views: 1250,
        comments: 15,
        status: "published",
        content: "대파마켓을 처음 이용하시는 분들을 위한 가이드입니다."
      },
      {
        id: 2,
        title: "안전한 거래를 위한 팁",
        category: "이용가이드",
        author: "관리자",
        date: "2024-01-20",
        views: 890,
        comments: 8,
        status: "published",
        content: "사기를 당하지 않기 위한 안전한 거래 방법을 알려드립니다."
      },
      {
        id: 3,
        title: "시스템 점검 안내",
        category: "공지사항",
        author: "관리자",
        date: "2024-01-18",
        views: 456,
        comments: 3,
        status: "draft",
        content: "1월 25일 새벽 2시부터 4시까지 시스템 점검이 예정되어 있습니다."
      },
      {
        id: 4,
        title: "신규 기능 업데이트",
        category: "업데이트",
        author: "관리자",
        date: "2024-01-22",
        views: 678,
        comments: 12,
        status: "published",
        content: "채팅 기능과 실시간 알림 기능이 추가되었습니다."
      }
    ]);
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === "all" || post.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return <span className={styles.statusSuccess}>게시됨</span>;
      case "draft":
        return <span className={styles.statusWarning}>임시저장</span>;
      case "archived":
        return <span className={styles.statusError}>보관됨</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>게시판 관리</h1>
        <p className={styles.pageSubtitle}>공지사항과 게시글을 관리하세요</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="제목, 작성자로 검색..."
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
          <option value="all">전체 카테고리</option>
          <option value="공지사항">공지사항</option>
          <option value="이용가이드">이용가이드</option>
          <option value="업데이트">업데이트</option>
          <option value="이벤트">이벤트</option>
        </select>
      </div>

      {/* Posts Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.tableCell}>제목</div>
            <div className={styles.tableCell}>카테고리</div>
            <div className={styles.tableCell}>작성자</div>
            <div className={styles.tableCell}>작성일</div>
            <div className={styles.tableCell}>조회수</div>
            <div className={styles.tableCell}>댓글수</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>작업</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredPosts.map((post) => (
            <div key={post.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <div className={styles.postInfo}>
                  <div className={styles.postTitle}>{post.title}</div>
                  <div className={styles.postPreview}>
                    {post.content.length > 50 
                      ? `${post.content.substring(0, 50)}...` 
                      : post.content}
                  </div>
                </div>
              </div>
              <div className={styles.tableCell}>
                <span className={styles.categoryTag}>{post.category}</span>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.authorInfo}>
                  {post.author}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.dateInfo}>
                  {new Date(post.date).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.statsInfo}>
                  👁️ {post.views.toLocaleString()}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.statsInfo}>
                  💬 {post.comments}
                </div>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(post.status)}
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button className={styles.actionButton}>
                    <Eye size={16} />
                  </button>
                  <button className={styles.actionButton}>
                    <Edit size={16} />
                  </button>
                  <button className={styles.actionButton}>
                    <Trash2 size={16} />
                  </button>
                  <button className={styles.actionButton}>
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
