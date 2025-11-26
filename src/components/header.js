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

// 새로 만든 axios 인스턴스를 가져옵니다.
import api from "@/lib/api";
import styles from "./css/header.module.css";
import useAuthStore from "@/store/useAuthStore"; // useAuthStore 임포트

// 여러 형태로 올 수 있는 이름을 하나로 골라주는 함수
function getDisplayName(me) {
    if (!me) return null;

    return (
        // 1) 우리가 백에서 Map으로 내려준 경우
        me.uNickname ||
        // 2) 옛날 OauthController 처럼 스네이크로 내려준 경우
        me.u_nickname ||
        // 3) 이름으로만 내려준 경우
        me.uName ||
        me.u_name ||
        // 4) 아이디/이메일만 있는 경우
        me.uId ||
        me.u_id ||
        null
    );
}

export default function Header() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // const [me, setMe] = useState(null); // useAuthStore에서 관리
    const { isLoggedIn, logout } = useAuthStore(); // useAuthStore에서 로그인 상태와 로그아웃 액션 가져오기
    const [chatUnread, setChatUnread] = useState(0);
    const [searchKeyword, setSearchKeyword] = useState("");
    // const fetchingRef = useRef(false); // useAuthStore에서 관리하므로 필요 없음

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

    // 페이지 로드 시 또는 경로 변경 시 사용자 정보 가져오기
    // useAuthStore와 ConditionalLayout에서 로그인 상태를 관리하므로 이 useEffect는 필요 없음
    // useEffect(() => {
    //     if (fetchingRef.current) return;
    //     fetchingRef.current = true;

    //     const fetchUser = async () => {
    //         try {
    //             const res = await api.get("/users/me");
    //             if (res.status === 200) {
    //                 setMe(res.data);
    //             } else {
    //                 setMe(null);
    //             }
    //         } catch (e) {
    //             setMe(null);
    //         } finally {
    //             fetchingRef.current = false;
    //         }
    //     };

    //     fetchUser();
    // }, [router]);

    // 로그아웃
    const onLogout = async () => {
        if (!confirm("로그아웃 하시겠습니까?")) return;
        try {
            await api.post("/sing/logout");
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            logout(); // useAuthStore 상태 업데이트
            router.push("/");
            router.refresh();
        }
    };

    // 마이페이지
    const onClickMyPage = (e) => {
        e.preventDefault();
        if (!isLoggedIn) { // isLoggedIn 사용
            alert("로그인 후 이용할 수 있어요.");
            router.push(`/sing/login?next=${encodeURIComponent("/mypage")}`);
            return;
        }
        router.push("/mypage");
    };

    // 판매하기
    const onClickSell = (e) => {
        e.preventDefault();
        if (!isLoggedIn) { // isLoggedIn 사용
            alert("로그인 후 이용할 수 있어요.");
            router.push(`/sing/login?next=${encodeURIComponent("/sell")}`);
            return;
        }
        router.push("/sell");
    };

    // 🔒 채팅 접근 가드 (비로그인 차단)
    const onClickChat = (e) => {
        e.preventDefault();
        if (!isLoggedIn) { // isLoggedIn 사용
            alert("로그인 후 이용할 수 있어요.");
            router.push(`/sing/login?next=${encodeURIComponent("/chat")}`);
            return;
        }
        router.push("/chat");
    };

    // ✅ 여기서 최종 이름 결정 (me 상태가 없으므로 임시로 처리)
    // 실제 사용자 이름은 /user/me 엔드포인트에서 가져와야 합니다.
    // 현재는 isLoggedIn 상태만 사용하므로, 이름 표시는 로그인/로그아웃으로만 구분합니다.
    const displayName = isLoggedIn ? "사용자" : null; // 로그인 상태일 때만 "사용자" 표시

    return (
        <header className={styles.sticky}>
            <div className={styles.warp}>
                {/* 상단 작은 메뉴 */}
                <div className={styles.header}>
                    <p className={styles.top}>안전거래를 위한 대파의 약속</p>

                    <div className={styles.rmenu}>
                        {isLoggedIn ? ( // isLoggedIn 사용
                            <>
                <span>
                  {/* <b>{displayName}</b>님 환영합니다. */}
                  환영합니다.
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

                    <form
                        noValidate
                        autoComplete="off"
                        className={styles.search}
                        onSubmit={handleSearchSubmit}
                    >
                        <FormControl className={styles.searchControl}>
                            <OutlinedInput
                                placeholder="찾으시는 상품을 검색해주세요"
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

                        {/* 🔒 비로그인 차단 */}
                        <a href="/chat" onClick={onClickChat} className={styles.chatBadgeWrap}>
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
