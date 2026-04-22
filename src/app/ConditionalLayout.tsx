"use client";

import { useEffect, Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
import api from "@/lib/api";
import useAuthStore from "@/store/useAuthStore";
import tokenStore from "@/store/TokenStore";
import StorageGuard from "@/components/StorageGuard";
import type { User } from "@/types";

export default function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { login, logout } = useAuthStore();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const res = await api.get<User & { accessToken?: string }>("/sign/me");
        if (res.data?.accessToken) {
          tokenStore.getState().setAccessToken(res.data.accessToken);
        }
        login(res.data);
      } catch (error) {
        logout();
      }
    };

    checkLoginStatus();
  }, [login, logout]);

  if (pathname === "/admin/login") {
    return (
      <>
        <StorageGuard />
        {children}
      </>
    );
  }

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
