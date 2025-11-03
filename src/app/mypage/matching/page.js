'use client';

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import styles from "../mypage.module.css";

import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import tokenStore from "@/app/store/TokenStore";
import Sidebar from "@/components/mypage/sidebar"; // ✅ 공용 사이드바

// ⚠️ 기존 SIDE_SECTIONS, METRICS 등은 그대로 사용 중이면 유지
//    여기서는 사이드바에만 쓰던 SIDE_SECTIONS를 완전히 제거했어요.

// 메트릭/탭/정렬(이 아래는 기존 코드 그대로)
const METRICS = [
    { key: "safe", label: "안심결제", value: 0 },
    { key: "review", label: "거래후기", value: 0 },
    { key: "close", label: "단골", value: 0 },
    { key: "eco", label: "에코마일", value: "0 M" },
];

export default function MyPage() {
    const { token } = tokenStore();

    // 상위 카테고리
    const [upper, setUpper] = React.useState('');
    const handleChange = (event) => setUpper(event.target.value);

    // 상/중/하위 카테고리 로딩 상태 및 값
    const [upperCategories, setUpperCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [middleCategories, setMiddleCategories] = useState([]);
    const [lowCategories, setLowCategories] = useState([]);
    const [loadingMiddle, setLoadingMiddle] = useState(false);
    const [loadingLow, setLoadingLow] = useState(false);
    const [selectedMiddle, setSelectedMiddle] = useState(null);
    const [selectedLow, setSelectedLow] = useState(null);

    // 가격 범위
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // 사용자 매칭 조건
    const [userPicks, setUserPicks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 내 관심 조건 불러오기
    useEffect(() => {
        const fetchUserPicks = async () => {
            const currentToken = token || localStorage.getItem('accessToken');
            try {
                const response = await fetch('http://localhost:8080/api/userpicks', {
                    headers: { 'Authorization': `Bearer ${currentToken}` },
                });
                if (!response.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
                const data = await response.json();
                setUserPicks(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserPicks();
    }, [token]);

    // 상위 카테고리 로드
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('http://localhost:8080/api/category/uppers');
                const data = await res.json();
                setUpperCategories(data);
            } catch (e) {
                console.error("상위 카테고리 로딩 실패:", e);
            } finally {
                setLoadingCategories(false);
            }
        })();
    }, []);

    // 상위 변경 → 중위 로드
    useEffect(() => {
        if (!upper) {
            setMiddleCategories([]);
            setLowCategories([]);
            return;
        }
        (async () => {
            setLoadingMiddle(true);
            try {
                const res = await fetch(`http://localhost:8080/api/category/uppers/${upper}/middles`);
                const data = await res.json();
                setMiddleCategories(data);
            } catch (e) {
                console.error("중위 카테고리 로딩 실패:", e);
            } finally {
                setLoadingMiddle(false);
            }
        })();
        setSelectedMiddle(null);
        setSelectedLow(null);
        setLowCategories([]);
    }, [upper]);

    // 중위 변경 → 하위 로드
    useEffect(() => {
        if (!selectedMiddle) {
            setLowCategories([]);
            return;
        }
        (async () => {
            setLoadingLow(true);
            try {
                const res = await fetch(`http://localhost:8080/api/category/middles/${selectedMiddle.middleIdx}/lows`);
                const data = await res.json();
                setLowCategories(data);
            } catch (e) {
                console.error("하위 카테고리 로딩 실패:", e);
            } finally {
                setLoadingLow(false);
            }
        })();
        setSelectedLow(null);
    }, [selectedMiddle]);

    // 삭제
    const handleDelete = async (idToDelete) => {
        if (!confirm('해당 항목을 정말 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`http://localhost:8080/api/userpicks/${idToDelete}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('삭제에 실패했습니다.');
            setUserPicks(prev => prev.filter(p => p.upIdx !== idToDelete));
        } catch (err) {
            alert(err.message);
        }
    };

    // 추가
    const handleAddPick = async () => {
        const currentToken = token || localStorage.getItem('accessToken');
        if (!upper || !selectedMiddle || !selectedLow || !minPrice || !maxPrice) {
            alert('모든 값을 입력해주세요.');
            return;
        }
        const upperCategoryLabel =
            upperCategories.find(c => c.upperIdx === upper)?.upperCt || '';

        const newPickData = {
            upperCategory: upperCategoryLabel,
            middleCategory: selectedMiddle.middleCt,
            lowCategory: selectedLow.lowCt,
            minPrice: parseInt(minPrice, 10),
            maxPrice: parseInt(maxPrice, 10),
        };

        try {
            const res = await fetch('http://localhost:8080/api/userpicks/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                },
                body: JSON.stringify(newPickData),
            });
            if (!res.ok) throw new Error('관심 상품 추가에 실패했습니다.');
            const added = await res.json();
            setUserPicks(prev => [...prev, added]);
            setUpper('');
            setSelectedMiddle(null);
            setSelectedLow(null);
            setMinPrice('');
            setMaxPrice('');
            alert('성공적으로 추가되었습니다.');
        } catch (err) {
            alert(err.message);
        }
    };

    // 데모용 유저/지표
    const user = { nickname: "씩씩한하이에나", trust: 162, avatarUrl: "" };
    const trustPercent = Math.min(100, Math.round((user.trust / 1000) * 100));

    return (
        <main className={styles.wrap}>
            {/* ✅ 좌측: 공용 사이드바로 교체 */}
            <aside className={styles.sidebar}>
                <Sidebar />
            </aside>

            {/* 우측 본문 */}
            <section className={styles.content}>
                {/* 프로필/지표 */}
                <header className={styles.header}>
                    <div className={styles.profile}>
                        <div className={styles.avatar} aria-hidden>
                            {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span className={styles.avatarFallback} />}
                        </div>

                        <div className={styles.profileMeta}>
                            <div className={styles.nicknameRow}>
                                <strong className={styles.nickname}>{user.nickname}</strong>
                                <Link href="/store/intro" className={styles.openStore} aria-label="가게 소개 작성하기" title="가게 소개 작성">
                                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M14 3l7 7-11 11H3v-7L14 3zM16.5 5.5l2 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                                    </svg>
                                </Link>
                            </div>

                            <div className={styles.trustRow}>
                                <span className={styles.trustLabel}>신뢰지수 <b>{user.trust}</b></span>
                                <div className={styles.trustBar}>
                                    <span className={styles.trustGauge} style={{ width: `${trustPercent}%` }} />
                                </div>
                                <span className={styles.trustMax}>1,000</span>
                            </div>

                            <p className={styles.trustDesc}>앱에서 가게 소개 작성하고 신뢰도를 높여 보세요.</p>
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        <Link href="/payCharge" className={styles.bannerCard}>
                            <div className={styles.bannerIcon} aria-hidden />
                            <div className={styles.bannerText}><strong>대파 페이 충전하기</strong></div>
                            <span className={styles.bannerArrow} aria-hidden>›</span>
                        </Link>

                        <ul className={styles.metricRow}>
                            {METRICS.map(m => (
                                <li key={m.key} className={styles.metricItem}>
                                    <span className={styles.metricLabel}>{m.label}</span>
                                    <strong className={styles.metricValue}>{m.value}</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                </header>

                {/* 관심 매칭 상품 패널 */}
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3 className={styles.panelTitle}>관심 매칭 상품</h3>
                    </div>

                    {/* 컨트롤 바 */}
                    <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
                        <Box sx={{ minWidth: 120, marginRight: 1 }}>
                            <FormControl sx={{ width: 150 }} size="small">
                                <InputLabel id="upper-label">상위 카테고리</InputLabel>
                                <Select
                                    labelId="upper-label"
                                    value={upper}
                                    label="상위 카테고리"
                                    onChange={handleChange}
                                >
                                    {upperCategories.map(c => (
                                        <MenuItem key={c.upperIdx} value={c.upperIdx}>{c.upperCt}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Autocomplete
                            options={middleCategories}
                            getOptionLabel={(o) => o.middleCt || ""}
                            sx={{ width: 150, marginRight: 1 }}
                            size="small"
                            value={selectedMiddle}
                            onChange={(_, v) => setSelectedMiddle(v)}
                            loading={loadingMiddle}
                            disabled={!upper || loadingMiddle}
                            renderInput={(params) => <TextField {...params} label="중간 카테고리" />}
                        />

                        <Autocomplete
                            options={lowCategories}
                            getOptionLabel={(o) => o.lowCt || ""}
                            isOptionEqualToValue={(o, v) => o.lowIdx === v?.lowIdx}
                            sx={{ width: 150 }}
                            size="small"
                            value={selectedLow}
                            onChange={(_, v) => setSelectedLow(v)}
                            loading={loadingLow}
                            disabled={!selectedMiddle || loadingLow}
                            renderInput={(params) => <TextField {...params} label="하위 카테고리" />}
                        />

                        <FormControl fullWidth sx={{ m: 1, width: 130 }} size="small">
                            <InputLabel htmlFor="min-price">최소금액</InputLabel>
                            <OutlinedInput
                                id="min-price"
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                startAdornment={<InputAdornment position="start">₩</InputAdornment>}
                                label="최소금액"
                                inputProps={{
                                    sx: {
                                        '&::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                        '&::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                        MozAppearance: 'textfield',
                                    },
                                    onWheel: (e) => e.currentTarget.blur(),
                                }}
                            />
                        </FormControl>
                        ~
                        <FormControl fullWidth sx={{ m: 1, width: 130 }} size="small">
                            <InputLabel htmlFor="max-price">최대금액</InputLabel>
                            <OutlinedInput
                                id="max-price"
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                startAdornment={<InputAdornment position="start">₩</InputAdornment>}
                                label="최대금액"
                                inputProps={{
                                    sx: {
                                        '&::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                        '&::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                        MozAppearance: 'textfield',
                                    },
                                    onWheel: (e) => e.currentTarget.blur(),
                                }}
                            />
                        </FormControl>

                        <Stack spacing={2} direction="row" style={{ marginLeft: 40 }}>
                            <Button variant="contained" onClick={handleAddPick}>추가</Button>
                        </Stack>
                    </div>

                    {/* 리스트/빈 상태 */}
                    {isLoading ? (
                        <div className={styles.empty}>로딩 중...</div>
                    ) : error ? (
                        <div className={styles.empty} style={{ color: 'red' }}>오류: {error}</div>
                    ) : userPicks.length === 0 ? (
                        <div className={styles.empty}>추가된 알림 관심 카테고리가 없습니다.</div>
                    ) : (
                        <ul style={{ listStyle: "none", marginTop: 10 }}>
                            {userPicks.map((pick) => (
                                <li key={pick.upIdx} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                        <span style={{ width: 100 }}>{pick.upperCategory}</span>
                                        <span style={{ width: 120 }}>{pick.middleCategory}</span>
                                        <span style={{ width: 150 }}>{pick.lowCategory}</span>
                                        <span style={{ flex: 1 }}>
                      {pick.minPrice.toLocaleString()}원 ~ {pick.maxPrice.toLocaleString()}원
                    </span>
                                        <Stack spacing={2} direction="row">
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDelete(pick.upIdx)}
                                            >
                                                삭제
                                            </Button>
                                        </Stack>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </main>
    );
}
