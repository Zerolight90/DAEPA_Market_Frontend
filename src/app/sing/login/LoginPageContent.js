"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/app/sing/login/login.module.css";
import api from "@/lib/api";
import naverLogo from "@/app/naver.png";
import kakaoLogo from "@/app/kakaologin.png";
import useAuthStore from "@/store/useAuthStore";
import tokenStore from "@/store/TokenStore";

export default function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [uid, setUid] = useState("");
    const [upw, setUpw] = useState("");
    const [rememberId, setRememberId] = useState(false);
    const [autoLogin, setAutoLogin] = useState(false);

    const { setAccessToken } = tokenStore();
    const { login: authLogin } = useAuthStore();
    const frontUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const handleNaverLogin = () => {
        const backendUrl = api.defaults.baseURL;
        const next = searchParams.get("next") || "/";
        const naverAuthUrl = `${backendUrl}/oauth2/authorization/naver?redirect_uri=${encodeURIComponent(
            frontUrl + "/oauth/success?next=" + next
        )}`;
        window.location.href = naverAuthUrl;
    };

    const handleKakaoLogin = () => {
        const backendUrl = api.defaults.baseURL;
        const next = searchParams.get("next") || "/";
        const kakaoAuthUrl = `${backendUrl}/oauth2/authorization/kakao?redirect_uri=${encodeURIComponent(
            frontUrl + "/oauth/success?next=" + next
        )}`;
        window.location.href = kakaoAuthUrl;
    };

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
            const response = await api.post("/sing/login", {
                u_id: uid,
                u_pw: upw,
            });

            console.log("Login API Response:", response.data);

            const { accessToken } = response.data;
            const userPayload =
                response.data.user ?? {
                    uName: response.data.u_name,
                    uNickname: response.data.u_nickname,
                    uId: response.data.u_id,
                    uType: response.data.u_type,
                };

            setAccessToken(accessToken);
            document.cookie =
                "ACCESS_TOKEN=" +
                accessToken +
                "; path=/; max-age=" +
                60 * 60 * 12 +
                "; SameSite=Lax";
            // 로그인 응답이 닉네임을 포함하지 않는 경우가 있어, 바로 /sing/me로 한 번 더 동기화해 닉네임을 확보
            try {
                const meRes = await api.get("/sing/me");
                if (meRes?.data) {
                    authLogin(meRes.data);
                } else {
                    authLogin(userPayload);
                }
            } catch {
                authLogin(userPayload);
            }

            const next = searchParams.get("next") || "/";
            router.replace(next);
            router.refresh();
        } catch (err) {
            console.error(err);
            const message =
                err.response?.data?.message || "로그인 중 오류가 발생했습니다.";
            alert(message);
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
                            placeholder="이메일을 입력해주세요"
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
                            placeholder="비밀번호를 입력해주세요"
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
                        개인 기기에서만 자동 로그인을 사용해주세요.
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
