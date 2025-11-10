"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./info.module.css";
import tokenStore from "@/app/store/TokenStore";

function EditProfileContent() {
    const router = useRouter();
    const { accessToken } = tokenStore();

    const [original, setOriginal] = useState(null);
    const [vo, setVO] = useState({
        u_id: "",
        u_name: "",
        u_phone: "",
        u_birth: "",
        u_gender: "",
        u_address: "",
        u_location: "",
        u_location_detail: "",
        u_nickname: "",
        new_password: "",
        new_password2: "",
    });

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [nickMsg, setNickMsg] = useState({ text: "", color: "" });

    // ✅ 내 정보 불러오기
    useEffect(() => {
        if (!accessToken) {
            setErr("로그인이 필요합니다.");
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const res = await axios.get("/api/sing/me", {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                });
                const data = res.data;

                const hasLocations =
                    Array.isArray(data.locations) && data.locations.length > 0;
                const firstLocation = hasLocations
                    ? data.locations.find((l) => l.locDefault) || data.locations[0]
                    : null;

                let next = {
                    u_id: data.uId || data.u_id || "",
                    u_name: data.uName || data.u_name || "",
                    u_phone: data.uPhone || data.u_phone || "",
                    u_birth: "",
                    u_gender: "",
                    u_address: firstLocation ? firstLocation.locCode || "" : "",
                    u_location: firstLocation ? firstLocation.locAddress || "" : "",
                    u_location_detail: firstLocation ? firstLocation.locDetail || "" : "",
                    u_nickname: data.uNickname || data.u_nickname || "",
                    new_password: "",
                    new_password2: "",
                };

                if (!next.u_birth || !next.u_gender) {
                    try {
                        const res2 = await axios.get("/api/users/me", {
                            headers: { Authorization: `Bearer ${accessToken}` },
                            withCredentials: true,
                        });
                        const data2 = res2.data;

                        next.u_birth = data2.u_birth || data2.uBirth || next.u_birth || "";
                        next.u_gender = data2.u_gender || data2.uGender || next.u_gender || "";
                    } catch {}
                }

                if (next.u_birth && /^[0-9]{8}$/.test(next.u_birth)) {
                    next.u_birth =
                        next.u_birth.slice(0, 4) +
                        "-" +
                        next.u_birth.slice(4, 6) +
                        "-" +
                        next.u_birth.slice(6, 8);
                }

                setVO(next);
                setOriginal(next);
                setLoading(false);
            } catch (e) {
                console.error(e);
                setErr("회원 정보를 불러오지 못했습니다.");
                setLoading(false);
            }
        })();
    }, [accessToken]);

    // ✅ 주소 스크립트 로드
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
        const w = window;
        if (!w.daum || !w.daum.Postcode) {
            alert("우편번호 스크립트가 아직 준비되지 않았어요. 잠시 후 다시 시도해주세요.");
            return;
        }
        new w.daum.Postcode({
            oncomplete: (data) => {
                const addr = data.roadAddress || data.jibunAddress || "";
                setVO((prev) => ({
                    ...prev,
                    u_address: data.zonecode || "",
                    u_location: addr,
                }));
                setTimeout(() => {
                    const el = document.getElementById("u_location_detail");
                    if (el) el.focus();
                }, 0);
            },
        }).open();
    };

    const onChangeVO = (e) => {
        const { name, value } = e.target;
        setVO((prev) => ({ ...prev, [name]: value }));
        if (name === "u_nickname") setNickMsg({ text: "", color: "" });
    };

    const onBlurNickname = async () => {
        if (!vo.u_nickname) return;
        try {
            const res = await axios.get("/api/sing/join/check_nickname", {
                params: { u_nickname: vo.u_nickname },
            });
            if (res.data === true) {
                setNickMsg({ text: "이미 사용 중인 별명입니다.", color: "crimson" });
            } else {
                setNickMsg({ text: "사용 가능한 별명입니다.", color: "green" });
            }
        } catch {
            setNickMsg({
                text: "별명 중복 확인 중 오류가 발생했습니다.",
                color: "crimson",
            });
        }
    };

    // ✅ 저장 (수정버튼 클릭 시)
    const onSave = async (e) => {
        e.preventDefault();
        if (!accessToken) return alert("로그인이 필요합니다.");

        if (vo.new_password && vo.new_password !== vo.new_password2) {
            alert("새 비밀번호가 서로 다릅니다.");
            return;
        }
        if (nickMsg.color === "crimson") {
            alert("사용할 수 없는 별명입니다.");
            return;
        }

        let birthForSend = "";
        if (vo.u_birth) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(vo.u_birth))
                birthForSend = vo.u_birth.replace(/-/g, "");
            else if (/^\d{8}$/.test(vo.u_birth)) birthForSend = vo.u_birth;
            else return alert("생년월일 형식이 올바르지 않습니다.");
        }

        try {
            await axios.post(
                "/api/sing/update",
                {
                    newPassword: vo.new_password || "",
                    newPasswordConfirm: vo.new_password2 || "",
                    nickname: vo.u_nickname || "",
                    gender: vo.u_gender || "",
                    birth: birthForSend || "",
                    zip: vo.u_address || "",
                    address: vo.u_location || "",
                    addressDetail: vo.u_location_detail || "",
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    withCredentials: true,
                }
            );

            alert("회원정보가 수정되었습니다.");
            router.push("/mypage"); // ✅ 수정 후 마이페이지로 이동
        } catch (error) {
            console.error(error);
            alert(error?.response?.data || "회원정보 수정 중 오류가 발생했습니다.");
        }
    };

    const onCancel = () => {
        if (original) setVO(original);
        setNickMsg({ text: "", color: "" });
        router.push("/mypage");
    };

    if (loading) return <main className={styles.container}>불러오는 중...</main>;
    if (err) return <main className={styles.container}>{err}</main>;

    return (
        <main className={styles.container}>
            <h2 className={styles.title}>회원정보 수정</h2>

            <form className={styles.form} onSubmit={onSave}>
                {/* 이메일 */}
                <div className={styles.row}>
                    <label className={styles.label}>이메일(아이디)</label>
                    <input className={styles.input} value={vo.u_id} disabled />
                </div>

                {/* 이름 */}
                <div className={styles.row}>
                    <label className={styles.label}>이름</label>
                    <input className={styles.input} value={vo.u_name} disabled />
                </div>

                {/* 전화번호 */}
                <div className={styles.row}>
                    <label className={styles.label}>전화번호</label>
                    <input className={styles.input} value={vo.u_phone} disabled />
                </div>

                {/* 별명 */}
                <div className={styles.row}>
                    <label className={styles.label}>별명</label>
                    <input
                        name="u_nickname"
                        className={styles.input}
                        value={vo.u_nickname}
                        onChange={onChangeVO}
                        onBlur={onBlurNickname}
                        placeholder="표시될 이름을 입력하세요."
                    />
                    {nickMsg.text && (
                        <span style={{ color: nickMsg.color, fontSize: 13 }}>
              {nickMsg.text}
            </span>
                    )}
                </div>

                {/* 새 비밀번호 */}
                <div className={styles.row}>
                    <label className={styles.label}>새 비밀번호</label>
                    <input
                        type="password"
                        name="new_password"
                        className={styles.input}
                        placeholder="영문/숫자/특수문자 8~20자"
                        pattern={String.raw`^[\x21-\x7E]{8,20}$`}
                        value={vo.new_password}
                        onChange={onChangeVO}
                    />
                </div>
                <div className={styles.row}>
                    <label className={styles.label}>새 비밀번호 확인</label>
                    <input
                        type="password"
                        name="new_password2"
                        pattern={String.raw`^[\x21-\x7E]{8,20}$`}
                        className={styles.input}
                        value={vo.new_password2}
                        onChange={onChangeVO}
                    />
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
                    <label className={styles.label}>생년월일</label>
                    <input
                        type="date"
                        name="u_birth"
                        className={styles.input}
                        value={vo.u_birth || ""}
                        onChange={onChangeVO}
                    />
                </div>

                {/* 주소 */}
                <div className={styles.row}>
                    <span className={styles.label}>주소</span>
                    <div className={styles.addrGrid}>
                        <div className={styles.addrZipWrap}>
                            <input
                                name="u_address"
                                placeholder="우편번호"
                                value={vo.u_address}
                                readOnly
                                className={styles.input}
                            />
                            <button
                                type="button"
                                onClick={openPostcode}
                                className={styles.addrBtn}
                            >
                                주소 찾기
                            </button>
                        </div>

                        <input
                            name="u_location"
                            placeholder="도로명 주소"
                            value={vo.u_location}
                            readOnly
                            className={styles.input}
                        />

                        <input
                            id="u_location_detail"
                            name="u_location_detail"
                            placeholder="상세 주소"
                            value={vo.u_location_detail}
                            onChange={onChangeVO}
                            className={styles.input}
                        />
                    </div>
                </div>

                <div className={styles.btnRow}>
                    <button type="submit" className={styles.submit}>
                        수정하기
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className={styles.cancelBtn}
                    >
                        취소
                    </button>
                </div>
            </form>
        </main>
    );
}

export default function EditProfilePage() {
    return (
        <Suspense fallback={<main style={{ padding: 30 }}>불러오는 중...</main>}>
            <EditProfileContent />
        </Suspense>
    );
}
