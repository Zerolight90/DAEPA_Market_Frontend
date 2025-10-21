"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import styles from "../admin.module.css";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Mock data
    setTransactions([
      {
        id: 1,
        product: "아이폰 15 Pro 256GB",
        buyer: "김철수",
        seller: "이영희",
        amount: 1200000,
        status: "completed",
        date: "2024-01-15",
        paymentMethod: "계좌이체"
      },
      {
        id: 2,
        product: "나이키 에어맥스 270",
        buyer: "박민수",
        seller: "정수진",
        amount: 150000,
        status: "pending",
        date: "2024-01-20",
        paymentMethod: "직거래"
      },
      {
        id: 3,
        product: "맥북 프로 14인치 M2",
        buyer: "최영수",
        seller: "김철수",
        amount: 2500000,
        status: "cancelled",
        date: "2024-01-18",
        paymentMethod: "계좌이체"
      },
      {
        id: 4,
        product: "자전거 픽시",
        buyer: "이영희",
        seller: "박민수",
        amount: 300000,
        status: "completed",
        date: "2024-01-22",
        paymentMethod: "직거래"
      }
    ]);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || transaction.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span className={styles.statusSuccess}>완료</span>;
      case "pending":
        return <span className={styles.statusWarning}>진행중</span>;
      case "cancelled":
        return <span className={styles.statusError}>취소됨</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>거래 관리</h1>
        <p className={styles.pageSubtitle}>플랫폼 내 모든 거래를 모니터링하고 관리하세요</p>
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
          <option value="pending">진행중</option>
          <option value="completed">완료</option>
          <option value="cancelled">취소됨</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.tableCell}>거래 정보</div>
            <div className={styles.tableCell}>구매자</div>
            <div className={styles.tableCell}>판매자</div>
            <div className={styles.tableCell}>금액</div>
            <div className={styles.tableCell}>결제방법</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>작업</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <div className={styles.transactionInfo}>
                  <div className={styles.productTitle}>{transaction.product}</div>
                  <div className={styles.transactionDate}>
                    거래일: {new Date(transaction.date).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {transaction.buyer}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {transaction.seller}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.amount}>
                  {formatPrice(transaction.amount)}
                </div>
              </div>
              <div className={styles.tableCell}>
                <span className={styles.paymentMethod}>
                  {transaction.paymentMethod}
                </span>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(transaction.status)}
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button className={styles.actionButton}>
                    <CheckCircle size={16} />
                  </button>
                  {transaction.status === "pending" && (
                    <button className={`${styles.actionButton} ${styles.cancelButton}`}>
                      <XCircle size={16} />
                    </button>
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
