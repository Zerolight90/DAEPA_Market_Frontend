"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/sing/login/login.module.css";
import tokenStore from "@/app/store/TokenStore";
import naverLogo from "@/app/naver.png";
import kakaoLogo from "@/app/kakaologin.png"; // ✅ 추가

export default function Page() {
    const router = useRouter();
    const [uid, setUid] = useState("");
    const [upw, setUpw] = useState("");
    const [rememberId, setRememberId] = useState(false);
    const [autoLogin, setAutoLogin] = useState(false);

    const { setToken } = tokenStore();

    // ✅ 백엔드 주소
    const BACKEND_URL = "http://52.79.241.142:8080";

    // ✅ 네이버 로그인 버튼
    const handleNaverLogin = () => {
        window.location.href = `${BACKEND_URL}/oauth2/authorization/naver`;
    };

    // ✅ 카카오 로그인 버튼
    const handleKakaoLogin = () => {
        window.location.href = `${BACKEND_URL}/oauth2/authorization/kakao`;
    };

    // ✅ 저장된 로그인 옵션 불러오기
    useEffect(() => {
        try {
            const savedId = localStorage.getItem("login_saved_id") || "";
            const savedRemember = localStorage.getItem("login_remember_id") === "1";
            const savedAuto = localStorage.getItem("login_auto_login") === "1";

            if (savedRemember && savedId) setUid(savedId);
            setRememberId(savedRemember);
            setAutoLogin(savedAuto);
        } catch (_) {}
    }, []);

    // ✅ 일반 로그인
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (rememberId && uid) {
                localStorage.setItem("login_saved_id", uid);
                localStorage.setItem("login_remember_id", "1");
            } else {
                localStorage.removeItem("login_saved_id");
                localStorage.setItem("login_remember_id", "0");
            }
            localStorage.setItem("login_auto_login", autoLogin ? "1" : "0");
        } catch {}

        try {
            const res = await fetch("/api/sing/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ u_id: uid, u_pw: upw }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.message || '로그인 실패');
                return;
            }

            const data = await res.json();

            if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken);
                setToken(data.accessToken);
            }

            // alert("로그인 성공");
            router.push("/");
        } catch (err) {
            console.error(err);
            alert("로그인 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>로그인</h1>

                <form onSubmit={handleSubmit}>
                    <div className={styles.row}>
                        <label htmlFor="u_id" className={styles.label}>
                            아이디
                        </label>
                        <input
                            id="u_id"
                            name="u_id"
                            type="text"
                            placeholder="이메일을 입력하세요"
                            required
                            className={styles.input}
                            autoComplete="username"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                        />
                    </div>

                    <div className={styles.row}>
                        <label htmlFor="u_pw" className={styles.label}>
                            비밀번호
                        </label>
                        <input
                            id="u_pw"
                            name="u_pw"
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            required
                            className={styles.input}
                            autoComplete="current-password"
                            value={upw}
                            onChange={(e) => setUpw(e.target.value)}
                        />
                    </div>

                    <div className={styles.options}>
                        <label className={styles.checkItem}>
                            <input
                                type="checkbox"
                                checked={rememberId}
                                onChange={(e) => setRememberId(e.target.checked)}
                            />
                            <span>아이디 저장</span>
                        </label>

                        <label className={styles.checkItem}>
                            <input
                                type="checkbox"
                                checked={autoLogin}
                                onChange={(e) => setAutoLogin(e.target.checked)}
                            />
                            <span>자동 로그인</span>
                        </label>
                    </div>

                    <p className={styles.optionNote}>
                        개인기기에서만 자동 로그인을 사용하세요.
                    </p>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitBtn}>
                            로그인
                        </button>
                    </div>
                </form>

                <div className={styles.links}>
                    <Link href="/sing/login/find_id" className={styles.link}>
                        아이디 찾기
                    </Link>
                    <span className={styles.divider}>|</span>
                    <Link href="/sing/login/find_password" className={styles.link}>
                        비밀번호 찾기
                    </Link>
                </div>

                {/* ✅ SNS 로그인 버튼들 */}
                <div className={styles.snsWrap}>
                    <button
                        type="button"
                        className={`${styles.snsBtn} ${styles.naver}`}
                        onClick={handleNaverLogin}
                    >
                        <Image
                            src={naverLogo}
                            alt="네이버 로그인"
                            width={380}
                            height={48}
                            priority
                        />
                    </button>

                    <button
                        type="button"
                        className={`${styles.snsBtn} ${styles.kakao}`}
                        onClick={handleKakaoLogin}
                    >
                        <Image
                            src={kakaoLogo}
                            alt="카카오 로그인"
                            width={380}
                            height={48}
                            priority
                        />
                    </button>
                </div>

            </div>
        </div>
    );
}
