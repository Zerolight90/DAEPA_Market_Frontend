"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/sing/login/login.module.css";
import axios from "axios";

export default function FindPasswordPage() {
    const [uId, setUId] = useState("");       // 이메일(아이디)
    const [name, setName] = useState("");     // 이름
    const [phone, setPhone] = useState("");   // 전화번호(숫자만)
    const [result, setResult] = useState(null); // null | 'loading' | 'error' | { message: string }
    const [error, setError] = useState("");

    const handleFindPassword = async (e) => {
        e.preventDefault();
        setResult("loading");
        setError("");

        try {
            //  엔드포인트 & 필드명은 백엔드에 맞춰 조정
            // 예: POST /api/sing/find_password  body: { u_id, u_name, u_phone }
            const response = await axios.post("/api/sing/find_password", {
                u_id: uId,
                u_name: name,
                u_phone: phone,
            });

            // 응답 구조에 맞게 success/data/message 필드 확인
            if (response.status === 200 && response.data?.success) {
                // 백엔드가 내려주는 메시지를 그대로 노출하거나, 고정 문구로 안내
                const msg = response.data?.message || "임시 비밀번호(또는 재설정 링크)를 전송했습니다.";
                setResult({ message: msg });
            } else {
                setError(response.data?.message || "일치하는 회원 정보가 없습니다.");
                setResult("error");
            }
        } catch (err) {
            setError(err.response?.data?.message || "비밀번호 찾기 중 오류가 발생했습니다.");
            setResult("error");
        }
    };

    // 결과 UI
    if (result && result !== "loading" && result !== "error") {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>비밀번호 찾기 결과</h1>

                    <div className={styles.resultBox}>
                        <p className={styles.resultMessage}>
                            {result.message || "요청이 완료되었습니다."}
                        </p>
                        <p className={styles.foundDate}>
                            ※ 메일이 보이지 않으면 스팸함을 확인해 주세요.
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/sing/login" className={styles.submitBtn} style={{ textAlign: "center" }}>
                            로그인 하러가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    //  폼 UI
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
                        <button type="submit" className={styles.submitBtn} disabled={result === "loading"}>
                            {result === "loading" ? "처리 중..." : "비밀번호 찾기"}
                        </button>
                    </div>
                </form>

                {/* 하단 링크 */}
                <div className={styles.links}>
                    <Link href="/sing/login" className={styles.link}>로그인</Link>
                    <span className={styles.divider}>|</span>
                    <Link href="/sing/find_id" className={styles.link}>아이디 찾기</Link>
                </div>
            </div>
        </div>
    );
}
