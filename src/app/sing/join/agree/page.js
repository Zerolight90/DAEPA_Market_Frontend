"use client";

import { useRouter } from "next/navigation";
import {useEffect, useRef, useState} from "react";
import styles from "../join.module.css";
import axios from "axios";

export default function AgreePage() {
    const api_url = "api/sing/join/agree";

    const router = useRouter();
    const allRef = useRef(null);
    const termsRef = useRef(null);
    const privacyRef = useRef(null);
    const marketingRef = useRef(null);

    // const [vo, setVO] = useState(){
    //     u_agree: "",
    // });

    // 전체동의 ↔ 개별동의 동기화
    useEffect(() => {
        const syncAll = () => {
            const all = allRef.current;
            const list = [termsRef.current, privacyRef.current, marketingRef.current];
            if (!all || list.some((el) => !el)) return;
            const checked = list.every((el) => el.checked);
            const indeterminate = !checked && list.some((el) => el.checked);
            all.indeterminate = indeterminate;
            all.checked = checked;
        };
        const list = [termsRef.current, privacyRef.current, marketingRef.current];
        list.forEach((el) => el?.addEventListener("change", syncAll));
        syncAll();
        return () => list.forEach((el) => el?.removeEventListener("change", syncAll));
    }, []);

    const onToggleAll = (e) => {
        const { checked } = e.target;
        [termsRef.current, privacyRef.current, marketingRef.current].forEach(
            (el) => el && (el.checked = checked)
        );
        allRef.current.indeterminate = false;
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (!termsRef.current?.checked || !privacyRef.current?.checked) {
            alert("필수 약관(이용약관, 개인정보 처리방침)에 모두 동의해주세요.");
            return;
        }

        //선택사항 체크 됐는지 확인
        let agree;
        const checkbox = marketingRef.current;

        if (checkbox && checkbox.checked){
            agree = 1;
        }
        else {
            agree = 0;
        }

        router.push(`/sing/join/form?agree=${agree}`);
    };

    return (
        <main className={styles.container}>
            <h2 className={styles.title}>회원가입 - 약관 동의</h2>

            <form className={styles.form} onSubmit={handleNext}>
                {/* 전체 동의 박스 */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <label className={styles.checkTitle}>
                            <input ref={allRef} type="checkbox" onChange={onToggleAll} />
                            <strong>전체 동의</strong>
                        </label>
                    </div>
                </div>

                {/* 이용약관(필수) 박스 */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <label className={styles.checkTitle}>
                            <input ref={termsRef} type="checkbox" required />
                            <span className={styles.required}>[필수]</span>
                            <span>이용약관 동의</span>
                        </label>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.termsBox}>
                            <h4>제1장 총칙</h4>
                            <p>제1조(목적) 본 약관은 대파(이하 ‘회사’)가 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정합니다.</p>
                            <p>제2조(정의) ‘서비스’란 회사가 제공하는 중고거래 플랫폼 및 부가 기능을 말합니다.</p>
                            <h4>제2장 서비스 이용</h4>
                            <p>제5조(계정 생성) 이용자는 사실에 근거한 정보로 회원가입을 하여야 합니다.</p>
                            <h4>제3장 이용제한</h4>
                            <p>약관 위반, 불법행위, 권리침해가 확인되는 경우 이용을 제한할 수 있습니다.</p>
                            <p className={styles.note}>※ 실제 오픈 시 법무 검토본으로 교체하세요.</p>
                        </div>
                    </div>
                </section>

                {/* 개인정보 처리방침(필수) 박스 */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <label className={styles.checkTitle}>
                            <input ref={privacyRef} type="checkbox" required />
                            <span className={styles.required}>[필수]</span>
                            <span>개인정보 처리방침 동의</span>
                        </label>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.termsBox}>
                            <h4>1. 수집 항목</h4>
                            <p>이메일, 비밀번호, 이름, 연락처, 주소 등. 서비스 이용 중 기기정보/접속로그 수집 가능.</p>
                            <h4>2. 이용 목적</h4>
                            <p>회원 식별, 거래 중개, 고객지원, 부정 이용 방지, 법령 준수.</p>
                            <h4>3. 보유 기간</h4>
                            <p>회원 탈퇴 시까지 또는 법령상 보관기간.</p>
                            <h4>4. 제3자 제공/처리위탁</h4>
                            <p>필요 시 사전 고지·동의를 거쳐 처리위탁할 수 있습니다.</p>
                            <p className={styles.note}>※ 실제 오픈 시 최신 정책 전문으로 교체하세요.</p>
                        </div>
                    </div>
                </section>

                {/* 마케팅(선택) 박스 */}
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <label className={styles.checkTitle}>
                            <input ref={marketingRef} type="checkbox" />
                            <span className={styles.optional}>[선택]</span>
                            <span>마케팅 정보 수신 동의 (이메일/푸시)</span>
                        </label>
                    </div>

                    <div className={styles.cardBody}>
                        <div className={styles.termsBoxSm}>
                            <p>이벤트/혜택 소식을 받아볼 수 있습니다. 미동의해도 서비스 이용 가능하며, 마이페이지에서 언제든 변경할 수 있어요.</p>
                        </div>
                    </div>
                </section>

                <button type="submit" className={styles.submit}>다음 단계</button>
            </form>
        </main>
    );
}
