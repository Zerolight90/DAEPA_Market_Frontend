"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../join.module.css";
import axios from "axios";

export default function JoinFormPage() {
    const router = useRouter();
    const api_url = "/api/sing/join/signup";

    //아이디, 별명, 전화번호 중복 확인
    const check_id = "/api/sing/join/check_id"
    const check_nickname = "/api/sing/join/check_nickname"
    const check_phone = "/api/sing/join/check_phone"


    // 2단계에서 전달받은 이메일 (필요 시 초기값으로 세팅 가능)
    const params = useSearchParams();
    const email = params.get("email") || "";

    //선택사항 param으로 가지고 오기
    const agreeparam = params.get("agree");

    //아이디, 별명, 전화번호 중복 관련 메시지
    const [checkMsg, setCheckMsg] = useState({
        u_id: { text: '', color: ''},
        u_nickname: { text: '', color: '' },
        u_phone: { text: '', color: '' },
    });

    // 모든 입력값을 한 state로 관리
    const [vo, setVO] = useState({
        u_id: email || "",
        u_pw: "",
        u_pw2: "",
        u_name: "",
        u_nickname: "",
        u_phone: "",
        u_address: "",            // 우편번호
        u_location: "",           // 도로명
        u_location_detail: "",
        u_birth: "",
        u_gender: "",
        u_agree: agreeparam,
    });

    // 공통 입력 핸들러
    const onChangeVO = (e) => {
        const {name, value} = e.target;
        setVO((prev) => ({...prev, [name]: value}));

        setCheckMsg((prev) => ({...prev, [name]: { text: '', color: ''}}));
    };

    // 카카오(다음) 우편번호 스크립트 로드
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
                // 우편번호/도로명을 vo에도 즉시 반영
                setVO((prev) => ({
                    ...prev,
                    u_address: data.zonecode || "",
                    u_location: addr,
                }));
                setTimeout(() => document.getElementById("u_location_detail")?.focus(), 0);
            },
        }).open();
    };

    const handleBlur = async (field) => {
        try{
            let url = "";
            let params = {};
            let value = vo[field];

            if(field === "u_id" && vo.u_id){
                url = check_id;
                params = {u_id: value}
            }
            else if(field === "u_nickname" && vo.u_nickname){
                url = check_nickname;
                params = {u_nickname: value}
            }
            else if(field === "u_phone" && vo.u_phone){
                url = check_phone;
                params = {u_phone: value}
            }
            else
                return;

            const res = await axios.get(url, {params});

                    if(res.data === true) {
                        setCheckMsg((prev) => ({...prev, [field]: { text: '이미 사용 중입니다.', color: 'red' }}));
                    }
                    else {
                        setCheckMsg((prev) => ({...prev, [field]: { text: '사용 가능합니다.', color: 'green' }}));
                    }
        }
        catch (err) {
            console.error(err);
            alert("중복 확인 중 오류가 발생했습니다.");
        }

    }

    // 제출
    function saveData(e) {
        e.preventDefault();

        if (checkMsg.u_id.color === 'red') {
            alert("이미 사용 중인 이메일입니다. 수정 후 다시 확인해주세요.");
            return;
        }
        if (checkMsg.u_nickname.color === 'red') {
            alert("이미 사용 중인 별명입니다. 수정 후 다시 확인해주세요.");
            return;
        }
        if (checkMsg.u_phone.color === 'red') {
            alert("이미 사용 중인 전화번호입니다. 수정 후 다시 확인해주세요.");
            return;
        }


        if (!vo.u_id || !vo.u_pw || !vo.u_name || !vo.u_nickname || !vo.u_phone || !vo.u_birth || !vo.u_gender) {
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


        console.log("API URL:", api_url);
        console.log("Payload:", payload);

        //비동기식 통신
        axios
            .post(api_url, payload)
            .then((res) => {
                // 서버 응답 확인
                console.log(res.data);
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
                {/* 이메일 */}
                <div className={styles.row}>
                    <label htmlFor="u_id" className={styles.label}>이메일</label>
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
                    />
                    <div style={{ color: checkMsg.u_id.color, fontSize: '0.9em', marginTop: '5px' }}>
                        {checkMsg.u_id.text}
                    </div>
                </div>

                {/* 비밀번호 */}
                <div className={styles.row}>
                    <label htmlFor="u_pw" className={styles.label}>비밀번호</label>
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
                    <label htmlFor="u_pw2" className={styles.label}>비밀번호 확인</label>
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
                    <label htmlFor="u_name" className={styles.label}>이름</label>
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
                    <label htmlFor="u_nickname" className={styles.label}>별명</label>
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
                    <div style={{ color: checkMsg.u_nickname.color, fontSize: '0.9em', marginTop: '5px' }}>
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
                    <label htmlFor="u_birth" className={styles.label}>생년월일</label>
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
                    <label htmlFor="u_phone" className={styles.label}>전화번호</label>
                    <input
                        id="u_phone"
                        name="u_phone"
                        type="tel"
                        placeholder="010-1234-5678"
                        required
                        pattern={String.raw`^01[016789]-?\d{3,4}-?\d{4}$`}
                        value={vo.u_phone}
                        onChange={onChangeVO}
                        onBlur={() => handleBlur("u_phone")}
                        autoComplete="tel"
                        className={styles.input}
                    />
                    <div style={{ color: checkMsg.u_phone.color, fontSize: '0.9em', marginTop: '5px' }}>
                        {checkMsg.u_phone.text}
                    </div>
                </div>

                {/* 주소 (카카오 우편번호 API) */}
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

                <button type="submit" className={styles.submit}>회원가입 완료</button>
            </form>
        </main>
    );
}
