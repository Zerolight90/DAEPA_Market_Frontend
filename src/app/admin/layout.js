'use client';

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Package, ShoppingCart, BarChart3,
  Menu, X, LogOut, User, Image, ChevronDown,
  Edit, UserPlus, ShieldAlert, UserCog, Boxes
} from "lucide-react";
import styles from "./admin.module.css";
import { Box, CircularProgress, Typography } from "@mui/material";

function AdminLayoutContent({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [adminName, setAdminName] = useState("대파 관리자");
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (typeof window !== "undefined") {
    const isLoggedIn = sessionStorage.getItem("adminIdx");
    if (!isLoggedIn) {
      window.location.href = "/admin/login";
      return null;
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const nick = sessionStorage.getItem("adminNick");
    if (nick) setAdminName(nick);
  }, []);

  const menuItems = [
    { name: "대시보드", href: "/admin", icon: LayoutDashboard },
    { name: "회원 관리", href: "/admin/users", icon: Users },
    { name: "상품 관리", href: "/admin/products", icon: Boxes },
    { name: "거래 후기", href: "/admin/reviews", icon: ShoppingCart },
    { name: "검수 관리", href: "/admin/inspection", icon: BarChart3 },
    { name: "배송 관리", href: "/admin/shipping", icon: Package },
    { name: "배너 관리", href: "/admin/banner", icon: Image },
    { name: "신고 관리", href: "/admin/reports", icon: ShieldAlert },
    { name: "관리자 조회", href: "/admin/admins", icon: UserCog },
  ];

  return (
    <div className={styles.adminLayout}>
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>
            <img
              src="/DAEPA_Logo.png"
              alt="대파마켓 로고"
              className={styles.logoImage}
            />
          </div>
          <div className={styles.headerLinks}>
            <Link href="/" className={styles.headerLink}>홈</Link>
            <Link href="/admin/notice" className={styles.headerLink}>공지사항</Link>
            <Link href="/admin/contact" className={styles.headerLink}>문의</Link>
          </div>
        </div>
      </header>

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.profileSection} ref={dropdownRef}>
            <button
              className={styles.profileButton}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <User className={styles.profileIcon} />
              <span className={styles.profileText}>{adminName}</span>
              <ChevronDown
                size={16}
                className={`${styles.chevronIcon} ${profileDropdownOpen ? styles.chevronRotated : ""}`}
              />
            </button>

            {profileDropdownOpen && (
              <div className={styles.profileDropdown}>
                <Link href="/admin/profile" className={styles.dropdownItem}>
                  <Edit size={16} />
                  <span>정보 수정</span>
                </Link>
                <Link href="/admin/add-admin" className={styles.dropdownItem}>
                  <UserPlus size={16} />
                  <span>관리자 추가</span>
                </Link>
              </div>
            )}
          </div>
          <button
            className={styles.closeButton}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
              className={styles.logoutButton}
              onClick={() => {
                sessionStorage.removeItem("adminIdx");
                sessionStorage.removeItem("adminNick");
                window.location.href = "/admin/login";
              }}
          >
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function AdminLayout({ children }) {
    return (
        <Suspense fallback={
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress />
                <Typography sx={{ml: 2}}>관리자 페이지 로딩 중...</Typography>
            </Box>
        }>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
    );
}
