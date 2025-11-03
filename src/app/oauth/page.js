"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./oauth.module.css";
import tokenStore from "@/app/store/TokenStore";

const BACKEND_URL = "http://localhost:8080";

export default function OAuthPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const { setToken } = tokenStore();

    const provider = sp.get("provider") || "naver";
    const accessTokenFromQuery = sp.get("accessToken");
    const refreshTokenFromQuery = sp.get("refreshToken");

    // 화면 제어용
    const [loading, setLoading] = useState(true);     // ✅ 처음엔 로딩
    const [forceShow, setForceShow] = useState(false); // ✅ 이미 입력했어도 강제로 열고 싶을 때 대비 (옵션)

    // 폼 데이터
    const [email, setEmail] = useState("");
    const [uname, setUname] = useState("");
    const [nickname, setNickname] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [birth, setBirth] = useState("");

    const [location, setLocation] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [zipcode, setZipcode] = useState("");

    // 약관
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [termsRead, setTermsRead] = useState(false);
    const [privacyRead, setPrivacyRead] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);
    const [marketingChecked, setMarketingChecked] = useState(false);
    const [allChecked, setAllChecked] = useState(false);

    // 1) 쿼리로 온 토큰 저장
    useEffect(() => {
        if (accessTokenFromQuery) {
            localStorage.setItem("accessToken", accessTokenFromQuery);
            setToken(accessTokenFromQuery);
        }
        if (refreshTokenFromQuery) {
            localStorage.setItem("refreshToken", refreshTokenFromQuery);
        }
    }, [accessTokenFromQuery, refreshTokenFromQuery, setToken]);

    // 2) 내 정보 조회 → u_status=1 이면 바로 리다이렉트
    useEffect(() => {
        (async () => {
            const atk =
                accessTokenFromQuery || localStorage.getItem("accessToken") || null;
            if (!atk) {
                // 토큰도 없으면 로그인부터
                setLoading(false);
                alert("로그인이 필요합니다.");
                router.replace("/sing/login");
                return;
            }

            try {
                const res = await fetch(`${BACKEND_URL}/api/users/me`, {
                    headers: { Authorization: `Bearer ${atk}` },
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) {
                    setLoading(false);
                    return;
                }

                const data = await res.json();

                // ✅ 여기서 핵심
                if (data.u_status === 1 && !forceShow) {
                    // 이미 추가정보 입력 끝난 유저 → 다시 여기 올 필요 없음
                    router.replace("/");
                    return;
                }

                // 폼에 미리 채워줄 값
                if (data.u_id) setEmail(data.u_id);
                if (data.u_name) setUname(data.u_name);
                if (data.u_nickname) setNickname(data.u_nickname);
                if (data.u_phone) setPhone(data.u_phone);
                if (data.u_gender) setGender(data.u_gender);
                if (data.u_birth) setBirth(data.u_birth);
                if (data.u_location) setLocation(data.u_location);
                if (data.u_location_detail) setAddressDetail(data.u_location_detail);
                if (data.u_address) setZipcode(data.u_address);
            } catch (e) {
                // 실패해도 폼은 보여줄 수 있음
            } finally {
                setLoading(false);
            }
        })();
    }, [accessTokenFromQuery, forceShow, router]);

    // 3) 다음 주소 스크립트
    useEffect(() => {
        const id = "daum-postcode-script";
        if (document.getElementById(id)) return;
        const s = document.createElement("script");
        s.id = id;
        s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        s.async = true;
        document.body.appendChild(s);
    }, []);

    const openPostcode = () => {
        if (!window.daum?.Postcode) {
            alert("주소 스크립트가 아직 준비 안 됐어요. 잠시 후 다시 시도해주세요.");
            return;
        }
        new window.daum.Postcode({
            oncomplete: (data) => {
                const addr = data.roadAddress || data.jibunAddress || "";
                setLocation(addr);
                setZipcode(data.zonecode || "");
                setTimeout(() => {
                    document.getElementById("addressDetailInput")?.focus();
                }, 0);
            },
        }).open();
    };

    const handleAllAgree = (e) => {
        const checked = e.target.checked;
        setAllChecked(checked);
        setTermsChecked(checked);
        setPrivacyChecked(checked);
        setMarketingChecked(checked);
        if (checked) {
            setTermsRead(true);
            setPrivacyRead(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!termsChecked || !privacyChecked) {
            alert("필수 약관에 모두 동의해 주세요.");
            return;
        }

        const atk =
            accessTokenFromQuery || localStorage.getItem("accessToken") || "";

        try {
            const res = await fetch(`${BACKEND_URL}/api/users/oauth-complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(atk ? { Authorization: `Bearer ${atk}` } : {}),
                },
                credentials: "include",
                body: JSON.stringify({
                    email,
                    uname,
                    nickname,
                    phone,
                    gender,
                    birth,
                    location,
                    address: zipcode,
                    addressDetail,
                    provider,
                    agree: marketingChecked ? "1" : "0",
                }),
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error(txt);
                alert("회원정보 저장에 실패했습니다.");
                return;
            }

            alert("정보가 저장되었습니다.");
            router.replace("/");
        } catch (err) {
            console.error(err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    // ✅ 여기서 로딩 처리
    if (loading) {
        return <p style={{ padding: 24 }}>불러오는 중...</p>;
    }

    return (
        <main className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>추가 정보 입력</h1>
                <p className={styles.subText}>
                    소셜 로그인을 마무리하려면 아래 정보를 한 번만 입력해 주세요 🙌
                </p>

                <form onSubmit={handleSubmit}>
                    {/* 이메일 */}
                    <div className={styles.row}>
                        <label className={styles.label}>이메일</label>
                        <input
                            className={styles.input}
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            readOnly={provider === "naver" && !!email}
                        />
                    </div>

                    {/* 이름 */}
                    <div className={styles.row}>
                        <label className={styles.label}>이름</label>
                        <input
                            className={styles.input}
                            type="text"
                            required
                            value={uname}
                            onChange={(e) => setUname(e.target.value)}
                        />
                    </div>

                    {/* 닉네임 */}
                    <div className={styles.row}>
                        <label className={styles.label}>닉네임</label>
                        <input
                            className={styles.input}
                            type="text"
                            required
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                        />
                    </div>

                    {/* 전화번호 */}
                    <div className={styles.row}>
                        <label className={styles.label}>전화번호</label>
                        <input
                            className={styles.input}
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    {/* 성별 + 생일 */}
                    <div className={styles.inlineRow}>
                        <div>
                            <label className={styles.label}>성별</label>
                            <select
                                className={styles.input}
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                disabled
                            >
                                <option value="">선택</option>
                                <option value="M">남성</option>
                                <option value="F">여성</option>
                            </select>
                        </div>
                        <div>
                            <label className={styles.label}>생년월일</label>
                            <input
                                className={styles.input}
                                type="date"
                                value={birth}
                                onChange={(e) => setBirth(e.target.value)}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* 주소 */}
                    <div className={styles.row}>
                        <label className={styles.label}>주소</label>
                        <div className={styles.inlineRow}>
                            <input
                                className={styles.input}
                                type="text"
                                required
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="시/군/구까지 입력"
                            />
                            <button
                                type="button"
                                className={styles.inlineBtn}
                                onClick={openPostcode}
                            >
                                검색
                            </button>
                        </div>
                    </div>

                    {/* 상세주소 */}
                    <div className={styles.row}>
                        <label className={styles.label}>상세 주소</label>
                        <input
                            id="addressDetailInput"
                            className={styles.input}
                            type="text"
                            value={addressDetail}
                            onChange={(e) => setAddressDetail(e.target.value)}
                            placeholder="동/호수 등"
                        />
                    </div>

                    {/* 우편번호 */}
                    <div className={styles.row}>
                        <label className={styles.label}>우편번호</label>
                        <input
                            className={styles.input}
                            type="text"
                            value={zipcode}
                            onChange={(e) => setZipcode(e.target.value)}
                            readOnly
                        />
                    </div>

                    {/* 약관 */}
                    <div className={styles.agreeBox}>
                        <p className={styles.label}>약관 동의</p>
                        <div className={styles.agreeItem}>
                            <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={handleAllAgree}
                            />
                            <strong>전체 동의</strong>
                        </div>

                        <div className={styles.agreeItem}>
                            <input
                                type="checkbox"
                                checked={termsChecked}
                                onChange={(e) => setTermsChecked(e.target.checked)}
                                disabled={!termsRead}
                            />
                            <span>[필수] 이용약관 동의</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTerms((p) => !p);
                                    setTermsRead(true);
                                }}
                                className={styles.linkBtn}
                            >
                                보기
                            </button>
                        </div>
                        {showTerms && (
                            <div className={styles.termsBox}>
                                <p>제1조(목적) ...</p>
                            </div>
                        )}

                        <div className={styles.agreeItem}>
                            <input
                                type="checkbox"
                                checked={privacyChecked}
                                onChange={(e) => setPrivacyChecked(e.target.checked)}
                                disabled={!privacyRead}
                            />
                            <span>[필수] 개인정보 처리방침 동의</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPrivacy((p) => !p);
                                    setPrivacyRead(true);
                                }}
                                className={styles.linkBtn}
                            >
                                보기
                            </button>
                        </div>
                        {showPrivacy && (
                            <div className={styles.termsBox}>
                                <p>1. 수집 항목: ...</p>
                            </div>
                        )}

                        <div className={styles.agreeItem}>
                            <input
                                type="checkbox"
                                checked={marketingChecked}
                                onChange={(e) => setMarketingChecked(e.target.checked)}
                            />
                            <span>[선택] 마케팅 정보 수신 동의</span>
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        저장하고 시작하기
                    </button>
                </form>
            </div>
        </main>
    );
}
