"use client";

import { useState } from "react";
import Link from "next/link";
// 로그인 페이지와 같은 CSS 파일을 사용한다고 가정합니다.
import styles from "@/app/sing/login/login.module.css";
import axios from "axios";

export default function FindIdPage() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [result, setResult] = useState(null); // 결과를 저장할 상태 (null, 'loading', {id: '...'..}, 'error')
    const [error, setError] = useState("");

    const handleFindId = async (e) => {
        e.preventDefault();
        setResult('loading');
        setError("");

        try {

            const response = await axios.post("/api/sing/login/find_id", {
                u_name: name,
                u_phone: phone
            });

            if (response.status === 200 && response?.data?.uId) {
                // 성공적으로 아이디를 찾았을 때
                setResult({ uId: response.data.uId, uDate: response.data.uDate });
            } else {
                // 백엔드에서 실패 응답을 보냈을 때
                setError(response.data.message || "일치하는 회원 정보가 없습니다.");
                setResult('error');
            }

        } catch (err) {
            // 💡 1. 디버깅: 콘솔에 전체 오류 객체 출력
            console.error("아이디 찾기 요청 오류:", err);

            // 💡 2. 서버에서 받은 상태 코드와 메시지 확인
            const status = err.response?.status;
            const serverMessage = err.response?.data?.message;

            let displayError = "아이디 찾기 중 오류가 발생했습니다.";

            if (status) {
                // 상태 코드가 있을 경우, 404나 500 응답이 왔다는 뜻
                displayError = `서버 응답 오류 (Status ${status}).`;
                if (serverMessage) {
                    // 서버가 구체적인 메시지를 보냈으면 그 메시지를 사용
                    displayError = serverMessage;
                }
            }

            setError(displayError);
            setResult('error');
        }
    };

    // 아이디 찾기 결과를 보여주는 UI
    if (result && result !== 'loading' && result !== 'error') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>아이디 찾기 결과</h1>
                    <div className={styles.resultBox}>
                        <p className={styles.resultMessage}>회원님의 아이디를 찾았습니다.</p>
                        <p className={styles.foundId}>
                            아이디: <strong>{result.uId}</strong>
                        </p>
                        <p className={styles.foundDate}>
                            가입일: {result.uDate}
                        </p>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/sing/login" className={styles.submitBtn} style={{ textAlign: 'center' }}>
                            로그인하기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 아이디 찾기 입력 폼 UI
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>아이디 찾기</h1>

                <form onSubmit={handleFindId}>
                    {/* 이름 입력 */}
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

                    {/* 전화번호 입력 */}
                    <div className={styles.row}>
                        <label htmlFor="u_phone" className={styles.label}>전화번호</label>
                        <input
                            id="u_phone"
                            name="u_phone"
                            type="tel"
                            placeholder="'-' 없이 입력하세요"
                            required
                            pattern="[0-9]{10,11}" // 10~11자리 숫자 패턴
                            className={styles.input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    {/* 에러 메시지 표시 */}
                    {error && <p className={styles.error} style={{ marginTop: '15px' }}>{error}</p>}

                    {/* 버튼 및 로딩 상태 */}
                    <div className={styles.actions} style={{ marginTop: '30px' }}>
                        <button type="submit"
                                className={styles.submitBtn}
                                disabled={result === 'loading'}>
                            {result === 'loading' ? '검색 중...' : '아이디 찾기'}
                        </button>
                    </div>
                </form>

                {/* 하단 링크 */}
                <div className={styles.links}>
                    <Link href="/sing/login" className={styles.link}>로그인</Link>
                    <span className={styles.divider}>|</span>
                    <Link href="/sing/login/find_password" className={styles.link}>비밀번호 찾기</Link>
                </div>
            </div>
        </div>
    );
}