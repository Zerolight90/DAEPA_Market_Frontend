"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../admin.module.css";

export default function EditNoticePage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "공지",
    content: "",
    isImportant: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/notices/${params.id}`);
        if (!res.ok) throw new Error("공지사항 불러오기 실패");

        const data = await res.json();
        
        // 백엔드 DTO -> UI 구조로 변환
        const mappedNotice = {
          title: data.nsubject,
          category: convertCategory(data.ncategory),
          content: data.ncontent,
          isImportant: data.ncategory === 1
        };

        setFormData(mappedNotice);
      } catch (err) {
        console.error(err);
        alert("공지사항을 불러오는 중 오류가 발생했습니다.");
        router.push("/admin/notice");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNotice();
    }
  }, [params.id, router]);

  const convertCategory = (num) => {
    switch (num) {
      case 1: return "공지";
      case 2: return "업데이트";
      case 3: return "안내";
      case 4: return "이벤트";
      default: return "기타";
    }
  };

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
          const payload = {
              nSubject: formData.title,
              nContent: formData.content,
              nCategory: formData.category === "공지" ? 1 :
                  formData.category === "업데이트" ? 2 :
                  formData.category === "안내" ? 3 :
                  formData.category === "이벤트" ? 4 : 0,
              // 이미지 업로드 기능은 나중 처리
          };

          const res = await fetch(`http://localhost:8080/api/admin/notices/${params.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
          });

          if (!res.ok) {
              throw new Error("수정 실패");
          }

          alert("공지사항이 성공적으로 수정되었습니다!");
          router.push(`/admin/notice/${params.id}`);

      } catch (error) {
          console.error("공지사항 수정 실패:", error);
          alert("공지사항 수정에 실패했습니다.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleCancel = () => {
      if (confirm("수정 중인 내용이 삭제됩니다. 정말 취소하시겠습니까?")){
          router.push(`/admin/notice/${params.id}`);
      }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "400px",
          fontSize: "1.125rem",
          color: "#64748b"
        }}>
          공지사항을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <Link 
              href={`/admin/notice/${params.id}`}
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
              상세보기로 돌아가기
            </Link>
          </div>
          <h1 className={styles.pageTitle}>공지사항 수정</h1>
          <p className={styles.pageSubtitle}>
            공지사항 내용을 수정하고 업데이트하세요
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

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "0.5rem", 
                    fontWeight: "600", 
                    color: "#374151",
                    fontSize: "0.875rem"
                  }}>
                    중요도
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 0" }}>
                    <input
                      type="checkbox"
                      name="isImportant"
                      checked={formData.isImportant}
                      onChange={handleInputChange}
                      style={{ width: "1rem", height: "1rem" }}
                    />
                    <span style={{ fontSize: "0.875rem", color: "#374151" }}>
                      중요 공지사항으로 설정
                    </span>
                  </div>
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
                  {isSubmitting ? "수정 중..." : "공지사항 수정"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

