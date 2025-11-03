"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./account.module.css";
import Sidebar from "@/components/mypage/sidebar";
import tokenStore from "@/app/store/TokenStore";

const BANKS = [
    "국민은행","신한은행","우리은행","하나은행","카카오뱅크","토스뱅크",
    "농협은행","기업은행","SC제일은행","경남은행","부산은행","대구은행",
    "광주은행","전북은행","수협은행","우체국",
];

export default function AccountPage() {
    const { accessToken } = tokenStore();

    const [accounts, setAccounts] = useState([]);   // 서버 저장 계좌 목록(데모)
    const [openForm, setOpenForm] = useState(false);

    // 내 정보(예금주)
    const [myName, setMyName] = useState("");

    // 폼 상태
    const [bank, setBank] = useState("");
    const [acct, setAcct] = useState("");
    const [primary, setPrimary] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const atk = accessToken || localStorage.getItem("accessToken");
                const res = await fetch("/api/sing/me", {
                    headers: atk ? { Authorization: `Bearer ${atk}` } : {},
                    credentials: "include",
                    cache: "no-store",
                });
                if (res.ok) {
                    const me = await res.json();
                    setMyName(me.uName || "");
                }
            } catch {}
        })();
    }, [accessToken]);

    const canSubmit = useMemo(() => {
        const cleaned = acct.replaceAll("-", "").trim();
        return myName && bank && /^[0-9]{6,20}$/.test(cleaned);
    }, [myName, bank, acct]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        // TODO: 실제 API로 교체
        const payload = {
            holder: myName,
            bank,
            accountNumber: acct.replaceAll("-", ""),
            primary,
        };
        setAccounts(prev => [
            { id: Date.now(), ...payload },
            ...prev.map(a => (primary ? { ...a, primary: false } : a)),
        ]);
        setOpenForm(false);
        setBank(""); setAcct(""); setPrimary(true);
    };

    return (
        <div className={styles.wrapper}>
            {/* 좌측: 공통 사이드바 */}
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            {/* 우측: 콘텐츠 */}
            <main className={styles.main}>
                {!openForm && accounts.length === 0 ? (
                    <>
                        <header className={styles.topBar}>
                            <h1 className={styles.title}>계좌 관리</h1>
                        </header>

                        {/* 빈 상태 – 버튼을 위로 끌어올리기 위해 높이와 여백을 확 줄였음 */}
                        <section className={styles.emptyBox}>
                            <div className={styles.emptyIcon} aria-hidden />
                            <p className={styles.emptyTitle}>등록된 계좌가 없습니다.</p>
                            <p className={styles.emptySub}>
                                판매금 및 환불금을 빠르게 정산받으시려면 계좌를 등록해 주세요.
                            </p>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={() => setOpenForm(true)}
                            >
                                + 계좌 등록하기
                            </button>
                        </section>
                    </>
                ) : (
                    <>
                        <header className={styles.topBar}>
                            <button
                                className={styles.backBtn}
                                onClick={() => setOpenForm(false)}
                                aria-label="뒤로가기"
                            >
                                ←
                            </button>
                            <h1 className={styles.title}>계좌 신규 등록</h1>
                            <span />
                        </header>

                        <form className={styles.form} onSubmit={onSubmit}>
                            <label className={styles.label}>예금주</label>
                            <input className={`${styles.input} ${styles.readonly}`} value={myName} readOnly />

                            <label className={styles.label}>은행명</label>
                            <div className={styles.selectWrap}>
                                <select
                                    className={styles.select}
                                    value={bank}
                                    onChange={(e) => setBank(e.target.value)}
                                >
                                    <option value="">은행명</option>
                                    {BANKS.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <span className={styles.chev} aria-hidden>▾</span>
                            </div>

                            <label className={styles.label}>계좌번호</label>
                            <input
                                className={styles.input}
                                placeholder="계좌번호 (-없이 숫자만 입력)"
                                inputMode="numeric"
                                value={acct}
                                onChange={(e) => setAcct(e.target.value.replace(/[^0-9-]/g, ""))}
                            />

                            <label className={styles.checkRow}>
                                <input
                                    type="checkbox"
                                    checked={primary}
                                    onChange={(e) => setPrimary(e.target.checked)}
                                />
                                <span>대표계좌로 설정</span>
                            </label>

                            <p className={styles.notice}>
                                안전한 중고거래를 위해 <b>본인 인증된 명의의 계좌</b>만 사용하실 수 있습니다.
                            </p>

                            <div className={styles.footer}>
                                <button
                                    type="submit"
                                    className={`${styles.footerBtn} ${canSubmit ? styles.footerBtnActive : ""}`}
                                    disabled={!canSubmit}
                                >
                                    완료
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}
