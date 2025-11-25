"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  DollarSign,
  MessageSquare,
  FileText,
  ShieldAlert,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import styles from "./admin.module.css";
import api from "@/lib/api"; // axios 인스턴스 가져오기

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    monthlyRevenue: 0,
    reportsAndInquiries: 0
  });

  const [recentProducts, setRecentProducts] = useState([]);
  const [dailyTransactions, setDailyTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const CATEGORY_COLORS = {
    "전자제품": "#2563eb",      // blue-600
    "패션/의류": "#ef4444",     // red-500
    "생활/가전": "#f97316",     // orange-500
    "도서/음반": "#6366f1",     // indigo-500
    "스포츠/레저": "#facc15",   // yellow-400
    "자동차": "#d946ef",        // fuchsia-500
    "반려동물": "#10b981",      // emerald-500
    "기타": "#6b7280"          // gray-500
  };

  const EXTRA_CATEGORY_COLORS = [
    "#0ea5e9", // sky-500
    "#fbbf24", // amber-400
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#22d399", // cyan-400
    "#047857", // emerald-700
    "#ff7f11", // custom orange
    "#7c3aed"  // purple-600
  ];

  // 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 대시보드 통계 조회
        const statsResponse = await api.get(`/admin/analytics/stats`);
        const statsData = statsResponse.data;
        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalTransactions: statsData.monthlyTransactions || 0,
          monthlyRevenue: statsData.monthlyRevenue || 0,
          reportsAndInquiries: statsData.pendingReports || 0
        });

        // 일간 거래 추이 조회
        const transactionResponse = await api.get(`/admin/analytics/daily-transactions`);
        const transactionData = transactionResponse.data;
        setDailyTransactions(transactionData.map(item => ({
          date: item.date,
          value: item.value || 0,
          totalAmount: item.totalAmount || 0,
          sellerCount: item.sellerCount || 0
        })));

        // 최근 등록 상품 조회
        const productsResponse = await api.get(`/admin/analytics/recent-products?limit=5`);
        const productsData = productsResponse.data;
        setRecentProducts(productsData.map(item => {
          // 날짜 포맷팅 (상대 시간)
          const formatDate = (dateString) => {
            if (!dateString) return "-";
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return "방금 전";
            if (diffMins < 60) return `${diffMins}분 전`;
            if (diffHours < 24) return `${diffHours}시간 전`;
            if (diffDays < 7) return `${diffDays}일 전`;
            return date.toLocaleDateString("ko-KR");
          };
          
          return {
            id: item.id,
            name: item.name,
            seller: item.seller,
            price: item.price || 0,
            category: item.category || "기타",
            date: formatDate(item.createdAt)
          };
        }));

        // 카테고리 비율 조회
        const categoryResponse = await api.get("/admin/analytics/category-ratio");
        const categoryRaw = categoryResponse.data;
        const categoriesOrder = [
          "전자제품",
          "패션/의류",
          "생활/가전",
          "도서/음반",
          "스포츠/레저",
          "자동차",
          "반려동물",
          "기타"
        ];

        const extraColorQueue = [...EXTRA_CATEGORY_COLORS];
        const nextExtraColor = () => {
          if (extraColorQueue.length > 0) {
            return extraColorQueue.shift();
          }
          const hue = Math.floor(Math.random() * 360);
          return `hsl(${hue}, 70%, 55%)`;
        };

        const colorMap = new Map();
        categoriesOrder.forEach((name) => {
          colorMap.set(name, CATEGORY_COLORS[name] || nextExtraColor());
        });
        categoryRaw.forEach((item) => {
          if (!colorMap.has(item.category)) {
            colorMap.set(item.category, nextExtraColor());
          }
        });

        const mapped = categoriesOrder.map((name) => {
          const found = categoryRaw.find((item) => item.category === name);
          const count = found ? (found.count || 0) : 0;
          return {
            name,
            value: count,
            color: colorMap.get(name)
          };
        });

        const extraCategories = categoryRaw
          .filter((item) => !categoriesOrder.includes(item.category))
          .map((item) => ({
            name: item.category,
            value: item.count || 0,
            color: colorMap.get(item.category)
          }));

        setCategoryData([...mapped, ...extraCategories]);
      } catch (err) {
        console.error("데이터 조회 실패:", err);
        // 에러 시 빈 데이터로 초기화
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        
        const emptyData = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          emptyData.push({ date: `${month}/${day}`, value: 0, totalAmount: 0, sellerCount: 0 });
        }
        setDailyTransactions(emptyData);
        setCategoryData([]);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  // 막대 그래프 컴포넌트
  function BarChart({ data }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    
    if (!data || data.length === 0) {
      return (
        <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
          데이터가 없습니다.
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value || 0), 1);
    const greenColors = [
      "#10b981", // emerald-500
      "#22c55e", // green-500
      "#16a34a", // green-600
      "#15803d", // green-700
      "#4ade80", // green-400
      "#34d399", // emerald-400
      "#6ee7b7"  // emerald-300
    ];

    const yAxisStep = 3;
    const minYAxisMax = yAxisStep * 5;
    const yAxisMax = Math.max(Math.ceil(maxValue / yAxisStep) * yAxisStep, minYAxisMax);
    const yAxisLabels = Array.from(
      { length: Math.floor(yAxisMax / yAxisStep) + 1 },
      (_, i) => i * yAxisStep
    );

    return (
      <div style={{
        height: "300px",
        padding: "1.5rem 1rem 2rem 3rem",
        position: "relative"
      }}>
        {/* Y축 라벨 */}
        <div style={{
          position: "absolute",
          left: "0.5rem",
          top: "1.5rem",
          bottom: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontSize: "0.75rem",
          color: "#94a3b8",
          width: "30px"
        }}>
          {yAxisLabels
            .slice()
            .reverse()
            .map((label) => (
              <span key={label}>{label}</span>
            ))}
        </div>

        {/* 막대 그래프 */}
        <div style={{
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "0.75rem",
          position: "relative",
          paddingBottom: "1.5rem"
        }}>
          {data.map((item, index) => {
            const height = yAxisMax > 0 ? (item.value / yAxisMax) * 100 : 0;
            const barColor = greenColors[index % greenColors.length];
            
            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end"
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* 막대 */}
                <div
                  style={{
                    width: "100%",
                    height: `${height}%`,
                    backgroundColor: barColor,
                    borderRadius: "0.375rem 0.375rem 0 0",
                    minHeight: item.value > 0 ? "4px" : "0",
                    transition: "all 0.2s",
                    cursor: "pointer",
                    boxShadow: hoveredIndex === index ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 4px rgba(0,0,0,0.1)",
                    transform: hoveredIndex === index ? "scaleY(1.05)" : "scaleY(1)",
                    transformOrigin: "bottom"
                  }}
                />
                
                {/* 날짜 라벨 (X축) */}
                <div style={{
                  position: "absolute",
                  bottom: "-1.5rem",
                  fontSize: "0.75rem",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                  fontWeight: hoveredIndex === index ? 600 : 400
                }}>
                  {item.date}
                </div>

                {/* 거래 건수 라벨 */}
                {item.value > 0 && (
                  <div style={{
                    position: "absolute",
                    bottom: `calc(${height}% + 8px)`,
                    fontSize: "0.75rem",
                    color: "#1e293b",
                    fontWeight: 600,
                    backgroundColor: "#fff",
                    padding: "0.125rem 0.375rem",
                    borderRadius: "0.25rem",
                    whiteSpace: "nowrap",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    opacity: hoveredIndex === index ? 1 : 0.8
                  }}>
                    {item.value}건
                  </div>
                )}

                {/* 툴팁 */}
                {hoveredIndex === index && (
                  <div style={{
                    position: "absolute",
                    bottom: `${height}%`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginBottom: "0.5rem",
                    backgroundColor: "#1e293b",
                    color: "#fff",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                    zIndex: 10,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    pointerEvents: "none"
                  }}>
                    <div style={{ marginBottom: "0.25rem", fontWeight: 600 }}>
                      {item.date}
                    </div>
                    <div style={{ marginBottom: "0.25rem" }}>
                      거래 건수: <strong>{item.value || 0}건</strong>
                    </div>
                    <div style={{ marginBottom: "0.25rem" }}>
                      총 금액: <strong>₩{formatNumber(item.totalAmount || 0)}</strong>
                    </div>
                    <div>
                      판매자 수: <strong>{item.sellerCount || 0}명</strong>
                    </div>
                    {/* 화살표 */}
                    <div style={{
                      position: "absolute",
                      bottom: "-6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 0,
                      height: 0,
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: "6px solid #1e293b"
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 파이차트 계산 함수
  const calculatePieChart = (data) => {
    const validData = data.filter((item) => item.value > 0);
    const total = validData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
      return [];
    }
    let currentAngle = -90; // 시작 각도 (12시 방향)
    const segments = validData.map((item) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      const endAngle = currentAngle;
      
      // SVG path 계산
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const radius = 80;
      const x1 = 100 + radius * Math.cos(startRad);
      const y1 = 100 + radius * Math.sin(startRad);
      const x2 = 100 + radius * Math.cos(endRad);
      const y2 = 100 + radius * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      
      return {
        name: item.name,
        color: item.color,
        ...item,
        path,
        percentage: percentage.toFixed(1),
        startAngle,
        endAngle
      };
    });
    return segments;
  };

  const totalCategoryCount = categoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>관리자 대시보드</h1>
        <p className={styles.pageSubtitle}>
          대파마켓 플랫폼 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* Statistics Cards */}
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>전체회원</span>
            <div className={styles.statCardIcon}>
              <Users size={20} color="#16a34a" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatNumber(stats.totalUsers)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +12.5% <span style={{ color: "#64748b" }}>지난 달 대비</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>이번 달 거래건</span>
            <div className={styles.statCardIcon} >
              <ShoppingCart size={20} color="#16a34a" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatNumber(stats.totalTransactions)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +8.3% <span style={{ color: "#64748b" }}>지난 달 대비</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>이번 달 거래액</span>
            <div className={styles.statCardIcon}>
              <DollarSign size={20} color="#16a34a" />
            </div>
          </div>
          <div className={styles.statCardValue}>₩{formatNumber(stats.monthlyRevenue)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +22.1% <span style={{ color: "#64748b" }}>지난 달 대비</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>신고/문의</span>
            <div className={styles.statCardIcon}>
              <AlertCircle size={20} color="#16a34a" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatNumber(stats.reportsAndInquiries)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangeNegative}`}>
            <AlertCircle size={16} />
            <span>처리 필요</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* 일간 거래 추이 - 막대 그래프 */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>일간 거래 추이</h3>
          <BarChart data={dailyTransactions} />
        </div>

        {/* 상품 카테고리 비율 (파이차트) */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>상품 카테고리 비율</h3>
          <div style={{ 
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            gap: "2rem"
          }}>
            {/* 파이차트 */}
            <div style={{ position: "relative" }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {calculatePieChart(categoryData).map((segment, index) => (
                  <path
                    key={segment.name}
                    d={segment.path}
                    fill={segment.color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            </div>
            
            {/* 범례 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {categoryData.map((item, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "2px",
                    backgroundColor: item.color
                  }} />
                  <span style={{ fontSize: "0.875rem", color: "#374151" }}>{item.name}</span>
                  <span style={{ fontSize: "0.875rem", color: "#64748b", marginLeft: "0.5rem" }}>
                    {totalCategoryCount === 0 ? "0%" : `${((item.value / totalCategoryCount) * 100).toFixed(1)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 최근 등록 상품 리스트 */}
      <div className={styles.chartContainer} style={{ marginBottom: "2rem" }}>
        <h3 className={styles.chartTitle}>최근 등록 상품</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>상품명</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>판매자</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>카테고리</th>
                <th style={{ padding: "0.75rem", textAlign: "right", fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>가격</th>
                <th style={{ padding: "0.75rem", textAlign: "right", fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>등록일</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
                    등록된 상품이 없습니다.
                  </td>
                </tr>
              ) : (
                recentProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    style={{ 
                      borderBottom: "1px solid #f1f5f9"
                    }}
                  >
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#1e293b", fontWeight: 500 }}>{product.name}</td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#64748b" }}>{product.seller}</td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#64748b" }}>{product.category}</td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#1e293b", textAlign: "right", fontWeight: 600 }}>
                      ₩{formatNumber(product.price)}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.875rem", color: "#64748b", textAlign: "right" }}>{product.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.chartContainer} style={{ marginBottom: "2rem" }}>
        <h3 className={styles.chartTitle}>빠른 작업</h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem" 
        }}>
          <Link href="/admin/users" style={{
            padding: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            background: "white",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            textDecoration: "none"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0fdf4";
            e.currentTarget.style.borderColor = "#86efac";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
          >
             <Users size={20} color="#16a34a" />
             <span style={{ fontSize: "0.875rem", color: "#374151" }}>사용자 관리</span>
          </Link>
          <Link href="/admin/inspection" style={{
            padding: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            background: "white",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            textDecoration: "none"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0fdf4";
            e.currentTarget.style.borderColor = "#86efac";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
          >
             <Package size={20} color="#16a34a" />
             <span style={{ fontSize: "0.875rem", color: "#374151" }}>검수 관리</span>
          </Link>
          <Link href="/admin/reports" style={{
            padding: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            background: "white",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            textDecoration: "none"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0fdf4";
            e.currentTarget.style.borderColor = "#86efac";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
          >
             <ShieldAlert size={20} color="#16a34a" />
             <span style={{ fontSize: "0.875rem", color: "#374151" }}>신고 관리</span>
          </Link>
          <Link href="/admin/notice/create" style={{
            padding: "20px",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            background: "white",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            textDecoration: "none"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0fdf4";
            e.currentTarget.style.borderColor = "#86efac";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "white";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
          >
             <FileText size={20} color="#16a34a" />
             <span style={{ fontSize: "0.875rem", color: "#374151" }}>공지 등록</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
