"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
    FormControl,
    OutlinedInput,
    InputAdornment,
    Divider,
    Badge,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChatIcon from "@mui/icons-material/Chat";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import StorefrontIcon from "@mui/icons-material/Storefront";

import api from "@/lib/api";
import styles from "./css/header.module.css";
import useAuthStore from "@/store/useAuthStore";
import tokenStore from "@/store/TokenStore";

function getDisplayName(me) {
    if (!me) return null;

    return (
        me.uNickname ||
        me.u_nickname ||
        me.nickname ||
        me.nickName ||
        me.uName ||
        me.u_name ||
        me.uId ||
        me.u_id ||
        null
    );
}

export default function Header() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoggedIn, user, logout, login: authLogin } = useAuthStore();
    const { clearAccessToken, accessToken } = tokenStore();
    const [chatUnread, setChatUnread] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isClient, setIsClient] = useState(false);
    const fetchingUserRef = useRef(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        if (isLoggedIn || fetchingUserRef.current) return;

        // HttpOnly 쿠키는 document.cookie에서 안 보이므로 /sing/me로 세션을 복원
        fetchingUserRef.current = true;
        api.get("/sing/me")
            .then((res) => {
                if (res?.data) authLogin(res.data);
            })
            .catch((err) => {
                if (err?.response?.status === 401) {
                    logout();
                    clearAccessToken();
                } else {
                    console.error("사용자 정보 불러오기 실패:", err?.message || err);
                }
            })
            .finally(() => {
                fetchingUserRef.current = false;
            });
    }, [isClient, isLoggedIn, authLogin, logout, clearAccessToken]);

    useEffect(() => {
        const kw = searchParams?.get("keyword") ?? "";
        setSearchKeyword(kw);
    }, [searchParams]);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const trimmed = searchKeyword.trim();
        const params = new URLSearchParams();
        if (trimmed) {
            params.set("keyword", trimmed);
        }
        router.push(params.toString() ? `/all?${params.toString()}` : "/all");
    };

    const onLogout = async () => {
        if (!confirm("로그아웃 하시겠습니까?")) return;
        try {
            await api.post("/sing/logout");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            document.cookie = "ACCESS_TOKEN=; path=/; max-age=0; SameSite=Lax";
            clearAccessToken();
            logout();
            router.push("/");
            router.refresh();
        }
    };

    const guardOrPush = (e, target) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert("로그인이 필요한 서비스입니다.");
            router.push(`/sing/login?next=${encodeURIComponent(target)}`);
            return;
        }
        router.push(target);
    };

    const onClickMyPage = (e) => guardOrPush(e, "/mypage");
    const onClickSell = (e) => guardOrPush(e, "/sell");
    const onClickChat = (e) => guardOrPush(e, "/chat");

    const displayNameRaw = getDisplayName(user);
    const displayName = (displayNameRaw || "").trim();
    const greetingName = displayName || "회원";
    const isAuthenticated =
        isClient &&
        isLoggedIn &&
        !!user &&
        displayName.length > 0;

    return (
        <header className={styles.sticky}>
            <div className={styles.warp}>
                <div className={styles.header}>
                    <p className={styles.top}>안전거래를 위한 빠른 약속</p>

                    <div className={styles.rmenu}>
                        {isAuthenticated ? (
                            <>
                                <span>
                                    <b>{greetingName}</b>님 환영합니다
                                </span>
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className={styles.logoutBtn}
                                >
                                    로그아웃
                                </button>
                                <Link href="/faq">고객센터</Link>
                            </>
                        ) : (
                            <>
                                <Link href="/sing/login">로그인</Link>
                                <Link href="/sing/join/agree">회원가입</Link>
                                <Link href="/faq">고객센터</Link>
                            </>
                        )}
                    </div>
                </div>

                <Divider className={styles.hr} />

                <div className={styles.menu}>
                    <Link href="/">
                        <div className={styles.logo}>
                            <Image
                                src="/DAEPA_Logo.png"
                                alt="대파마켓 로고"
                                width={150}
                                height={80}
                                priority
                            />
                        </div>
                    </Link>

                    <form
                        noValidate
                        autoComplete="off"
                        className={styles.search}
                        onSubmit={handleSearchSubmit}
                    >
                        <FormControl className={styles.searchControl}>
                            <OutlinedInput
                                placeholder="찾으시는 상품을 검색해 주세요"
                                value={searchKeyword}
                                onChange={(event) => setSearchKeyword(event.target.value)}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                }
                                sx={{
                                    height: 40,
                                    fontSize: 14,
                                    "& input": { padding: "8px" },
                                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ccc" },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#999",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#000",
                                    },
                                }}
                            />
                        </FormControl>
                    </form>

                    <div className={styles.icon}>
                        <Link href="/mypage" onClick={onClickMyPage}>
                            <AccountCircleIcon />
                        </Link>

                        <a
                            href="/chat"
                            onClick={onClickChat}
                            className={styles.chatBadgeWrap}
                        >
                            <Badge
                                badgeContent={chatUnread}
                                color="error"
                                invisible={!chatUnread}
                                overlap="circular"
                            >
                                <ChatIcon />
                            </Badge>
                        </a>

                        <Link href="/like">
                            <FavoriteBorderIcon />
                        </Link>

                        <a href="/sell" onClick={onClickSell}>
                            <StorefrontIcon />
                        </a>
                    </div>
                </div>

                <Divider className={styles.hr} />
            </div>
        </header>
    );
}
