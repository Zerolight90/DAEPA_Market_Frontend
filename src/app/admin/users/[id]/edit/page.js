"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  MapPin,
  Phone,
  Calendar,
  ShieldCheck,
  Loader2,
  Save
} from "lucide-react";
import styles from "../../../admin.module.css";
import detailStyles from "../user-detail.module.css";

export default function UserEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    uname: "",
    unickname: "",
    uphone: "",
    ubirth: "",
    ugender: "",
    ustatus: 1,
    uwarn: 0,
    loc_address: "",
    loc_detail: "",
  });
  
  // 주소를 분리하는 함수
  const parseLocation = (locationStr) => {
    if (!locationStr) return { address: "", detail: "" };
    // 공백으로 분리 (첫 번째가 기본 주소, 나머지가 상세 주소)
    const parts = locationStr.trim().split(/\s+/);
    if (parts.length === 1) {
      return { address: parts[0], detail: "" };
    }
    // 마지막 부분을 상세 주소로, 나머지를 기본 주소로
    const detail = parts[parts.length - 1];
    const address = parts.slice(0, -1).join(" ");
    return { address, detail };
  };


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          const userData = data.user || data;
          setUser(userData);
          
          // 주소 분리
          const location = parseLocation(userData.ulocation || "");
          
          setFormData({
            uname: userData.uname || "",
            unickname: userData.unickname || "",
            uphone: userData.uphone || "",
            ubirth: userData.ubirth || "",
            ugender: userData.ugender || "",
            ustatus: userData.ustatus ?? 1,
            uwarn: userData.uwarn ?? 0,
            loc_address: location.address,
            loc_detail: location.detail
          });
        } else {
          // Fallback to list API
          const listRes = await fetch("http://localhost:8080/api/admin/users");
          if (listRes.ok) {
            const list = await listRes.json();
            const found = list.find((u) => `${u.uIdx}` === `${id}`);
            if (found) {
              setUser(found);
              
              // 주소 분리
              const location = parseLocation(found.ulocation || "");
              
              setFormData({
                uname: found.uname || "",
                unickname: found.unickname || "",
                uphone: found.uphone || "",
                ubirth: found.ubirth || "",
                ugender: found.ugender || "",
                ustatus: found.ustatus ?? 1,
                uwarn: found.uwarn ?? 0,
                loc_address: location.address,
                loc_detail: location.detail
              });
            } else {
              throw new Error("사용자를 찾을 수 없습니다.");
            }
          } else {
            throw new Error("사용자 정보를 불러오지 못했습니다.");
          }
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "사용자 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 전송할 데이터 준비
      const submitData = {
        uname: formData.uname ? formData.uname.trim() : null,
        unickname: formData.unickname ? formData.unickname.trim() : null,
        uphone: formData.uphone ? formData.uphone.trim() : null,
        ubirth: formData.ubirth ? formData.ubirth.trim() : null,
        ugender: formData.ugender ? formData.ugender.trim() : null,
        ustatus: formData.ustatus,
        uwarn: formData.uwarn,
        loc_address: formData.loc_address ? formData.loc_address.trim() : null,
        loc_detail: formData.loc_detail ? formData.loc_detail.trim() : null,
      };

      const res = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submitData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API 응답 오류:", res.status, errorText);
        throw new Error(`사용자 정보 업데이트에 실패했습니다. (${res.status})`);
      }

      const result = await res.json();
      alert("사용자 정보가 성공적으로 수정되었습니다.");
      router.push(`/admin/users/${id}`);
    } catch (err) {
      console.error("저장 오류:", err);
      alert(err.message || "수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "ustatus" || name === "uwarn" ? parseInt(value) || 0 : value
    }));
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={detailStyles.loadingRow}>
          <Loader2 size={20} className={detailStyles.spinner} />
          사용자 정보를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles.pageContainer}>
        <p className={detailStyles.errorMessage}>{error ?? "사용자 정보를 찾을 수 없습니다."}</p>
        <Link href="/admin/users" className={detailStyles.errorButton}>
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Link href={`/admin/users/${id}`} className={detailStyles.backLink}>
          <ArrowLeft size={16} /> 상세 페이지로 돌아가기
        </Link>
        <h1 className={styles.pageTitle}>사용자 정보 수정</h1>
        <p className={styles.pageSubtitle}>사용자 정보를 수정하고 저장하세요.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={detailStyles.pageSections}>
          <section className={`${detailStyles.card} ${detailStyles.profileCard}`}>
            <div className={detailStyles.infoGrid}>
              <div className={detailStyles.infoRow}>
                <span className={detailStyles.infoLabel}>
                  <Mail size={16} />
                  회원 ID
                </span>
                <strong className={detailStyles.infoValue} style={{ color: "#64748b" }}>
                  {user.uid}
                </strong>
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="uname">
                  이름
                </label>
                <input
                  type="text"
                  id="uname"
                  name="uname"
                  value={formData.uname}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                  required
                />
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="unickname">
                  닉네임
                </label>
                <input
                  type="text"
                  id="unickname"
                  name="unickname"
                  value={formData.unickname}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                />
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="loc_address">
                  주소
                </label>
                <input
                  type="text"
                  id="loc_address"
                  name="loc_address"
                  value={formData.loc_address}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                  placeholder="기본 주소 (예: 서울특별시 강남구 역삼동)"
                />
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="loc_detail">
                  상세 주소
                </label>
                <input
                  type="text"
                  id="loc_detail"
                  name="loc_detail"
                  value={formData.loc_detail}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                  placeholder="상세 주소 (예: 123-45)"
                />
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="uphone">
                  전화번호
                </label>
                <input
                  type="tel"
                  id="uphone"
                  name="uphone"
                  value={formData.uphone}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                  placeholder="010-1234-5678"
                />
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="ubirth">
                  생년월일
                </label>
                <input
                  type="date"
                  id="ubirth"
                  name="ubirth"
                  value={formData.ubirth}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                />
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="ugender">
                  성별
                </label>
                <select
                  id="ugender"
                  name="ugender"
                  value={formData.ugender}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                >
                  <option value="">선택하세요</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="ustatus">
                  상태
                </label>
                <select
                  id="ustatus"
                  name="ustatus"
                  value={formData.ustatus}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                >
                  <option value={1}>활성</option>
                  <option value={2}>탈퇴</option>
                  <option value={3}>정지</option>
                  <option value={9}>보류</option>
                </select>
              </div>

              <div className={detailStyles.infoRow}>
                <label className={detailStyles.infoLabel} htmlFor="uwarn">
                  경고 횟수
                </label>
                <input
                  type="number"
                  id="uwarn"
                  name="uwarn"
                  value={formData.uwarn}
                  onChange={handleChange}
                  className={detailStyles.formInput}
                  min="0"
                />
              </div>

              <div className={detailStyles.infoRow}>
                <span className={detailStyles.infoLabel}>
                  <Calendar size={16} />
                  가입일
                </span>
                <strong className={detailStyles.infoValue} style={{ color: "#64748b" }}>
                  {user.udate ? new Date(user.udate).toLocaleDateString("ko-KR") : "-"}
                </strong>
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e2e8f0"
            }}>
              <Link
                href={`/admin/users/${id}`}
                style={{
                  padding: "0.75rem 1.5rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                  backgroundColor: "#fff",
                  color: "#374151",
                  fontWeight: 600,
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#fff";
                }}
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={saving}
                className={detailStyles.primaryButton}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <Save size={16} />
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}


