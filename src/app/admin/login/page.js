"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import Link from "next/link";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    adminId: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 입력 시 에러 메시지 제거
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.adminId || !formData.password) {
      setError("관리자 ID와 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        setError("관리자 ID 또는 비밀번호가 올바르지 않습니다.");
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();

      // 로그인 정보 저장 (관리자 PK, 닉네임)
      sessionStorage.setItem("adminIdx", data.adIdx);
      sessionStorage.setItem("adminNick", data.adNick);

      // 로그인 성공 후 페이지 이동
      window.location.href = "/admin";

    } catch (error) {
      console.error("로그인 실패:", error);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* 로고 섹션 */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <Shield size={48} color="#ffffff" />
          </div>
          <h1 className={styles.logoTitle}>대파마켓</h1>
          <p className={styles.logoSubtitle}>관리자 로그인</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formHeader}>

          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* 관리자 ID */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>관리자 ID</label>
            <input
              type="text"
              name="adminId"
              value={formData.adminId}
              onChange={handleInputChange}
              placeholder="관리자 ID를 입력하세요"
              required
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>

          {/* 비밀번호 */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>비밀번호</label>
            <div className={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력하세요"
                required
                className={styles.input}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${styles.loginButton} ${isSubmitting ? styles.loginButtonDisabled : ""}`}
          >
            {isSubmitting ? (
              <div className={styles.loadingSpinner}></div>
            ) : (
              <>
                <LogIn size={20} />
                로그인
              </>
            )}
          </button>

          {/* 도움말 */}
          <div className={styles.helpSection}>
            <p className={styles.helpText}>
              로그인에 문제가 있으신가요?
            </p>
            <p className={styles.contactInfo}>
              시스템 관리자에게 문의하세요: admin@daepa-market.com
            </p>
          </div>
        </form>

        {/* 푸터 */}
        <div className={styles.footer}>
          {/*<p className={styles.footerText}>*/}
          {/*  © 2024 대파마켓. All rights reserved.*/}
          {/*</p>*/}
        </div>
      </div>
    </div>
  );
}