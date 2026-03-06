"use client";

import React, { useEffect, useState } from "react";
import styles from "./login.module.css";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { getSafeLocalStorage, safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/safeStorage";
import useAuthStore from "@/store/useAuthStore";
import tokenStore from "@/store/TokenStore";

export default function LoginPageContent() {
    const router = useRouter();
    const { login: setAuthUser } = useAuthStore();
    const { setAccessToken } = tokenStore.getState();

    const [id, setId] = useState("");
    const [pw, setPw] = useState("");
    const [error, setError] = useState("");
    const [rememberId, setRememberId] = useState(false);
    const [autoLogin, setAutoLogin] = useState(false);

    useEffect(() => {
        const ls = getSafeLocalStorage();
        const savedId = safeGetItem(ls, "login_saved_id", "") || "";
        const savedRemember = safeGetItem(ls, "login_remember_id", "0") === "1";
        const savedAuto = safeGetItem(ls, "login_auto_login", "0") === "1";
        setId(savedId);
        setRememberId(savedRemember);
        setAutoLogin(savedAuto);
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            // 1. 로그인 API 호출
            const res = await api.post("/sing/login", { u_id: id, u_pw: pw });
            if (res?.data?.message) alert(res.data.message);

            // 2. 토큰/유저 상태 저장
            const access = res?.data?.accessToken;
            setAccessToken?.(access || null);
            setAuthUser?.(res?.data || null);

            // 3. ✅ [최종 수정] 쿠키 저장 로직 (Domain 설정을 추가하여 api 서버와 토큰 공유)
            if (access && typeof document !== "undefined") {
                // Domain=daepamarket.shop을 추가해야 api.daepamarket.shop 서버가 이 쿠키를 읽을 수 있습니다.
                document.cookie = `ACCESS_TOKEN=${access}; Path=/; Domain=daepamarket.shop; SameSite=Lax`;
                console.log("토큰 쿠키 저장 완료 (Domain 설정 포함)");
            }

            // 4. 로컬 스토리지 관리
            const ls = getSafeLocalStorage();
            if (rememberId) {
                safeSetItem(ls, "login_saved_id", id);
                safeSetItem(ls, "login_remember_id", "1");
            } else {
                safeRemoveItem(ls, "login_saved_id");
                safeSetItem(ls, "login_remember_id", "0");
            }
            safeSetItem(ls, "login_auto_login", autoLogin ? "1" : "0");

            // 5. 메인 화면으로 이동
            router.push("/");
            
        } catch (err) {
            console.error("로그인 에러 상세:", err);
            const msg = err.response?.data?.message || err.message || "로그인에 실패했습니다.";
            setError(msg);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <form onSubmit={submit}>
                    <h1 className={styles.title}>로그인</h1>

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
                            onClick={() => (window.location.href = "/api/oauth2/authorization/kakao")}
                        >
                            카카오로 로그인
                        </button>
                        <button
                            type="button"
                            className={`${styles.snsBtn} ${styles.naver}`}
                            onClick={() => (window.location.href = "/api/oauth2/authorization/naver")}
                        >
                            네이버로 로그인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}