"use client";

import { useState, useEffect } from "react";
import { Search, Truck, Package, MapPin, Calendar, User, Eye } from "lucide-react";
import styles from "../admin.module.css";

export default function ShippingPage() {
  const [shippings, setShippings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/deliveries");
        if (!res.ok) throw new Error("배송 목록을 불러오지 못했습니다.");
        const data = await res.json();
        setShippings(data.map(item => ({
          id: item.dvIdx,
          dIdx: item.dIdx,
          product: item.productName || "-",
          buyer: item.buyerName || "-",
          seller: item.sellerName || "-",
          address: item.address || "-",
          addressDetail: item.addressDetail || "",
          status: item.dvStatus,
          tradeType: item.tradeType || "-",
          dealDate: item.dealDate || ""
        })));
      } catch (err) {
        console.error("배송 목록 조회 실패:", err);
        setShippings([]);
      }
    };

    fetchDeliveries();
  }, []);

  const filteredShippings = shippings.filter(shipping => {
    const matchesSearch = shipping.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipping.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipping.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (shipping.address && shipping.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "0" && shipping.status === 0) ||
                         (filterStatus === "1" && shipping.status === 1) ||
                         (filterStatus === "2" && shipping.status === 2) ||
                         (filterStatus === "3" && shipping.status === 3) ||
                         (filterStatus === "4" && shipping.status === 4) ||
                         (filterStatus === "5" && shipping.status === 5);
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 0:
        return <span style={{
          padding: "0.25rem 0.6rem",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
          fontWeight: 600
        }}>배송전</span>;
      case 1:
        return <span style={{
          padding: "0.25rem 0.6rem",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
          backgroundColor: "#dbeafe",
          color: "#1e40af",
          fontWeight: 600
        }}>배송중</span>;
      case 2:
        return <span style={{
          padding: "0.25rem 0.6rem",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
          backgroundColor: "#dcfce7",
          color: "#166534",
          fontWeight: 600
        }}>검수배송완료</span>;
      case 3:
        return <span style={{
          padding: "0.25rem 0.6rem",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
          backgroundColor: "#dbeafe",
          color: "#1e40af",
          fontWeight: 600
        }}>검수 후 배송</span>;
      case 4:
        return <span style={{
          padding: "0.25rem 0.6rem",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          fontWeight: 600
        }}>반품</span>;
      case 5:
        return <span style={{
          padding: "0.25rem 0.6rem",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
          backgroundColor: "#dcfce7",
          color: "#166534",
          fontWeight: 600
        }}>배송완료</span>;
      default:
        return <span style={{
          padding: "0.25rem 0.6rem",
          borderRadius: "0.5rem",
          fontSize: "0.75rem",
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
          fontWeight: 600
        }}>배송전</span>;
    }
  };

  const openModal = (shipping) => {
    setSelectedShipping(shipping);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedShipping(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedShipping) return;
    
    try {
      const res = await fetch(`http://localhost:8080/api/admin/deliveries/${selectedShipping.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("배송 상태 변경에 실패했습니다.");

      // 목록 다시 불러오기
      const refreshRes = await fetch("http://localhost:8080/api/admin/deliveries");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setShippings(refreshData.map(item => ({
          id: item.dvIdx,
          dIdx: item.dIdx,
          product: item.productName || "-",
          buyer: item.buyerName || "-",
          seller: item.sellerName || "-",
          address: item.address || "-",
          addressDetail: item.addressDetail || "",
          status: item.dvStatus,
          tradeType: item.tradeType || "-",
          dealDate: item.dealDate || ""
        })));
      }

      alert("배송 상태가 변경되었습니다.");
      closeModal();
    } catch (err) {
      console.error(err);
      alert(err.message || "배송 상태 변경에 실패했습니다.");
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
            placeholder="상품명, 구매자, 판매자, 배송지로 검색..."
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
          <option value="0">배송전</option>
          <option value="1">배송중</option>
          <option value="2">검수배송완료</option>
          <option value="3">검수 후 배송</option>
          <option value="4">반품</option>
          <option value="5">배송완료</option>
        </select>
      </div>

      {/* Shipping Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 2fr 1fr 100px", gap: "0.5rem" }}>
            <div className={styles.tableCell}>상품 정보</div>
            <div className={styles.tableCell}>보내는 사람</div>
            <div className={styles.tableCell}>받는 사람</div>
            <div className={styles.tableCell}>배송지</div>
            <div className={styles.tableCell}>배송 상태</div>
            <div className={styles.tableCell} style={{ textAlign: "center" }}>작업</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredShippings.length === 0 ? (
            <div className={styles.tableRow} style={{ justifyContent: "center" }}>
              <div className={styles.tableCell} style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b" }}>
                배송 데이터가 없습니다.
              </div>
            </div>
          ) : (
            filteredShippings.map((shipping) => (
              <div key={shipping.id} className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 2fr 1fr 100px", gap: "0.5rem" }}>
                <div className={styles.tableCell}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div className={styles.productTitle}>{shipping.product}</div>
                    {shipping.dealDate && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Calendar size={12} />
                        거래일: {shipping.dealDate}
                      </div>
                    )}
                    {shipping.tradeType && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        거래종류: {shipping.tradeType}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.tableCell}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <User size={16} color="#2563eb" />
                    <span>{shipping.seller}</span>
                  </div>
                </div>
                <div className={styles.tableCell}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <User size={16} color="#22c55e" />
                    <span>{shipping.buyer}</span>
                  </div>
                </div>
                <div className={styles.tableCell}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#374151" }}>
                      <MapPin size={16} color="#64748b" />
                      <span>{shipping.address}</span>
                    </div>
                    {shipping.addressDetail && (
                      <div style={{ fontSize: "0.875rem", color: "#64748b", marginLeft: "1.5rem" }}>
                        {shipping.addressDetail}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.tableCell}>
                  {getStatusBadge(shipping.status)}
                </div>
                <div className={styles.tableCell} style={{ display: "flex", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
                  <button
                    onClick={() => openModal(shipping)}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #e2e8f0",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f0f9ff";
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <Eye size={16} color="#3b82f6" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 배송 상태 변경 모달 */}
      {isModalOpen && selectedShipping && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={closeModal}>
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
            padding: "2rem",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflow: "auto"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#1e293b" }}>
                배송 상태 변경
              </h2>
              <div style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>상품:</strong> {selectedShipping.product}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>보내는 사람:</strong> {selectedShipping.seller}
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong>받는 사람:</strong> {selectedShipping.buyer}
                </div>
                <div>
                  <strong>현재 상태:</strong> {getStatusBadge(selectedShipping.status)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem", fontWeight: 600 }}>
                배송 상태를 선택해주세요
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                <button
                  onClick={() => handleStatusChange(0)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    backgroundColor: selectedShipping.status === 0 ? "#f3f4f6" : "#ffffff",
                    color: "#374151",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  배송전
                </button>
                <button
                  onClick={() => handleStatusChange(1)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    backgroundColor: selectedShipping.status === 1 ? "#dbeafe" : "#ffffff",
                    color: "#1e40af",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  배송중
                </button>
                <button
                  onClick={() => handleStatusChange(2)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    backgroundColor: selectedShipping.status === 2 ? "#dcfce7" : "#ffffff",
                    color: "#166534",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  검수배송완료
                </button>
                <button
                  onClick={() => handleStatusChange(3)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    backgroundColor: selectedShipping.status === 3 ? "#dbeafe" : "#ffffff",
                    color: "#1e40af",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  검수 후 배송
                </button>
                <button
                  onClick={() => handleStatusChange(4)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    backgroundColor: selectedShipping.status === 4 ? "#fee2e2" : "#ffffff",
                    color: "#991b1b",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  반품
                </button>
                <button
                  onClick={() => handleStatusChange(5)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    backgroundColor: selectedShipping.status === 5 ? "#dcfce7" : "#ffffff",
                    color: "#166534",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  배송완료
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  backgroundColor: "#fff",
                  color: "#374151",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
