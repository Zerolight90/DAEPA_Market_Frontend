"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import styles from "../../../admin.module.css";

export default function EditUserPage({ params }) {
  const { id } = params;
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    uid: "",
    uname: "",
    uphone: "",
    ulocation: "",
    ustatus: 1,
    uwarn: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`);
        if (!res.ok) throw new Error("사용자 정보를 불러오지 못했습니다.");
        const data = await res.json();
        setUser(data);
        setFormData({
          uid: data.uid,
          uname: data.uname,
          uphone: data.uphone,
          ulocation: data.ulocation,
          ustatus: data.ustatus,
          uwarn: data.uwarn
        });
      } catch (err) {
        console.error("사용자 정보 조회 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. 사용자 목록에서 해당 사용자 찾기
      const listRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);
      if (!listRes.ok) throw new Error("사용자 목록 조회 실패");
      const users = await listRes.json();
      const targetUser = users.find(u => u.uidx === Number(id));

      if (!targetUser) throw new Error("수정할 사용자를 찾을 수 없습니다.");

      // 2. 수정된 정보로 payload 생성
      const payload = {
        ...targetUser, // 기존 정보 유지
        uname: formData.uname,
        uphone: formData.uphone,
        ulocation: formData.ulocation,
        ustatus: Number(formData.ustatus),
        uwarn: Number(formData.uwarn)
      };

      // 3. 수정 API 호출
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("사용자 정보 수정에 실패했습니다.");

      alert("사용자 정보가 성공적으로 수정되었습니다.");
      window.location.href = `/admin/users/${id}`;

    } catch (err) {
      console.error("수정 실패:", err);
      alert(err.message || "사용자 정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm("변경사항이 저장되지 않습니다. 정말 취소하시겠습니까?")) {
      window.location.href = `/admin/users/${id}`;
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
            href={`/admin/users/${id}`}
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
        <h1 className={styles.pageTitle}>사용자 정보 수정</h1>
        <p className={styles.pageSubtitle}>
          사용자 정보를 수정하고 저장하세요
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.tableContainer}>
          <div style={{ padding: "2rem" }}>
            {/* 회원 ID (수정 불가) */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                회원 ID
              </label>
              <input
                type="text"
                name="uid"
                value={formData.uid}
                readOnly
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  background: "#f3f4f6",
                  color: "#6b7280",
                  cursor: "not-allowed"
                }}
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
                name="uname"
                value={formData.uname}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  background: "white"
                }}
              />
            </div>

            {/* 전화번호 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                전화번호 *
              </label>
              <input
                type="text"
                name="uphone"
                value={formData.uphone}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  background: "white"
                }}
              />
            </div>

            {/* 주소 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "600", 
                color: "#374151",
                fontSize: "0.875rem"
              }}>
                주소
              </label>
              <input
                type="text"
                name="ulocation"
                value={formData.ulocation}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  background: "white"
                }}
              />
            </div>

            {/* 상태 및 경고 횟수 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  fontWeight: "600", 
                  color: "#374151",
                  fontSize: "0.875rem"
                }}>
                  상태 *
                </label>
                <select
                  name="ustatus"
                  value={formData.ustatus}
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
                  <option value={1}>활성</option>
                  <option value={3}>정지</option>
                  <option value={9}>보류</option>
                  <option value={2}>탈퇴</option>
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
                  경고 횟수 *
                </label>
                <input
                  type="number"
                  name="uwarn"
                  value={formData.uwarn}
                  onChange={handleInputChange}
                  required
                  min="0"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    background: "white"
                  }}
                />
              </div>
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