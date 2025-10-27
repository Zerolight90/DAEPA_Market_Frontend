"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";          // ✅ push 위해 추가
import styles from "./page.module.css";
import CategoryPicker from "./CategoryPicker";
import { API_BASE, Endpoints } from "./api";

export default function Page() {
    const router = useRouter();                          // ✅
    const [form, setForm] = useState({
        upperId: null,
        middleId: null,
        lowId: null,
        title: "",
        price: "",
        content: "",
        location: "",
        pdStatus: 0,
        dDeal: "DELIVERY",                                 // ✅ 기본값 확실히 세팅
        files: [],
    });

    const fileRef = useRef(null);

    const onCategory = (cat) => setForm((p) => ({ ...p, ...cat }));

    const onFiles = (e) => {
        const list = Array.from(e.target.files || []);
        if (list.length > 10) { alert("이미지는 최대 10장까지 업로드 가능합니다."); return; }
        setForm((p) => ({ ...p, files: list }));
    };

    const validate = () => {
        if (!form.upperId || !form.middleId || !form.lowId) { alert("카테고리를 상→중→하 모두 선택하세요."); return false; }
        if (!form.title.trim()) { alert("상품명을 입력하세요."); return false; }
        if (!form.price) { alert("가격을 입력하세요."); return false; }
        if (!form.dDeal) { alert("거래 방식을 선택하세요."); return false; } // ✅ 추가 체크
        return true;
    };
//

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const dto = {
                upperId: form.upperId,
                middleId: form.middleId,
                lowId: form.lowId,
                title: form.title,
                price: Number((form.price || "0").replace(/,/g, "")),
                content: form.content,
                location: form.location,
                pdStatus: form.pdStatus,
                dDeal: form.dDeal,
                imageUrls: [],
            };

            const fd = new FormData();
            fd.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
            (form.files || []).forEach((f) => fd.append("images", f));

            const res = await fetch(`${API_BASE}${Endpoints.createProduct}`, {
                method: "POST",
                // headers: {},                         // ❌ X-USER-ID 제거, Authorization 필요 없음
                body: fd,
                credentials: "include",                 // ✅ 로그인 쿠키 동봉
            });

            // ✅ 미로그인/만료 시 로그인 페이지로 이동
            if (res.status === 401) {
                alert("판매하기는 로그인 후 이용할 수 있어요. 로그인 페이지로 이동합니다.");
                return router.push(`/sing/login?next=${encodeURIComponent("/sell")}&reason=need_login`);
            }

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || `등록 실패 (HTTP ${res.status})`);
            }

            const id = await res.json();
            alert(`상품 등록 완료! (id=${id})`);

            router.push("/mypage");

            setForm({
                upperId: null, middleId: null, lowId: null,
                title: "", price: "", content: "", location: "",
                pdStatus: 0, dDeal: "DELIVERY", files: [],
            });
            if (fileRef.current) fileRef.current.value = "";
        } catch (err) {
            alert(err.message || "등록 중 오류가 발생했습니다.");
        }
    };


    return (
        <main className={styles.wrap}>
            <div className={styles.container}>
                <h1 className={styles.pageTitle}>상품 등록</h1>
                <form onSubmit={submit}>
                    {/* 이미지 업로더 */}
                    <section className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.labelCol}>상품 이미지</div>
                            <div className={styles.fieldCol}>
                                <div className={styles.uploader} onClick={() => fileRef.current?.click()} title="이미지 선택">
                                    <div className={styles.camIcon} />
                                    <div className={styles.counter}>{(form.files || []).length}/10</div>
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
                            </div>
                        </div>
                    </section>

                    {/* 카테고리 */}
                    <section className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.labelCol}>카테고리</div>
                            <div className={styles.fieldCol}>
                                <CategoryPicker onChange={onCategory} />
                            </div>
                        </div>
                    </section>

                    {/* 상품명 */}
                    <section className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.labelCol}>상품명</div>
                            <div className={styles.fieldCol}>
                                <input className={styles.input} value={form.title}
                                       onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="상품명을 입력하세요" />
                            </div>
                        </div>
                    </section>

                    {/* 가격 */}
                    <section className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.labelCol}>가격</div>
                            <div className={styles.fieldCol}>
                                <div className={styles.priceRow}>
                                    <input className={`${styles.input} ${styles.priceInput}`} value={form.price}
                                           onChange={(e) => setForm((p) => ({
                                               ...p,
                                               price: e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                                           }))} placeholder="₩ 판매가격" />
                                    <span className={styles.safePay}><span className={styles.safeDot} />안심결제란?</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 설명 */}
                    <section className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.labelCol}>설명</div>
                            <div className={styles.fieldCol}>
                <textarea className={`${styles.input} ${styles.textarea}`} value={form.content}
                          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="상세 상태, 구성품, 사용감 등을 적어주세요" />
                            </div>
                        </div>
                    </section>

                    {/* 상품 상태 */}
                    <section className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.labelCol}>상품 상태</div>
                            <div className={styles.fieldCol}>
                                <div className={styles.radioInline}>
                                    <label className={styles.radio}>
                                        <input type="radio" name="cond" value="USED"
                                               checked={form.pdStatus === 0}
                                               onChange={() => setForm((p) => ({ ...p, pdStatus: 0 }))} />
                                        <span>중고</span>
                                    </label>
                                    <label className={styles.radio}>
                                        <input type="radio" name="cond" value="NEW"
                                               checked={form.pdStatus === 1}
                                               onChange={() => setForm((p) => ({ ...p, pdStatus: 1 }))} />
                                        <span>새상품</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 거래 방법 */}
                    <section className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.labelCol}>거래 방법</div>
                            <div className={styles.fieldCol}>
                                <div className={styles.radioInline}>
                                    <label className={styles.radio}>
                                        <input type="radio" name="deal" value="DELIVERY"      // ✅ value 부여
                                               checked={form.dDeal === "DELIVERY"}
                                               onChange={(e) => setForm((p) => ({ ...p, dDeal: e.target.value }))} />
                                        <span>택배거래</span>
                                    </label>
                                    <label className={styles.radio}>
                                        <input type="radio" name="deal" value="MEET"
                                               checked={form.dDeal === "MEET"}
                                               onChange={(e) => setForm((p) => ({ ...p, dDeal: e.target.value }))} />
                                        <span>만나서 직거래</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    <button className={styles.primaryBtn} type="submit">등록하기</button>
                </form>
            </div>
        </main>
    );
}
