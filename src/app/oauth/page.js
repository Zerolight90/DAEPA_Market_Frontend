"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./oauth.module.css";
import tokenStore from "@/app/store/TokenStore";

export default function OAuthPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const { setToken } = tokenStore();

    // 쿼리에서 온 토큰(성공페이지가 안 줬을 때를 대비해서도 남겨둠)
    const provider = sp.get("provider") || "naver";
    const accessTokenFromQuery = sp.get("accessToken");
    const refreshTokenFromQuery = sp.get("refreshToken");

    // ✅ 배포/로컬 겸용 백엔드 주소
    const BACKEND_URL = useMemo(() => {
        if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
        // 환경변수도 없고 브라우저라면, 같은 도메인 기준으로
        if (typeof window !== "undefined") return window.location.origin;
        return ""; // SSR일 때는 빈 문자열
    }, []);

    const [loading, setLoading] = useState(true);
    const [forceShow, setForceShow] = useState(false);

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

    // 중복검사 메시지
    const [nicknameMsg, setNicknameMsg] = useState({ text: "", color: "" });
    const [phoneMsg, setPhoneMsg] = useState({ text: "", color: "" });

    // 약관
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [termsChecked, setTermsChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);
    const [marketingChecked, setMarketingChecked] = useState(false);
    const [allChecked, setAllChecked] = useState(false);

    // 1) 쿼리에 토큰이 있으면 일단 저장
    useEffect(() => {
        if (accessTokenFromQuery) {
            if (typeof window !== "undefined") {
                localStorage.setItem("accessToken", accessTokenFromQuery);
            }
            setToken(accessTokenFromQuery);
        }
        if (refreshTokenFromQuery && typeof window !== "undefined") {
            localStorage.setItem("refreshToken", refreshTokenFromQuery);
        }
    }, [accessTokenFromQuery, refreshTokenFromQuery, setToken]);

    // 2) 내 정보 조회
    useEffect(() => {
        // 백엔드 주소가 없으면 그냥 폼만 보여주자
        if (!BACKEND_URL) {
            setLoading(false);
            return;
        }

        (async () => {
            const atk =
                accessTokenFromQuery ||
                (typeof window !== "undefined" ? localStorage.getItem("accessToken") : "");

            if (!atk) {
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
                    // 토큰은 있는데 백엔드에서 못 찾을 때
                    setLoading(false);
                    return;
                }

                const data = await res.json();

                // 백엔드에서 "이미 정상등록된 유저" 표시했다면 바로 홈으로
                if (data.u_status === 1 && !forceShow) {
                    router.replace("/");
                    return;
                }

                // 기존 값 세팅 (네가 주던 필드명 그대로)
                setEmail(data.u_id || "");
                setUname(data.u_name || "");
                setNickname(data.u_nickname || "");
                setPhone(data.u_phone || "");
                setGender(data.u_gender || "");
                setBirth(data.u_birth || "");

                // ❗️여기 부분이 너네가 지금 location 테이블로 빼면서 이름이 바뀌어서 에러났을 수도 있음
                // 백엔드에서 null로 내려오면 그냥 빈값으로 세팅
                setLocation(data.u_location || "");
                setAddressDetail(data.u_location_detail || "");
                setZipcode(data.u_address || "");
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [BACKEND_URL, accessTokenFromQuery, forceShow, router]);

    // 3) 다음 주소 스크립트
    useEffect(() => {
        if (typeof document === "undefined") return;
        const id = "daum-postcode-script";
        if (document.getElementById(id)) return;
        const s = document.createElement("script");
        s.id = id;
        s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        s.async = true;
        document.body.appendChild(s);
    }, []);

    const openPostcode = () => {
        if (typeof window === "undefined") return;
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
                    if (typeof document !== "undefined") {
                        document.getElementById("addressDetailInput")?.focus();
                    }
                }, 0);
            },
        }).open();
    };

    // 4) 닉네임 자동 중복검사
    useEffect(() => {
        if (!nickname) {
            setNicknameMsg({ text: "", color: "" });
            return;
        }
        // 백엔드 주소가 없으면 검사 안 함
        if (!BACKEND_URL) return;

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${BACKEND_URL}/api/sing/join/check_nickname?u_nickname=${encodeURIComponent(
                        nickname
                    )}`
                );
                const exists = await res.json();
                if (exists) {
                    setNicknameMsg({ text: "이미 사용 중인 별명입니다.", color: "red" });
                } else {
                    setNicknameMsg({ text: "사용 가능한 별명입니다.", color: "green" });
                }
            } catch (err) {
                setNicknameMsg({ text: "확인 중 오류 발생", color: "red" });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [nickname, BACKEND_URL]);

    // 5) 전화번호 자동 중복검사
    useEffect(() => {
        if (!phone) {
            setPhoneMsg({ text: "", color: "" });
            return;
        }
        if (!BACKEND_URL) return;

        const timer = setTimeout(async () => {
            try {
                const cleanPhone = phone.replace(/[^0-9]/g, "");
                const res = await fetch(
                    `${BACKEND_URL}/api/sing/join/check_phone?u_phone=${cleanPhone}`
                );
                const exists = await res.json();
                if (exists) {
                    setPhoneMsg({ text: "이미 사용 중인 전화번호입니다.", color: "red" });
                } else {
                    setPhoneMsg({ text: "사용 가능한 전화번호입니다.", color: "green" });
                }
            } catch (err) {
                setPhoneMsg({ text: "확인 중 오류 발생", color: "red" });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [phone, BACKEND_URL]);

    // 6) 전체동의
    const handleAllAgree = (e) => {
        const checked = e.target.checked;
        setAllChecked(checked);
        setTermsChecked(checked);
        setPrivacyChecked(checked);
        setMarketingChecked(checked);
    };

    // 7) 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!termsChecked || !privacyChecked) {
            alert("필수 약관에 모두 동의해 주세요.");
            return;
        }

        const atk =
            accessTokenFromQuery ||
            (typeof window !== "undefined" ? localStorage.getItem("accessToken") : "");

        if (!BACKEND_URL) {
            alert("백엔드 주소가 설정되지 않았습니다.");
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/users/oauth-complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(atk ? { Authorization: `Bearer ${atk}` } : {}),
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
                            <select
                                className={styles.input}
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
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

                    {/* 약관 */}
                    <div className={styles.row} style={{ marginTop: "28px" }}>
                        <label className={styles.label}>약관 동의</label>

                        <div className={styles.termsBox}>
                            <label className={styles.checkboxRow}>
                                <input type="checkbox" checked={allChecked} onChange={handleAllAgree} />
                                <span>전체 동의합니다</span>
                            </label>

                            <hr className={styles.divider} />

                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={termsChecked}
                                    onChange={(e) => setTermsChecked(e.target.checked)}
                                />
                                <span>
                                    <b>[필수]</b> 이용약관 동의{" "}
                                    <button
                                        type="button"
                                        className={styles.linkBtn}
                                        onClick={() => setShowTerms(true)}
                                    >
                                        보기
                                    </button>
                                </span>
                            </label>

                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={privacyChecked}
                                    onChange={(e) => setPrivacyChecked(e.target.checked)}
                                />
                                <span>
                                    <b>[필수]</b> 개인정보 수집 및 이용 동의{" "}
                                    <button
                                        type="button"
                                        className={styles.linkBtn}
                                        onClick={() => setShowPrivacy(true)}
                                    >
                                        보기
                                    </button>
                                </span>
                            </label>

                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={marketingChecked}
                                    onChange={(e) => setMarketingChecked(e.target.checked)}
                                />
                                <span>[선택] 마케팅 정보 수신 동의</span>
                            </label>
                        </div>
                    </div>

                    {/* 약관 모달들 */}
                    {showTerms && (
                        <div className={styles.modalOverlay} onClick={() => setShowTerms(false)}>
                            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                                <h3>이용약관</h3>
                                <div className={styles.modalBody}>
                                    <p>여기에 서비스 이용약관 내용을 넣어주세요.</p>
                                </div>
                                <button onClick={() => setShowTerms(false)} className={styles.modalBtn}>
                                    닫기
                                </button>
                            </div>
                        </div>
                    )}

                    {showPrivacy && (
                        <div className={styles.modalOverlay} onClick={() => setShowPrivacy(false)}>
                            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                                <h3>개인정보 수집 및 이용 동의</h3>
                                <div className={styles.modalBody}>
                                    <p>여기에 개인정보 처리방침 내용을 넣어주세요.</p>
                                </div>
                                <button onClick={() => setShowPrivacy(false)} className={styles.modalBtn}>
                                    닫기
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" className={styles.submitBtn}>
                        저장하고 시작하기
                    </button>
                </form>
            </div>
        </main>
    );
}
