"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  ThermometerSun,
  AlertTriangle,
  ShoppingBag,
  MapPin,
  Phone,
  Calendar,
  ShieldCheck,
  Loader2,
  Mail
} from "lucide-react";
import styles from "../../admin.module.css";
import detailStyles from "./user-detail.module.css";

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manner, setManner] = useState(0);
  const [saving, setSaving] = useState(false);
  const reportTypeLabel = {
    1: "비매너",
    2: "사기 의심",
    3: "거래 문제",
    4: "기타"
  };

  const createDummyDetail = (id) => {
    const suffix = id ?? "0000";
    const today = new Date();
    return {
      user: {
        uidx: id,
        uid: `dummy${id}@mail.com`,
        uname: `홍길동`,
        ugender: "남성",
        ulocation: "서울특별시 강남구 역삼동",
        uphone: "010-1234-5678",
        udate: new Date().toISOString(),
        umanner: 37.5,
        uwarn: 1,
        ustatus: 1
      },
      tradeHistory: [
        {
          id: `trade-${suffix}-1`,
          title: "프리미엄 무선 이어폰",
          date: today.toISOString(),
          price: 125000,
          status: "completed"
        },
        {
          id: `trade-${suffix}-2`,
          title: "디지털 카메라",
          date: new Date(today.getTime() - 86400000 * 7).toISOString(),
          price: 320000,
          status: "pending"
        }
      ],
      warningHistory: [
        {
          id: `warn-${suffix}-1`,
          reason: "거래시간 미준수 신고",
          date: new Date(today.getTime() - 86400000 * 3).toISOString()
        }
      ]
    };
  };

  const fallbackToDummy = (id) => {
    const dummy = createDummyDetail(id);
    setDetail(dummy);
    setManner(dummy.user.umanner ?? 0);
    setError(null);
    return true;
  };

  useEffect(() => {
    const fallbackFromList = async () => {
      try {
        const listRes = await fetch("http://localhost:8080/api/admin/users");
        if (!listRes.ok) throw new Error("회원 목록 조회 실패");
        const list = await listRes.json();
        const found = list.find((u) => `${u.uIdx}` === `${id}`);
        if (found) {
          const fallbackDetail = {
            user: found,
            tradeHistory: [],
            warningHistory: []
          };

          setDetail(fallbackDetail);
          setManner(found.uManner ?? found.umanner ?? 0);
          setError(null);
          return true;
        }

        console.warn("목록에서도 회원을 찾지 못해 더미 데이터를 사용합니다.");
        return fallbackToDummy(id);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        return fallbackToDummy(id);
      }
    };

    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/users/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDetail(data);
          setManner(data.umanner ?? data.uManner ?? 0);
          setError(null);
        } else {
          console.warn("상세 엔드포인트 응답이 없어 목록에서 대체 데이터를 사용합니다.");
          const success = await fallbackFromList();
          if (!success) throw new Error("회원 상세 정보를 불러오지 못했습니다.");
          else setError(null);
        }
      } catch (err) {
        console.error(err);
        const success = await fallbackFromList();
        if (!success) {
          setError(err.message || "회원 정보를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  const handleMannerSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${id}/manner`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ umanner: manner })
      });

      if (!res.ok) throw new Error("매너 온도 업데이트에 실패했습니다.");

      const updated = await res.json();
      // 업데이트 후 화면에 반영
      setDetail(prev => ({
        ...prev,
        umanner: updated.umanner ?? manner
      }));

      alert("매너 온도가 업데이트되었습니다.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (statusNum) => {
    if (statusNum === 1) return <span className={styles.statusSuccess}>활성</span>;
    if (statusNum === 0) return <span className={styles.statusError}>정지</span>;
    return <span className={styles.statusWarning}>대기</span>;
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={detailStyles.loadingRow}>
          <Loader2 size={20} className={detailStyles.spinner} />
          데이터를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className={styles.pageContainer}>
        <p className={detailStyles.errorMessage}>{error ?? "회원 정보를 찾을 수 없습니다."}</p>
        <button onClick={() => router.back()} className={detailStyles.errorButton}>
          <ArrowLeft size={16} /> 뒤로 가기
        </button>
      </div>
    );
  }

  const user = detail.user || detail;
  // const tradeHistory = detail.tradeHistory || [];
  // BUY / SELL 합치기
  const buyHistory = detail.tradeHistory ?? [];
  const sellHistory = detail.tradeHistorySell ?? [];

  // 날짜가 있을 경우 최신순 정렬, 없으면 그대로
    const tradeHistory = [...buyHistory, ...sellHistory].sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : 0;
      const dateB = b.date ? new Date(b.date) : 0;
      return dateB - dateA;
    });

  const warningHistory = detail.reportHistory || [];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <Link href="/admin/users" className={detailStyles.backLink}>
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </Link>
        <h1 className={styles.pageTitle}>사용자 상세 정보</h1>
        <p className={styles.pageSubtitle}>회원의 프로필과 활동 내역을 확인하고 관리하세요.</p>
      </div>

      <div className={detailStyles.pageSections}>
        {/* 기본 정보 카드 */}
        <section className={`${detailStyles.card} ${detailStyles.profileCard}`}>
          <div className={detailStyles.profileHeader}>
            <div className={detailStyles.avatar}>
              <UserIcon size={36} color="#999" />
            </div>
            <h2 className={detailStyles.profileName}>{user.uname}</h2>
            {getStatusBadge(user.ustatus)}
          </div>
          <div className={detailStyles.infoGrid}>
            <InfoRow icon={<Mail size={16} />} label="회원 ID" value={user.uid} />
            <InfoRow icon={<UserIcon size={16} />} label="닉네임" value={user.unickname ?? "-"} />
            <InfoRow icon={<MapPin size={16} />} label="주소" value={user.ulocation ?? "-"} />
            <InfoRow icon={<Calendar size={16} />} label="생년월일" value={user.ubirth ?? "-"} />
            <InfoRow icon={<ShieldCheck size={16} />} label="성별" value={user.ugender ?? "-"} />
            <InfoRow icon={<Phone size={16} />} label="전화번호" value={user.uphone ?? "-"} />
            <InfoRow icon={<Calendar size={16} />} label="가입일" value={user.udate ? new Date(user.udate).toLocaleDateString("ko-KR") : "-"} />
            <InfoRow icon={<AlertTriangle size={16} color="#f97316" />} label="경고 횟수" value={`${user.uwarn ?? 0}회`} />
          </div>
        </section>

        {/* 매너 온도 조절 */}
        <section className={`${detailStyles.card} ${detailStyles.mannerCard}`}>
          <div className={detailStyles.sectionHeader}>
            <ThermometerSun size={24} color="#2e8b57" />
            매너 온도 조절
          </div>
          <p className={detailStyles.sectionDescription}>
            매너 온도를 조절하여 회원의 신뢰도를 반영하세요. 변경 사항은 즉시 저장됩니다.
          </p>
          <div className={detailStyles.mannerControls}>
            <strong className={detailStyles.mannerValue}>{manner.toFixed(1)}°C</strong>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={manner}
              onChange={(e) => setManner(parseFloat(e.target.value))}
              className={detailStyles.mannerSlider}
              style={{ "--progress": `${(manner / 100) * 100}%` }}
            />
            <div className={detailStyles.stepButtons}>
              <button
                type="button"
                onClick={() => setManner((prev) => Math.max(0, prev - 0.5))}
                className={detailStyles.stepButton}
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => setManner((prev) => Math.min(100, prev + 0.5))}
                className={detailStyles.stepButton}
              >
                +0.5
              </button>
            </div>
            <button
              type="button"
              onClick={handleMannerSave}
              disabled={saving}
              className={detailStyles.primaryButton}
            >
              {saving ? "저장 중..." : "온도 저장"}
            </button>
          </div>
        </section>

        {/* 거래 내역 */}
        <section className={`${detailStyles.card} ${detailStyles.tradeCard}`}>
          <div className={detailStyles.sectionHeader}>
            <ShoppingBag size={22} color="#2563eb" />
            거래 내역
          </div>
          {tradeHistory.length === 0 ? (
              <div className={detailStyles.listEmpty}>거래 내역이 없습니다.</div>
          ) : (
              <div className={detailStyles.tradeList}>
                {tradeHistory.map((trade) => (
                    <div key={trade.dealId} className={detailStyles.tradeItem}>
                      {/* 구매/판매 라벨 + 상품명 */}
                      <div className={detailStyles.tradeTitle}>
                        {trade.tradeType === "BUY" ? (
                            <span style={{ color: "#2563eb", fontWeight: "600" }}>🛒 구매</span>
                        ) : (
                            <span style={{ color: "#22c55e", fontWeight: "600" }}>💸 판매</span>
                        )}
                        <span style={{ marginLeft: "0.5rem" }}>
                          {trade.productName ?? "-"}
                        </span>
                      </div>

                      {/* 날짜 + 가격 */}
                      <div className={detailStyles.tradeMeta}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span style={{ fontSize: "1rem" }}>📅</span>
                          <span>{trade.date ? new Date(trade.date).toLocaleDateString("ko-KR") : "진행중"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span style={{ fontSize: "1rem" }}>💰</span>
                          <span>{trade.price != null ? `${trade.price.toLocaleString()}원` : "가격 미정"}</span>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          )}

        </section>

        {/* 신고 내역 */}
        <section className={`${detailStyles.card} ${detailStyles.warningCard}`}>
          <div className={detailStyles.sectionHeader}>
            <AlertTriangle size={22} color="#ef4444" />
            신고 내역
            <span className={detailStyles.reportCount}>총 {warningHistory.length || user.uwarn || 0}회</span>
          </div>

          {warningHistory.length === 0 ? (
              <div className={`${detailStyles.listEmpty} ${detailStyles.warningEmpty}`}>
                신고 기록이 없습니다.
              </div>
          ) : (
              <table className={detailStyles.reportTable}>
                <thead>
                <tr>
                  <th>신고자</th>
                  <th>신고 내용</th>
                  <th>신고 유형</th>
                  <th>신고 날짜</th>
                </tr>
                </thead>
                <tbody>
                {warningHistory.map((r) => (
                    <tr key={r.id}>
                      <td>{r.reporter}</td>
                      <td>{r.content}</td>
                      <td>{reportTypeLabel[r.type] ?? "-"}</td>
                      <td>{r.date ? new Date(r.date).toLocaleDateString("ko-KR") : "-"}</td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className={detailStyles.infoRow}>
      <span className={detailStyles.infoLabel}>
        {icon}
        {label}
      </span>
      <strong className={detailStyles.infoValue}>{value}</strong>
    </div>
  );
}

function StatusPill({ status }) {
  let label = "진행중";
  let typeClass = detailStyles.statusPending;

  switch (status) {
    case "completed":
      label = "완료";
      typeClass = detailStyles.statusCompleted;
      break;
    case "cancelled":
      label = "취소";
      typeClass = detailStyles.statusCancelled;
      break;
    case "pending":
    default:
      label = "진행중";
      typeClass = detailStyles.statusPending;
      break;
  }

  return <span className={`${detailStyles.statusPill} ${typeClass}`}>{label}</span>;
}

