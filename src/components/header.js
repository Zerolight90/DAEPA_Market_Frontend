'use client';

import Link from "next/link";
import { FormControl, OutlinedInput, InputAdornment, Divider } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Image from "next/image";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChatIcon from "@mui/icons-material/Chat";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import StorefrontIcon from "@mui/icons-material/Storefront";

import styles from "./css/header.module.css";

export default function Header() {
    function MyFormHelperText() { return null; }

    return (

        <header className={styles.sticky}>
            <div className={styles.warp}>

                {/* 상단 작은 메뉴 */}
                <div className={styles.header}>
                    <p className={styles.top}>안전거래를 위한 대파의 약속</p>

                    <div className={styles.rmenu}>
                        <Link href="/sing/login">로그인</Link>
                        <Link href="/sing/join/agree">회원가입</Link>
                        <Link href="/help">고객센터</Link>
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
                            <MyFormHelperText />
                        </FormControl>
                    </form>

                    <div className={styles.icon}>
                        <Link href="/mypage" aria-label="내 정보"><AccountCircleIcon /></Link>
                        <Link href="/chat" aria-label="채팅"><ChatIcon /></Link>
                        <Link href="/wishlist" aria-label="찜 목록"><FavoriteBorderIcon /></Link>
                        <Link href="/sell" aria-label="판매하기"><StorefrontIcon /></Link>
                    </div>
                </div>

                <Divider className={styles.hr} />
            </div>
        </header>
    );
}
