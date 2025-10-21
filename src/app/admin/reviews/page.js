"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Star, ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import styles from "../admin.module.css";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Mock data
    setReviews([
      {
        id: 1,
        product: "아이폰 15 Pro 256GB",
        buyer: "김철수",
        seller: "이영희",
        rating: 5,
        comment: "정말 좋은 상품이었습니다. 빠른 배송과 정확한 설명에 만족합니다.",
        date: "2024-01-15",
        status: "approved",
        helpful: 12
      },
      {
        id: 2,
        product: "나이키 에어맥스 270",
        buyer: "박민수",
        seller: "정수진",
        rating: 4,
        comment: "상품 상태가 설명과 조금 달랐지만 전반적으로 만족합니다.",
        date: "2024-01-20",
        status: "pending",
        helpful: 8
      },
      {
        id: 3,
        product: "맥북 프로 14인치 M2",
        buyer: "최영수",
        seller: "김철수",
        rating: 1,
        comment: "상품이 설명과 완전히 달랐습니다. 환불 요청합니다.",
        date: "2024-01-18",
        status: "reported",
        helpful: 3
      }
    ]);
  }, []);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || review.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className={styles.statusSuccess}>승인됨</span>;
      case "pending":
        return <span className={styles.statusWarning}>대기중</span>;
      case "reported":
        return <span className={styles.statusError}>신고됨</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? styles.starFilled : styles.starEmpty}
      />
    ));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>거래 후기 관리</h1>
        <p className={styles.pageSubtitle}>사용자들이 작성한 거래 후기를 검토하고 관리하세요</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="상품명, 구매자, 판매자로 검색..."
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
          <option value="pending">대기중</option>
          <option value="approved">승인됨</option>
          <option value="reported">신고됨</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.tableCell}>거래 정보</div>
            <div className={styles.tableCell}>구매자</div>
            <div className={styles.tableCell}>판매자</div>
            <div className={styles.tableCell}>평점</div>
            <div className={styles.tableCell}>후기</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>작업</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredReviews.map((review) => (
            <div key={review.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <div className={styles.reviewInfo}>
                  <div className={styles.productTitle}>{review.product}</div>
                  <div className={styles.reviewDate}>
                    작성일: {new Date(review.date).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {review.buyer}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {review.seller}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.ratingContainer}>
                  {renderStars(review.rating)}
                  <span className={styles.ratingText}>{review.rating}/5</span>
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.commentPreview}>
                  {review.comment.length > 50 
                    ? `${review.comment.substring(0, 50)}...` 
                    : review.comment}
                </div>
                <div className={styles.helpfulCount}>
                  👍 {review.helpful}명이 도움됨
                </div>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(review.status)}
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button className={styles.actionButton}>
                    <MessageCircle size={16} />
                  </button>
                  {review.status === "pending" && (
                    <>
                      <button className={`${styles.actionButton} ${styles.approveButton}`}>
                        <ThumbsUp size={16} />
                      </button>
                      <button className={`${styles.actionButton} ${styles.rejectButton}`}>
                        <ThumbsDown size={16} />
                      </button>
                    </>
                  )}
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
