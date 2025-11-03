'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './address.module.css';
import tokenStore from '@/app/store/TokenStore';

// ✅ 공용 사이드바 임포트
import Sidebar from '@/components/mypage/sidebar';

export default function AddressPage() {
    const pathname = usePathname();
    const { accessToken } = tokenStore();

    // me & ui state
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [addresses, setAddresses] = useState([]);

    // 어떤 카드가 "편집 모드"인지
    const [editTarget, setEditTarget] = useState(null);

    // modal
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        label: '',
        name: '',
        phone: '',
        addr1: '',
        addr2: '',
        region: '',
        primary: false,
    });

    // getMe
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErr('');
                const res = await fetch('/api/sing/me', {
                    method: 'GET',
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                    credentials: 'include',
                    cache: 'no-store',
                });
                if (!res.ok) {
                    const text = await res.text();
                    setErr(text || '불러오기 실패');
                    setMe(null);
                    return;
                }
                const data = await res.json();
                setMe(data);
            } catch (e) {
                setErr('네트워크 오류');
                setMe(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [accessToken]);

    // 대표 배송지: 백의 필드명에 맞춰서 한 번만 만든다
    const primaryFromMe = useMemo(() => {
        if (!me) return null;

        const name = me.uName ?? '';
        const phone = me.uPhone ?? '';
        const addr1 = me.uAddress ?? '';
        const addr2 = me.uLocationDetail ?? '';
        const region = me.uLocation ?? '';

        if (!addr1 && !addr2) return null;

        return {
            label: '기본 배송지',
            name,
            phone,
            addr1,      // 우편번호(예: 12345)
            addr2,      // 상세주소
            region,     // 도로명/지번
            primary: true,
        };
    }, [me]);

    // 화면에 뿌릴 전체 리스트
    const allAddresses = useMemo(() => {
        const list = [];
        if (primaryFromMe) list.push(primaryFromMe);
        return [...list, ...addresses];
    }, [primaryFromMe, addresses]);

    // 모달 열기/닫기
    const openModal = () => {
        setForm({
            label: '',
            name: '',
            phone: '',
            addr1: '',
            addr2: '',
            region: '',
            primary: false,
        });
        setOpen(true);
    };
    const closeModal = () => setOpen(false);

    // 입력 변경
    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
    };

    // 저장 (데모)
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim() || !form.addr1.trim()) {
            alert('받는 분, 연락처, 주소는 필수입니다.');
            return;
        }
        try {
            await fetch('/api/addresses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify(form),
                credentials: 'include',
            });
        } catch {
            // 데모라서 실패해도 프론트만 갱신
        }
        setAddresses((prev) => {
            const next = form.primary ? prev.map((a) => ({ ...a, primary: false })) : prev;
            return [{ ...form }, ...next];
        });
        setOpen(false);
    };

    return (
        <div className={styles.wrapper}>
            {/* ✅ 공용 사이드바 */}
            <Sidebar />

            {/* Content */}
            <main className={styles.content}>
                <header className={styles.addrHeaderRow}>
                    <h1 className={styles.pageTitle}>배송지 관리</h1>
                </header>

                {/* 상태 표시 */}
                {loading && <div className={styles.empty}>로딩 중…</div>}
                {!loading && err && <div className={styles.empty}>{err}</div>}

                {/* 목록 */}
                {!loading && !err && (
                    <section className={styles.addrList}>
                        {allAddresses.length === 0 ? (
                            <div className={styles.empty}>등록된 배송지가 없습니다.</div>
                        ) : (
                            allAddresses.map((a, idx) => {
                                const isEditing = editTarget === idx;

                                return (
                                    <article
                                        key={`${a.label}-${idx}`}
                                        className={`${styles.addrCard} ${a.primary ? styles.addrCardPrimary : ''}`}
                                    >
                                        {/* 위쪽: 제목/뱃지/편집버튼 */}
                                        <div className={styles.addrCardTop}>
                                            <div className={styles.addrTitleBox}>
                                                <strong className={styles.addrLabel}>
                                                    {a.label || '배송지'}
                                                </strong>
                                                {a.primary && (
                                                    <span className={styles.addrPrimaryBadge}>대표 배송지</span>
                                                )}
                                            </div>

                                            {/* 카드별 편집 버튼 */}
                                            <button
                                                type="button"
                                                className={styles.addrEditBtn}
                                                onClick={() => setEditTarget(isEditing ? null : idx)}
                                            >
                                                ✎ 편집
                                            </button>
                                        </div>

                                        {/* 이름 */}
                                        {a.name && <div className={styles.addrLine}>{a.name}</div>}

                                        {/* 전화번호 */}
                                        {a.phone && <div className={styles.addrLine}>{a.phone}</div>}

                                        {/* 주소 한 줄 */}
                                        {(a.addr1 || a.region || a.addr2) && (
                                            <div className={styles.addrLine}>
                                                {a.addr1 && `[${a.addr1}] `}
                                                {a.region && `${a.region} `}
                                                {a.addr2 && a.addr2}
                                            </div>
                                        )}

                                        {/* 편집 모드 하단 액션 */}
                                        {isEditing && (
                                            <div className={styles.addrActionBar}>
                                                <button
                                                    type="button"
                                                    className={styles.addrAction}
                                                    disabled={a.primary}
                                                    onClick={() => {
                                                        // TODO: 대표 설정 API
                                                    }}
                                                >
                                                    대표 배송지 설정
                                                </button>
                                                <span className={styles.addrDivider} />
                                                <button
                                                    type="button"
                                                    className={styles.addrActionDanger}
                                                    onClick={() => {
                                                        // TODO: 삭제 API
                                                    }}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        )}
                                    </article>
                                );
                            })
                        )}
                    </section>
                )}

                {/* 아래쪽 버튼 */}
                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.addBtn}`}
                    onClick={openModal}
                >
                    배송지 추가하기
                </button>
            </main>

            {/* Modal */}
            {open && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
                        <header className={styles.modalHeader}>
                            <button className={styles.modalBack} onClick={closeModal} aria-label="닫기">
                                ←
                            </button>
                            <h2 className={styles.modalTitle}>배송지 추가</h2>
                        </header>

                        <form className={styles.formGrid} onSubmit={onSubmit}>
                            <input
                                name="label"
                                value={form.label}
                                onChange={onChange}
                                maxLength={10}
                                className={styles.input}
                                placeholder="배송지명 (최대 10글자)"
                            />
                            <input
                                name="name"
                                value={form.name}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="받는 분"
                            />
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="연락처"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                            <input
                                name="addr1"
                                value={form.addr1}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="주소 검색"
                            />
                            <input
                                name="addr2"
                                value={form.addr2}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="상세주소 (예: 101동 101호)"
                            />

                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    name="primary"
                                    checked={form.primary}
                                    onChange={onChange}
                                    className={styles.checkbox}
                                />
                                <span>대표 배송지로 설정</span>
                            </label>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={`${styles.btn} ${styles.btnGhost}`}
                                    onClick={closeModal}
                                >
                                    취소
                                </button>
                                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                                    완료
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
