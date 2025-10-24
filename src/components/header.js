'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { FormControl, OutlinedInput, InputAdornment, Divider } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Image from "next/image";
import { useRouter } from "next/navigation";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChatIcon from "@mui/icons-material/Chat";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import StorefrontIcon from "@mui/icons-material/Storefront";

import TokeStore from "@/app/store/TokenStore";
import styles from "./css/header.module.css";

export default function Header() {
    const router = useRouter();
    const [me, setMe] = useState(null);

    // 전역 토큰 구독
    const { accessToken, setToken, clearToken } = TokeStore();

    // 첫 렌더 시 localStorage 값으로 Zustand 복원
    useEffect(() => {
        const saved = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (saved && !accessToken) {
            setToken(saved);
        }
    }, [accessToken, setToken]);

    // 토큰이 생기거나 바뀌면 /me 호출해서 헤더 갱신
    useEffect(() => {
        if (!accessToken) {
            setMe(null);
            return;
        }
        (async () => {
            try {
                const res = await fetch("/api/sing/me", {
                    method: "GET",
                    headers: { Authorization: `Bearer ${accessToken}` },
                    credentials: "include",
                    cache: "no-store",
                });
                if (res.ok) {
                    const data = await res.json();
                    setMe(data);
                } else {
                    setMe(null);
                }
            } catch {
                setMe(null);
            }
        })();
    }, [accessToken]);

    // 로그아웃
    const onLogout = async () => {
        if (!confirm("로그아웃 하시겠습니까?")) return;
        try {
            await fetch("/api/sing/logout", {
                method: "POST",
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                credentials: "include",
            });
        } finally {
            clearToken();
            localStorage.removeItem("accessToken");
            setMe(null);
            router.push("/");
        }
    };

    // ✅ 판매하기 클릭 시 로그인 확인
    const onClickSell = (e) => {
        e.preventDefault(); // 기본 링크 이동 막기
        if (!me) {
            alert("판매하기는 로그인 후 이용할 수 있어요. 로그인 페이지로 이동합니다.");
            router.push(`/sing/login?next=${encodeURIComponent("/sell")}&reason=need_login`);
            return;
        }
        // 로그인 상태면 정상 이동
        router.push("/sell");
    };

    return (
        <header className={styles.sticky}>
            <div className={styles.warp}>

                {/* 상단 작은 메뉴 */}
                <div className={styles.header}>
                    <p className={styles.top}>안전거래를 위한 대파의 약속</p>

                    <div className={styles.rmenu}>
                        {me ? (
                            <>
                                <span><b>{me.uName}</b>님 환영합니다.</span>
                                <button type="button" onClick={onLogout} className={styles.logoutBtn}>
                                    로그아웃
                                </button>
                                <Link href="/help">고객센터</Link>
                            </>
                        ) : (
                            <>
                                <Link href="/sing/login">로그인</Link>
                                <Link href="/sing/join/agree">회원가입</Link>
                                <Link href="/help">고객센터</Link>
                            </>
                        )}
                    </div>
                </div>

                <Divider className={styles.hr} />

                {/* 로고 / 검색 / 아이콘 */}
                <div className={styles.menu}>
                    <Link href="/">
                        <div className={styles.logo}>
                            <Image
                                src="/DAEPA_Logo.png"
                                alt="대 파 로고"
                                width={150}
                                height={80}
                                priority
                            />
                        </div>
                    </Link>

                    <form noValidate autoComplete="off" className={styles.search}>
                        <FormControl className={styles.searchControl}>
                            <OutlinedInput
                                placeholder="찾으시는 상품을 검색해주세요"
                                startAdornment={
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                }
                                sx={{
                                    height: 40,
                                    fontSize: 14,
                                    '& input': { padding: '8px' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ccc' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#999' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
                                }}
                            />
                        </FormControl>
                    </form>

                    <div className={styles.icon}>
                        <Link href="/mypage" aria-label="내 정보"><AccountCircleIcon /></Link>
                        <Link href="/chat" aria-label="채팅"><ChatIcon /></Link>
                        <Link href="/wishlist" aria-label="찜 목록"><FavoriteBorderIcon /></Link>

                        {/* ✅ 변경된 부분: 판매하기 클릭 시 로그인 확인 */}
                        <a href="/sell" aria-label="판매하기" onClick={onClickSell}>
                            <StorefrontIcon />
                        </a>
                    </div>
                </div>

                <Divider className={styles.hr} />
            </div>
        </header>
    );
}
