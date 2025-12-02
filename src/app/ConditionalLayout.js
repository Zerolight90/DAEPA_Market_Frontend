"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import api from "@/lib/api";
import useAuthStore from "@/store/useAuthStore";
import StorageGuard from "@/components/StorageGuard";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const { login, logout } = useAuthStore();

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 보호된 리소스 로그인 확인 (쿠키 기반)
        const res = await api.get("/sing/me");
        login(res.data);
      } catch (error) {
        // 401 등 에러 시 로그아웃 처리
        logout();
      }
    };

    checkLoginStatus();
  }, [login, logout]);

  // 관리자 로그인 페이지에서는 헤더/푸터 숨김
  if (pathname === "/admin/login") {
    return (
      <>
        <StorageGuard />
        {children}
      </>
    );
  }

  // 일반 페이지 레이아웃
  return (
    <>
      <StorageGuard />
      <Suspense>
        <Header />
      </Suspense>
      {children}
      <Footer />
    </>
  );
}
