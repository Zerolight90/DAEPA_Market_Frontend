"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  PieChart
} from "lucide-react";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayTransactions: 0,
    monthlyRevenue: 0,
    pendingProducts: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);

  // Mock data loading
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalUsers: 15420,
        todayTransactions: 45,
        monthlyRevenue: 45000000,
        pendingProducts: 156
      });

      setRecentActivities([
        {
          id: 1,
          type: "user",
          title: "새로운 사용자 가입",
          description: "김철수님이 회원가입했습니다",
          time: "5분 전",
          status: "success"
        },
        {
          id: 2,
          type: "product",
          title: "상품 등록 요청",
          description: "아이폰 15 Pro 등록 요청이 접수되었습니다",
          time: "12분 전",
          status: "warning"
        },
        {
          id: 3,
          type: "transaction",
          title: "거래 완료",
          description: "맥북 프로 거래가 성공적으로 완료되었습니다",
          time: "1시간 전",
          status: "success"
        },
        {
          id: 4,
          type: "report",
          title: "신고 접수",
          description: "부적절한 상품에 대한 신고가 접수되었습니다",
          time: "2시간 전",
          status: "error"
        },
        {
          id: 5,
          type: "user",
          title: "사용자 활동",
          description: "이영희님이 3개의 상품을 조회했습니다",
          time: "3시간 전",
          status: "success"
        }
      ]);
    }, 1000);
  }, []);

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "user":
        return <Users size={16} color="#6b7280" />;
      case "product":
        return <Package size={16} color="#6b7280" />;
      case "transaction":
        return <ShoppingCart size={16} color="#6b7280" />;
      case "report":
        return <AlertCircle size={16} color="#6b7280" />;
      default:
        return <Activity size={16} color="#6b7280" />;
    }
  };

  const getActivityIconBg = (type) => {
    return "#f3f4f6";
  };

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
              <Users size={20} color="#6b7280" />
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
            <span className={styles.statCardTitle}>오늘 거래</span>
            <div className={styles.statCardIcon} >
              <ShoppingCart size={20} color="#6b7280" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatNumber(stats.todayTransactions)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangePositive}`}>
            <TrendingUp size={16} />
            +8.3% <span style={{ color: "#64748b" }}>어제 대비</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>이번 달 거래액</span>
            <div className={styles.statCardIcon}>
              <DollarSign size={20} color="#6b7280" />
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
            <span className={styles.statCardTitle}>승인 대기 상품</span>
            <div className={styles.statCardIcon}>
              <Clock size={20} color="#6b7280" />
            </div>
          </div>
          <div className={styles.statCardValue}>{formatNumber(stats.pendingProducts)}</div>
          <div className={`${styles.statCardChange} ${styles.statCardChangeNegative}`}>
            <AlertCircle size={16} />
            <span>검토 필요</span>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Chart */}
        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>거래 추이</h3>
          <div style={{ 
            height: "500px",
            display: "flex", 
            alignItems: "end",
            justifyContent: "space-between",
            // backgroundColor: "#f8fafc",
            borderRadius: "0.5rem",
            padding: "1rem",
            gap: "0.5rem"
          }}>
            {/* Bar Chart */}
            <div style={{ 
              flex: 1, 
              height: "90%",
              display: "flex", 
              alignItems: "end", 
              gap: "0.25rem",
              padding: "30px 0",
              overflowX: "hidden"
            }}>
              {[
                { month: "1월", height: "60%" },
                { month: "2월", height: "80%" },
                { month: "3월", height: "70%" },
                { month: "4월", height: "90%" },
                { month: "5월", height: "85%" },
                { month: "6월", height: "95%" },
                { month: "7월", height: "75%" },
                { month: "8월", height: "88%" },
                { month: "9월", height: "82%" },
                { month: "10월", height: "92%" },
                { month: "11월", height: "78%" },
                { month: "12월", height: "100%" }
              ].map((data, index) => (
                <div key={index} style={{ 
                  flex: 1, 
                  minWidth: "30px",
                  height: data.height, 
                  backgroundColor: "#2E8B57",
                  borderRadius: "0.25rem 0.25rem 0 0",
                  position: "relative"
                }}>
                  <div style={{ 
                    position: "absolute", 
                    bottom: "-1.5rem", 
                    left: "50%", 
                    transform: "translateX(-50%)", 
                    fontSize: "0.7rem", 
                    color: "#64748b",
                    whiteSpace: "nowrap"
                  }}>
                    {data.month}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.recentActivity}>
          <h3 className={styles.chartTitle}>최근 활동</h3>
          <div>
            {recentActivities.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div 
                  className={styles.activityIcon}
                  style={{ backgroundColor: getActivityIconBg(activity.type) }}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>{activity.title}</div>
                  <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                    {activity.description}
                  </div>
                </div>
                <div className={styles.activityTime} style={{ 
                  color: "#64748b", 
                  fontSize: "0.875rem",
                  flexShrink: 0,
                  marginLeft: "1rem"
                }}>
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.chartContainer} style={{ marginBottom: "2rem" }}>
        <h3 className={styles.chartTitle}>빠른 작업</h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem" 
        }}>
          <button style={{
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
            gap: "0.5rem"
          }}>
             <Users size={20} color="#6b7280" />
             <span style={{ fontSize: "0.875rem", color: "#374151" }}>사용자 관리</span>
          </button>
          <button style={{
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
            gap: "0.5rem"
          }}>
             <Package size={20} color="#6b7280" />
             <span style={{ fontSize: "0.875rem", color: "#374151" }}>상품 승인</span>
          </button>
          <button style={{
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
            gap:                                   "0.5rem"
          }}>
             <AlertCircle size={20} color="#6b7280" />
             <span style={{ fontSize: "0.875rem", color: "#374151" }}>신고 처리</span>
          </button>
          <button style={{
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
            gap: "0.5rem"
          }}>
             <BarChart3 size={20} color="#6b7280" />
             <span style={{ fontSize: "0.875rem", color: "#374151" }}>통계 보기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
