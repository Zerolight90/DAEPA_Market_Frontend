"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, User as UserIcon, Ban, UserX, ShieldAlert } from "lucide-react";
import styles from "../admin.module.css";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/reports");
        if (!res.ok) throw new Error("신고 목록을 불러오지 못했습니다.");
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.warn("신고 API 호출 실패, 더미 데이터를 사용합니다.", err);
        setReports(createDummyReports());
      }
    };

    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch = [report.reporterName, report.reportedName, report.content]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || report.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [reports, searchTerm, filterType]);

  const handleAction = async (reportId, action) => {
    setActionLoading(`${reportId}-${action}`);
    try {
      const endpoint = `http://localhost:8080/api/admin/reports/${reportId}/${action}`;
      const method = action === "suspend" ? "PATCH" : "DELETE";
      const res = await fetch(endpoint, { method });

      if (!res.ok) throw new Error("요청을 처리하지 못했습니다.");

      alert(action === "suspend" ? "계정을 정지했습니다." : "계정을 탈퇴 처리했습니다.");

      if (action === "delete") {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (err) {
      alert(err.message || "계정 조치 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>신고 관리</h1>
        <p className={styles.pageSubtitle}>신고 접수 현황을 확인하고, 필요한 조치를 수행하세요.</p>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="신고자, 피신고자 또는 내용 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">전체 신고 종류</option>
          <option value="fraud">사기 의심</option>
          <option value="abuse">욕설/비방</option>
          <option value="spam">스팸/광고</option>
          <option value="other">기타</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 2.2fr 1.2fr 1.2fr" }}>
            <div className={styles.tableCell}>신고한 사람</div>
            <div className={styles.tableCell}>신고 당한 사람</div>
            <div className={styles.tableCell}>신고 종류</div>
            <div className={styles.tableCell}>신고 내용</div>
            <div className={styles.tableCell}>신고 날짜</div>
            <div className={styles.tableCell}>조치</div>
          </div>
        </div>

        <div className={styles.tableBody}>
          {filteredReports.length === 0 ? (
            <div className={styles.tableRow} style={{ justifyContent: "center" }}>
              <div className={styles.tableCell} style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b" }}>
                신고 데이터가 없습니다.
              </div>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 2.2fr 1.2fr 1.2fr" }}>
                <div className={styles.tableCell}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UserIcon size={16} color="#2563eb" />
                    {report.reporterName}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UserIcon size={16} color="#ef4444" />
                    {report.reportedName}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  <span style={{
                    padding: "0.25rem 0.6rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    backgroundColor: "#f3f4f6",
                    color: "#1f2937",
                    fontWeight: 600
                  }}>
                    {getTypeLabel(report.type)}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  <div style={{ color: "#64748b", maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {report.content}
                  </div>
                </div>
                <div className={styles.tableCell}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#475569" }}>
                    <Calendar size={16} />
                    {formatDate(report.createdAt)}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <button
                      className={`${styles.actionButton} ${styles.gray}`}
                      onClick={() => handleAction(report.id, "suspend")}
                      disabled={actionLoading === `${report.id}-suspend`}
                    >
                      <Ban size={16} />
                      {actionLoading === `${report.id}-suspend` ? "처리중" : "계정 정지"}
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.actionButtonRed}`}
                      onClick={() => handleAction(report.id, "ban")}
                      disabled={actionLoading === `${report.id}-ban`}
                    >
                      <UserX size={16} />
                      {actionLoading === `${report.id}-ban` ? "처리중" : "계정 탈퇴"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

function getTypeLabel(type) {
  switch (type) {
    case "fraud":
      return "사기 의심";
    case "abuse":
      return "욕설/비방";
    case "spam":
      return "스팸/광고";
    case "other":
    default:
      return "기타";
  }
}

function createDummyReports() {
  return [
    {
      id: 1,
      reporterName: "김신고",
      reportedName: "박피신",
      createdAt: new Date().toISOString(),
      content: "거래 중 입금이 되지 않아 신고합니다.",
      type: "fraud"
    },
    {
      id: 2,
      reporterName: "이소란",
      reportedName: "최욕설",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      content: "채팅에서 지속적인 욕설과 비방을 하였습니다.",
      type: "abuse"
    },
    {
      id: 3,
      reporterName: "오광고",
      reportedName: "정스팸",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      content: "판매와 관련 없는 광고 메시지를 반복적으로 보냅니다.",
      type: "spam"
    }
  ];
}

