"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Package, ShoppingCart, BarChart3,
  Settings, Menu, X, LogOut, User, MessageSquare, ChevronDown,
  Edit, UserPlus
} from "lucide-react";
import styles from "./admin.module.css";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [adminName, setAdminName] = useState("대파 관리자"); // ✅ 기본값
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  // 로그인 페이지인 경우 레이아웃을 적용하지 않음
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 로그인 체크: sessionStorage에 adminIdx 없으면 로그인 페이지로 강제 이동
  if (typeof window !== "undefined") {
    const isLoggedIn = sessionStorage.getItem("adminIdx");
    if (!isLoggedIn) {
      window.location.href = "/admin/login";
      return null;
    }
  }


  // 외부 클릭 시 드롭다운 닫기
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

  // 로그인한 관리자 닉네임 읽어오기
  useEffect(() => {
    const nick = sessionStorage.getItem("adminNick");
    if (nick) setAdminName(nick);
  }, []);

  const menuItems = [
    { name: "대시보드", href: "/admin", icon: LayoutDashboard },
    { name: "회원 관리", href: "/admin/users", icon: Users },
    { name: "거래 후기", href: "/admin/reviews", icon: ShoppingCart },
    { name: "배송 관리", href: "/admin/shipping", icon: Package },
    { name: "검수 관리", href: "/admin/inspection", icon: BarChart3 },
    { name: "게시판 관리", href: "/admin/board", icon: MessageSquare },
    { name: "설정", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className={styles.adminLayout}>
      {/* Top Header */}
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

      {/* Sidebar */}
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

      {/* Main Content */}
      <div className={styles.mainContent}>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
