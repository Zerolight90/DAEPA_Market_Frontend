"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, Truck, Package, MapPin, Clock } from "lucide-react";
import styles from "../admin.module.css";

export default function ShippingPage() {
  const [shippings, setShippings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Mock data
    setShippings([
      {
        id: 1,
        product: "아이폰 15 Pro 256GB",
        buyer: "김철수",
        seller: "이영희",
        trackingNumber: "CJ1234567890",
        status: "shipped",
        shippingDate: "2024-01-15",
        expectedDate: "2024-01-17",
        address: "서울시 강남구 테헤란로 123",
        shippingMethod: "택배"
      },
      {
        id: 2,
        product: "나이키 에어맥스 270",
        buyer: "박민수",
        seller: "정수진",
        trackingNumber: "CJ0987654321",
        status: "delivered",
        shippingDate: "2024-01-20",
        expectedDate: "2024-01-22",
        address: "부산시 해운대구 센텀중앙로 456",
        shippingMethod: "직거래"
      },
      {
        id: 3,
        product: "맥북 프로 14인치 M2",
        buyer: "최영수",
        seller: "김철수",
        trackingNumber: "CJ1122334455",
        status: "pending",
        shippingDate: "2024-01-18",
        expectedDate: "2024-01-20",
        address: "대구시 수성구 동대구로 789",
        shippingMethod: "택배"
      }
    ]);
  }, []);

  const filteredShippings = shippings.filter(shipping => {
    const matchesSearch = shipping.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipping.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipping.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipping.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || shipping.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "delivered":
        return <span className={styles.statusSuccess}>배송완료</span>;
      case "shipped":
        return <span className={styles.statusWarning}>배송중</span>;
      case "pending":
        return <span className={styles.statusWarning}>배송대기</span>;
      case "cancelled":
        return <span className={styles.statusError}>취소됨</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>배송 관리</h1>
        <p className={styles.pageSubtitle}>모든 배송 현황을 추적하고 관리하세요</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="상품명, 구매자, 판매자, 송장번호로 검색..."
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
          <option value="pending">배송대기</option>
          <option value="shipped">배송중</option>
          <option value="delivered">배송완료</option>
          <option value="cancelled">취소됨</option>
        </select>
      </div>

      {/* Shipping Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.tableCell}>상품 정보</div>
            <div className={styles.tableCell}>구매자</div>
            <div className={styles.tableCell}>판매자</div>
            <div className={styles.tableCell}>송장번호</div>
            <div className={styles.tableCell}>배송지</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>작업</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredShippings.map((shipping) => (
            <div key={shipping.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <div className={styles.shippingInfo}>
                  <div className={styles.productTitle}>{shipping.product}</div>
                  <div className={styles.shippingDate}>
                    배송일: {new Date(shipping.shippingDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {shipping.buyer}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {shipping.seller}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.trackingNumber}>
                  {shipping.trackingNumber}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.addressInfo}>
                  <div className={styles.address}>{shipping.address}</div>
                  <div className={styles.shippingMethod}>{shipping.shippingMethod}</div>
                </div>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(shipping.status)}
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button className={styles.actionButton}>
                    <Truck size={16} />
                  </button>
                  <button className={styles.actionButton}>
                    <MapPin size={16} />
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
