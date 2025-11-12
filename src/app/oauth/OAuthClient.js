// app/oauth/OAuthClient.js
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

    const [email, setEmail] = useState("");
    const [uname, setUname] = useState("");
    const [nickname, setNickname] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [birth, setBirth] = useState("");
    const [location, setLocation] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [zipcode, setZipcode] = useState("");

    const [nicknameMsg, setNicknameMsg] = useState({ text: "", color: "" });
    const [phoneMsg, setPhoneMsg] = useState({ text: "", color: "" });

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
                router.replace("/sing/login");
                return;
            }

            try {
                const data = await api("/users/me", {
                    headers: { Authorization: `Bearer ${atk}` },
                    credentials: "include",
                });

                // u_status === 1 이면 추가 정보 필요 없음 → 홈
                if (data.u_status === 1 && !forceShow) {
                    router.replace("/");
                    return;
                }

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
            } finally {
                setLoading(false);
            }
        })();
    }, [accessTokenFromQuery, forceShow, router]);

    // 3) 주소 스크립트
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
            {/* 여기 아래는 네가 올린 JSX 그대로라서 유지 */}
            {/* ... */}
        </main>
    );
}
