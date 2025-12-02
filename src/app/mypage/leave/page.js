'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/mypage/sidebar';
import styles from './leave.module.css';
import api from "@/lib/api"; // 지역 axios 서비스 사용
import { getSafeLocalStorage, safeRemoveItem } from "@/lib/safeStorage";

const REASONS = [
    { id: 'low_usage', label: '사용 빈도가 낮음 / 개인정보 및 보안 우려' },
    { id: 'bad_users', label: '비매너 사용자들로 인한 불편 (사기 등)' },
    { id: 'ux_issues', label: 'UI/기능 불편 (상품등록/거래 등)' },
    { id: 'temporary', label: '이벤트/일회성 목적이라 잠시 사용' },
    { id: 'etc', label: '기타' },
];

export default function LeavePage() {
    const router = useRouter();

    const [checked, setChecked] = useState([]);
    const [etcText, setEtcText] = useState('');
    const [agree, setAgree] = useState(false);

    const toggle = (id) => {
        setChecked((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // 기타 선택 시 내용 채워야 제출 가능
    const canSubmit = useMemo(() => {
        const etcOk =
            !checked.includes('etc') ||
            (checked.includes('etc') && etcText.trim().length > 0);

        return agree && checked.length > 0 && etcOk;
    }, [agree, checked, etcText]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        const payload = {
            reasons: checked,
            ...(checked.includes('etc') && etcText.trim().length > 0
                ? { etc: etcText.trim() }
                : { etc: '' }),
        };

        try {
            const { data } = await api.post("/sing/bye", payload);

            let msg = '회원 탈퇴가 완료되었습니다.';
            if (data && (data.message || typeof data === 'string')) {
                msg = data.message || data;
            }
            alert(msg);

            // 1) 브라우저 토큰 제거
            if (typeof window !== 'undefined') {
                const ls = getSafeLocalStorage();
                safeRemoveItem(ls, 'accessToken');
                safeRemoveItem(ls, 'refreshToken');
            }

            // 2) 홈으로 이동
            router.replace('/');
            router.refresh?.();
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || err.message || '탈퇴 요청 처리 중 오류가 발생했습니다.';
            alert(errorMessage);
            if (err.response?.status === 401) {
                alert("로그인이 필요합니다");
                router.push("/login");
            }
        }
    };

    return (
        <div className={styles.wrapper}>
            {/* 사이드바 */}
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            {/* 본문 */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>회원 탈퇴</h1>
                </header>

                <section className={styles.titleBlock}>
                    <h2 className={styles.titleLine}>
                        탈퇴 이유를 알려주시면 개선하는 데에 힘쓰겠습니다
                    </h2>
                    <p className={styles.subtitle}>한 번 선택해 주세요</p>
                </section>

                    <form onSubmit={onSubmit} className={styles.formGrid}>
                    {/* 이유 체크 */}
                    <section className={styles.card}>
                        <div className={styles.reasonList}>
                            {REASONS.map((r) => (
                                <label key={r.id} className={styles.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={checked.includes(r.id)}
                                        onChange={() => toggle(r.id)}
                                    />
                                    <span>{r.label}</span>
                                </label>
                            ))}
                        </div>

                        {checked.includes('etc') && (
                            <div className={styles.etcBox}>
                                <label className={styles.label}>기타 이유 (최대 100자)</label>
                                <textarea
                                    value={etcText}
                                    onChange={(e) => setEtcText(e.target.value.slice(0, 100))}
                                    maxLength={100}
                                    rows={3}
                                    placeholder="기타 이유를 간단히 적어주세요"
                                    className={styles.textarea}
                                />
                                <div className={styles.counter}>{etcText.length}/100</div>
                            </div>
                        )}
                    </section>

                    {/* 유의사항 */}
                    <section className={styles.card}>
                        <h3 className={styles.cardTitle}>유의 사항을 확인해주세요!</h3>

                        <ol className={styles.noticeList}>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>01</span>
                                <span>
                  탈퇴 요청으로부터 <b>30일</b> 내 동일 이메일/전화번호로 재가입하시면 기록이 유지되며 규정 가입이 가능합니다.
                </span>
                            </li>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>02</span>
                                <span>
                  회원 탈퇴 시 본인 계정의 등록/작성한 게시물은 삭제되지 않으니 필요 시 직접 삭제 후 진행해주세요.
                </span>
                            </li>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>03</span>
                                <div className={styles.noticeBlock}>
                                    <div>
                                        전자상거래법에 따라 거래 기록은 보관되며 다른 목적으로 사용하지 않습니다.
                                    </div>
                                    <div className={styles.keepGrid}>
                                        <div className={styles.keepItem}>
                                            표시·광고에 관한 기록 <b>6개월</b>
                                        </div>
                                        <div className={styles.keepItem}>
                                            계약/청약철회·결제·재화공급 <b>5년</b>
                                        </div>
                                        <div className={styles.keepItem}>
                                            소비자 불만/분쟁 처리 기록 <b>3년</b>
                                        </div>
                                        <div className={styles.keepItem}>
                                            로그기록 <b>3개월</b>
                                        </div>
                                        <div className={`${styles.keepItem} ${styles.keepItemWide}`}>
                                            전자금융거래기록 <b>5년</b>
                                        </div>
                                    </div>
                                </div>
                            </li>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>04</span>
                                <span>
                  탈퇴 요청 후 <b>72시간(3일)</b> 내 동일 계정 로그인 시 탈퇴 요청이 자동 철회됩니다.
                </span>
                            </li>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>05</span>
                                <span>자동 결제권한이 해제되었는지 꼭 확인해주세요</span>
                            </li>
                        </ol>

                        <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                            />
                            <span>유의 사항을 모두 확인했습니다.</span>
                        </label>
                    </section>

                    {/* 버튼 */}
                    <div className={styles.btnRow}>
                        <Link href="/mypage" className={`${styles.btn} ${styles.btnGhost}`}>
                            돌아가기
                        </Link>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className={`${styles.btn} ${
                                canSubmit ? styles.btnPrimary : styles.btnDisabled
                            }`}
                        >
                            회원 탈퇴
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
