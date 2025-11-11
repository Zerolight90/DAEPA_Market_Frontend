"use client";

import { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, XCircle, X, Package, User } from "lucide-react";
import styles from "../admin.module.css";

export default function InspectionPage() {
  const [inspections, setInspections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/checks`);
        if (!res.ok) throw new Error("검수 목록을 불러오지 못했습니다.");
        const data = await res.json();
        setInspections(data.map(item => ({
          id: item.ckIdx,
          product: item.productName || "-",
          seller: item.sellerName || "-",
          status: item.ckStatus === 1 ? "completed" : "processing",
          result: item.ckResult === 1 ? "passed" : item.ckResult === 0 ? "failed" : null,
          tradeType: item.tradeType || "-",
          dvStatus: item.dvStatus // 배송 상태
        })));
      } catch (err) {
        console.error("검수 목록 조회 실패:", err);
        setInspections([]);
      }
    };

    fetchInspections();
  }, []);

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (inspection.tradeType && inspection.tradeType.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === "all" || inspection.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const openModal = (inspection) => {
    setSelectedInspection(inspection);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInspection(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "processing":
        return <span className={styles.statusWarning}>검수중</span>;
      case "completed":
        return <span className={styles.statusSuccess}>검수 완료</span>;
      default:
        return <span className={styles.statusWarning}>검수중</span>;
    }
  };

  const getResultBadge = (result) => {
    if (!result) {
      return <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>-</span>;
    }
    switch (result) {
      case "passed":
        return <span className={styles.statusSuccess}>합격</span>;
      case "failed":
        return <span className={styles.statusError}>불합격</span>;
      default:
        return <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>-</span>;
    }
  };

  const getDeliveryStatusBadge = (dvStatus, ckStatus) => {
    // 검수 전이면 배송전
    if (ckStatus === 0 || ckStatus === "processing") {
      return <span style={{
        padding: "0.25rem 0.6rem",
        borderRadius: "0.5rem",
        fontSize: "0.75rem",
        backgroundColor: "#f3f4f6",
        color: "#6b7280",
        fontWeight: 600
      }}>배송전</span>;
    }

    // 검수 완료 후 배송 상태 표시
    if (dvStatus === null || dvStatus === undefined) {
      return <span style={{
        padding: "0.25rem 0.6rem",
        borderRadius: "0.5rem",
        fontSize: "0.75rem",
        backgroundColor: "#f3f4f6",
        color: "#6b7280",
        fontWeight: 600
      }}>배송전</span>;
    }

    switch (dvStatus) {
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

  const handleStatusChange = async (newStatus) => {
    if (!selectedInspection) return;
    
    // 이미 검수 완료된 항목은 처리하지 않음
    if (selectedInspection.status === "completed" && selectedInspection.result) {
      alert("이미 검수 결과가 등록된 항목입니다.");
      return;
    }
    
    try {
      // newStatus가 "passed" 또는 "failed"면 검수 완료로 변경하고 결과 설정
      if (newStatus === "passed" || newStatus === "failed") {
        const resultValue = newStatus === "passed" ? 1 : 0;
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/checks/${selectedInspection.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ result: resultValue })
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "검수 결과 등록에 실패했습니다.");
        }

        // 목록 다시 불러오기
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/checks`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setInspections(refreshData.map(item => ({
            id: item.ckIdx,
            product: item.productName || "-",
            seller: item.sellerName || "-",
            status: item.ckStatus === 1 ? "completed" : "processing",
            result: item.ckResult === 1 ? "passed" : item.ckResult === 0 ? "failed" : null,
            tradeType: item.tradeType || "-",
            dvStatus: item.dvStatus
          })));
        }

        alert("검수 결과가 등록되었습니다.");
        closeModal();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "상태 변경에 실패했습니다.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>검수 관리</h1>
        <p className={styles.pageSubtitle}>상품 검수 현황을 관리하고 품질을 보장하세요</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="상품명, 판매자, 거래 종류로 검색..."
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
          <option value="processing">검수중</option>
          <option value="completed">검수 완료</option>
        </select>
      </div>

      {/* Inspection Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 100px", gap: "0.5rem" }}>
            <div className={styles.tableCell}>상품명</div>
            <div className={styles.tableCell}>판매자</div>
            <div className={styles.tableCell}>거래 종류</div>
            <div className={styles.tableCell}>검수상태</div>
            <div className={styles.tableCell}>검수 결과</div>
            <div className={styles.tableCell}>배송</div>
            <div className={styles.tableCell} style={{ textAlign: "center" }}>작업</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredInspections.map((inspection) => (
            <div key={inspection.id} className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 100px", gap: "0.5rem" }}>
              <div className={styles.tableCell}>
                <div className={styles.productTitle}>{inspection.product}</div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {inspection.seller}
                </div>
              </div>
              <div className={styles.tableCell}>
                <span style={{
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  fontSize: "0.875rem",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  fontWeight: 500
                }}>
                  {inspection.tradeType || "-"}
                </span>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(inspection.status)}
              </div>
              <div className={styles.tableCell}>
                {getResultBadge(inspection.result)}
              </div>
              <div className={styles.tableCell}>
                {getDeliveryStatusBadge(inspection.dvStatus, inspection.status === "processing" ? 0 : 1)}
              </div>
              <div className={styles.tableCell} style={{ display: "flex", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
                <button
                  onClick={() => openModal(inspection)}
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
          ))}
        </div>
      </div>

      {/* Inspection Action Modal */}
      {isModalOpen && selectedInspection && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <h2>검수 결과 등록</h2>
              <button
                onClick={closeModal}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "0.375rem",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody} style={{ padding: 0 }}>
              {/* 상품 정보 */}
              <div style={{
                padding: "2rem",
                borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(135deg, #f8fafc, #e2e8f0)"
              }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                    <Package size={20} color="#64748b" />
                    <h2 style={{
                      margin: 0,
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#1e293b"
                    }}>
                      {selectedInspection.product}
                    </h2>
                  </div>
                </div>

                {/* 메타 정보 */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "2rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #e5e7eb"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <User size={18} color="#64748b" />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>판매자</div>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedInspection.seller}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <User size={18} color="#64748b" />
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>거래 종류</div>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedInspection.tradeType || "-"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 검수 결과 선택 */}
              <div style={{ padding: "3rem" }}>
                {selectedInspection.status === "completed" && selectedInspection.result ? (
                  <div style={{
                    textAlign: "center",
                    padding: "2rem",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "0.75rem"
                  }}>
                    <div style={{
                      fontSize: "1rem",
                      color: "#64748b",
                      marginBottom: "0.5rem",
                      fontWeight: 600
                    }}>
                      이미 검수 결과가 등록되었습니다.
                    </div>
                    <div style={{
                      fontSize: "1.25rem",
                      color: selectedInspection.result === "passed" ? "#22c55e" : "#ef4444",
                      fontWeight: 700
                    }}>
                      {selectedInspection.result === "passed" ? "✓ 검수 합격" : "✗ 검수 불합격"}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{
                      fontSize: "0.875rem",
                      color: "#64748b",
                      marginBottom: "1.5rem",
                      fontWeight: 600
                    }}>
                      검수 결과를 선택해주세요
                    </div>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem"
                    }}>
                      <button
                        onClick={() => handleStatusChange("passed")}
                        style={{
                          width: "100%",
                          padding: "1.25rem 1.5rem",
                          border: "2px solid #22c55e",
                          borderRadius: "0.75rem",
                          backgroundColor: "#ffffff",
                          color: "#22c55e",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.75rem",
                          fontSize: "1.0625rem",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#f0fdf4";
                          e.target.style.borderColor = "#16a34a";
                          e.target.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#ffffff";
                          e.target.style.borderColor = "#22c55e";
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        <CheckCircle size={24} />
                        검수 합격
                      </button>
                      <button
                        onClick={() => handleStatusChange("failed")}
                        style={{
                          width: "100%",
                          padding: "1.25rem 1.5rem",
                          border: "2px solid #ef4444",
                          borderRadius: "0.75rem",
                          backgroundColor: "#ffffff",
                          color: "#ef4444",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.75rem",
                          fontSize: "1.0625rem",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#fef2f2";
                          e.target.style.borderColor = "#dc2626";
                          e.target.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "#ffffff";
                          e.target.style.borderColor = "#ef4444";
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        <XCircle size={24} />
                        검수 불합격
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}