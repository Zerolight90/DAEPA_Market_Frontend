"use client";

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
import OutlinedInput from '@mui/material/OutlinedInput'
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

const SIDE_SECTIONS = [
    {
        title: "거래 정보",
        items: [
            { href: "/mypage/sell", label: "판매내역" },
            { href: "/mypage/buy", label: "구매내역" },
            { href: "/mypage/shipping", label: "택배" },
            { href: "/mypage/like", label: "찜한 상품" },
            { href: "/mypage/matching", label: "관심 상품 매칭" },
            { href: "/mypage/safe-settle", label: "안심결제 정산내역" },
        ],
    },
    {
        title: "내 정보",
        items: [
            { href: "/mypage/account", label: "계좌 관리" },
            { href: "/mypage/address", label: "배송지 관리" },
            { href: "/mypage/review", label: "거래 후기" },
            { href: "/mypage/leave", label: "탈퇴하기" },
        ],
    },
];

const METRICS = [
    { key: "safe", label: "안심결제", value: 0 },
    { key: "review", label: "거래후기", value: 0 },
    { key: "close", label: "단골", value: 0 },
    { key: "eco", label: "에코마일", value: "0 M" },
];

const TABS = [
    { key: "all", label: "전체" },
    { key: "selling", label: "판매중" },
    { key: "reserved", label: "예약중" },
    { key: "sold", label: "판매완료" },
];

const SORTS = [
    { key: "latest", label: "최신순" },
    { key: "low", label: "낮은가격순" },
    { key: "high", label: "높은가격순" },
];

