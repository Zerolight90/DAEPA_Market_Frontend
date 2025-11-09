"use client";

import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import styles from "../../admin.module.css";

export default function CreateNoticePage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "공지",
    content: "",
    isImportant: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

      try {
          // 1) 로그인된 관리자 ID (sessionStorage 사용)
          const adIdx = sessionStorage.getItem("adminIdx");
          if (!adIdx) {
              alert("로그인이 필요합니다.");
              return;
          }

          // 2) 카테고리 한글 → 숫자 매핑
          const categoryMap = { "공지": 1, "업데이트": 2, "안내": 3, "이벤트": 4 };

          // 3) 백엔드 DTO 형태로 변환
          const payload = {
              adIdx: Number(adIdx),
              nSubject: formData.title,
              nContent: formData.content,
              nCategory: categoryMap[formData.category],
              nImg: null,
              nIp: "127.0.0.1"
          };

          const res = await fetch("http://3.34.181.73/api/admin/notices", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error("공지 등록 실패");

          alert("공지사항이 등록되었습니다.");
          window.location.href = "/admin/notice";

      } catch (err) {
          console.error(err);
          alert("공지사항 등록 중 오류가 발생했습니다.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleCancel = () => {
    if (confirm("작성 중인 내용이 삭제됩니다. 정말 취소하시겠습니까?")) {
      window.location.href = "/admin/notice";
    }
  };

  return (
    <>
      <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Link 
            href="/admin/notice" 
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
        <h1 className={styles.pageTitle}>공지사항 작성</h1>
        <p className={styles.pageSubtitle}>
          새로운 공지사항을 작성하고 등록하세요
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.tableContainer}>
          <div style={{ padding: "2rem" }}>
            {/* 제목 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                제목 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="공지사항 제목을 입력하세요"
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  background: "white",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>

            {/* 카테고리 및 중요도 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  fontWeight: "600", 
                  color: "#374151",
                  fontSize: "0.875rem"
                }}>
                  카테고리 *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    background: "white",
                    cursor: "pointer"
                  }}
                >
                  <option value="공지">공지</option>
                  <option value="업데이트">업데이트</option>
                  <option value="안내">안내</option>
                  <option value="이벤트">이벤트</option>
                </select>
              </div>



            </div>

            {/* 내용 */}
            <div style={{ marginBottom: "2rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                내용 *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="공지사항 내용을 입력하세요"
                required
                rows={10}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  background: "white",
                  resize: "vertical",
                  minHeight: "200px",
                  fontFamily: "inherit",
                  lineHeight: "1.5"
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>


            {/* 미리보기 */}
            {formData.title && formData.content && (
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ 
                  marginBottom: "1rem", 
                  fontWeight: "600", 
                  color: "#374151",
                  fontSize: "0.875rem"
                }}>
                  미리보기
                </h4>
                <div style={{ 
                  padding: "1rem", 
                  border: "1px solid #e5e7eb", 
                  borderRadius: "0.5rem", 
                  backgroundColor: "#f9fafb"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    {formData.isImportant && (
                      <span style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>
                        중요
                      </span>
                    )}
                    <span style={{
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      backgroundColor: formData.category === "공지" ? "#fee2e2" : 
                                      formData.category === "업데이트" ? "#dbeafe" :
                                      formData.category === "안내" ? "#dcfce7" : "#fef3c7",
                      color: formData.category === "공지" ? "#dc2626" : 
                             formData.category === "업데이트" ? "#2563eb" :
                             formData.category === "안내" ? "#16a34a" : "#d97706"
                    }}>
                      {formData.category}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>
                    {formData.title}
                  </h3>
                  <p style={{ color: "#64748b", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {formData.content}
                  </p>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              gap: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid #e5e7eb"
            }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <X size={16} />
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title || !formData.content}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: isSubmitting || !formData.title || !formData.content ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: isSubmitting || !formData.title || !formData.content ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
              >
                <Save size={16} />
                {isSubmitting ? "등록 중..." : "공지사항 등록"}
              </button>
            </div>
          </div>
        </div>
      </form>
      </div>
    </>
  );
}
