"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Pin } from "lucide-react";
import Link from "next/link";
import styles from "../admin.module.css";
import api from "@/lib/api";

export default function NoticeListPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [filteredNotices, setFilteredNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNotices(notices);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredNotices(
      notices.filter(
        (n) =>
          (n.nsubject || "").toLowerCase().includes(term) ||
          (n.adminNick || "").toLowerCase().includes(term)
      )
    );
  }, [searchTerm, notices]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/notices");
      const data = Array.isArray(res.data) ? res.data : [];
      const sorted = [...data].sort((a, b) => {
        if (b.nfix !== a.nfix) return b.nfix - a.nfix;
        return b.nidx - a.nidx;
      });
      setNotices(sorted);
      setFilteredNotices(sorted);
    } catch (err) {
      console.error("공지사항 목록 조회 실패:", err);
      alert("공지사항 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 공지사항을 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/admin/notices/${id}`);
      setNotices((prev) => prev.filter((n) => n.nidx !== id));
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const convertCategory = (num: number) => {
    const map: Record<number, string> = { 1: "공지", 2: "업데이트", 3: "안내", 4: "이벤트" };
    return map[num] ?? "기타";
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "공지": return { bg: "#fee2e2", color: "#dc2626" };
      case "업데이트": return { bg: "#dbeafe", color: "#2563eb" };
      case "안내": return { bg: "#dcfce7", color: "#16a34a" };
      case "이벤트": return { bg: "#fef3c7", color: "#d97706" };
      default: return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", fontSize: "1.125rem", color: "#64748b" }}>
          공지사항을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className={styles.pageTitle}>공지사항 관리</h1>
            <p className={styles.pageSubtitle}>공지사항을 등록·수정·삭제합니다.</p>
          </div>
          <Link href="/admin/notice/create" style={{ textDecoration: "none" }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              새 공지 작성
            </button>
          </Link>
        </div>
      </div>

      <div className={styles.tableContainer} style={{ marginBottom: "1rem", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="제목 또는 작성자 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div
          className={styles.tableHeader}
          style={{ gridTemplateColumns: "60px 100px 1fr 100px 140px 120px" }}
        >
          <div>No</div>
          <div>카테고리</div>
          <div>제목</div>
          <div>작성자</div>
          <div>작성일</div>
          <div>관리</div>
        </div>
        <div className={styles.tableBody}>
          {filteredNotices.length === 0 ? (
            <div className={styles.tableRow} style={{ justifyContent: "center", padding: "2rem", gridTemplateColumns: "1fr" }}>
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const categoryLabel = convertCategory(notice.ncategory);
              const categoryStyle = getCategoryStyle(categoryLabel);
              return (
                <div
                  key={notice.nidx}
                  className={styles.tableRow}
                  style={{ gridTemplateColumns: "60px 100px 1fr 100px 140px 120px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: notice.nfix === 1 ? "#9ca3af" : "inherit" }}>
                    {notice.nfix === 1 && <Pin size={12} color="#9ca3af" />}
                    {notice.nidx}
                  </div>
                  <div>
                    <span
                      style={{
                        backgroundColor: categoryStyle.bg,
                        color: categoryStyle.color,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      {categoryLabel}
                    </span>
                  </div>
                  <div className={styles.textAlignLeft} style={{ color: notice.nfix === 1 ? "#9ca3af" : "inherit" }}>
                    <Link
                      href={`/admin/notice/${notice.nidx}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {notice.nsubject}
                    </Link>
                  </div>
                  <div>{notice.adminNick}</div>
                  <div>
                    {notice.ndate
                      ? new Date(notice.ndate).toLocaleDateString("ko-KR")
                      : "-"}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <Link href={`/admin/notice/edit/${notice.nidx}`} style={{ textDecoration: "none" }}>
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.375rem 0.625rem",
                          background: "#f0f9ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        <Edit size={12} />
                        수정
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(notice.nidx, notice.nsubject)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        padding: "0.375rem 0.625rem",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={12} />
                      삭제
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
