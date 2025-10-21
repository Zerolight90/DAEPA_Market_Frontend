"use client";

import { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, CheckCircle, XCircle, AlertTriangle, Eye } from "lucide-react";
import styles from "../admin.module.css";

export default function InspectionPage() {
  const [inspections, setInspections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Mock data
    setInspections([
      {
        id: 1,
        product: "아이폰 15 Pro 256GB",
        seller: "이영희",
        inspectionDate: "2024-01-15",
        status: "passed",
        inspector: "김검수",
        notes: "상품 상태가 설명과 일치하며, 정상적인 중고 상품입니다.",
        issues: []
      },
      {
        id: 2,
        product: "나이키 에어맥스 270",
        seller: "정수진",
        inspectionDate: "2024-01-20",
        status: "failed",
        inspector: "박검수",
        notes: "상품에 미세한 스크래치가 발견되었습니다.",
        issues: ["미세한 스크래치 발견", "색상 차이"]
      },
      {
        id: 3,
        product: "맥북 프로 14인치 M2",
        seller: "김철수",
        inspectionDate: "2024-01-18",
        status: "pending",
        inspector: "이검수",
        notes: "검수 진행 중입니다.",
        issues: []
      }
    ]);
  }, []);

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || inspection.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "passed":
        return <span className={styles.statusSuccess}>검수통과</span>;
      case "failed":
        return <span className={styles.statusError}>검수실패</span>;
      case "pending":
        return <span className={styles.statusWarning}>검수중</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
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
            placeholder="상품명, 판매자, 검수자로 검색..."
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
          <option value="pending">검수중</option>
          <option value="passed">검수통과</option>
          <option value="failed">검수실패</option>
        </select>
      </div>

      {/* Inspection Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.tableCell}>상품 정보</div>
            <div className={styles.tableCell}>판매자</div>
            <div className={styles.tableCell}>검수자</div>
            <div className={styles.tableCell}>검수일</div>
            <div className={styles.tableCell}>상태</div>
            <div className={styles.tableCell}>이슈</div>
            <div className={styles.tableCell}>작업</div>
          </div>
        </div>
        <div className={styles.tableBody}>
          {filteredInspections.map((inspection) => (
            <div key={inspection.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <div className={styles.inspectionInfo}>
                  <div className={styles.productTitle}>{inspection.product}</div>
                  <div className={styles.inspectionDate}>
                    검수일: {new Date(inspection.inspectionDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.participantInfo}>
                  {inspection.seller}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.inspectorInfo}>
                  {inspection.inspector}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.dateInfo}>
                  {new Date(inspection.inspectionDate).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className={styles.tableCell}>
                {getStatusBadge(inspection.status)}
              </div>
              <div className={styles.tableCell}>
                <div className={styles.issuesContainer}>
                  {inspection.issues.length > 0 ? (
                    <div className={styles.issuesList}>
                      {inspection.issues.map((issue, index) => (
                        <div key={index} className={styles.issueItem}>
                          <AlertTriangle size={12} />
                          {issue}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.noIssues}>이슈 없음</span>
                  )}
                </div>
              </div>
              <div className={styles.tableCell}>
                <div className={styles.actionButtons}>
                  <button className={styles.actionButton}>
                    <Eye size={16} />
                  </button>
                  {inspection.status === "pending" && (
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
