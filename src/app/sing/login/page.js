"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/app/sing/login/login.module.css";

export default function Page() {
    const [uid, setUid] = useState("");
    const [upw, setUpw] = useState("");
    const [rememberId, setRememberId] = useState(false);
    const [autoLogin, setAutoLogin] = useState(false);

    // 초기 로드 시 저장된 ID / 옵션 불러오기
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

    const handleSubmit = (e) => {
        // 로컬 스토리지에 옵션 저장 후 실제 submit 진행
        try {
            if (rememberId && uid) {
                localStorage.setItem("login_saved_id", uid);
                localStorage.setItem("login_remember_id", "1");
            } else {
                localStorage.removeItem("login_saved_id");
                localStorage.setItem("login_remember_id", "0");
            }
            localStorage.setItem("login_auto_login", autoLogin ? "1" : "0");
        } catch (_) {}

        // 실제 제출
        // 주의: Next.js App Router에서는 기본 submit 동작을 그대로 사용해도 됩니다.
        // onSubmit에서 preventDefault를 하지 않으면 자동으로 action으로 POST됩니다.
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>로그인</h1>

                <form method="post" action="/" onSubmit={handleSubmit}>
                    {/* 아이디 */}
                    <div className={styles.row}>
                        <label htmlFor="u_id" className={styles.label}>아이디</label>
                        <input
                            id="u_id"
                            name="u_id"
                            type="text"
                            placeholder="영문/숫자 4~16자"
                            required
                            minLength={4}
                            maxLength={16}
                            pattern={String.raw`^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$`}
                            className={styles.input}
                            autoComplete="username"
                            value={uid}
                            onChange={(e) => setUid(e.target.value)}
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div className={styles.row}>
                        <label htmlFor="u_pw" className={styles.label}>비밀번호</label>
                        <input
                            id="u_pw"
                            name="u_pw"
                            type="password"
                            placeholder="영문/숫자/특수문자 8~20자"
                            required
                            minLength={8}
                            maxLength={20}
                            className={styles.input}
                            autoComplete="current-password"
                            value={upw}
                            onChange={(e) => setUpw(e.target.value)}
                        />
                    </div>

                    {/* 옵션: 아이디 저장 / 자동 로그인 */}
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

                    {/* 액션 */}
                    <div className={styles.actions}>
                        <button type="submit" className={styles.submitBtn}>로그인</button>
                    </div>
                </form>

                {/* 아이디/비밀번호 찾기 */}
                <div className={styles.links}>
                    <Link href="/sing/find_id" className={styles.link}>아이디 찾기</Link>
                    <span className={styles.divider}>|</span>
                    <Link href="/sing/find-password" className={styles.link}>비밀번호 찾기</Link>
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
