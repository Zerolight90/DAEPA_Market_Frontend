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

    // 카카오 주소 스크립트 로드
    useEffect(() => {
        const id = 'daum-postcode-script';
        if (document.getElementById(id)) return;
        const s = document.createElement('script');
        s.id = id;
        s.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        s.async = true;
        document.body.appendChild(s);
    }, []);

    // 주소 찾기 열기
    const openPostcode = () => {
        if (!window.daum || !window.daum.Postcode) {
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
                    const detail = document.getElementById('addr-detail-input');
                    if (detail) detail.focus();
                }, 0);
            },
        }).open();
    };

    // 내 정보 + 주소 목록 가져오기
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

    // 서버 주소 → 화면용
    const addrList = useMemo(() => {
        if (!me || !Array.isArray(me.locations)) return [];

        const converted = me.locations.map((loc) => {
            // loc_default = false(0) → 대표
            const isPrimary =
                loc.locDefault === 0 ||
                loc.locDefault === '0' ||
                loc.locDefault === false;

            return {
                title:
                    (loc.locTitle && loc.locTitle.trim().length > 0)
                        ? loc.locTitle
                        : isPrimary
                            ? '대표 배송지'
                            : '기본 배송지',
                badge: isPrimary ? '대표 배송지' : '기본 배송지',
                name: loc.locName || '',
                phone: loc.locNum || '',
                zipcode: loc.locCode || '',
                region: loc.locAddress || '',
                addr2: loc.locDetail || '',
                primary: isPrimary,
                locKey: loc.locKey,
                fromDB: true,
            };
        });

        // 대표 먼저
        return converted.sort((a, b) => {
            if (a.primary === b.primary) return 0;
            return a.primary ? -1 : 1;
        });
    }, [me]);

    // 모달 열기
    const openModal = () => {
        // 5개 제한
        if ((me?.locations?.length || 0) >= 5) {
            alert('배송지는 최대 5개까지만 등록할 수 있습니다.');
            return;
        }
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

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
    };

    // 주소 저장
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

            const data = await res.json();

            if (!res.ok) {
                alert(data?.message || '주소 저장에 실패했습니다.');
                return;
            }

            alert(data.message || '주소가 저장되었습니다.');
            // {message, locations} 내려오므로 그대로 반영
            setMe((prev) =>
                prev
                    ? {
                        ...prev,
                        locations: data.locations,
                    }
                    : prev
            );

            setOpen(false);
        } catch (err) {
            console.error(err);
            alert('주소 저장 중 오류가 발생했습니다.');
        }
    };

    // 삭제
    const handleDelete = async (locKey, isPrimary) => {
        if (isPrimary) {
            alert('대표 배송지는 삭제할 수 없습니다.');
            return;
        }
        if (!confirm('이 배송지를 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/sing/location/${locKey}`, {
                method: 'DELETE',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                credentials: 'include',
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data?.message || '삭제에 실패했습니다.');
                return;
            }

            alert(data?.message || '배송지가 삭제되었습니다.');

            // 프론트에서 목록 갱신
            setMe((prev) =>
                prev
                    ? {
                        ...prev,
                        locations: prev.locations.filter((l) => l.locKey !== locKey),
                    }
                    : prev
            );
        } catch (err) {
            console.error(err);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // 🟢 대표 배송지 설정 (편집 안에서 누르는 거)
    const handleSetPrimary = async (locKey, isPrimary) => {
        if (isPrimary) {
            alert('이미 대표 배송지입니다.');
            return;
        }
        try {
            const res = await fetch(`/api/sing/location/${locKey}/update`, {
                method: 'PUT',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data?.message || '대표 배송지 설정에 실패했습니다.');
                return;
            }

            // 서비스가 {message, locations}로 주게 해놨으니까 그대로 반영
            alert(data.message || '대표 배송지가 변경되었습니다.');
            setMe((prev) =>
                prev
                    ? {
                        ...prev,
                        locations: data.locations,
                    }
                    : prev
            );
            // 편집 닫기
            setEditTarget(null);
        } catch (err) {
            console.error(err);
            alert('대표 배송지 변경 중 오류가 발생했습니다.');
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
                                        className={`${styles.addrCard} ${
                                            a.primary ? styles.addrCardPrimary : styles.addrCardSecondary
                                        }`}
                                    >
                                        {/* 상단: 제목 + 뱃지 + 편집 */}
                                        <div className={styles.addrCardTop}>
                                            <div className={styles.addrTitleBox}>
                                                <strong className={styles.addrTitleBig}>{a.title}</strong>
                                                <span
                                                    className={
                                                        a.primary ? styles.addrBadgePrimary : styles.addrBadge
                                                    }
                                                >
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

                                        {(a.name || a.phone) && (
                                            <div className={styles.addrLine}>
                                                {a.name}
                                                {a.name && a.phone ? ' · ' : ''}
                                                {a.phone}
                                            </div>
                                        )}

                                        {(a.zipcode || a.region || a.addr2) && (
                                            <div className={styles.addrLine}>
                                                {a.zipcode ? <span className={styles.addrZip}>[{a.zipcode}]</span> : null}
                                                {a.region && <span className={styles.addrTextInline}>{a.region}</span>}
                                                {a.addr2 && <span className={styles.addrTextInline}>, {a.addr2}</span>}
                                            </div>
                                        )}

                                        {isEditing && (
                                            <div className={styles.addrActionBar}>
                                                <button
                                                    type="button"
                                                    className={styles.addrAction}
                                                    disabled={a.primary}
                                                    onClick={() => handleSetPrimary(a.locKey, a.primary)}
                                                >
                                                    대표 배송지 설정
                                                </button>
                                                <span className={styles.addrDivider} />
                                                <button
                                                    type="button"
                                                    className={styles.addrActionDanger}
                                                    onClick={() => handleDelete(a.locKey, a.primary)}
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
                    disabled={(me?.locations?.length || 0) >= 5}
                    style={(me?.locations?.length || 0) >= 5 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
                            <input
                                name="title"
                                value={form.title}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="배송지명 (예: 집, 회사)"
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
                            />

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

                            <input
                                id="addr-detail-input"
                                name="addr2"
                                value={form.addr2}
                                onChange={onChange}
                                className={styles.input}
                                placeholder="상세주소"
                            />

                            <input
                                name="zipcode"
                                value={form.zipcode}
                                onChange={onChange}
                                className={styles.zipInput}
                                placeholder="우편번호"
                                readOnly
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