export default function MyPage() {

    // 상위 카테고리
    const [upper, setUpper] = React.useState('');
    const handleChange = (event) => {
        setUpper(event.target.value);
    };

    // 상위 카테고리 데이터를 저장할 State 추가
    const [upperCategories, setUpperCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // 중/하위 카테고리 데이터 및 상태 관리
    const [middleCategories, setMiddleCategories] = useState([]);
    const [lowCategories, setLowCategories] = useState([]);
    const [loadingMiddle, setLoadingMiddle] = useState(false);
    const [loadingLow, setLoadingLow] = useState(false);

    // 선택된 중하위 카테고리 값을 객체 형태로 관리 (ID와 이름 모두 필요하므로)
    const [selectedMiddle, setSelectedMiddle] = useState(null);
    const [selectedLow, setSelectedLow] = useState(null);

    // 중, 하위 카테고리
    const [value, setValue] = useState(null);
    const [value2, setValue2] = useState(null);

    // 매칭받을 상품의 최소/최대 금액을 저장할 State
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // DB 데이터를 저장하고 UI 상태를 관리할 State
    const [userPicks, setUserPicks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // DB에서 데이터를 가져오는 로직 (컴포넌트가 처음 로드될 때 실행)
    useEffect(() => {
        const fetchUserPicks = async () => {
            try {
                // 백엔드 API 주소
                const response = await fetch('http://localhost:8080/api/userpicks');
                if (!response.ok) {
                    throw new Error('데이터를 불러오는 데 실패했습니다.');
                }
                const data = await response.json();
                setUserPicks(data); // 상태에 데이터 저장
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserPicks();
    }, []); // 빈 배열: 최초 1회만 실행

    // 상위 카테고리 목록을 불러오는 useEffect
    useEffect(() => {
        const fetchUpperCategories = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/category/uppers');
                const data = await response.json();
                setUpperCategories(data); // 가져온 데이터를 State에 저장
            } catch (error) {
                console.error("상위 카테고리를 불러오는 데 실패했습니다:", error);
            } finally {
                setLoadingCategories(false); // 로딩 종료
            }
        };

        fetchUpperCategories();
    }, []); // 빈 배열: 최초 1회만 실행

    // ✅ 상위 카테고리(upper)가 변경될 때마다 실행
    useEffect(() => {
        // 상위 카테고리가 선택되지 않았으면 중/하위 목록 초기화
        if (!upper) {
            setMiddleCategories([]);
            setLowCategories([]);
            return;
        }

        const fetchMiddleCategories = async () => {
            setLoadingMiddle(true);
            try {
                // 선택된 upper ID로 API 호출 /api/categories/middle?upperIdx=${upper}
                const response = await fetch(`http://localhost:8080/api/category/uppers/${upper}/middles`);
                const data = await response.json();
                setMiddleCategories(data);
            } catch (error) {
                console.error("중위 카테고리 로딩 실패:", error);
            } finally {
                setLoadingMiddle(false);
            }
        };

        fetchMiddleCategories();
        // 상위 카테고리가 바뀌면 기존에 선택했던 중/하위 값은 초기화
        setSelectedMiddle(null);
        setSelectedLow(null);
        setLowCategories([]);
    }, [upper]); // 'upper' 값이 바뀔 때마다 이 useEffect가 다시 실행됨

    // ✅ 중위 카테고리(selectedMiddle)가 변경될 때마다 실행
    useEffect(() => {
        if (!selectedMiddle) {
            setLowCategories([]);
            return;
        }

        const fetchLowCategories = async () => {
            setLoadingLow(true);
            try {
                // 선택된 middle ID로 API 호출 /api/categories/low?middleIdx=${selectedMiddle.middleIdx}
                const response = await fetch(`http://localhost:8080/api/category/middles/${selectedMiddle.middleIdx}/lows`);
                const data = await response.json();
                setLowCategories(data);
            } catch (error) {
                console.error("하위 카테고리 로딩 실패:", error);
            } finally {
                setLoadingLow(false);
            }
        };

        fetchLowCategories();
        // 중위 카테고리가 바뀌면 기존 하위 값은 초기화
        setSelectedLow(null);
    }, [selectedMiddle]); // 'selectedMiddle' 객체가 바뀔 때마다 실행

    // 삭제 버튼을 눌렀을 때 실행될 함수
    const handleDelete = async (idToDelete) => {
        if (!confirm('해당 항목을 정말 삭제하시겠습니까?')) {
            return;
        }
        try {
            // 실제 백엔드 API 주소로 변경해야 합니다.
            const response = await fetch(`http://localhost:8080/api/userpicks/${idToDelete}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('삭제에 실패했습니다.');
            }
            // 화면에서도 즉시 해당 항목 제거
            setUserPicks(currentPicks =>
                currentPicks.filter(pick => pick.up_idx !== idToDelete)
            );
        } catch (err) {
            alert(err.message);
        }
    };

    // 추가 버튼 클릭 시 실행될 함수
    const handleAddPick = async () => {
        // 1. 유효성 검사 (필수 값들이 모두 입력되었는지 확인)
        console.log(upper, selectedMiddle.middleIdx, selectedLow.lowIdx, minPrice, maxPrice)

        if (!upper || !selectedMiddle.middleCt || !selectedLow.lowCt || !minPrice || !maxPrice) {
            alert('모든 값을 입력해주세요.');
            return;
        }

        // ✅ 상위 카테고리 ID(upper)로부터 라벨(이름)을 찾습니다.
        const upperCategoryLabel = upperCategories.find(c => c.upperIdx === upper)?.upperCt || '';

        // 2. 백엔드로 보낼 데이터 객체 생성
        const newPickData = {
            upperCategory: upperCategoryLabel, // upper === 10 ? '전자제품' : upper === 20 ? '패션/의류' : '생활/가전',
            middleCategory: selectedMiddle.middleCt, // Autocomplete에서 선택된 객체의 label 값
            lowCategory: selectedLow.lowCt,
            minPrice: parseInt(minPrice), // 문자열을 숫자로 변환
            maxPrice: parseInt(maxPrice),
        };

        try {
            // 3. 백엔드 API에 POST 요청
            const response = await fetch('http://localhost:8080/api/userpicks/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPickData),
            });

            if (!response.ok) {
                throw new Error('관심 상품 추가에 실패했습니다.');
            }

            // 4. 성공 시, 서버로부터 받은 새 데이터를 화면 목록에 추가
            const addedPick = await response.json();
            setUserPicks(prevPicks => [...prevPicks, addedPick]);

            // 5. 입력 필드 초기화
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







    // 데모 상태
    const [tab, setTab] = useState("all");
    const [sort, setSort] = useState("latest");

    // 실제로는 사용자 정보/상품을 서버에서 가져오세요.
    const user = {
        nickname: "씩씩한하이에나",
        trust: 162, // 0~1000
        avatarUrl: "", // 비어있으면 기본 이미지
    };

    const items = useMemo(() => {
        // TODO: 탭/정렬에 맞는 리스트 반환
        return []; // 지금은 빈 상태로 예시
    }, [tab, sort]);

    const trustPercent = Math.min(100, Math.round((user.trust / 1000) * 100));

    return (
        <main className={styles.wrap}>
            {/* 좌측 사이드바 */}
            <aside className={styles.sidebar}>
                <h2 className={styles.sidebarTitle}>마이페이지</h2>

                {SIDE_SECTIONS.map((section) => (
                    <div key={section.title} className={styles.sideSection}>
                        <div className={styles.sideSectionTitle}>{section.title}</div>
                        <ul className={styles.sideList}>
                            {section.items.map((it) => (
                                <li key={it.href}>
                                    <Link href={it.href} className={styles.sideLink}>
                                        {it.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </aside>

            {/* 메인 콘텐츠 */}
            <section className={styles.content}>
                {/* 상단 프로필 & 신뢰지수 & 우측 배너/지표 */}
                <header className={styles.header}>
                    <div className={styles.profile}>
                        <div className={styles.avatar} aria-hidden>
                            {user.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.avatarUrl} alt="" />
                            ) : (
                                <span className={styles.avatarFallback} />
                            )}
                        </div>

                        <div className={styles.profileMeta}>
                            <div className={styles.nicknameRow}>
                                <strong className={styles.nickname}>{user.nickname}</strong>
                                <Link
                                    href="/store/intro"
                                    className={styles.openStore}
                                    aria-label="가게 소개 작성하기"
                                    title="가게 소개 작성"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                                        <path d="M14 3l7 7-11 11H3v-7L14 3zM16.5 5.5l2 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                                    </svg>
                                </Link>
                            </div>

                            <div className={styles.trustRow}>
                <span className={styles.trustLabel}>
                  신뢰지수 <b>{user.trust}</b>
                </span>
                                <div className={styles.trustBar}>
                  <span
                      className={styles.trustGauge}
                      style={{ width: `${trustPercent}%` }}
                  />
                                </div>
                                <span className={styles.trustMax}>1,000</span>
                            </div>

                            <p className={styles.trustDesc}>
                                앱에서 가게 소개 작성하고 신뢰도를 높여 보세요.
                            </p>
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        <Link href="/mypage/connect-cafe" className={styles.bannerCard}>
                            <div className={styles.bannerIcon} aria-hidden />
                            <div className={styles.bannerText}>
                                <strong>내 상품 2배로 노출시키기</strong>
                                <span>카페에 상품 자동 등록하기</span>
                            </div>
                            <span className={styles.bannerArrow} aria-hidden>›</span>
                        </Link>

                        <ul className={styles.metricRow}>
                            {METRICS.map((m) => (
                                <li key={m.key} className={styles.metricItem}>
                                    <span className={styles.metricLabel}>{m.label}</span>
                                    <strong className={styles.metricValue}>{m.value}</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                </header>

                {/* 내 상품 탭/정렬 */}
                <div className={styles.panel}>
                    <div className={styles.panelHead}>
                        <h3 className={styles.panelTitle}>관심 매칭 상품</h3>
                    </div>

                    <div style={{display: "flex", alignItems: "center", marginTop: "10px"}}>
                        <Box sx={{ minWidth: 120, marginRight: 1 }}>
                            <FormControl sx={{ width: 150 }} size="small">
                                <InputLabel id="demo-simple-select-label">상위 카테고리</InputLabel>
                                <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={upper}
                                label="Upper"
                                onChange={handleChange}
                                >

                                {/* DB에서 가져온 데이터로 메뉴 아이템을 동적으로 생성 */}
                                {upperCategories.map((category) => (
                                    <MenuItem key={category.upperIdx} value={category.upperIdx}>
                                        {category.upperCt}
                                    </MenuItem>
                                ))}

                                {/* <MenuItem value={10}>전자제품</MenuItem>
                                <MenuItem value={20}>패션/의류</MenuItem>
                                <MenuItem value={30}>생활/가전</MenuItem> */}

                                </Select>
                            </FormControl>
                        </Box>

                        <Autocomplete
                        // disablePortal
                        options={middleCategories}
                        getOptionLabel={(option) => option.middleCt || ""}  // 객체일 경우 label 지정 필수
                        sx={{ width: 150, marginRight: 1 }}
                        size="small"
                        value={selectedMiddle}
                        onChange={(event, newValue) => {
                            setSelectedMiddle(newValue);  // 선택한 값 저장
                            console.log('선택된 값:', newValue);
                        }}
                        loading={loadingMiddle}
                        disabled={!upper || loadingMiddle} // 상위 카테고리가 없거나 로딩 중일 때 비활성화
                        renderInput={(params) => <TextField {...params} label="중간 카테고리" />}
                        />

                        <Autocomplete
                        // disablePortal
                        options={lowCategories}
                        getOptionLabel={(option) => option.lowCt || ""}  // 객체일 경우 label 지정 필수
                        isOptionEqualToValue={(option, value) => option.lowIdx === value.lowIdx}
                        sx={{ width: 150 }}
                        size="small"
                        value={selectedLow}
                        onChange={(event, newValue) => {
                            setSelectedLow(newValue);  // 선택한 값 저장
                            console.log('선택된 값:', newValue);
                        }}
                        loading={loadingLow}
                        disabled={!selectedMiddle || loadingLow} // 중위 카테고리가 없거나 로딩 중일 때 비활성화
                        renderInput={(params) => <TextField {...params} label="하위 카테고리" />}
                        />

                        <FormControl fullWidth sx={{ m: 1, width: 120 }} size="small">
                            <InputLabel htmlFor="outlined-adornment-amount">최소금액</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-amount"
                                type="number" // 숫자만 입력되도록 타입 지정
                                value={minPrice} // State와 연결
                                onChange={(e) => setMinPrice(e.target.value)} // State 업데이트
                                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                                label="Amount"
                            />
                        </FormControl>
                        ~
                        <FormControl fullWidth sx={{ m: 1, width: 120 }} size="small">
                            <InputLabel htmlFor="outlined-adornment-amount">최대금액</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-amount"
                                type="number" // 숫자만 입력되도록 타입 지정
                                value={maxPrice} // State와 연결
                                onChange={(e) => setMaxPrice(e.target.value)} // State 업데이트
                                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                                label="Amount"
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
                        <div className={styles.empty}>
                            추가된 알림 관심 카테고리가 없습니다.
                        </div>
                    ) : (
                        <ul>
                            {userPicks.map((pick) => (
                                <li key={pick.up_idx} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: '20px' }}>
                                        {/* 백엔드에서 받은 데이터의 필드명(컬럼명)에 맞게 수정해야 합니다. */}
                                        <span style={{ width: '100px' }}>{pick.upper_idx}</span>
                                        <span style={{ width: '120px' }}>{pick.middle_idx}</span>
                                        <span style={{ width: '150px' }}>{pick.ct_low}</span>
                                        <span style={{ flex: 1 }}>
                                            {pick.up_low_cost.toLocaleString()}원 ~ {pick.up_high_cost.toLocaleString()}원
                                        </span>
                                        <Stack spacing={2} direction="row">
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDelete(pick.up_idx)}
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
