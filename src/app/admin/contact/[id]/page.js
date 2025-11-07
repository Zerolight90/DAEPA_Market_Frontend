"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  Calendar,
  CheckCircle,
  MessageSquare,
  Mail,
  MapPin
} from "lucide-react";
import styles from "../../admin.module.css";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/contact/${params.id}`);
        if (!res.ok) throw new Error("문의 상세를 불러오지 못했습니다.");
        
        const data = await res.json();
        // API 응답 데이터 구조에 맞게 처리
        const inquiryData = {
          id: data.id || data.oo_idx || params.id,
          name: data.name || data.u_name || "알 수 없음",
          category: data.category || data.oo_category || 1,
          title: data.title || data.oo_title || "제목 없음",
          content: data.content || data.oo_content || "내용 없음",
          date: data.date || data.oo_date || new Date().toISOString().split('T')[0],
          status: data.status || data.oo_status || "pending",
          reply: data.reply || data.oo_re || ""
        };
        setInquiry(inquiryData);
        setProcessingStatus(inquiryData.status);
      } catch (err) {
        console.error("API 호출 실패, 더미 데이터 사용:", err);
        // API 목록에서 해당 ID 찾기 시도
        try {
          const listRes = await fetch("http://localhost:8080/api/admin/contact");
          if (listRes.ok) {
            const listData = await listRes.json();
            const foundInquiry = listData.find(item => 
              item.id === Number(params.id) || 
              item.oo_idx === Number(params.id) ||
              String(item.id) === String(params.id)
            );
            if (foundInquiry) {
              const inquiryData = {
                id: foundInquiry.id || foundInquiry.oo_idx || params.id,
                name: foundInquiry.name || foundInquiry.u_name || "알 수 없음",
                category: foundInquiry.category || foundInquiry.oo_category || 1,
                title: foundInquiry.title || foundInquiry.oo_title || "제목 없음",
                content: foundInquiry.content || foundInquiry.oo_content || "내용 없음",
                date: foundInquiry.date || foundInquiry.oo_date || new Date().toISOString().split('T')[0],
                status: foundInquiry.status || foundInquiry.oo_status || "pending",
                reply: foundInquiry.reply || foundInquiry.oo_re || ""
              };
              setInquiry(inquiryData);
              setProcessingStatus(inquiryData.status);
            } else {
              setInquiry(createDummyInquiry(params.id));
              setProcessingStatus("pending");
            }
          } else {
            setInquiry(createDummyInquiry(params.id));
            setProcessingStatus("pending");
          }
        } catch (listErr) {
          console.error("목록 조회 실패, 더미 데이터 사용:", listErr);
          setInquiry(createDummyInquiry(params.id));
          setProcessingStatus("pending");
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchInquiry();
  }, [params.id]);

  const handleReply = async () => {
    if (!replyText.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    setIsSavingReply(true);
    try {
      const res = await fetch(`http://localhost:8080/api/admin/contact/${params.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reply: replyText })
      });

      if (!res.ok) throw new Error("답변 등록 실패");

      alert("답변이 등록되었습니다.");
      
      // 답변 저장 후 최신 데이터 다시 불러오기
      const detailRes = await fetch(`http://localhost:8080/api/admin/contact/${params.id}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setInquiry({
          id: detailData.id || params.id,
          name: detailData.name || "알 수 없음",
          category: detailData.category || 1,
          title: detailData.title || "제목 없음",
          content: detailData.content || "내용 없음",
          date: detailData.date || new Date().toISOString().split('T')[0],
          status: detailData.status || "completed",
          reply: detailData.reply || replyText
        });
        setProcessingStatus("completed");
      } else {
        // API 호출 실패 시 로컬 상태만 업데이트
        setProcessingStatus("completed");
        setInquiry((prev) => (prev ? { ...prev, status: "completed", reply: replyText } : null));
      }
      setReplyText("");
    } catch (err) {
      console.error(err);
      alert("답변 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/contact/${params.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("상태 변경 실패");

      setProcessingStatus(newStatus);
      setInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      if (newStatus === "pending") {
        alert("문의가 보류 처리되었습니다.");
      } else {
        alert(`문의가 "${newStatus === "completed" ? "완료" : "대기"}"으로 변경되었습니다.`);
      }
    } catch (err) {
      console.error(err);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className={styles.statusWarning}>대기</span>;
      case "completed":
        return <span className={styles.statusSuccess}>완료</span>;
      default:
        return <span className={styles.statusWarning}>대기</span>;
    }
  };

  const getCategoryText = (category) => {
    // 숫자와 문자열 모두 처리
    const cat = typeof category === 'string' ? category : String(category);
    const num = typeof category === 'number' ? category : Number(category);
    
    // 숫자 기반 처리 (API에서 주로 사용)
    if (!isNaN(num)) {
      switch (num) {
        case 1:
          return "계정/로그인";
        case 2:
          return "거래 관련";
        case 3:
          return "불편 신고";
        case 4:
          return "기타 문의";
        default:
          return "기타 문의";
      }
    }
    
    // 문자열 기반 처리 (더미 데이터용)
    switch (cat) {
      case "general":
      case "General":
        return "거래 관련";
      case "technical":
      case "Technical":
        return "계정/로그인";
      case "complaint":
      case "Complaint":
        return "불편 신고";
      case "other":
      case "Other":
        return "기타 문의";
      default:
        return "기타 문의";
    }
  };

  const createDummyInquiry = (id) => {
    return {
      id: id,
      name: "홍길동",
      category: 2, // 숫자로 통일 (거래 관련)
      title: "거래 결제 문의",
      content: `안녕하세요. 거래 결제 관련해서 문의드립니다.
      
제가 최근에 구매한 상품의 결제가 정상적으로 처리되었는지 확인하고 싶습니다.
결제일은 지난주 월요일이고, 계좌 이체로 진행했습니다.
하지만 판매자님께서 입금 확인이 안 되신다고 하시는데, 저는 확실히 이체를 완료했습니다.

계좌번호나 이체 내역 등 추가 정보가 필요하시면 말씀해주시기 바랍니다.
빠른 확인 부탁드립니다. 감사합니다.`,
      date: new Date().toISOString().split('T')[0],
      status: "pending"
    };
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem", color: "#64748b" }}>
          문의 내용을 불러오는 중...
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className={styles.pageContainer}>
        <p style={{ color: "#ef4444" }}>{error || "문의를 찾을 수 없습니다."}</p>
        <Link href="/admin/contact" className={styles.actionButton}>
          <ArrowLeft size={16} /> 목록으로
        </Link>
      </div>
    );
  }

  const canProcess = processingStatus === "pending";

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Link
          href="/admin/contact"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#64748b",
            textDecoration: "none",
            fontSize: "0.875rem",
            marginBottom: "0.75rem"
          }}
        >
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </Link>
        <h1 className={styles.pageTitle}>문의 상세</h1>
        <p className={styles.pageSubtitle}>
          문의 내용을 확인하고 처리하세요
        </p>
      </div>

      <div className={styles.tableContainer}>
        <div style={{ padding: "2rem" }}>
          {/* 기본 정보 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>문의 번호</div>
              <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>#{inquiry.id}</div>
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                문의인
              </div>
              <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>{inquiry.name}</div>
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                문의 종류
              </div>
              <span style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                fontWeight: 600
              }}>
                {getCategoryText(inquiry.category)}
              </span>
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>상태</div>
              <div>{getStatusBadge(processingStatus)}</div>
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                등록일
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Calendar size={16} />
                <span>{inquiry.date ? (inquiry.date.includes('T') ? inquiry.date.split('T')[0] : inquiry.date) : "날짜 없음"}</span>
              </div>
            </div>
          </div>

          {/* 문의 제목 및 내용 */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>제목</div>
            <div style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1e293b",
              marginBottom: "1.5rem"
            }}>
              {inquiry.title}
            </div>

            <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>내용</div>
            <div style={{
              padding: "1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              whiteSpace: "pre-wrap",
              lineHeight: "1.7",
              color: "#374151",
              minHeight: "100px"
            }}>
              {inquiry.content || "내용이 없습니다."}
            </div>
          </div>


          {/* 답변 섹션 */}
          {canProcess ? (
            <div style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: "1.5rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
                fontSize: "1.125rem",
                fontWeight: 600
              }}>
                <MessageSquare size={20} color="#3b82f6" />
                답변 작성
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="문의에 대한 답변을 작성해주세요"
                rows={6}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  resize: "vertical",
                  fontFamily: "inherit",
                  lineHeight: "1.6"
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  onClick={() => router.push("/admin/contact")}
                  style={{
                    padding: "0.75rem 1.5rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    backgroundColor: "#fff",
                    color: "#374151",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = "#f8fafc";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = "#fff";
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleReply}
                  disabled={isSavingReply}
                  style={{
                    padding: "0.75rem 1.5rem",
                    border: "none",
                    borderRadius: "0.5rem",
                    backgroundColor: isSavingReply ? "#9ca3af" : "#10b981",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: isSavingReply ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    if (!isSavingReply) {
                      e.target.style.backgroundColor = "#059669";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSavingReply) {
                      e.target.style.backgroundColor = "#10b981";
                    }
                  }}
                >
                  {isSavingReply ? "저장 중..." : "답변 등록"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: "1.5rem"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#059669"
              }}>
                <CheckCircle size={20} />
                답변 완료
              </div>
              
              {inquiry.reply ? (
                <div style={{
                  padding: "1.5rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #a7f3d0",
                  backgroundColor: "#ecfdf5",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.7",
                  color: "#374151"
                }}>
                  {inquiry.reply}
                </div>
              ) : (
                <div style={{
                  padding: "1.5rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#059669"
                }}>
                  답변이 완료된 문의입니다
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

