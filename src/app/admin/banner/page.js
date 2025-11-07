"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import styles from "../admin.module.css";

export default function BannerManagementPage() {
  const [banners, setBanners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // 헤더와 데이터 행 정렬을 위한 공통 그리드 템플릿
  const columnTemplate = "60px 120px 1fr 1fr 200px 100px 100px 120px";

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      // TODO: 실제 API 연결 시 주석 해제
      // const res = await fetch("http://localhost:8080/api/admin/banners");
      // if (!res.ok) throw new Error("배너 목록 불러오기 실패");
      // const data = await res.json();
      // setBanners(data);

      // 임시 더미 데이터
      setBanners([
        {
          id: 1,
          title: "신규 회원 환영 이벤트",
          subtitle: "지금 가입하면 특별 혜택",
          image: "/banners/banner1.jpg",
          href: "/event/1",
          order: 1,
          isActive: true
        },
        {
          id: 2,
          title: "특가 할인 이벤트",
          subtitle: "최대 50% 할인",
          image: "/banners/banner2.jpg",
          href: "/event/2",
          order: 2,
          isActive: true
        },
        {
          id: 3,
          title: "신상품 출시",
          subtitle: "새로운 상품을 만나보세요",
          image: "/banners/banner3.jpg",
          href: "/event/3",
          order: 3,
          isActive: false
        }
      ]);
    } catch (err) {
      console.error(err);
      alert("배너 목록을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBanners = banners.filter(banner => {
    const matchesSearch =
      (banner.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.subtitle ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleToggleActive = async (id) => {
    try {
      // TODO: 실제 API 연결 시 주석 해제
      // const res = await fetch(`http://localhost:8080/api/admin/banners/${id}/toggle`, {
      //   method: "PATCH"
      // });
      // if (!res.ok) throw new Error("배너 상태 변경 실패");
      
      setBanners(banners.map(banner =>
        banner.id === id ? { ...banner, isActive: !banner.isActive } : banner
      ));
    } catch (err) {
      console.error(err);
      alert("배너 상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("이 배너를 삭제하시겠습니까?")) return;

    try {
      // TODO: 실제 API 연결 시 주석 해제
      // const res = await fetch(`http://localhost:8080/api/admin/banners/${id}`, {
      //   method: "DELETE"
      // });
      // if (!res.ok) throw new Error("배너 삭제 실패");
      
      setBanners(banners.filter(banner => banner.id !== id));
      alert("배너가 삭제되었습니다.");
    } catch (err) {
      console.error(err);
      alert("배너 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleOrderChange = async (id, direction) => {
    const currentIndex = banners.findIndex(b => b.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    [newBanners[currentIndex], newBanners[newIndex]] = [newBanners[newIndex], newBanners[currentIndex]];
    
    // 순서 업데이트
    const updatedBanners = newBanners.map((banner, index) => ({
      ...banner,
      order: index + 1
    }));

    try {
      // TODO: 실제 API 연결 시 주석 해제
      // await fetch(`http://localhost:8080/api/admin/banners/${id}/order`, {
      //   method: "PATCH",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ order: newIndex + 1 })
      // });
      
      setBanners(updatedBanners);
    } catch (err) {
      console.error(err);
      alert("배너 순서 변경 중 오류가 발생했습니다.");
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
          배너 목록을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>배너 관리</h1>
        <p className={styles.pageSubtitle}>
          메인 페이지에 표시되는 배너를 관리합니다.
        </p>
      </div>

      {/* Search and Actions */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="배너 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Link href="/admin/banner/create" className={styles.createLink}>
          <Plus size={20} />
          배너 추가
        </Link>
      </div>

      {/* Banner List */}
      <div className={styles.tableContainer}>
        {filteredBanners.length === 0 ? (
          <div className={styles.emptyState}>
            <ImageIcon size={48} className={styles.emptyStateIcon} />
            <h3 className={styles.emptyStateTitle}>등록된 배너가 없습니다</h3>
            <p className={styles.emptyStateDescription}>
              새로운 배너를 추가하여 메인 페이지에 표시하세요.
            </p>
            <Link href="/admin/banner/create" className={styles.createLink}>
              <Plus size={20} />
              배너 추가하기
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.tableHeader}>
              <div className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: columnTemplate }}>
                <div className={styles.tableCell}>순서</div>
                <div className={styles.tableCell}>미리보기</div>
                <div className={styles.tableCell}>제목</div>
                <div className={styles.tableCell}>부제목</div>
                <div className={styles.tableCell}>링크</div>
                <div className={styles.tableCell} style={{ textAlign: "center" }}>상태</div>
                <div className={styles.tableCell} style={{ textAlign: "center" }}>순서 변경</div>
                <div className={styles.tableCell} style={{ textAlign: "center" }}>관리</div>
              </div>
            </div>
            <div className={styles.tableBody}>
              {filteredBanners.map((banner, index) => (
                <div
                  key={banner.id}
                  className={styles.tableRow}
                  style={{ display: "grid", gridTemplateColumns: columnTemplate }}
                >
                  <div className={styles.tableCell} style={{ fontWeight: 600, color: "#374151" }}>
                    {banner.order}
                  </div>
                  
                  <div className={styles.tableCell}>
                    <div className={styles.bannerPreview}>
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className={styles.bannerImage}
                        onError={(e) => {
                          e.target.src = "/images/placeholder.jpg";
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.tableCell}>
                    <div className={styles.bannerInfo}>
                      <div className={styles.bannerTitle}>{banner.title}</div>
                    </div>
                  </div>

                  <div className={styles.tableCell}>
                    <div className={styles.bannerInfo}>
                      <div className={styles.bannerSubtitle}>{banner.subtitle}</div>
                    </div>
                  </div>

                  <div className={styles.tableCell} style={{ minWidth: 0 }}>
                    <div className={styles.bannerLink} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {banner.href}
                    </div>
                  </div>

                  <div className={styles.tableCell} style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleToggleActive(banner.id)}
                      style={{
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.375rem",
                        border: "none",
                        background: banner.isActive ? "#dcfce7" : "#f3f4f6",
                        color: banner.isActive ? "#16a34a" : "#6b7280",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        margin: "0 auto"
                      }}
                    >
                      {banner.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      {banner.isActive ? "활성" : "비활성"}
                    </button>
                  </div>

                  <div className={styles.tableCell} style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                    <button
                      onClick={() => handleOrderChange(banner.id, "up")}
                      disabled={index === 0}
                      style={{
                        padding: "0.375rem",
                        borderRadius: "0.25rem",
                        border: "1px solid #e2e8f0",
                        background: "white",
                        cursor: index === 0 ? "not-allowed" : "pointer",
                        opacity: index === 0 ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <ArrowUp size={16} color={index === 0 ? "#9ca3af" : "#374151"} />
                    </button>
                    <button
                      onClick={() => handleOrderChange(banner.id, "down")}
                      disabled={index === filteredBanners.length - 1}
                      style={{
                        padding: "0.375rem",
                        borderRadius: "0.25rem",
                        border: "1px solid #e2e8f0",
                        background: "white",
                        cursor: index === filteredBanners.length - 1 ? "not-allowed" : "pointer",
                        opacity: index === filteredBanners.length - 1 ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <ArrowDown size={16} color={index === filteredBanners.length - 1 ? "#9ca3af" : "#374151"} />
                    </button>
                  </div>

                  <div className={styles.tableCell} style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <Link href={`/admin/banner/edit/${banner.id}`}>
                      <button
                        style={{
                          padding: "0.5rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #e2e8f0",
                          background: "white",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Edit size={16} color="#3b82f6" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #e2e8f0",
                        background: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

