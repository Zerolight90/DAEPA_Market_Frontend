"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Send, CheckCircle, Clock, User, Calendar, Tag, MessageSquare } from "lucide-react";
import Link from "next/link";
import styles from "../../admin.module.css";

export default function ContactDetailPage({ params }) {
  const [inquiry, setInquiry] = useState(null);
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otherInquiries, setOtherInquiries] = useState([]);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        // 1. 상세 정보 조회
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/contact/${params.id}`);
        if (!res.ok) throw new Error("문의 상세 정보를 불러오지 못했습니다.");
        const data = await res.json();
        setInquiry(data);

        // 2. 해당 사용자의 다른 문의 목록 조회
        const listRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/contact`);
        if (listRes.ok) {
          const listData = await listRes.json();
          setOtherInquiries(
              listData.filter(item => item.name === data.name && item.id !== data.id)
          );
        }
      } catch (err) {
        console.error("데이터 조회 실패:", err);
      }
    };

    fetchInquiry();
  }, [params.id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            fontWeight: 600,
            backgroundColor: "#fef3c7",
            color: "#92400e"
          }}>
            <Clock size={16} />
            답변 대기
          </span>
        );
      case "completed":
        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            fontWeight: 600,
            backgroundColor: "#dcfce7",
            color: "#166534"
          }}>
            <CheckCircle size={16} />
            답변 완료
          </span>
        );
      default:
        return null;
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/contact/${params.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyContent: reply })
      });

      if (!res.ok) throw new Error("답변 등록에 실패했습니다.");

      // 답변 등록 후 상세 정보 다시 불러오기
      const detailRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/contact/${params.id}`);
      if (detailRes.ok) {
        const updatedData = await detailRes.json();
        setInquiry(updatedData);
      }

      alert("답변이 등록되었습니다.");
      setReply("");
    } catch (err) {
      console.error("답변 등록 실패:", err);
      alert("답변 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!confirm(`상태를 '${newStatus === "pending" ? "답변 대기" : "답변 완료"}'로 변경하시겠습니까?`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/contact/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("상태 변경 실패");

      setInquiry(prev => ({ ...prev, status: newStatus }));
      alert("상태가 변경되었습니다.");
    } catch (err) {
      console.error("상태 변경 실패:", err);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  if (!inquiry) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "1.25rem",
        color: "#64748b"
      }}>
        로딩 중...
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Link 
            href="/admin/contact" 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              color: "#64748b", 
              textDecoration: "none",
              fontSize: "0.875rem"
            }}
          >
            <ArrowLeft size={16} />
            목록으로 돌아가기
          </Link>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 className={styles.pageTitle}>문의 상세</h1>
            <p className={styles.pageSubtitle}>
              문의 내용 확인 및 답변
            </p>
          </div>
          {getStatusBadge(inquiry.status)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        {/* 왼쪽: 문의 내용 및 답변 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* 문의 내용 */}
          <div className={styles.tableContainer}>
            <div style={{ padding: "2rem" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                paddingBottom: "1.5rem",
                borderBottom: "1px solid #e5e7eb"
              }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#1e293b" }}>
                  {inquiry.title}
                </h2>
                <span style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  backgroundColor: "#f3f4f6",
                  color: "#374151"
                }}>
                  #{inquiry.id}
                </span>
              </div>

              <div style={{
                fontSize: "1rem",
                lineHeight: "1.8",
                color: "#374151",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                minHeight: "150px",
                padding: "1rem",
                background: "#f9fafb",
                borderRadius: "0.5rem"
              }}>
                {inquiry.content}
              </div>
            </div>
          </div>

          {/* 답변 내용 */}
          {inquiry.reply && (
            <div className={styles.tableContainer}>
              <div style={{ padding: "2rem" }}>
                <h3 style={{
                  margin: "0 0 1.5rem 0",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "1rem"
                }}>
                  관리자 답변
                </h3>
                <div style={{
                  fontSize: "1rem",
                  lineHeight: "1.8",
                  color: "#374151",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  padding: "1rem",
                  background: "#f0fdf4",
                  borderRadius: "0.5rem",
                  border: "1px solid #bbf7d0"
                }}>
                  {inquiry.reply}
                </div>
              </div>
            </div>
          )}

          {/* 답변 작성 */}
          {inquiry.status === "pending" && (
            <div className={styles.tableContainer}>
              <div style={{ padding: "2rem" }}>
                <h3 style={{
                  margin: "0 0 1.5rem 0",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#1e293b"
                }}>
                  답변 작성
                </h3>
                <form onSubmit={handleSubmitReply}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="답변 내용을 입력하세요..."
                    rows={8}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "1rem",
                      background: "white",
                      resize: "vertical",
                      marginBottom: "1rem"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.5rem",
                        background: isSubmitting ? "#9ca3af" : "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "0.5rem",
                        fontWeight: "600",
                        cursor: isSubmitting ? "not-allowed" : "pointer"
                      }}
                    >
                      <Send size={16} />
                      {isSubmitting ? "등록 중..." : "답변 등록"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 문의 정보 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className={styles.tableContainer}>
            <div style={{ padding: "2rem" }}>
              <h3 style={{
                margin: "0 0 1.5rem 0",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b"
              }}>
                문의 정보
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <User size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>작성자</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{inquiry.name}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Calendar size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>등록일</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{inquiry.date}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <Tag size={18} color="#64748b" />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>카테고리</div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{inquiry.category}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 상태 변경 */}
          <div className={styles.tableContainer}>
            <div style={{ padding: "2rem" }}>
              <h3 style={{
                margin: "0 0 1.5rem 0",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1e293b"
              }}>
                상태 변경
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  onClick={() => handleStatusChange("pending")}
                  disabled={inquiry.status === "pending"}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    background: inquiry.status === "pending" ? "#f3f4f6" : "white",
                    color: "#374151",
                    fontWeight: 600,
                    cursor: inquiry.status === "pending" ? "not-allowed" : "pointer"
                  }}
                >
                  답변 대기
                </button>
                <button
                  onClick={() => handleStatusChange("completed")}
                  disabled={inquiry.status === "completed"}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    background: inquiry.status === "completed" ? "#f3f4f6" : "white",
                    color: "#374151",
                    fontWeight: 600,
                    cursor: inquiry.status === "completed" ? "not-allowed" : "pointer"
                  }}
                >
                  답변 완료
                </button>
              </div>
            </div>
          </div>

          {/* 다른 문의 목록 */}
          {otherInquiries.length > 0 && (
            <div className={styles.tableContainer}>
              <div style={{ padding: "2rem" }}>
                <h3 style={{
                  margin: "0 0 1.5rem 0",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#1e293b"
                }}>
                  {inquiry.name}님의 다른 문의
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {otherInquiries.map(item => (
                    <Link
                      key={item.id}
                      href={`/admin/contact/${item.id}`}
                      style={{
                        display: "block",
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #e5e7eb",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <div style={{ fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </div>
                        {item.status === "completed" ? (
                          <span style={{ fontSize: "0.75rem", color: "#16a34a" }}>완료</span>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>대기</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                        {item.date}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}