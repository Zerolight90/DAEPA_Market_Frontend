"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import styles from "../admin.module.css";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Mock data
    setProducts([
      {
        id: 1,
        title: "아이폰 15 Pro 256GB",
        seller: "김철수",
        category: "전자제품",
        price: 1200000,
        status: "approved",
        uploadDate: "2024-01-15",
        views: 245,
        likes: 12
      },
      {
        id: 2,
        title: "나이키 에어맥스 270",
        seller: "이영희",
        category: "패션/의류",
        price: 150000,
        status: "pending",
        uploadDate: "2024-01-20",
        views: 89,
        likes: 5
      },
      {
        id: 3,
        title: "맥북 프로 14인치 M2",
        seller: "박민수",
        category: "전자제품",
        price: 2500000,
        status: "rejected",
        uploadDate: "2024-01-18",
        views: 156,
        likes: 8
      },
      {
        id: 4,
        title: "자전거 픽시",
        seller: "정수진",
        category: "스포츠/레저",
        price: 300000,
        status: "approved",
        uploadDate: "2024-01-22",
        views: 78,
        likes: 3
      }
    ]);
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || product.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className={styles.statusSuccess}>승인됨</span>;
      case "pending":
        return <span className={styles.statusWarning}>대기중</span>;
      case "rejected":
        return <span className={styles.statusError}>거부됨</span>;
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
        <h1 className={styles.pageTitle}>상품 관리</h1>
        <p className={styles.pageSubtitle}>등록된 상품들을 검토하고 관리하세요</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="상품명 또는 판매자로 검색..."
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
          <option value="pending">승인 대기</option>
          <option value="approved">승인됨</option>
          <option value="rejected">거부됨</option>
        </select>
      </div>

      {/* Products Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.tableCell}>상품 정보</div>
            <div className={styles.tableCell}>판매자</div>
            <div className={styles.tableCell}>카테고리</div>
            <div className={styles.tableCell}>가격</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>조회수</div>
            <div className={styles.tableCell}>작업</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredProducts.map((product) => (
            <div key={product.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <div className={styles.productInfo}>
                  <div className={styles.productImage}>
                    📱
                  </div>
                  <div>
                    <div className={styles.productTitle}>{product.title}</div>
                    <div className={styles.productDate}>
                      등록일: {new Date(product.uploadDate).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.sellerInfo}>
                  {product.seller}
                </div>
              </div>
              <div className={styles.tableCell}>
                <span className={styles.categoryTag}>{product.category}</span>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.price}>
                  {formatPrice(product.price)}
                </div>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(product.status)}
              </div>
              <div className={styles.tableCell}>
                <div className={styles.statsInfo}>
                  <div>👁️ {product.views}</div>
                  <div>❤️ {product.likes}</div>
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button className={styles.actionButton}>
                    <Eye size={16} />
                  </button>
                  {product.status === "pending" && (
                    <>
                      <button className={`${styles.actionButton} ${styles.approveButton}`}>
                        <CheckCircle size={16} />
                      </button>
                      <button className={`${styles.actionButton} ${styles.rejectButton}`}>
                        <XCircle size={16} />
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
