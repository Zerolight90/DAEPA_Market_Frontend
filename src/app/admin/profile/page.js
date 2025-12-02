"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import styles from "../admin.module.css";
import api from "@/lib/api"; // axios 서비스 가져오기
import { getSafeSessionStorage, safeGetItem, safeSetItem } from "@/lib/safeStorage";

export default function AdminProfilePage() {
  const [formData, setFormData] = useState({
    nickname: "관리자",
    name: "관리자",
    birthDate: "1990-01-01",
    adminId: "admin001",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
      const ss = getSafeSessionStorage();
      const adIdx = safeGetItem(ss, "adminIdx");
      if (!adIdx) {
          window.location.href = "/admin/login";
          return;
      }

      api.get(`/admin/me?adIdx=${adIdx}`)
          .then((response) => {
              const data = response.data;
              setFormData((prev) => ({
                  ...prev,
                  nickname: data.adNick,
                  name: data.adName,
                  birthDate: data.adBirth,
                  adminId: data.adId,
              }));
          })
          .catch((err) => console.error("프로필 조회 실패:", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 비밀번호 확인 검증
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
        const ss = getSafeSessionStorage();
        const adIdx = safeGetItem(ss, "adminIdx");
        const response = await api.put(`/admin/me`, {
            adIdx: adIdx,
            adNick: formData.nickname,
            adName: formData.name,
            adBirth: formData.birthDate,
            adPw: formData.password || null
        });
        const data = response.data;

        // 1) sessionStorage 닉네임 갱신
        safeSetItem(ss, "adminNick", data.adNick);

        // 2) 완료 후 /admin 으로 이동
        alert("관리자 정보가 성공적으로 수정되었습니다.");
        window.location.href = "/admin";

    } catch (error) {
      console.error("정보 수정 실패:", error);
      alert("정보 수정에 실패했습니다: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm("변경사항이 저장되지 않습니다. 정말 취소하시겠습니까?")) {
      window.location.href = "/admin";
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <Link 
            href="/admin" 
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
            대시보드로 돌아가기
          </Link>
        </div>
        <h1 className={styles.pageTitle}>관리자 정보 수정</h1>
        <p className={styles.pageSubtitle}>
          관리자 계정 정보를 수정하세요
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.tableContainer}>
          <div style={{ padding: "2rem" }}>
            {/* 닉네임 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                닉네임 *
              </label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                placeholder="닉네임을 입력하세요"
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

            {/* 이름 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                이름 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="성명을 입력하세요"
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

            {/* 생년월일 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                생년월일 *
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
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

            {/* 관리자 ID */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                관리자 ID *
              </label>
              <input
                type="text"
                name="adminId"
                value={formData.adminId}
                onChange={handleInputChange}
                placeholder="관리자 ID를 입력하세요"
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

            {/* 비밀번호 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                새 비밀번호
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="새 비밀번호를 입력하세요"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    paddingRight: "3rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    background: "white",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                비밀번호를 변경하지 않을 경우 비워두세요
              </p>
            </div>

            {/* 비밀번호 확인 */}
            {formData.password && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  fontWeight: "600", 
                  color: "#374151",
                  fontSize: "0.875rem"
                }}>
                  비밀번호 확인 *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="비밀번호를 다시 입력하세요"
                    required={formData.password ? true : false}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      paddingRight: "3rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      background: "white",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                    onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b"
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
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
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  background: isSubmitting ? "#9ca3af" : "#2E8B57",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s"
                }}
              >
                <Save size={16} />
                {isSubmitting ? "저장 중.." : "정보 저장"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
