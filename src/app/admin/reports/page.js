"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, User as UserIcon, CheckCircle } from "lucide-react";
import styles from "../admin.module.css";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null,
    reportId: null,
    reportedName: "",
    report: null,
  });
  const [suspendForm, setSuspendForm] = useState({
    suspendDate: "",
    reason: "",
    duration: ""
  });
  const [banForm, setBanForm] = useState({
    reason: ""
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/reports`);
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

  const openModal = (action, reportId, reportedName, report = null) => {
    setModalState({
      isOpen: true,
      action,
      reportId,
      reportedName,
      report,
    });
    if (action === "suspend") {
      setSuspendForm({
        suspendDate: new Date().toISOString().split('T')[0],
        reason: "",
        duration: ""
      });
    } else if (action === "ban") {
      setBanForm({ reason: "" });
    }
    if (!report && action === "details") {
      setModalState((prev) => ({ ...prev, report }));
    }
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      action: null,
      reportId: null,
      reportedName: "",
      report: null,
    });
  };

  const handleAction = async (reportId, action, formData = {}) => {
    setActionLoading(`${reportId}-${action}`);
    try {
      const base = `${process.env.NEXT_PUBLIC_API_BASE}/api/admin/reports/${reportId}`;
      const endpoint =
          action === "suspend"     ? `${base}/suspend` :
              action === "ban"         ? `${base}/ban` :
                  action === "activate"    ? `${base}/activate` :
                      action === "manner-down" ? `${base}/manner-down` :
                          `${base}/${action}`;

      const body =
          action === "suspend" ? { suspendDate: formData.suspendDate, reason: formData.reason, duration: formData.duration } :
              action === "ban"     ? { reason: formData.reason } :
                  undefined;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      if (!res.ok) throw new Error("요청을 처리하지 못했습니다.");

      let message = "";
      if (action === "suspend")      message = "계정을 정지하고 신선도 -10 적용했습니다.";
      else if (action === "ban")     message = "계정을 탈퇴 처리하고 신선도 0으로 초기화했습니다.";
      else if (action === "activate")message = "계정을 활성화했습니다.";
      else if (action === "manner-down") message = "신선도를 5 하락시켰습니다.";

      alert(message);
      closeModal();

      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/reports`);
      if (refreshRes.ok) setReports(await refreshRes.json());
    } catch (err) {
      alert(err.message || "조치 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendSubmit = (e) => {
    e.preventDefault();
    if (!suspendForm.reason || !suspendForm.duration) {
      alert("정지사유와 정지기간을 입력해주세요.");
      return;
    }
    handleAction(modalState.reportId, "suspend", suspendForm);
  };

  const handleBanSubmit = (e) => {
    e.preventDefault();
    if (!banForm.reason) {
      alert("탈퇴사유를 입력해주세요.");
      return;
    }
    handleAction(modalState.reportId, "ban", banForm);
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
              <div className={styles.tableCell}>처리 상태 / 조치</div>
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
                        {report.status && report.status !== "pending" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.375rem 0.75rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                backgroundColor: report.status === "banned" ? "#fee2e2" :
                                    report.status === "suspended" ? "#fef3c7" :
                                        "#dcfce7",
                                color: report.status === "banned" ? "#991b1b" :
                                    report.status === "suspended" ? "#92400e" :
                                        "#166534",
                                width: "fit-content"
                              }}>
                                <CheckCircle size={16} />
                                {report.status === "banned" ? "탈퇴 처리됨" :
                                    report.status === "suspended" ? "정지 처리됨" :
                                        "활성화 처리됨"}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                {report.actionType === "ban" ? "계정 탈퇴 조치 완료" :
                                    report.actionType === "suspend" ? "계정 정지 조치 완료" :
                                        "계정 활성화 조치 완료"}
                              </div>
                            </div>
                        ) : (
                            <button
                                className={`${styles.actionButton} ${styles.gray}`}
                                onClick={() => openModal("details", report.id, report.reportedName, report)}
                                disabled={actionLoading}
                            >
                              조치하기
                            </button>
                        )}
                      </div>
                    </div>
                ))
            )}
          </div>
        </div>

        {/* 신고 상세 및 조치 모달 */}
        {modalState.isOpen && modalState.action === "details" && modalState.report && (
            <div
                style={{
                  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex",
                  alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}
                onClick={closeModal}
            >
              <div
                  style={{
                    backgroundColor: "#ffffff", borderRadius: "0.75rem",
                    padding: "2rem", maxWidth: "520px", width: "90%",
                    maxHeight: "90vh", overflow: "auto",
                  }}
                  onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b" }}>신고 상세 정보</h2>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                    신고자 <strong>{modalState.report.reporterName}</strong> → 피신고자{" "}
                    <strong>{modalState.report.reportedName}</strong>
                  </p>
                </div>

                <div
                    style={{
                      padding: "1rem", borderRadius: "0.75rem",
                      backgroundColor: "#f8fafc", border: "1px solid #e2e8f0",
                      marginBottom: "1.5rem",
                    }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>신고 유형</div>
                  <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "0.75rem" }}>
                    {getTypeLabel(modalState.report.type)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>신고 내용</div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#374151" }}>
                    {modalState.report.content || "내용이 없습니다."}
                  </div>
                </div>

                <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "0.75rem",
                    }}
                >
                  {/* 계정 정지 – 점수 -10 */}
                  <button
                      onClick={() => openModal("suspend", modalState.report.id, modalState.report.reportedName)}
                      disabled={actionLoading}
                      style={{
                        padding: "1rem 1.25rem",
                        border: "1px solid #facc15",
                        borderRadius: "0.75rem",
                        backgroundColor: "#fefce8",
                        color: "#b45309",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fde68a"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fefce8"; }}
                  >
                    계정 정지
                  </button>

                  {/* 활성화 */}
                  <button
                      onClick={() => handleAction(modalState.report.id, "activate")}
                      disabled={actionLoading === `${modalState.report.id}-activate`}
                      style={{
                        padding: "1rem 1.25rem",
                        border: "1px solid #bbf7d0",
                        borderRadius: "0.75rem",
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: actionLoading === `${modalState.report.id}-activate` ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#bbf7d0"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#dcfce7"; }}
                  >
                    {actionLoading === `${modalState.report.id}-activate` ? "처리중" : "활성화"}
                  </button>

                  {/* 계정 탈퇴 – 점수 0 */}
                  <button
                      onClick={() => openModal("ban", modalState.report.id, modalState.report.reportedName)}
                      disabled={actionLoading}
                      style={{
                        padding: "1rem 1.25rem",
                        border: "1px solid #fca5a5",
                        borderRadius: "0.75rem",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fecaca"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; }}
                  >
                    계정 탈퇴
                  </button>

                  {/* ✅ 신선도 하락 – 점수 -5 */}
                  <button
                      onClick={() => handleAction(modalState.report.id, "manner-down")}
                      disabled={actionLoading === `${modalState.report.id}-manner-down`}
                      style={{
                        padding: "1rem 1.25rem",
                        border: "1px solid #c7d2fe",
                        borderRadius: "0.75rem",
                        backgroundColor: "#eef2ff",
                        color: "#3730a3",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        cursor: actionLoading ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0e7ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#eef2ff"; }}
                  >
                    신선도 하락
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                  <button
                      onClick={closeModal}
                      style={{
                        padding: "0.75rem 1.5rem",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.5rem",
                        backgroundColor: "#fff",
                        color: "#374151",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* 계정 정지 모달 */}
        {modalState.isOpen && modalState.action === "suspend" && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 1000
            }} onClick={closeModal}>
              <div style={{
                backgroundColor: "#ffffff", borderRadius: "0.75rem",
                padding: "2rem", maxWidth: "500px", width: "90%",
                maxHeight: "90vh", overflow: "auto"
              }} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSuspendSubmit}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#1e293b" }}>
                    계정 정지
                  </h2>
                  <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
                    <strong>{modalState.reportedName}</strong>님의 계정을 정지합니다. (신선도 –10)
                  </p>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
                      정지일
                    </label>
                    <input
                        type="date"
                        value={suspendForm.suspendDate}
                        onChange={(e) => setSuspendForm(prev => ({ ...prev, suspendDate: e.target.value }))}
                        required
                        style={{
                          width: "100%", padding: "0.625rem 0.75rem",
                          border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem"
                        }}
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
                      정지사유
                    </label>
                    <textarea
                        value={suspendForm.reason}
                        onChange={(e) => setSuspendForm(prev => ({ ...prev, reason: e.target.value }))}
                        required
                        rows={4}
                        placeholder="정지 사유를 입력하세요"
                        style={{
                          width: "100%", padding: "0.625rem 0.75rem",
                          border: "1px solid #d1d5db", borderRadius: "0.375rem",
                          fontSize: "0.875rem", resize: "vertical", fontFamily: "inherit"
                        }}
                    />
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
                      정지기간
                    </label>
                    <select
                        value={suspendForm.duration}
                        onChange={(e) => setSuspendForm(prev => ({ ...prev, duration: e.target.value }))}
                        required
                        style={{
                          width: "100%", padding: "0.625rem 0.75rem",
                          border: "1px solid #d1d5db", borderRadius: "0.375rem",
                          fontSize: "0.875rem"
                        }}
                    >
                      <option value="">선택하세요</option>
                      <option value="1일">1일</option>
                      <option value="3일">3일</option>
                      <option value="7일">7일</option>
                      <option value="30일">30일</option>
                      <option value="90일">90일</option>
                      <option value="무기한">무기한</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                        type="button"
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
                    <button
                        type="submit"
                        disabled={actionLoading}
                        style={{
                          padding: "0.75rem 1.5rem",
                          border: "none",
                          borderRadius: "0.5rem",
                          backgroundColor: actionLoading ? "#9ca3af" : "#3b82f6",
                          color: "#fff",
                          fontWeight: 600,
                          cursor: actionLoading ? "not-allowed" : "pointer"
                        }}
                    >
                      {actionLoading ? "처리 중..." : "정지하기"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* 계정 탈퇴 모달 */}
        {modalState.isOpen && modalState.action === "ban" && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 1000
            }} onClick={closeModal}>
              <div style={{
                backgroundColor: "#ffffff", borderRadius: "0.75rem",
                padding: "2rem", maxWidth: "500px", width: "90%",
                maxHeight: "90vh", overflow: "auto"
              }} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleBanSubmit}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#1e293b" }}>
                    계정 탈퇴
                  </h2>
                  <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
                    <strong>{modalState.reportedName}</strong>님의 계정을 탈퇴 처리합니다. (신선도 0)
                  </p>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>
                      탈퇴사유
                    </label>
                    <textarea
                        value={banForm.reason}
                        onChange={(e) => setBanForm({ reason: e.target.value })}
                        required
                        rows={5}
                        placeholder="탈퇴 사유를 입력하세요"
                        style={{
                          width: "100%", padding: "0.625rem 0.75rem",
                          border: "1px solid #d1d5db", borderRadius: "0.375rem",
                          fontSize: "0.875rem", resize: "vertical", fontFamily: "inherit"
                        }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                        type="button"
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
                    <button
                        type="submit"
                        disabled={actionLoading}
                        style={{
                          padding: "0.75rem 1.5rem",
                          border: "none",
                          borderRadius: "0.5rem",
                          backgroundColor: actionLoading ? "#9ca3af" : "#ef4444",
                          color: "#fff",
                          fontWeight: 600,
                          cursor: actionLoading ? "not-allowed" : "pointer"
                        }}
                    >
                      {actionLoading ? "처리 중..." : "탈퇴 처리"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return value;
}

function getTypeLabel(type) {
  switch (type) {
    case "fraud": return "사기 의심";
    case "abuse": return "욕설/비방";
    case "spam":  return "스팸/광고";
    case "other":
    default:      return "기타";
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
