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
  Mail,
  Star,
  MessageSquare
} from "lucide-react";
import styles from "../../admin.module.css";
import detailStyles from "./user-detail.module.css";

// 상대시간 한국어 표시 함수 추가
function timeAgoKR(input) {
  if (!input) return "-";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "-";

  const now = new Date();
  let diffSec = Math.floor((now - d) / 1000);

  if (diffSec < 60) return "방금";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day === 1) return "어제";
  if (day < 7) return `${day}일 전`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}주 전`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}개월 전`;
  const year = Math.floor(day / 365);
  return `${year}년 전`;
}

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

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/users/${id}`);
        if (!res.ok) {
          throw new Error("회원 상세 정보를 불러오지 못했습니다.");
        }
        
        const data = await res.json();
        
        // 판매 후기 API 호출
        try {
          const reviewRes = await fetch(`http://localhost:8080/api/admin/users/${id}/reviews/sell`);
          if (reviewRes.ok) {
            const reviews = await reviewRes.json();
            data.reviewHistory = reviews.map((r) => ({
              id: r.reviewId,
              reviewerName: r.reviewerName,
              rating: r.rating,
              content: r.content,
              date: r.date,
              productName: r.productName
            }));
          } else {
            data.reviewHistory = [];
          }
        } catch (e) {
          console.warn("판매 후기 API 오류", e);
          data.reviewHistory = [];
        }

        // reviewHistory가 없으면 빈 배열로 설정
        if (!data.reviewHistory) {
          data.reviewHistory = [];
        }

        // reportHistory가 없으면 빈 배열로 설정
        if (!data.reportHistory) {
          data.reportHistory = [];
        }

        setDetail(data);
        setManner(data.umanner ?? data.uManner ?? 0);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message || "회원 정보를 불러오는 중 오류가 발생했습니다.");
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

      if (!res.ok) throw new Error("신선도 업데이트에 실패했습니다.");

      const updated = await res.json();
      // 업데이트 후 화면에 반영
      setDetail(prev => ({
        ...prev,
        umanner: updated.umanner ?? manner
      }));

      alert("신선도가 업데이트되었습니다.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (statusNum) => {
    // u_status: 1=활성, 2=탈퇴, 3=정지, 9=보류
    switch (statusNum) {
      case 1:
        return <span className={styles.statusSuccess}>활성</span>;
      case 2:
        return <span className={styles.statusGray}>탈퇴</span>;
      case 3:
        return <span className={styles.statusError}>정지</span>;
      case 9:
        return <span className={styles.statusWarning}>보류</span>;
      default:
        return <span className={styles.statusWarning}>보류</span>;
    }
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
  const reviews = detail.reviewHistory || [];

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
            <InfoRow icon={<AlertTriangle size={16} />} label="경고 횟수" value={`${user.uwarn ?? 0}회`} />
          </div>
        </section>

        {/* 신선도 조절 */}
        <section className={`${detailStyles.card} ${detailStyles.mannerCard}`}>
          <div className={detailStyles.sectionHeader}>
            <ThermometerSun size={24} color="#2e8b57" />
            신선도 조절
          </div>
          <p className={detailStyles.sectionDescription}>
            신선도를 조절하여 회원의 신뢰도를 반영하세요. 변경 사항은 즉시 저장됩니다.
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

        {/* 거래 내역 및 거래 후기 */}
        <section className={`${detailStyles.card} ${detailStyles.tradeCard}`} style={{ padding: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            {/* 왼쪽: 거래 내역 */}
            <div style={{ padding: "1.5rem", borderRight: "1px solid #e2e8f0" }}>
              <div className={detailStyles.sectionHeader}>
                <ShoppingBag size={22} color="#2563eb" />
                거래 내역
              </div>
              {tradeHistory.length === 0 ? (
                <div className={detailStyles.listEmpty}>거래 내역이 없습니다.</div>
              ) : (
                <div className={detailStyles.tradeListScrollable}>
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
            </div>

            {/* 오른쪽: 거래 후기 */}
            <div style={{ padding: "1.5rem" }}>
              <div className={detailStyles.sectionHeader}>
                <MessageSquare size={22} color="#f59e0b" />
                판매 후기
              </div>
              {reviews.length === 0 ? (
                <div className={detailStyles.listEmpty}>거래 후기가 없습니다.</div>
              ) : (
                <div className={detailStyles.reviewListScrollable}>
                  {reviews.map((review) => {

                    return (
                      <div key={review.id} className={detailStyles.reviewCard}>
                        <div className={detailStyles.reviewHeader}>
                          <div className={detailStyles.reviewUserSection}>
                            <div className={detailStyles.reviewAvatar}>
                              <UserIcon size={20} color="#999" />
                            </div>
                            <span className={detailStyles.reviewNickname}>
                              {review.reviewerName || "익명"}
                            </span>
                          </div>
                          <div className={detailStyles.reviewDate}>
                            {timeAgoKR(review.date)}
                          </div>
                        </div>
                        
                        <div className={detailStyles.reviewStars}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              fill={i < (review.rating || 0) ? "#fbbf24" : "#e5e7eb"}
                              color={i < (review.rating || 0) ? "#fbbf24" : "#e5e7eb"}
                            />
                          ))}
                        </div>

                        <div className={detailStyles.reviewContent}>
                          {review.content}
                        </div>

                        <div className={detailStyles.reviewInfoBox}>
                          <div className={detailStyles.reviewInfoRow}>
                            <span className={detailStyles.reviewInfoLabel}>구매 상품</span>
                            <span style={{ color: "#d1d5db", margin: "0 0.5rem" }}>|</span>
                            <span className={detailStyles.reviewInfoValue}>
                              {review.productName || "기록없음"}
                            </span>
                          </div>
                          <div className={detailStyles.reviewInfoRow}>
                            <span className={detailStyles.reviewInfoLabel}>등록일</span>
                            <span style={{ color: "#d1d5db", margin: "0 0.5rem" }}>|</span>
                            <span className={detailStyles.reviewInfoValue}>
                              {review.date ? new Date(review.date).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit"
                              }) : "기록없음"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
              <div className={detailStyles.reportListScrollable}>
                {warningHistory.map((r) => (
                  <div key={r.id} className={detailStyles.reportItem}>
                    <div className={detailStyles.reportTitle}>
                      <span style={{ color: "#ef4444", fontWeight: "600" }}>⚠️ 신고자</span>
                      <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>
                        {r.reporter || "익명"}
                      </span>
                      <span style={{ 
                        marginLeft: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        background: "#fee2e2",
                        color: "#b91c1c"
                      }}>
                        {reportTypeLabel[r.type] ?? "-"}
                      </span>
                    </div>
                    <div className={detailStyles.reportContent}>
                      {r.content || "신고 내용이 없습니다."}
                    </div>
                    <div className={detailStyles.reportMeta}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span style={{ fontSize: "1rem" }}>📅</span>
                        <span>{r.date ? new Date(r.date).toLocaleDateString("ko-KR") : "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

