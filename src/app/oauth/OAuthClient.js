// app/oauth/OAuthClient.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./oauth.module.css";
import tokenStore from "@/app/store/TokenStore";
import { api } from "@/lib/api/client";

export default function OAuthClient() {
    const router = useRouter();
    const sp = useSearchParams();
    const { setToken } = tokenStore();

    const provider = sp.get("provider") || "naver";
    const accessTokenFromQuery = sp.get("accessToken");
    const refreshTokenFromQuery = sp.get("refreshToken");

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

    // ✅ 중복검사 결과 상태
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

    // 1) 토큰 저장
    useEffect(() => {
        if (accessTokenFromQuery) {
            localStorage.setItem("accessToken", accessTokenFromQuery);
            setToken(accessTokenFromQuery);
        }
        if (refreshTokenFromQuery) {
            localStorage.setItem("refreshToken", refreshTokenFromQuery);
        }
    }, [accessTokenFromQuery, refreshTokenFromQuery, setToken]);

    // 2) 내 정보 조회
    useEffect(() => {
        (async () => {
            const atk = accessTokenFromQuery || localStorage.getItem("accessToken");
            if (!atk) {
                alert("로그인이 필요합니다.");
                router.replace("/sing/login"); // 기존 경로 유지
                return;
            }

            try {
                const data = await api("/users/me", {
                    headers: { Authorization: `Bearer ${atk}` },
                    credentials: "include",
                });

                if (data.u_status === 1 && !forceShow) {
                    router.replace("/");
                    return;
                }

                // 폼 초기값
                setEmail(data.u_id || "");
                setUname(data.u_name || "");
                setNickname(data.u_nickname || "");
                setPhone(data.u_phone || "");
                setGender(data.u_gender || "");
                setBirth(data.u_birth || "");
                setLocation(data.u_location || "");
                setAddressDetail(data.u_location_detail || "");
                setZipcode(data.u_address || "");
            } catch (err) {
                console.error(err);
                setLoading(false);
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

    // 4) 닉네임 자동 중복검사
    useEffect(() => {
        if (!nickname) {
            setNicknameMsg({ text: "", color: "" });
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const exists = await api(
                    `/sing/join/check_nickname?u_nickname=${encodeURIComponent(nickname)}`
                );
                if (exists) {
                    setNicknameMsg({ text: "이미 사용 중인 별명입니다.", color: "red" });
                } else {
                    setNicknameMsg({ text: "사용 가능한 별명입니다.", color: "green" });
                }
            } catch {
                setNicknameMsg({ text: "확인 중 오류 발생", color: "red" });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [nickname]);

    // 5) 전화번호 자동 중복검사
    useEffect(() => {
        if (!phone) {
            setPhoneMsg({ text: "", color: "" });
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const cleanPhone = phone.replace(/[^0-9]/g, "");
                const exists = await api(
                    `/sing/join/check_phone?u_phone=${encodeURIComponent(cleanPhone)}`
                );
                if (exists) {
                    setPhoneMsg({ text: "이미 사용 중인 전화번호입니다.", color: "red" });
                } else {
                    setPhoneMsg({ text: "사용 가능한 전화번호입니다.", color: "green" });
                }
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

        const atk = accessTokenFromQuery || localStorage.getItem("accessToken");

        try {
            await api("/users/oauth-complete", {
                method: "POST",
                headers: {
                    Authorization: atk ? `Bearer ${atk}` : "",
                },
                body: {
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
                },
            });

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

                    {/* 약관 동의 섹션 */}
                    <div className={styles.row} style={{ marginTop: "28px" }}>
                        <label className={styles.label}>약관 동의</label>

                        <div className={styles.termsBox}>
                            {/* 전체동의 */}
                            <label className={styles.checkboxRow}>
                                <input type="checkbox" checked={allChecked} onChange={handleAllAgree} />
                                <span>전체 동의합니다</span>
                            </label>

                            <hr className={styles.divider} />

                            {/* 필수 약관 */}
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

                            {/* 선택 약관 */}
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

                    {/* 약관 보기 모달 */}
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
