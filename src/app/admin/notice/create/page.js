"use client";

import { useState } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import styles from "../../admin.module.css";
import api from "@/lib/api"; // axios 인스턴스 가져오기

export default function CreateNoticePage() {
  // 폼 입력 데이터(제목, 카테고리, 내용)를 관리하는 상태
  const [formData, setFormData] = useState({
    title: "",
    category: "공지",
    content: "",
    isImportant: false,
    nFix: false
  });
  
  // (이미지) 사용자가 선택한 파일 객체를 관리하는 상태
  const [file, setFile] = useState(null);
  // (이미지) 선택된 이미지 파일의 미리보기 URL을 관리하는 상태
  const [imagePreview, setImagePreview] = useState(null);
  
  // 폼 제출 진행 상태를 관리하는 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 텍스트 입력 필드(제목, 내용 등)의 변경을 처리하는 핸들러
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 파일 입력 필드의 변경을 처리하는 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // 파일 객체 상태 업데이트
      setFile(selectedFile);
      // 미리보기 URL 생성 및 상태 업데이트
      setImagePreview(URL.createObjectURL(selectedFile));
    } else {
      // 파일 선택이 취소된 경우 상태 초기화
      setFile(null);
      setImagePreview(null);
    }
  };

  // 폼 제출을 처리하는 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
        alert("제목과 내용은 필수 입력 항목입니다.");
        return;
    }
    setIsSubmitting(true);

    try {
        const ss = getSafeSessionStorage();
        const adIdx = safeGetItem(ss, "adminIdx");
        if (!adIdx) {
            alert("로그인이 필요합니다.");
            setIsSubmitting(false);
            return;
        }

        const categoryMap = { "공지": 1, "업데이트": 2, "안내": 3, "이벤트": 4 };

        // 백엔드 API의 DTO 형식에 맞게 전송할 JSON 데이터
        const noticeData = {
            adIdx: Number(adIdx),
            nSubject: formData.title,
            nContent: formData.content,
            nCategory: categoryMap[formData.category],
            nFix: formData.nFix ? 1 : 0,
            nIp: "127.0.0.1"
        };

        // multipart/form-data 형식으로 데이터를 보내기 위해 FormData 객체 생성
        const formDataToSend = new FormData();
        
        // 1. JSON 데이터를 'req'라는 키의 Blob 객체로 변환하여 FormData에 추가
        formDataToSend.append('req', new Blob([JSON.stringify(noticeData)], { type: "application/json" }));

        // 2. 이미지 파일이 있는 경우, 'file'이라는 키로 FormData에 추가
        if (file) {
            formDataToSend.append('file', file);
        }

        // axios 인스턴스를 사용하여 서버에 POST 요청
        await api.post("/admin/notices", formDataToSend);

        alert("공지사항이 등록되었습니다.");
        window.location.href = "/admin/notice";

    } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "공지사항 등록 중 오류가 발생했습니다.");
    } finally {
        setIsSubmitting(false);
    }
  };

  // 취소 버튼 클릭 시 처리 핸들러
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

            {/* 카테고리 */}
            <div style={{ marginBottom: "1.5rem" }}>
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

            {/* 상단 고정 체크박스 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.875rem" }}>
                <input
                  type="checkbox"
                  name="nFix"
                  checked={formData.nFix}
                  onChange={handleInputChange}
                  style={{ marginRight: "0.5rem" }}
                />
                <span>이 공지사항을 상단에 고정합니다.</span>
              </label>
            </div>

            {/* 내용 */}
            <div style={{ marginBottom: "1.5rem" }}>
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

            {/* 이미지 첨부 UI */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                이미지 첨부 (선택)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  background: "white",
                  cursor: "pointer"
                }}
              />
            </div>

            {/* 이미지 미리보기 UI */}
            {imagePreview && (
              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ marginBottom: "1rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  이미지 미리보기
                </h4>
                <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", backgroundColor: "#f9fafb" }}>
                  <img src={imagePreview} alt="미리보기" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "0.5rem", border: "1px solid #e5e7eb" }} />
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
