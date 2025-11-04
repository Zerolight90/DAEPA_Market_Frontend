"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./oauth.module.css";
import tokenStore from "@/app/store/TokenStore";

// 배포에서는 NEXT_PUBLIC_API_BASE_URL 사용, 없으면 로컬로
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

function InnerOAuthPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const { setToken } = tokenStore();

    const ranTokenSave = useRef(false);
    const ranFetchMe = useRef(false);

    const provider = sp.get("provider") || "naver";
    const accessTokenFromQuery = sp.get("accessToken") || null;
    const refreshTokenFromQuery = sp.get("refreshToken") || null;

    const [loading, setLoading] = useState(true);
    const [forceShow] = useState(false);

    // 폼 상태
    const [email, setEmail] = useState("");
    const [uname, setUname] = useState("");
    const [nickname, setNickname] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [birth, setBirth] = useState("");
    const [location, setLocation] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [zipcode, setZipcode] = useState("");

    // 중복검사 메시지
    const [nicknameMsg, setNicknameMsg] = useState({ text: "", color: "" });
    const [phoneMsg, setPhoneMsg] = useState({ text: "", color: "" });

    // 약관
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [termsRead, setTermsRead] = useState(false);
    const [privacyRead, setPrivacyRead] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);
    const [marketingChecked, setMarketingChecked] = useState(false);
    const [allChecked, setAllChecked] = useState(false);

    // 1) 토큰 저장(중복 방지)
    useEffect(() => {
        if (ranTokenSave.current) return;
        ranTokenSave.current = true;

        if (accessTokenFromQuery) {
            localStorage.setItem("accessToken", accessTokenFromQuery);
            setToken(accessTokenFromQuery);
        }
        if (refreshTokenFromQuery) localStorage.setItem("refreshToken", refreshTokenFromQuery);
    }, [accessTokenFromQuery, refreshTokenFromQuery, setToken]);

    // 2) 내 정보 조회(중복 방지)
    useEffect(() => {
        if (ranFetchMe.current) return;
        ranFetchMe.current = true;

        (async () => {
            const atk = accessTokenFromQuery || localStorage.getItem("accessToken");
            if (!atk) {
                alert("로그인이 필요합니다.");
                router.replace("/sing/login");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/users/me`, {
                    headers: { Authorization: `Bearer ${atk}` },
                    credentials: "include",
                    cache: "no-store",
                });

                if (!res.ok) {
                    setLoading(false);
                    return;
                }

                const data = await res.json();

                // u_status === 1이면 가입 완료 → 홈으로
                if (data.u_status === 1 && !forceShow) {
                    router.replace("/");
                    return;
                }

                // 폼 초기화
                setEmail(data.u_id || "");
                setUname(data.u_name || "");
                setNickname(data.u_nickname || "");
                setPhone(data.u_phone || "");
                setGender(data.u_gender || "");
                setBirth(data.u_birth || "");
                setLocation(data.u_location || "");
                setAddressDetail(data.u_location_detail || "");
                setZipcode(data.u_address || "");
            } catch (e) {
                // 폴백: 폼 머무름
            } finally {
                setLoading(false);
            }
        })();
    }, [accessTokenFromQuery, forceShow, router]);

    // 3) 주소 API 스크립트
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
        if (!window.daum || !window.daum.Postcode) {
            alert("주소 스크립트가 아직 준비 안 됐어요.");
            return;
        }
        new window.daum.Postcode({
            oncomplete: (data) => {
                const addr = data.roadAddress || data.jibunAddress || "";
                setLocation(addr);
                setZipcode(data.zonecode || "");
                setTimeout(() => {
                    const el = document.getElementById("addressDetailInput");
                    if (el) el.focus();
                }, 0);
            },
        }).open();
    };

    // 4) 닉네임 중복검사(디바운스)
    useEffect(() => {
        if (!nickname) {
            setNicknameMsg({ text: "", color: "" });
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/api/sing/join/check_nickname?u_nickname=${encodeURIComponent(nickname)}`
                );
                const exists = await res.json();
                setNicknameMsg(
                    exists
                        ? { text: "이미 사용 중인 별명입니다.", color: "red" }
                        : { text: "사용 가능한 별명입니다.", color: "green" }
                );
            } catch {
                setNicknameMsg({ text: "확인 중 오류 발생", color: "red" });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [nickname]);

    // 5) 전화번호 중복검사(디바운스)
    useEffect(() => {
        if (!phone) {
            setPhoneMsg({ text: "", color: "" });
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const cleanPhone = phone.replace(/[^0-9]/g, "");
                const res = await fetch(
                    `${API_BASE}/api/sing/join/check_phone?u_phone=${encodeURIComponent(cleanPhone)}`
                );
                const exists = await res.json();
                setPhoneMsg(
                    exists
                        ? { text: "이미 사용 중인 전화번호입니다.", color: "red" }
                        : { text: "사용 가능한 전화번호입니다.", color: "green" }
                );
            } catch {
                setPhoneMsg({ text: "확인 중 오류 발생", color: "red" });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [phone]);

    // 6) 약관 전체동의
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

    // 7) 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!termsChecked || !privacyChecked) {
            alert("필수 약관에 모두 동의해 주세요.");
            return;
        }

        const atk = accessTokenFromQuery || localStorage.getItem("accessToken") || "";

        try {
            const res = await fetch(`${API_BASE}/api/users/oauth-complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: atk ? `Bearer ${atk}` : "",
                },
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
                credentials: "include",
                cache: "no-store",
            });

            if (!res.ok) throw new Error("저장 실패");
            alert("정보가 저장되었습니다.");
            router.replace("/");
        } catch (err) {
            console.error(err);
            alert("회원정보 저장 중 오류가 발생했습니다.");
        }
    };

    if (loading) return <p style={{ padding: 24 }}>불러오는 중...</p>;

    return (
        <main className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>추가 정보 입력</h1>
                <p className={styles.subText}>소셜 로그인을 마무리하려면 아래 정보를 입력해 주세요 🙌</p>

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
                        <div style={{ color: nicknameMsg.color, fontSize: "0.9em", marginTop: 5 }}>
                            {nicknameMsg.text}
                        </div>
                    </div>

                    {/* 전화번호 */}
                    <div className={styles.row}>
                        <label className={styles.label}>전화번호</label>
                        <input
                            className={styles.input}
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="'-' 없이 숫자만 입력"
                        />
                        <div style={{ color: phoneMsg.color, fontSize: "0.9em", marginTop: 5 }}>
                            {phoneMsg.text}
                        </div>
                    </div>

                    {/* 성별 + 생년월일 */}
                    <div className={styles.inlineRow}>
                        <div>
                            <label className={styles.label}>성별</label>
                            <select className={styles.input} value={gender} onChange={(e) => setGender(e.target.value)}>
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
                            <button type="button" className={styles.inlineBtn} onClick={openPostcode}>
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

                    <button type="submit" className={styles.submitBtn}>저장하고 시작하기</button>
                </form>
            </div>
        </main>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<p style={{ padding: 24 }}>로딩 중…</p>}>
            <InnerOAuthPage />
        </Suspense>
    );
}
