"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/app/sing/login/login.module.css";
import { useRouter } from "next/navigation";
import tokenStore from "@/app/store/TokenStore";

export default function Page() {
    const router = useRouter();
    const [uid, setUid] = useState("");
    const [upw, setUpw] = useState("");
    const [rememberId, setRememberId] = useState(false);
    const [autoLogin, setAutoLogin] = useState(false);

    const { setToken, clearToken} = tokenStore();


    // localStorage에서 저장된 로그인 옵션 불러오기
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

    // 로그인 폼 제출 시 실행
    const handleSubmit = async (e) => {
        e.preventDefault(); // 기본 새로고침 동작 방지

        // localStorage에 옵션 저장
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

        // 로그인
        try {
            const res = await fetch("/api/sing/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // 쿠키 수신
                body: JSON.stringify({ u_id: uid, u_pw: upw }),
            });

            // 실패 처리
            if (!res.ok) {
                let msg = ("로그인 실패");
                alert(msg);
                return;
            }

            //로그인 성공시
            const data = await res.json();

            // accessToken이 있다면 저장
            if (data.accessToken) {
                localStorage.setItem("accessToken", data.accessToken); // 새로고침 후에도 유지
                setToken(data.accessToken); // zustand에도 저장 (현재 세션 상태)
            }
            else {
                console.warn("서버가 accessToken을 안 내려줌. 응답 구조 확인 필요", data);
            }

            // 성공 시 페이지 이동
            alert("로그인 성공")
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

                {/* action/method 제거, fetch로만 처리 */}
                <form onSubmit={handleSubmit}>
                    {/* 아이디 입력 */}
                    <div className={styles.row}>
                        <label htmlFor="u_id" className={styles.label}>아이디</label>
                        <input
                            id="u_id"
                            name="u_id"
                            type="text"
                            placeholder="이메일을 입력하세요"
                            required
                            pattern={String.raw`^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$`}
                            className={styles.input}
                            autoComplete="username"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                        />
                    </div>

                    {/* 비밀번호 입력 */}
                    <div className={styles.row}>
                        <label htmlFor="u_pw" className={styles.label}>비밀번호</label>
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

                    {/* 아이디 저장 / 자동 로그인 옵션 */}
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

                    {/* 로그인 버튼 */}
                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitBtn}>로그인</button>
                    </div>
                </form>

                {/* 아이디 / 비밀번호 찾기 */}
                <div className={styles.links}>
                    <Link href="/sing/login/find_id" className={styles.link}>아이디 찾기</Link>
                    <span className={styles.divider}>|</span>
                    <Link href="/sing/login/find_password" className={styles.link}>비밀번호 찾기</Link>
                </div>

                {/* SNS 로그인 */}
                <div className={styles.snsWrap}>
                    <button
                        className={`${styles.snsBtn} ${styles.kakao}`}
                        onClick={() => (window.location.href = "/api/auth/kakao")}
                        aria-label="카카오로 로그인"
                        type="button"
                    >
                        카카오로 로그인
                    </button>
                    <button
                        className={`${styles.snsBtn} ${styles.naver}`}
                        onClick={() => (window.location.href = "/api/auth/naver")}
                        aria-label="네이버로 로그인"
                        type="button"
                    >
                        네이버로 로그인
                    </button>
                </div>
            </div>
        </div>
    );
}
