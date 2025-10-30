'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../mypage.module.css';

// 사이드바 섹션
const SIDE_SECTIONS = [
    {
        title: '거래 정보',
        items: [
            { href: '/mypage/sell', label: '판매내역' },
            { href: '/mypage/buy', label: '구매내역' },
            { href: '/mypage/shipping', label: '택배' },
            { href: '/mypage/like', label: '찜한 상품' },
            { href: '/mypage/matching', label: '관심 상품 매칭' },
            { href: '/mypage/safe-settle', label: '안심결제 정산내역' },
        ],
    },
    {
        title: '내 정보',
        items: [
            { href: '/mypage/account', label: '계좌 관리' },
            { href: '/mypage/address', label: '배송지 관리' },
            { href: '/mypage/review', label: '거래 후기' },
            { href: '/mypage/leave', label: '탈퇴하기' }, // 현재 페이지
        ],
    },
];

// 탈퇴 사유
const REASONS = [
    { id: 'low_usage', label: '사용 빈도가 낮고 개인정보 및 보안 우려' },
    { id: 'bad_users', label: '비매너 사용자들로 인한 불편 (사기 등)' },
    { id: 'ux_issues', label: '서비스 기능 불편 (상품등록/거래 등)' },
    { id: 'temporary', label: '이벤트 등의 목적으로 한시 사용' },
    { id: 'etc', label: '기타' },
];

export default function LeavePage() {
    const pathname = usePathname();

    const [checked, setChecked] = useState([]);
    const [detail, setDetail] = useState('');
    const [etcText, setEtcText] = useState('');
    const [agree, setAgree] = useState(false);

    const MAX = 200;
    const count = detail.length;

    const toggle = (id) => {
        setChecked((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const canSubmit = useMemo(() => {
        const etcOk =
            !checked.includes('etc') ||
            (checked.includes('etc') && etcText.trim().length > 0);
        return agree && checked.length > 0 && count <= MAX && etcOk;
    }, [agree, checked, count, etcText]);

    const onSubmit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        const payload = {
            reasons: checked,
            etc: checked.includes('etc') ? etcText.trim() : null,
            detail: detail.trim(),
            agreed: agree,
        };

        // TODO: 실제 API 연결
        console.log('withdraw payload', payload);
        alert('탈퇴 신청이 접수되었습니다. (데모)');
    };

    return (
        <div className={styles.wrapper}>
            {/* 좌: 사이드바 */}
            <aside className={styles.sidebar}>
                <nav className={styles.sideNav}>
                    <div className={styles.sideHeader}>마이페이지</div>

                    {SIDE_SECTIONS.map((sec) => (
                        <div key={sec.title} className={styles.sideSection}>
                            <div className={styles.sideTitle}>{sec.title}</div>
                            <ul className={styles.sideList}>
                                {sec.items.map((it) => {
                                    const active = pathname === it.href;
                                    return (
                                        <li key={it.href}>
                                            <Link
                                                href={it.href}
                                                className={`${styles.sideLink} ${active ? styles.active : ''}`}
                                            >
                                                {it.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* 우: 본문 */}
            <main className={styles.main}>
                <header className={styles.header}>
                    <Link href="/mypage" className={styles.backLink}>←</Link>
                    <h1 className={styles.pageTitle}>회원 탈퇴</h1>
                </header>

                <section className={styles.titleBlock}>
                    <h2 className={styles.titleLine}>탈퇴사유를 알려주시면 개선을 위해 노력하겠습니다.</h2>
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
                                <label className={styles.label}>기타 사유</label>
                                <input
                                    type="text"
                                    value={etcText}
                                    onChange={(e) => setEtcText(e.target.value)}
                                    maxLength={100}
                                    placeholder="기타 사유를 간단히 입력하세요"
                                    className={styles.input}
                                />
                            </div>
                        )}
                    </section>

                    {/* 상세 사유 */}
                    <section className={styles.card}>
                        <div className={styles.cardTitleRow}>
                            <h3 className={styles.cardTitle}>상세 사유를 작성해 주세요.</h3>
                            <span className={`${styles.counter} ${count > MAX ? styles.counterOver : ''}`}>
                {count}/{MAX}
              </span>
                        </div>
                        <textarea
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            rows={6}
                            maxLength={MAX}
                            placeholder="예 : 타 서비스 이용"
                            className={styles.textarea}

                        />
                    </section>

                    {/* 유의사항 */}
                    <section className={styles.card}>
                        <h3 className={styles.cardTitle}>유의 사항을 확인해주세요!</h3>

                        <ol className={styles.noticeList}>
                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>01</span>
                                <span>
                  탈퇴 신청일로부터 <b>30일</b> 이내 동일 아이디·휴대폰 번호로 재가입 불가 (신규 혜택 미적용)
                </span>
                            </li>

                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>02</span>
                                <span>
                  회원 탈퇴 시 본인 계정에 등록/작성한 게시물은 삭제됩니다. 단, 스크랩/공용 게시판 게시물은 직접 삭제 후 진행하세요.
                </span>
                            </li>

                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>03</span>
                                <div className={styles.noticeBlock}>
                                    <div>전자상거래법에 따라 아래 기록을 보관하며 다른 목적으로 이용하지 않습니다.</div>
                                    <div className={styles.keepGrid}>
                                        <div className={styles.keepItem}>표시·광고에 대한 기록 <b>6개월</b></div>
                                        <div className={styles.keepItem}>계약/청약철회·대금결제·재화공급 <b>5년</b></div>
                                        <div className={styles.keepItem}>소비자 불만/분쟁 처리 기록 <b>3년</b></div>
                                        <div className={styles.keepItem}>로그인 기록 <b>3개월</b></div>
                                        <div className={`${styles.keepItem} ${styles.keepItemWide}`}>전자금융거래기록 <b>5년</b></div>
                                    </div>
                                </div>
                            </li>

                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>04</span>
                                <span>탈퇴 신청 후 <b>72시간(3일)</b> 내 동일 계정 로그인 시 탈퇴 신청이 자동 철회됩니다.</span>
                            </li>

                            <li className={styles.noticeItem}>
                                <span className={styles.badgeNum}>05</span>
                                <span>연동 서비스 권한이 해제될 수 있으며, 등급/권한 변경에 유의해주세요.</span>
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
                            className={`${styles.btn} ${canSubmit ? styles.btnPrimary : styles.btnDisabled}`}
                        >
                            회원 탈퇴
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
