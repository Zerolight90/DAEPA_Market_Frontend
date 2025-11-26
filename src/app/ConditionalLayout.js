"use client";

import { useEffect } from "react"; // useEffect 임포트
import { usePathname } from "next/navigation";
import { Suspense } from "react"; // Suspense를 임포트합니다.
import Header from "@/components/header";
import Footer from "@/components/footer";
import api from "@/lib/api"; // axios 인스턴스 임포트
import useAuthStore from "@/store/useAuthStore"; // useAuthStore 임포트

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const { login, logout } = useAuthStore(); // useAuthStore 액션 가져오기

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 보호된 엔드포인트 호출 (예: 사용자 정보 가져오기)
        await api.get("/user/me"); // 이 엔드포인트가 200 OK를 반환하면 로그인 상태
        login(); // 로그인 상태로 설정
      } catch (error) {
        // 401 Unauthorized 또는 다른 에러 발생 시 로그아웃 상태로 설정
        logout();
      }
    };

    checkLoginStatus();
  }, [login, logout]); // login, logout 함수가 변경될 때만 재실행 (Zustand는 안정적)
  
  // 관리자 로그인 페이지에서는 헤더와 푸터를 표시하지 않음
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  
  // 일반 페이지에서는 헤더와 푸터를 표시
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      {children}
      <Footer />
    </>
  );
}
