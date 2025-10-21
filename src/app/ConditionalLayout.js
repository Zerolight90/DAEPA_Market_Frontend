"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  
  // 관리자 로그인 페이지에서는 헤더와 푸터를 표시하지 않음
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  
  // 일반 페이지에서는 헤더와 푸터를 표시
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
