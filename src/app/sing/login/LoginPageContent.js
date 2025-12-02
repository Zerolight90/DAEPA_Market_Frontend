"use client";

import React, { useEffect, useState } from "react";
import styles from "./login.module.css";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { getSafeLocalStorage, safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/safeStorage";

export default function LoginPageContent() {
    const router = useRouter();

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
            const res = await api.post("/sing/login", { uid: id, upw: pw });
            if (res?.data?.message) alert(res.data.message);

            const ls = getSafeLocalStorage();
            if (rememberId) {
                safeSetItem(ls, "login_saved_id", id);
                safeSetItem(ls, "login_remember_id", "1");
            } else {
                safeRemoveItem(ls, "login_saved_id");
                safeSetItem(ls, "login_remember_id", "0");
            }
            safeSetItem(ls, "login_auto_login", autoLogin ? "1" : "0");

            router.push("/");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "로그인에 실패했습니다.";
            setError(msg);
        }
    };

    return (
        <div className={styles.wrap}>
            <form className={styles.form} onSubmit={submit}>
                <h1 className={styles.title}>로그인</h1>

                <label className={styles.label}>
                    아이디
                    <input
                        className={styles.input}
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        placeholder="아이디"
                    />
                </label>

                <label className={styles.label}>
                    비밀번호
                    <input
                        className={styles.input}
                        type="password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="비밀번호"
                    />
                </label>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.checkboxRow}>
                    <label>
                        <input
                            type="checkbox"
                            checked={rememberId}
                            onChange={(e) => setRememberId(e.target.checked)}
                        />
                        아이디 저장
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={autoLogin}
                            onChange={(e) => setAutoLogin(e.target.checked)}
                        />
                        자동 로그인
                    </label>
                </div>

                <button type="submit" className={styles.submit}>
                    로그인
                </button>
            </form>
        </div>
    );
}
