'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './address.module.css';
import tokenStore from '@/app/store/TokenStore';
import Sidebar from '@/components/mypage/sidebar';

export default function AddressPage() {
    const { accessToken } = tokenStore();

    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');
    const [editTarget, setEditTarget] = useState(null);

    // 모달
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        title: '',
        name: '',
        phone: '',
        zipcode: '',
        region: '',
        addr2: '',
        primary: false,
    });

    /* 1) 카카오 우편번호 스크립트 로드 */
    useEffect(() => {
        const id = 'daum-postcode-script';
        if (document.getElementById(id)) return;
        const s = document.createElement('script');
        s.id = id;
        s.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        s.async = true;
        document.body.appendChild(s);
    }, []);

    /* 2) 팝업 열기 */
    const openPostcode = () => {
        if (!window.daum?.Postcode) {
            alert('우편번호 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }
        new window.daum.Postcode({
            oncomplete: (data) => {
                const addr = data.roadAddress || data.jibunAddress || '';
                setForm((prev) => ({
                    ...prev,
                    zipcode: data.zonecode || '',
                    region: addr,
                }));
                setTimeout(() => {
                    document.getElementById('addr-detail-input')?.focus();
                }, 0);
            },
        }).open();
    };

    /* 3) 내 정보 + 주소 목록 가져오기 */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
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

    /* 4) 서버에서 내려준 location → 화면용 배열 */
    const addrList = useMemo(() => {
        if (!me || !Array.isArray(me.locations)) return [];

        const converted = me.locations.map((loc) => {
            // 🔥 0 이 대표, true 도 대표로 해석
            const isPrimary =
                loc.locDefault === 0 ||
                loc.locDefault === '0' ||
                loc.locDefault === false; // JPA boolean → false가 0이었을 때

            return {
                // 큰 글씨로 보여줄 제목
                title: loc.locTitle && loc.locTitle.trim().length > 0 ? loc.locTitle : isPrimary ? '대표 배송지' : '기본',
                // 뱃지에 들어갈 텍스트
                badge: isPrimary ? '대표 배송지' : '기본 배송지',
                name: loc.locName || '',   // 받는 사람
                phone: loc.locNum || '',   // 연락처
                zipcode: loc.locCode || '',
                region: loc.locAddress || '',
                addr2: loc.locDetail || '',
                primary: isPrimary,
                locKey: loc.locKey,
                fromDB: true,
            };
        });

        // 대표 먼저
        return converted.sort((a, b) => (a.primary === b.primary ? 0 : a.primary ? -1 : 1));
    }, [me]);

    /* 모달 열기 */
    const openModal = () => {
        setForm({
            title: '',
            name: me?.uName ?? '',
            phone: me?.uPhone ?? '',
            zipcode: '',
            region: '',
            addr2: '',
            primary: false,
        });
        setOpen(true);
    };
    const closeModal = () => setOpen(false);

    /* 폼 입력 변경 */
    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
    };

    /* 5) 주소 저장 요청 */
    const onSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim() || !form.phone.trim()) {
            alert('받는 분과 연락처는 필수입니다.');
            return;
        }
        if (!form.region.trim() || !form.zipcode.trim()) {
            alert('주소 찾기로 주소와 우편번호를 입력해 주세요.');
            return;
        }

        const payload = {
            title: form.title,
            name: form.name,
            phone: form.phone,
            region: form.region,
            addr2: form.addr2,
            zipcode: form.zipcode,
            primary: form.primary,
        };

        try {
            const res = await fetch('/api/sing/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data.message || '주소 저장에 실패했습니다.');
                return;
            }

            alert(data.message || '주소가 저장되었습니다.');
            setMe((prev) =>
                prev ? { ...prev, locations: data.locations } : prev
            );
            setOpen(false);
        } catch (err) {
            console.error(err);
            alert('주소 저장 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className={styles.wrapper}>
            <Sidebar />

            <main className={styles.content}>
                <header className={styles.addrHeaderRow}>
                    <h1 className={styles.pageTitle}>배송지 관리(최대 5개)</h1>
                </header>

                {loading && <div className={styles.empty}>로딩 중…</div>}
                {!loading && err && <div className={styles.empty}>{err}</div>}

                {/* 리스트 */}
                {!loading && !err && (
                    <section className={styles.addrList}>
                        {addrList.length === 0 ? (
                            <div className={styles.empty}>등록된 배송지가 없습니다.</div>
                        ) : (
                            addrList.map((a, idx) => {
                                const isEditing = editTarget === idx;
                                return (
                                    <article
                                        key={a.locKey ?? idx}
                                        className={`${styles.addrCard} ${a.primary ? styles.addrCardPrimary : styles.addrCardSecondary}`}
                                    >
                                        {/* 상단: 큰 제목 + 뱃지 + 편집 */}
                                        <div className={styles.addrCardTop}>
                                            <div className={styles.addrTitleBox}>
                                                {/* 큰 제목: loc_title */}
                                                <strong className={styles.addrTitleBig}>{a.title}</strong>
                                                {/* 작은 뱃지: 대표/기본 */}
                                                <span className={a.primary ? styles.addrBadgePrimary : styles.addrBadge}>
                          {a.badge}
                        </span>
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.addrEditBtn}
                                                onClick={() => setEditTarget(isEditing ? null : idx)}
                                            >
                                                ✎ 편집
                                            </button>
                                        </div>

                                        {/* 받는 분 + 연락처 한 줄 */}
                                        {(a.name || a.phone) && (
                                            <div className={styles.addrLine}>
                                                {a.name}
                                                {a.name && a.phone ? ' · ' : ''}
                                                {a.phone}
                                            </div>
                                        )}

                                        {/* 주소 라인 */}
                                        {(a.zipcode || a.region || a.addr2) && (
                                            <div className={styles.addrLine}>
                                                {a.zipcode ? <span className={styles.addrZip}>[{a.zipcode}]</span> : null}
                                                {a.region && <span className={styles.addrTextInline}>{a.region}</span>}
                                                {a.addr2 && <span className={styles.addrTextInline}>, {a.addr2}</span>}
                                            </div>
                                        )}

                                        {/* 편집 모드 버튼들 */}
                                        {isEditing && (
                                            <div className={styles.addrActionBar}>
                                                <button
                                                    type="button"
                                                    className={styles.addrAction}
                                                    disabled={a.primary}
                                                    onClick={() => {
                                                        if (a.primary) {
                                                            alert('이미 대표 배송지입니다.');
                                                            return;
                                                        }
                                                        alert('대표 설정은 새 주소 추가 시 "대표 배송지로 설정"으로 변경해 주세요.');
                                                    }}
                                                >
                                                    대표 배송지 설정
                                                </button>
                                                <span className={styles.addrDivider} />
                                                <button
                                                    type="button"
                                                    className={styles.addrActionDanger}
                                                    onClick={() => {
                                                        if (a.primary) {
                                                            alert('대표 배송지는 삭제할 수 없습니다.');
                                                            return;
                                                        }
                                                        if (a.fromDB) {
                                                            alert('이 주소는 서버 API로 삭제해야 합니다.');
                                                            return;
                                                        }
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

                {/* 추가 버튼 */}
                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.addBtn}`}
                    onClick={openModal}
                >
                    배송지 추가
                </button>
            </main>

            {/* 모달 */}
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
                            {/* 배송지명 */}
                            <input
                                name="title"
                                value={form.title}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="배송지명 (예: 집, 회사)"
                            />

                            {/* 받는 분 */}
                            <input
                                name="name"
                                value={form.name}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="받는 분"
                            />

                            {/* 연락처 */}
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="연락처"
                            />

                            {/* 도로명 주소 + 버튼 */}
                            <div className={styles.zipRow}>
                                <input
                                    name="region"
                                    value={form.region}
                                    onChange={onChange}
                                    className={styles.input}
                                    placeholder="도로명 주소"
                                    readOnly
                                />
                                <button type="button" onClick={openPostcode} className={styles.zipBtn}>
                                    주소 찾기
                                </button>
                            </div>

                            {/* 상세주소 */}
                            <input
                                id="addr-detail-input"
                                name="addr2"
                                value={form.addr2}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="상세주소"
                            />

                            {/* 우편번호 */}
                            <input
                                name="zipcode"
                                value={form.zipcode}
                                onChange={onChange}
                                className={styles.zipInput}
                                placeholder="우편번호"
                                readOnly
                            />

                            {/* 대표 체크 */}
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
