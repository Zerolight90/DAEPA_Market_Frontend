"use client";

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import styles from "../admin.module.css";

const statusBadge = (status) => {
  switch (status) {
    case 1:
      return <span className={styles.statusSuccess}>활성</span>;
    case 0:
      return <span className={styles.statusWarning}>비활성</span>;
    default:
      return <span className={styles.statusError}>알 수 없음</span>;
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return value;
  } catch {
    return value;
  }
};

export default function AdminManagePage() {
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/admin/admins");
        if (!res.ok) throw new Error("관리자 목록을 불러오지 못했습니다.");
        const data = await res.json();
        setAdmins(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("관리자 목록을 불러오는 중 문제가 발생했습니다.");
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const filteredAdmins = useMemo(() => {
    if (!searchTerm.trim()) {
      return admins;
    }
    const term = searchTerm.toLowerCase();
    return admins.filter((admin) =>
      [admin.adId, admin.adName, admin.adNick]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [admins, searchTerm]);

  const columnsTemplate = "120px 1.1fr 1fr 1.1fr 140px 160px";

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>관리자 조회</h1>
        <p className={styles.pageSubtitle}>등록된 관리자 계정을 확인하고 조회하세요</p>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="관리자 ID, 이름 또는 별명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div
            className={styles.tableRow}
            style={{ display: "grid", gridTemplateColumns: columnsTemplate, gap: "0.5rem" }}
          >
            <div className={styles.tableCell} style={{ paddingRight: "1.5rem" }}>관리자 번호</div>
            <div className={styles.tableCell} style={{ paddingLeft: "1.25rem" }}>관리자 ID</div>
            <div className={styles.tableCell}>관리자 이름</div>
            <div className={styles.tableCell} style={{ paddingRight: "0.75rem" }}>관리자 별명</div>
            <div className={styles.tableCell} style={{ textAlign: "center", paddingRight: "70px"}}>상태</div>
            <div className={styles.tableCell} style={{ textAlign: "center" }}>생년월일</div>
          </div>
        </div>

        <div className={styles.tableBody}>
          {loading ? (
            <div className={styles.tableRow} style={{ justifyContent: "center" }}>
              <div className={styles.tableCell} style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b" }}>
                로딩 중...
              </div>
            </div>
          ) : error ? (
            <div className={styles.tableRow} style={{ justifyContent: "center" }}>
              <div className={styles.tableCell} style={{ gridColumn: "1 / -1", textAlign: "center", color: "#ef4444" }}>
                {error}
              </div>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className={styles.tableRow} style={{ justifyContent: "center" }}>
              <div className={styles.tableCell} style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b" }}>
                관리자 데이터가 없습니다.
              </div>
            </div>
          ) : (
            filteredAdmins.map((admin) => (
              <div
                key={admin.adIdx}
                className={styles.tableRow}
                style={{ display: "grid", gridTemplateColumns: columnsTemplate, gap: "0.5rem" }}
              >
                <div className={styles.tableCell} style={{ paddingRight: "1.5rem" }}>#{admin.adIdx}</div>
                <div className={styles.tableCell} style={{ paddingLeft: "1.25rem", fontWeight: 500 }}>
                  {admin.adId || "-"}
                </div>
                <div className={styles.tableCell}>{admin.adName || "-"}</div>
                <div className={styles.tableCell} style={{ paddingRight: "0.75rem" }}>
                  {admin.adNick || "-"}
                </div>
                <div className={styles.tableCell} style={{ textAlign: "center", paddingRight: "70px"}}>
                  {statusBadge(admin.adStatus)}
                </div>
                <div className={styles.tableCell} style={{ textAlign: "center" }}>
                  {formatDate(admin.adBirth)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

