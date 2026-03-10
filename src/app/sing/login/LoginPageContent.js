"use client";

import React, { useEffect, useState } from "react";
import styles from "./login.module.css";
import api from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeLocalStorage, safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/safeStorage";
import useAuthStore from "@/store/useAuthStore";
import tokenStore from "@/store/TokenStore";

export default function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login: setAuthUser } = useAuthStore();
    const { setAccessToken } = tokenStore.getState();

    const [id, setId] = useState("");
    const [pw, setPw] = useState("");
    const [error, setError] = useState("");
    const [rememberId, setRememberId] = useState(false);
    const [autoLogin, setAutoLogin] = useState(false);

    // ✅ 세션 만료로 리다이렉트된 경우 안내 메시지 표시
    const [sessionMsg, setSessionMsg] = useState("");

    useEffect(() => {
        const ls = getSafeLocalStorage();
        const savedId = safeGetItem(ls, "login_saved_id", "") || "";
        const savedRemember = safeGetItem(ls, "login_remember_id", "0") === "1";
        const savedAuto = safeGetItem(ls, "login_auto_login", "0") === "1";
        setId(savedId);
        setRememberId(savedRemember);
        setAutoLogin(savedAuto);

        // ✅ ?reason=session_expired 파라미터 감지
        const reason = searchParams?.get("reason");
        if (reason === "session_expired") {
            setSessionMsg("세션이 만료되었습니다. 다시 로그인해 주세요.");
        }
    }, [searchParams]);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setSessionMsg("");
        try {
            const res = await api.post("/sing/login", { u_id: id, u_pw: pw, autoLogin: autoLogin });

            // 2. 토큰/유저 상태 저장
            const access = res?.data?.accessToken;
            setAccessToken?.(access || null);
            setAuthUser?.(res?.data || null);

            // 3. 로컬 스토리지 관리
            const ls = getSafeLocalStorage();
            if (rememberId) {
                safeSetItem(ls, "login_saved_id", id);
                safeSetItem(ls, "login_remember_id", "1");
            } else {
                safeRemoveItem(ls, "login_saved_id");
                safeSetItem(ls, "login_remember_id", "0");
            }
            safeSetItem(ls, "login_auto_login", autoLogin ? "1" : "0");

            // 4. ✅ next 파라미터가 있으면 원래 페이지로, 없으면 메인으로
            const next = searchParams?.get("next") || "/";
            router.replace(next);

        } catch (err) {
            console.error("로그인 에러 상세:", err);
            const status = err.response?.status;
            let msg;
            if (status === 401) {
                msg = "아이디 또는 비밀번호가 올바르지 않습니다.";
            } else if (status === 403) {
                msg = "탈퇴한 회원입니다.";
            } else {
                msg = err.response?.data?.message || err.message || "로그인에 실패했습니다.";
            }
            setError(msg);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <form onSubmit={submit}>
                    <h1 className={styles.title}>로그인</h1>

                    {/* ✅ 세션 만료 안내 배너 */}
                    {sessionMsg && (
                        <div style={{
                            background: "#fff3cd",
                            border: "1px solid #ffc107",
                            borderRadius: "8px",
                            padding: "10px 14px",
                            marginBottom: "16px",
                            fontSize: "13px",
                            color: "#856404",
                        }}>
                            ⚠️ {sessionMsg}
                        </div>
                    )}

                    <div className={styles.row}>
                        <label className={styles.label}>아이디</label>
                        <input
                            className={styles.input}
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            placeholder="아이디를 입력하세요"
                        />
                    </div>

                    <div className={styles.row}>
                        <label className={styles.label}>비밀번호</label>
                        <input
                            className={styles.input}
                            type="password"
                            value={pw}
                            onChange={(e) => setPw(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.options}>
                        <label className={styles.checkItem}>
                            <input
                                type="checkbox"
                                checked={rememberId}
                                onChange={(e) => setRememberId(e.target.checked)}
                            />
                            아이디 저장
                        </label>
                        <label className={styles.checkItem}>
                            <input
                                type="checkbox"
                                checked={autoLogin}
                                onChange={(e) => setAutoLogin(e.target.checked)}
                            />
                            자동 로그인
                        </label>
                    </div>

                    <div className={styles.actions} style={{ textAlign: "center" }}>
                        <button type="submit" className={styles.submitBtn}>
                            로그인
                        </button>
                    </div>

                    <div className={styles.links}>
                        <a className={styles.link} href="/sing/login/find_id">아이디 찾기</a>
                        <span className={styles.divider}>|</span>
                        <a className={styles.link} href="/sing/login/find_password">비밀번호 찾기</a>
                        <span className={styles.divider}>|</span>
                        <a className={styles.link} href="/sing/join/agree">회원가입</a>
                    </div>

                    <div className={styles.snsWrap}>
                        <button
                            type="button"
                            className={`${styles.snsBtn} ${styles.kakao}`}
                            onClick={() => {
                                // ✅ 쿠키 도메인 추가 & 백엔드(api.) 직접 호출
                                document.cookie = `oauth_auto_login=${autoLogin}; path=/; domain=.daepazone.shop; max-age=60`;
                                window.location.href = `https://api.daepazone.shop/oauth2/authorization/kakao`;
                            }}
                        >
                            카카오로 로그인
                        </button>
                        <button
                            type="button"
                            className={`${styles.snsBtn} ${styles.naver}`}
                            onClick={() => {
                                // ✅ 쿠키 도메인 추가 & 백엔드(api.) 직접 호출
                                document.cookie = `oauth_auto_login=${autoLogin}; path=/; domain=.daepazone.shop; max-age=60`;
                                window.location.href = `https://api.daepazone.shop/oauth2/authorization/naver`;
                            }}
                        >
                            네이버로 로그인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}