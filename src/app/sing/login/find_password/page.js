"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/app/sing/login/login.module.css";
import axios from "axios";

export default function FindPasswordPage() {
    const router = useRouter();

    // 1) 본인 확인용 입력값
    const [uId, setUId] = useState("");     // 이메일(아이디)
    const [name, setName] = useState("");   // 이름
    const [phone, setPhone] = useState(""); // 전화번호(숫자만)

    // 2) 단계/오류 상태
    // stage: "idle" | "loading" | "verified" | "resetting"
    const [stage, setStage] = useState("idle");
    const [error, setError] = useState("");

    // 3) 비밀번호 재설정 입력값
    const [newPw, setNewPw] = useState("");
    const [newPw2, setNewPw2] = useState("");

    // 본인 확인 (아이디/이름/전화번호로 조회)
    const handleFindPassword = async (e) => {
        e.preventDefault();
        setStage("loading");
        setError("");

        try {
            const res = await axios.post("/api/sing/login/find_password", {
                u_id: uId,
                u_name: name,
                u_phone: phone,
            });

            const okByFlag = res.data && res.data.success === true;
            const okByLoose200 = res.status === 200 && res.data; // 임시 호환

            if (okByFlag || okByLoose200) {
                // 본인 확인 성공 → 비밀번호 입력 단계로 전환
                setStage("verified");
            } else {
                setError(res.data?.message || "일치하는 회원 정보가 없습니다.");
                setStage("idle");
            }
        } catch (err) {
            setError(err.response?.data?.message || "비밀번호 찾기 중 오류가 발생했습니다.");
            setStage("idle");
        }
    };

    // 비밀번호 재설정
    const handleResetPassword = async () => {
        setError("");

        if (!newPw || !newPw2) {
            setError("새 비밀번호와 확인 값을 모두 입력해주세요.");
            return;
        }
        if (newPw !== newPw2) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }
        // 기본 예시: 8~20자 가시 문자
        if (!/^[\x21-\x7E]{8,20}$/.test(newPw)) {
            setError("비밀번호는 8~20자 이내의 영문/숫자/특수문자를 사용해주세요.");
            return;
        }

        try {
            setStage("resetting");
            // 백엔드: PUT /api/sing/find_password/reset  body: { u_id, new_password }
            const res = await axios.put("/api/sing/find_password/reset", {
                u_id: uId,
                new_password: newPw,
            });

            if (res.status === 200) {
                alert("비밀번호가 성공적으로 변경되었습니다!");
                router.push("/sing/login");
            } else {
                setError(res.data?.message || "비밀번호 변경에 실패했습니다.");
                setStage("verified");
            }
        } catch (err) {
            setError(err.response?.data?.message || "서버 오류가 발생했습니다.");
            setStage("verified");
        }
    };

    // ========================
    // ① 비밀번호 재설정 단계 UI
    // ========================
    if (stage === "verified" || stage === "resetting") {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>비밀번호 재설정</h1>

                    <div className={styles.resultBox}>
                        <p className={styles.resultMessage}>새로운 비밀번호를 입력하세요.</p>

                        <input
                            type="password"
                            placeholder="새 비밀번호 (8~20자)"
                            className={styles.input}
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="비밀번호 확인"
                            className={styles.input}
                            value={newPw2}
                            onChange={(e) => setNewPw2(e.target.value)}
                        />

                        {error && <p className={styles.error} style={{ marginTop: 12 }}>{error}</p>}
                    </div>

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.submitBtn}
                            onClick={handleResetPassword}
                            disabled={stage === "resetting"}
                        >
                            {stage === "resetting" ? "변경 중..." : "비밀번호 변경"}
                        </button>
                    </div>

                    <div className={styles.links}>
                        <Link href="/sing/login" className={styles.link}>로그인</Link>
                        <span className={styles.divider}>|</span>
                        <Link href="/sing/login/find_id" className={styles.link}>아이디 찾기</Link>
                    </div>
                </div>
            </div>
        );
    }

    // ========================
    // ② 본인 확인 단계 UI
    // ========================
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>비밀번호 찾기</h1>

                <form onSubmit={handleFindPassword}>
                    {/* 아이디(이메일) */}
                    <div className={styles.row}>
                        <label htmlFor="u_id" className={styles.label}>아이디(이메일)</label>
                        <input
                            id="u_id"
                            name="u_id"
                            type="email"
                            placeholder="가입한 이메일을 입력하세요"
                            required
                            className={styles.input}
                            value={uId}
                            onChange={(e) => setUId(e.target.value)}
                        />
                    </div>

                    {/* 이름 */}
                    <div className={styles.row}>
                        <label htmlFor="u_name" className={styles.label}>이름</label>
                        <input
                            id="u_name"
                            name="u_name"
                            type="text"
                            placeholder="이름을 입력하세요"
                            required
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* 전화번호 */}
                    <div className={styles.row}>
                        <label htmlFor="u_phone" className={styles.label}>전화번호</label>
                        <input
                            id="u_phone"
                            name="u_phone"
                            type="tel"
                            placeholder="'-' 없이 숫자만 입력"
                            required
                            pattern="[0-9]{10,11}"
                            className={styles.input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    {/* 에러 */}
                    {error && <p className={styles.error} style={{ marginTop: 12 }}>{error}</p>}

                    {/* 버튼 */}
                    <div className={styles.actions} style={{ marginTop: 24 }}>
                        <button type="submit" className={styles.submitBtn} disabled={stage === "loading"}>
                            {stage === "loading" ? "확인 중..." : "비밀번호 재설정"}
                        </button>
                    </div>
                </form>

                {/* 하단 링크 */}
                <div className={styles.links}>
                    <Link href="/sing/login" className={styles.link}>로그인</Link>
                    <span className={styles.divider}>|</span>
                    <Link href="/sing/login/find_id" className={styles.link}>아이디 찾기</Link>
                </div>
            </div>
        </div>
    );
}
