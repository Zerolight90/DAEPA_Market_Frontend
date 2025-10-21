"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Eye, Heart } from "lucide-react";
import styles from "../admin.module.css";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 15420,
      totalProducts: 8934,
      totalTransactions: 5678,
      totalRevenue: 125000000,
      avgTransactionValue: 22000,
      conversionRate: 12.5
    },
    trends: {
      userGrowth: [120, 150, 180, 200, 250, 300, 350],
      productGrowth: [80, 120, 150, 180, 220, 280, 320],
      revenueGrowth: [5000000, 8000000, 12000000, 15000000, 18000000, 22000000, 25000000]
    },
    topCategories: [
      { name: "전자제품", count: 2340, percentage: 26.2 },
      { name: "패션/의류", count: 1890, percentage: 21.1 },
      { name: "생활/가전", count: 1456, percentage: 16.3 },
      { name: "도서/음반", count: 1234, percentage: 13.8 },
      { name: "스포츠/레저", count: 987, percentage: 11.0 },
      { name: "자동차", count: 456, percentage: 5.1 },
      { name: "반려동물", count: 234, percentage: 2.6 },
      { name: "기타", count: 231, percentage: 2.6 }
    ],
    recentActivity: [
      { type: "user", message: "새로운 사용자 25명 가입", time: "1시간 전", change: "+15%" },
      { type: "product", message: "새로운 상품 45개 등록", time: "2시간 전", change: "+8%" },
      { type: "transaction", message: "거래 완료 12건", time: "3시간 전", change: "+22%" },
      { type: "revenue", message: "매출 증가 ₩2,500,000", time: "4시간 전", change: "+18%" }
    ]
  });

  // 숫자 포맷 (3자리 콤마 + 억/만 단위)
  const formatNumber = (num) => {
    if (num >= 100000000) {
      // 1억 이상 → '억' 단위 표시
      return (num / 100000000).toFixed(1).toLocaleString() + "억";
    } else if (num >= 10000) {
      // 1만 이상 → '만' 단위 표시
      return (num / 10000).toFixed(1).toLocaleString() + "만";
    } else {
      // 그 외는 콤마(,)만 적용
      return num.toLocaleString("ko-KR");
    }
  };

  const formatCurrency = (num) => {
    if (num >= 1000000000) {
      // 10억 이상
      return `₩${(num / 1000000000).toFixed(1)}B`; // Billion
    } else if (num >= 1000000) {
      // 백만 이상
      return `₩${(num / 1000000).toFixed(1)}M`; // Million
    } else if (num >= 1000) {
      // 천 이상
      return `₩${(num / 1000).toFixed(1)}K`; // Thousand
    } else {
      // 그 외
      return `₩${num.toLocaleString("ko-KR")}`;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>통계 및 분석</h1>
        <p className={styles.pageSubtitle}>플랫폼 성과를 분석하고 인사이트를 얻으세요</p>
      </div>

      {/* Overview Cards */}
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>총 사용자</span>
            <div className={styles.statCardIcon} style={{ backgroundColor: "#dbeafe" }}>
              <Users size={20} color="#3b82f6" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatNumber(analytics.overview.totalUsers)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +12.5% 지난 달 대비
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>총 상품</span>
            <div className={styles.statCardIcon} style={{ backgroundColor: "#fef3c7" }}>
              <ShoppingCart size={20} color="#f59e0b" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatNumber(analytics.overview.totalProducts)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +8.3% 지난 주 대비
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>총 거래</span>
            <div className={styles.statCardIcon} style={{ backgroundColor: "#dcfce7" }}>
              <BarChart3 size={20} color="#10b981" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatNumber(analytics.overview.totalTransactions)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +15.2% 지난 달 대비
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>총 매출</span>
            <div className={styles.statCardIcon} style={{ backgroundColor: "#f3e8ff" }}>
              <DollarSign size={20} color="#8b5cf6" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatCurrency(analytics.overview.totalRevenue)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +22.1% 지난 달 대비
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>평균 거래액</span>
            <div className={styles.statCardIcon} style={{ backgroundColor: "#ecfdf5" }}>
              <TrendingUp size={20} color="#059669" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatCurrency(analytics.overview.avgTransactionValue)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +5.7% 지난 주 대비
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>전환율</span>
            <div className={styles.statCardIcon} style={{ backgroundColor: "#fef2f2" }}>
              <Eye size={20} color="#ef4444" />
            </div>
          </div>
          <div className={styles.statCardValue}>{analytics.overview.conversionRate}%</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +2.1% 지난 달 대비
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Growth Chart */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>성장 추이</h3>
          <div style={{ 
            height: "300px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            borderRadius: "0.5rem",
            color: "#64748b"
          }}>
            <div style={{ textAlign: "center" }}>
              <BarChart3 size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
              <p>성장 차트를 불러오는 중...</p>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>인기 카테고리</h3>
          <div className={styles.categoryList}>
            {analytics.topCategories.slice(0, 5).map((category, index) => (
              <div key={category.name} className={styles.categoryItem}>
                <div className={styles.categoryRank}>#{index + 1}</div>
                <div className={styles.categoryInfo}>
                  <div className={styles.categoryName}>{category.name}</div>
                  <div className={styles.categoryStats}>
                    {category.count.toLocaleString()}개 ({category.percentage}%)
                  </div>
                </div>
                <div className={styles.categoryBar}>
                  <div 
                    className={styles.categoryBarFill}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>최근 활동 분석</h3>
        <div className={styles.activityGrid}>
          {analytics.recentActivity.map((activity, index) => (
            <div key={index} className={styles.activityCard}>
              <div className={styles.activityIcon}>
                {activity.type === "user" && <Users size={20} />}
                {activity.type === "product" && <ShoppingCart size={20} />}
                {activity.type === "transaction" && <BarChart3 size={20} />}
                {activity.type === "revenue" && <DollarSign size={20} />}
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityMessage}>{activity.message}</div>
                <div className={styles.activityMeta}>
                  <span className={styles.activityTime}>{activity.time}</span>
                  <span className={`${styles.activityChange} ${styles.statCardChangePositive}`}>
                    {activity.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
