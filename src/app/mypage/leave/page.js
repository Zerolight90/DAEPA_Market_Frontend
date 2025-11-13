'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/mypage/sidebar';
import styles from './leave.module.css';
import TokeStore from "@/app/store/TokenStore";
import { api } from "@/lib/api/client";

const REASONS = [
    { id: 'low_usage', label: '사용 빈도가 낮고 개인정보 및 보안 우려' },
    { id: 'bad_users', label: '비매너 사용자들로 인한 불편 (사기 등)' },
    { id: 'ux_issues', label: '서비스 기능 불편 (상품등록/거래 등)' },
    { id: 'temporary', label: '이벤트 등의 목적으로 한시 사용' },
    { id: 'etc', label: '기타' },
];

export default function LeavePage() {
    const router = useRouter();
    const { clearToken } = TokeStore(); // ✅ zustand에서 clearToken 가져옴

    const [checked, setChecked] = useState([]);
    const [etcText, setEtcText] = useState('');
    const [agree, setAgree] = useState(false);

    const toggle = (id) => {
        setChecked((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // 기타 선택했으면 내용 채워야 제출 가능
    const canSubmit = useMemo(() => {
        const etcOk =
            !checked.includes('etc') ||
            (checked.includes('etc') && etcText.trim().length > 0);

        return agree && checked.length > 0 && etcOk;
    }, [agree, checked, etcText]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        const atk =
            typeof window !== 'undefined'
                ? localStorage.getItem('accessToken')
                : null;

        const payload = {
            reasons: checked,
            ...(checked.includes('etc') && etcText.trim().length > 0
                ? { etc: etcText.trim() }
                : { etc: '' }),
        };

        try {
            const data = await api("/sing/bye", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(atk ? { Authorization: `Bearer ${atk}` } : {}),
                },
                // 🔥 쿠키 삭제(Set-Cookie) 받으려면 필수
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            let msg = '회원 탈퇴가 완료되었습니다.';
            if (data && (data.message || typeof data === 'string')) {
                msg = data.message || data;
            }
            alert(msg);

            // 1) 브라우저 저장 토큰 제거
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }

            // 2) zustand 상태도 제거 → 헤더가 바로 로그인해제 UI로
            clearToken();

            // 3) 홈으로 보내고 새로 렌더
            router.replace('/');
            router.refresh?.();
        } catch (err) {
            console.error(err);
            const errorMessage = err.data?.message || err.message || '탈퇴 요청 중 오류가 발생했습니다.';
            alert(errorMessage);
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
                    {/*<Link href="/mypage" className={styles.backLink} aria-label="뒤로가기">*/}
                    {/*    ←*/}
                    {/*</Link>*/}
                    <h1 className={styles.pageTitle}>회원 탈퇴</h1>
                </header>

                <section className={styles.titleBlock}>
                    <h2 className={styles.titleLine}>
                        탈퇴사유를 알려주시면 개선을 위해 노력하겠습니다.
                    </h2>
                    <p className={styles.subtitle}>다중 선택이 가능해요.</p>
                </section>

                <form onSubmit={onSubmit} className={styles.formGrid}>
                    {/* 사유 체크 */}
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
                                <label className={styles.label}>기타 사유 (최대 100자)</label>
                                <textarea
                                    value={etcText}
                                    onChange={(e) => setEtcText(e.target.value.slice(0, 100))}
                                    maxLength={100}
                                    rows={3}
                                    placeholder="기타 사유를 간단히 입력하세요"
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
                  탈퇴 신청일로부터 <b>30일</b> 이내 동일 아이디와 휴대폰 번호로 재가입
                  불가하며 신규 가입 혜택은 적용되지 않습니다.
                </span>
                            </li>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>02</span>
                                <span>
                  회원 탈퇴 시 본인 계정에 등록/작성한 게시물은 삭제됩니다. 단,
                  스크랩/공용 게시물 등은 직접 삭제한 후 진행해 주세요.
                </span>
                            </li>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>03</span>
                                <div className={styles.noticeBlock}>
                                    <div>
                                        전자상거래법에 따라 아래 기록을 보관하며 다른 목적으로 이용하지 않습니다.
                                    </div>
                                    <div className={styles.keepGrid}>
                                        <div className={styles.keepItem}>
                                            표시·광고에 대한 기록 <b>6개월</b>
                                        </div>
                                        <div className={styles.keepItem}>
                                            계약/청약철회·대금결제·재화공급 <b>5년</b>
                                        </div>
                                        <div className={styles.keepItem}>
                                            소비자 불만/분쟁 처리 기록 <b>3년</b>
                                        </div>
                                        <div className={styles.keepItem}>
                                            로그인 기록 <b>3개월</b>
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
                  탈퇴 신청 후 <b>72시간(3일)</b> 이내 동일 계정 로그인 시 탈퇴 신청이 자동
                  철회됩니다.
                </span>
                            </li>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>05</span>
                                <span>연동 서비스 권한이 해제될 수 있으며, 등급/권한 변경에 유의해 주세요.</span>
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
