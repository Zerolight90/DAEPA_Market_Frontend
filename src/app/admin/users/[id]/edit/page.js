"use client";

import { useState, useEffect } from "react"; // use 제거
import { ArrowLeft, Save, X, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "../../../admin.module.css";
import api from "@/lib/api"; // axios 인스턴스 가져오기

const NUMERIC_FIELDS = ["ustatus", "uwarn", "umanner"];

export default function EditUserPage({ params }) {
  const { id } = params; // use(params) 대신 직접 params 사용
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    uid: "",
    uname: "",
    unickname: "",
    uphone: "",
    ulocation: "",
    ustatus: 1,
    uwarn: 0,
    umanner: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/admin/users/${id}`); // axios.get 사용
        const data = response.data;
        setUser(data);
        setFormData({
          uid: data.uid,
          uname: data.uname ?? "",
          unickname: data.unickname ?? "",
          uphone: data.uphone ?? "",
          ulocation: data.ulocation ?? "",
          ustatus: data.ustatus ?? 1,
          uwarn: data.uwarn ?? 0,
          umanner: data.umanner ?? 0
        });
      } catch (err) {
        console.error("사용자 정보 조회 실패:", err);
        alert("사용자 정보를 불러오는 중 오류가 발생했습니다: " + (err.response?.data?.message || err.message));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: NUMERIC_FIELDS.includes(name)
        ? value === "" ? "" : Number(value)
        : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const umannerValue = Number(formData.umanner);
    if (Number.isNaN(umannerValue) || umannerValue < 0 || umannerValue > 100) {
      alert("신선도는 0에서 100 사이의 숫자여야 합니다.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        uname: formData.uname?.trim() || undefined,
        unickname: formData.unickname?.trim() || undefined,
        uphone: formData.uphone?.trim() || undefined,
        loc_address: formData.ulocation && formData.ulocation.trim() !== ""
          ? formData.ulocation.trim()
          : null,
        loc_detail: null,
        ustatus: Number(formData.ustatus),
        uwarn: Number(formData.uwarn) || 0,
        umanner: umannerValue
      };

      await api.patch(`/admin/users/${id}`, payload); // axios.patch 사용

      alert("사용자 정보가 성공적으로 수정되었습니다.");
      router.push(`/admin/users/${id}`);
    } catch (err) {
      console.error("수정 실패:", err);
      alert("사용자 정보 수정 중 오류가 발생했습니다: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    router.push(`/admin/users/${id}`);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        로딩 중...
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.loadingState}>
        사용자 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className={styles.userEditWrapper}>
      <div className={styles.userEditHeader}>
        <Link href={`/admin/users/${id}`} className={styles.userEditBackLink}>
          <ArrowLeft size={16} /> 사용자 상세로 돌아가기
        </Link>
        <div>
          <h1 className={styles.userEditTitle}>사용자 정보 수정</h1>
          <p className={styles.userEditSubtitle}>사용자 데이터를 최신 상태로 유지하세요.</p>
        </div>
      </div>

      <div className={styles.userEditSummaryCard}>
        <div className={styles.userEditAvatar}>
          <User size={40} />
        </div>
        <div className={styles.userEditSummaryText}>
          <h2>{formData.uname || "이름 없음"}</h2>
          <p>{formData.uid}</p>
        </div>
        <div className={styles.userEditSummaryBadge}>
          현재 상태 · {formData.ustatus === 1 ? "활성" : formData.ustatus === 3 ? "정지" : formData.ustatus === 9 ? "보류" : "탈퇴"}
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.userEditForm}>
        <div className={styles.userEditCard}>
          <div className={styles.userEditCardHeader}>기본 정보</div>
          <div className={styles.userEditGrid}>
            <div className={styles.userEditGroup}>
              <label className={styles.userEditLabel}>회원 ID</label>
              <input value={formData.uid} disabled className={`${styles.userEditInput} ${styles.userEditInputReadOnly}`} />
            </div>
            <div className={styles.userEditGroup}>
              <label className={styles.userEditLabel}>이름</label>
              <input
                type="text"
                name="uname"
                value={formData.uname}
                onChange={handleInputChange}
                className={styles.userEditInput}
                placeholder="사용자 이름"
              />
            </div>
            <div className={styles.userEditGroup}>
              <label className={styles.userEditLabel}>닉네임</label>
              <input
                type="text"
                name="unickname"
                value={formData.unickname}
                onChange={handleInputChange}
                className={styles.userEditInput}
                placeholder="사용자 닉네임"
              />
            </div>
            <div className={styles.userEditGroup}>
              <label className={styles.userEditLabel}>전화번호</label>
              <input
                type="text"
                name="uphone"
                value={formData.uphone}
                onChange={handleInputChange}
                className={styles.userEditInput}
                placeholder="010-0000-0000"
              />
            </div>
            <div className={styles.userEditGroup}>
              <label className={styles.userEditLabel}>주소</label>
              <input
                type="text"
                name="ulocation"
                value={formData.ulocation}
                onChange={handleInputChange}
                className={styles.userEditInput}
                placeholder="상세 주소 입력"
              />
            </div>
            <div className={styles.userEditGroup}>
              <label className={styles.userEditLabel}>신선도 (0~100)</label>
              <input
                type="number"
                name="umanner"
                min={0}
                max={100}
                value={formData.umanner}
                onChange={handleInputChange}
                className={styles.userEditInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.userEditCard}>
          <div className={styles.userEditCardHeader}>상태 및 경고</div>
          <div className={styles.userEditGridCompact}>
            <div className={styles.userEditGroup}>
              <label className={styles.userEditLabel}>상태</label>
              <select
                name="ustatus"
                value={formData.ustatus}
                onChange={handleInputChange}
                className={styles.userEditSelect}
              >
                <option value={1}>활성</option>
                <option value={3}>정지</option>
                <option value={9}>보류</option>
                <option value={2}>탈퇴</option>
              </select>
            </div>
            <div className={styles.userEditGroup}>
              <label className={styles.userEditLabel}>경고 횟수</label>
              <input
                type="number"
                name="uwarn"
                min={0}
                value={formData.uwarn}
                onChange={handleInputChange}
                className={styles.userEditInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.userEditActions}>
          <button type="button" className={styles.userEditCancelButton} onClick={handleCancel} disabled={isSubmitting}>
            <X size={16} /> 취소
          </button>
          <button type="submit" className={styles.userEditSaveButton} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}