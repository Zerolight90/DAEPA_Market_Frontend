"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../join.module.css";
import axios from "axios";
import { CircularProgress, Box, Typography } from "@mui/material";

function JoinFormContent() {
    const router = useRouter();
    const api_url = "/api/sing/join/signup";

    // 중복확인 API
    const check_id = "/api/sing/join/check_id";
    const check_nickname = "/api/sing/join/check_nickname";
    const check_phone = "/api/sing/join/check_phone";

    // ✅ 이메일 인증 API (백엔드 경로 맞게 바꿔도 됨)
    const send_code_api = "/api/mail/send";
    const verify_code_api = "/api/mail/verify";

    const params = useSearchParams();
    const email = params.get("email") || "";
    const agreeparam = params.get("agree");

    const [checkMsg, setCheckMsg] = useState({
        u_id: { text: "", color: "" },
        u_nickname: { text: "", color: "" },
        u_phone: { text: "", color: "" },
    });

    const [vo, setVO] = useState({
        u_id: email || "",
        u_pw: "",
        u_pw2: "",
        u_name: "",
        u_nickname: "",
        u_phone: "",
        u_address: "",
        u_location: "",
        u_location_detail: "",
        u_birth: "",
        u_gender: "",
        u_agree: agreeparam,
    });

    // =========================
    // 이메일 인증 관련 상태
    // =========================
    const [isSending, setIsSending] = useState(false);
    const [codeBoxOpen, setCodeBoxOpen] = useState(false);
    const [authCode, setAuthCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [timer, setTimer] = useState(0); // 초 단위 (5분 = 300초)
    const [emailErr, setEmailErr] = useState(""); // 이메일 인증 관련 메시지

    // 5분 카운트다운
    useEffect(() => {
        if (!codeBoxOpen || timer <= 0 || isEmailVerified) return;
        const t = setInterval(() => setTimer((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [codeBoxOpen, timer, isEmailVerified]);

    const formatTimer = (s) => {
        const m = Math.floor(s / 60)
            .toString()
            .padStart(2, "0");
        const ss = (s % 60).toString().padStart(2, "0");
        return `${m}:${ss}`;
    };

    // 이메일 코드 발송
    const onSendEmailCode = async () => {
        setEmailErr("");
        if (!vo.u_id) {
            setEmailErr("이메일을 입력해 주세요.");
            return;
        }
        // 간단한 이메일 패턴 체크
        const re = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
        if (!re.test(vo.u_id)) {
            setEmailErr("올바른 이메일 형식이 아닙니다.");
            return;
        }
        try {
            setIsSending(true);
            // 백엔드로 인증코드 발송 요청
            await axios.post(send_code_api, { email: vo.u_id });
            setCodeBoxOpen(true);
            setTimer(300); // 5분
            setEmailErr("인증코드를 보냈습니다. 메일함을 확인해 주세요.");
        } catch (e) {
            setEmailErr(e?.response?.data?.message || "인증코드 발송에 실패했습니다.");
        } finally {
            setIsSending(false);
        }
    };

    // 인증코드 확인
    const onVerifyCode = async () => {
        setEmailErr("");
        if (!authCode) {
            setEmailErr("인증코드를 입력해 주세요.");
            return;
        }
        if (timer <= 0) {
            setEmailErr("인증 유효 시간이 만료되었습니다. 다시 요청해 주세요.");
            return;
        }
        try {
            setIsVerifying(true);
            const res = await axios.post(verify_code_api, {
                email: vo.u_id,
                code: authCode,
            });
            // 성공 기준은 백엔드 응답에 맞추세요 (여기선 200만 성공으로 처리)
            if (res.status === 200) {
                setIsEmailVerified(true);
                setEmailErr("이메일 인증이 완료되었습니다.");
            } else {
                setEmailErr(res.data?.message || "인증에 실패했습니다.");
            }
        } catch (e) {
            setEmailErr(e?.response?.data?.message || "인증에 실패했습니다.");
        } finally {
            setIsVerifying(false);
        }
    };

    // 공통 입력
    const onChangeVO = (e) => {
        const { name, value } = e.target;
        setVO((prev) => ({ ...prev, [name]: value }));
        setCheckMsg((prev) => ({ ...prev, [name]: { text: "", color: "" } }));
        if (name === "u_id") {
            // 이메일 변경 시 인증 초기화
            setIsEmailVerified(false);
            setCodeBoxOpen(false);
            setTimer(0);
            setAuthCode("");
            setEmailErr("");
        }
    };

    // 카카오 우편번호 스크립트 로드
    useEffect(() => {
        const id = "daum-postcode-script";
        if (document.getElementById(id)) return;
        const s = document.createElement("script");
        s.id = id;
        s.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        s.async = true;
        document.body.appendChild(s);
    }, []);

    // 우편번호 팝업
    const openPostcode = () => {
        if (!window.daum?.Postcode) {
            alert("우편번호 스크립트가 아직 준비되지 않았어요. 잠시 후 다시 시도해주세요.");
            return;
        }
        new window.daum.Postcode({
            oncomplete: (data) => {
                const addr = data.roadAddress || data.jibunAddress || "";
                setVO((prev) => ({
                    ...prev,
                    u_address: data.zonecode || "",
                    u_location: addr,
                }));
                setTimeout(() => document.getElementById("u_location_detail")?.focus(), 0);
            },
        }).open();
    };

    // 중복 체크
    const handleBlur = async (field) => {
        try {
            let url = "";
            let params = {};
            let value = vo[field];

            if (field === "u_id" && vo.u_id) {
                url = check_id;
                params = { u_id: value };
            } else if (field === "u_nickname" && vo.u_nickname) {
                url = check_nickname;
                params = { u_nickname: value };
            } else if (field === "u_phone" && vo.u_phone) {
                url = check_phone;
                params = { u_phone: value };
            } else return;

            const res = await axios.get(url, { params });

            if (res.data === true) {
                setCheckMsg((prev) => ({
                    ...prev,
                    [field]: { text: "이미 사용 중입니다.", color: "red" },
                }));
                // 이메일일 경우 인증창 닫기
                if (field === "u_id") {
                    setCodeBoxOpen(false);
                    setIsEmailVerified(false);
                    setTimer(0);
                    setAuthCode("");
                }
            } else {
                setCheckMsg((prev) => ({
                    ...prev,
                    [field]: { text: "사용 가능합니다.", color: "green" },
                }));

                // ✅ 이메일이 사용 가능하면 자동으로 인증창 열기
                if (field === "u_id") {
                    setCodeBoxOpen(true);   // 인증코드 입력칸 표시
                    setTimer(300);          // 5분 타이머
                    setEmailErr("이메일 인증코드를 입력해주세요.");
                }
            }
        } catch (err) {
            console.error(err);
            alert("중복 확인 중 오류가 발생했습니다.");
        }
    };


    // 제출
    function saveData(e) {
        e.preventDefault();

        // ✅ 이메일 인증 강제
        if (!isEmailVerified) {
            alert("이메일 인증을 완료해 주세요.");
            return;
        }

        if (checkMsg.u_id.color === "red") {
            alert("이미 사용 중인 이메일입니다. 수정 후 다시 확인해주세요.");
            return;
        }
        if (checkMsg.u_nickname.color === "red") {
            alert("이미 사용 중인 별명입니다. 수정 후 다시 확인해주세요.");
            return;
        }
        if (checkMsg.u_phone.color === "red") {
            alert("이미 사용 중인 전화번호입니다. 수정 후 다시 확인해주세요.");
            return;
        }

        if (
            !vo.u_id ||
            !vo.u_pw ||
            !vo.u_name ||
            !vo.u_nickname ||
            !vo.u_phone ||
            !vo.u_birth ||
            !vo.u_gender
        ) {
            alert("필수 항목을 모두 입력해주세요.");
            return;
        }
        if (vo.u_pw !== vo.u_pw2) {
            alert("비밀번호가 서로 일치하지 않습니다.");
            return;
        }
        if (!vo.u_address || !vo.u_location) {
            alert("주소를 입력해주세요. (주소 찾기 버튼으로 우편번호/도로명 선택)");
            return;
        }
        if (!/^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/.test(vo.u_birth)) {
            alert("생년월일은 YYYYMMDD 형식으로 입력해주세요. (예: 20050501)");
            return;
        }

        const payload = {
            u_id: vo.u_id,
            u_pw: vo.u_pw,
            u_name: vo.u_name,
            u_nickname: vo.u_nickname,
            u_phone: vo.u_phone,
            u_address: vo.u_address,
            u_location: vo.u_location,
            u_location_detail: vo.u_location_detail,
            u_birth: vo.u_birth,
            u_gender: vo.u_gender,
            u_agree: vo.u_agree,
        };

        axios
            .post(api_url, payload)
            .then((res) => {
                alert(res.data || "회원가입 성공!");
                router.push("/");
            })
            .catch((err) => {
                console.error(err);
                alert(err?.response?.data || "회원가입 중 오류가 발생했습니다.");
            });
    }

    return (
        <main className={styles.container}>
            <h2 className={styles.title}>회원가입 - 정보 입력</h2>

            <form className={styles.form} onSubmit={saveData}>
                {/* 이메일 + 인증하기 */}
                <div className={styles.row}>
                    <label htmlFor="u_id" className={styles.label}>
                        이메일
                    </label>

                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            id="u_id"
                            name="u_id"
                            type="email"
                            placeholder="example@gmail.com"
                            required
                            pattern={String.raw`^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$`}
                            value={vo.u_id}
                            onChange={onChangeVO}
                            onBlur={() => handleBlur("u_id")}
                            className={styles.input}
                            disabled={isEmailVerified}
                        />
                        <button
                            type="button"
                            className={styles.addrBtn}
                            onClick={onSendEmailCode}
                            disabled={isSending || isEmailVerified}
                            aria-label="이메일 인증코드 발송"
                        >
                            {isEmailVerified ? "인증완료" : isSending ? "발송중..." : "인증하기"}
                        </button>
                    </div>

                    {/* 중복 메시지 */}
                    <div
                        style={{
                            color: checkMsg.u_id.color,
                            fontSize: "0.9em",
                            marginTop: 5,
                        }}
                    >
                        {checkMsg.u_id.text}
                    </div>

                    {/* 인증코드 입력 박스 + 5분 타이머 */}
                    {codeBoxOpen && !isEmailVerified && (
                        <div style={{ marginTop: 10 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input
                                    type="text"
                                    placeholder="인증코드 6자리"
                                    className={styles.input}
                                    value={authCode}
                                    onChange={(e) => setAuthCode(e.target.value)}
                                    maxLength={8}
                                />
                                <button
                                    type="button"
                                    className={styles.addrBtn}
                                    onClick={onVerifyCode}
                                    disabled={isVerifying || timer <= 0}
                                >
                                    {isVerifying ? "확인 중..." : "확인"}
                                </button>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 13 }}>
                                {timer > 0 ? (
                                    <span>남은 시간: {formatTimer(timer)}</span>
                                ) : (
                                    <span style={{ color: "crimson" }}>
                    유효 시간이 만료되었습니다. 다시 인증을 요청해 주세요.
                  </span>
                                )}
                            </div>
                            {emailErr && (
                                <div style={{ marginTop: 6, color: "#ff4d4f", fontSize: 13 }}>
                                    {emailErr}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 인증 완료 메시지 */}
                    {isEmailVerified && (
                        <div style={{ marginTop: 6, color: "#2ecc71", fontSize: 13 }}>
                            이메일 인증이 완료되었습니다.
                        </div>
                    )}
                </div>

                {/* 비밀번호 */}
                <div className={styles.row}>
                    <label htmlFor="u_pw" className={styles.label}>
                        비밀번호
                    </label>
                    <input
                        id="u_pw"
                        name="u_pw"
                        type="password"
                        placeholder="영문/숫자/특수문자 8~20자"
                        required
                        pattern={String.raw`^[\x21-\x7E]{8,20}$`}
                        value={vo.u_pw}
                        onChange={onChangeVO}
                        autoComplete="new-password"
                        className={styles.input}
                    />
                </div>

                {/* 비밀번호 확인 */}
                <div className={styles.row}>
                    <label htmlFor="u_pw2" className={styles.label}>
                        비밀번호 확인
                    </label>
                    <input
                        id="u_pw2"
                        name="u_pw2"
                        type="password"
                        required
                        value={vo.u_pw2}
                        onChange={onChangeVO}
                        autoComplete="new-password"
                        className={styles.input}
                    />
                </div>

                {/* 이름 */}
                <div className={styles.row}>
                    <label htmlFor="u_name" className={styles.label}>
                        이름
                    </label>
                    <input
                        id="u_name"
                        name="u_name"
                        type="text"
                        required
                        value={vo.u_name}
                        onChange={onChangeVO}
                        autoComplete="name"
                        className={styles.input}
                    />
                </div>

                {/* 별명 */}
                <div className={styles.row}>
                    <label htmlFor="u_nickname" className={styles.label}>
                        별명
                    </label>
                    <input
                        id="u_nickname"
                        name="u_nickname"
                        type="text"
                        required
                        placeholder="비속어나 욕설이 포함된 별명은 예고 없이 변경 또는 제한될 수 있어요."
                        value={vo.u_nickname}
                        onChange={onChangeVO}
                        onBlur={() => handleBlur("u_nickname")}
                        className={styles.input}
                    />
                    <div
                        style={{
                            color: checkMsg.u_nickname.color,
                            fontSize: "0.9em",
                            marginTop: 5,
                        }}
                    >
                        {checkMsg.u_nickname.text}
                    </div>
                </div>

                {/* 성별 */}
                <div className={styles.row}>
                    <span className={styles.label}>성별</span>
                    <div className={styles.genderGroup}>
                        <label className={styles.genderItem}>
                            <input
                                type="radio"
                                name="u_gender"
                                value="M"
                                checked={vo.u_gender === "M"}
                                onChange={onChangeVO}
                                required
                            />
                            <span>남성</span>
                        </label>
                        <label className={styles.genderItem}>
                            <input
                                type="radio"
                                name="u_gender"
                                value="F"
                                checked={vo.u_gender === "F"}
                                onChange={onChangeVO}
                            />
                            <span>여성</span>
                        </label>
                    </div>
                </div>

                {/* 생년월일 */}
                <div className={styles.row}>
                    <label htmlFor="u_birth" className={styles.label}>
                        생년월일
                    </label>
                    <input
                        id="u_birth"
                        name="u_birth"
                        type="text"
                        pattern={String.raw`^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$`}
                        placeholder="생년월일 8자리 (예: 20050501)"
                        required
                        value={vo.u_birth}
                        onChange={onChangeVO}
                        className={styles.input}
                    />
                </div>

                {/* 전화번호 */}
                <div className={styles.row}>
                    <label htmlFor="u_phone" className={styles.label}>
                        전화번호
                    </label>
                    <input
                        id="u_phone"
                        name="u_phone"
                        type="tel"
                        placeholder="'-' 없이 숫자만 입력"
                        required
                        pattern={String.raw`^01[016789]-?\d{3,4}-?\d{4}$`}
                        value={vo.u_phone}
                        onChange={onChangeVO}
                        onBlur={() => handleBlur("u_phone")}
                        autoComplete="tel"
                        className={styles.input}
                    />
                    <div
                        style={{ color: checkMsg.u_phone.color, fontSize: "0.9em", marginTop: 5 }}
                    >
                        {checkMsg.u_phone.text}
                    </div>
                </div>

                {/* 주소 */}
                <div className={styles.row}>
                    <span className={styles.label}>주소</span>

                    <div className={styles.addrGrid}>
                        <div className={styles.addrZipWrap}>
                            <input
                                id="u_address"
                                name="u_address"
                                type="text"
                                placeholder="우편번호"
                                value={vo.u_address}
                                readOnly
                                required
                                className={styles.input}
                            />
                            <button
                                type="button"
                                onClick={openPostcode}
                                className={styles.addrBtn}
                                aria-label="우편번호 검색"
                            >
                                주소 찾기
                            </button>
                        </div>

                        <input
                            id="u_location"
                            name="u_location"
                            type="text"
                            placeholder="도로명 주소"
                            value={vo.u_location}
                            readOnly
                            required
                            className={styles.input}
                        />

                        <input
                            id="u_location_detail"
                            name="u_location_detail"
                            type="text"
                            placeholder="상세 주소"
                            value={vo.u_location_detail}
                            onChange={onChangeVO}
                            className={styles.input}
                        />
                    </div>
                </div>

                <button type="submit" className={styles.submit}>
                    회원가입 완료
                </button>
            </form>
        </main>
    );
}

export default function JoinFormPage() {
    return (
        <Suspense fallback={
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress />
                <Typography sx={{ml: 2}}>페이지를 불러오는 중...</Typography>
            </Box>
        }>
            <JoinFormContent />
        </Suspense>
    );
}
