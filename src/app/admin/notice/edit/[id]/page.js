"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import styles from "../../../admin.module.css";

export default function EditNoticePage({ params }) {
  const [formData, setFormData] = useState({
    title: "",
    category: "공지",
    content: "",
    isImportant: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/notices/${params.id}`);
        if (!res.ok) throw new Error("공지사항을 불러오지 못했습니다.");
        const data = await res.json();

        // 백엔드 DTO -> UI 구조로 변환
        setFormData({
          title: data.nsubject,
          content: data.ncontent,
          category: convertCategory(data.ncategory),
          isImportant: false // 중요도 필드는 UI에만 있으므로 기본값 설정
        });
      } catch (err) {
        console.error(err);
        alert("공지사항을 가져오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotice();
  }, [params.id]);

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
      const adIdx = sessionStorage.getItem("adminIdx");
      if (!adIdx) {
        alert("로그인이 필요합니다.");
        return;
      }

      const categoryMap = { "공지": 1, "업데이트": 2, "안내": 3, "이벤트": 4 };

      const payload = {
        adIdx: Number(adIdx),
        nSubject: formData.title,
        nContent: formData.content,
        nCategory: categoryMap[formData.category],
        nImg: null,
        nIp: "127.0.0.1"
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/notices/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("공지 수정 실패");

      alert("공지사항이 수정되었습니다.");
      window.location.href = `/admin/notice/${params.id}`;

    } catch (err) {
      console.error(err);
      alert("공지사항 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm("변경사항이 저장되지 않습니다. 정말 취소하시겠습니까?")) {
      window.location.href = `/admin/notice/${params.id}`;
    }
  };

  if (isLoading) {
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
          공지사항 내용을 수정하고 저장하세요
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
                    중요 공지로 표시
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
              />
            </div>

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
                  cursor: "pointer"
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
                  cursor: isSubmitting || !formData.title || !formData.content ? "not-allowed" : "pointer"
                }}
              >
                <Save size={16} />
                {isSubmitting ? "저장 중..." : "변경사항 저장"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}