"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; // useSearchParams 추가
import styles from "@/app/sing/login/login.module.css";
// import tokenStore from "@/app/store/TokenStore"; // 더 이상 필요 없음
import api from "@/lib/api"; // axios 인스턴스 가져오기
import naverLogo from "@/app/naver.png";
import kakaoLogo from "@/app/kakaologin.png";
// import { getApiBaseUrl } from "@/lib/api/client"; // 더 이상 필요 없음
import useAuthStore from "@/store/useAuthStore"; // useAuthStore 임포트
import tokenStore from "@/store/TokenStore"; // tokenStore 임포트

export default function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams(); // next 파라미터 읽기 위해 추가
    const [uid, setUid] = useState("");
    const [upw, setUpw] = useState("");
    const [rememberId, setRememberId] = useState(false);
    const [autoLogin, setAutoLogin] = useState(false);

    const { setAccessToken } = tokenStore(); // tokenStore에서 setAccessToken 가져오기
    const { login: authLogin } = useAuthStore(); // useAuthStore에서 login 액션 가져오기

    // 프론트엔드 앱의 기본 URL (OAuth 리다이렉트 URI 구성에 사용)
    const frontUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    // ✅ 네이버 로그인 버튼
    const handleNaverLogin = () => {
        const backendUrl = api.defaults.baseURL; // axios 인스턴스의 baseURL 사용
        const next = searchParams.get("next") || "/"; // 리다이렉트할 경로
        const naverAuthUrl = `${backendUrl}/oauth2/authorization/naver?redirect_uri=${encodeURIComponent(frontUrl + "/oauth/success?next=" + next)}`;
        window.location.href = naverAuthUrl;
    };

    // ✅ 카카오 로그인 버튼
    const handleKakaoLogin = () => {
        const backendUrl = api.defaults.baseURL; // axios 인스턴스의 baseURL 사용
        const next = searchParams.get("next") || "/"; // 리다이렉트할 경로
        const kakaoAuthUrl = `${backendUrl}/oauth2/authorization/kakao?redirect_uri=${encodeURIComponent(frontUrl + "/oauth/success?next=" + next)}`;
        window.location.href = kakaoAuthUrl;
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
            // axios 인스턴스로 로그인 요청
            const response = await api.post("/sing/login", {
                u_id: uid,
                u_pw: upw,
            });

            console.log("Login API Response:", response.data); // ✅ 로그인 응답 로깅

            // 백엔드에서 로그인 성공 시 HttpOnly 쿠키를 설정해주므로,
            // 프론트에서는 별도로 토큰을 저장할 필요가 없습니다.
            // 하지만 Authorization 헤더를 위해 accessToken을 저장합니다.
            const { accessToken, user } = response.data; // accessToken과 user 정보 추출

            setAccessToken(accessToken); // tokenStore에 accessToken 저장
            authLogin(user); // useAuthStore에 로그인 상태와 사용자 정보 업데이트

            // alert("로그인 성공");
            const next = searchParams.get("next") || "/"; // 리다이렉트할 경로가 있으면 그곳으로, 없으면 홈으로
            router.replace(next); // 이전 히스토리를 남기지 않고 이동
            router.refresh(); // 페이지를 새로고침하여 헤더 등 상태를 업데이트
        } catch (err) {
            console.error(err);
            // axios는 에러 발생 시 response 객체를 error.response에 담아줍니다.
            const message = err.response?.data?.message || "로그인 중 오류가 발생했습니다.";
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
