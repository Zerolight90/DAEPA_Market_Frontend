"use client";

import { useRef, useState } from "react";
import "./contact.css";



const CATEGORIES = [
    { code: 1, label: "불편 신고" },
    { code: 2, label: "거래 관련" },
    { code: 3, label: "계정/로그인" },
    { code: 4, label: "기타 문의" },
];

export default function ContactPage() {
    // 선택된 문의 종류 (기본 1: 불편 신고)
    const [status, setStatus] = useState(1);
    // 제목
    const [title, setTitle] = useState("");
    // 내용
    const [content, setContent] = useState("");
    // 이미지 미리보기
    const [preview, setPreview] = useState(null);
    // 실제 파일
    const [photoFile, setPhotoFile] = useState(null);
    const fileRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);

    const onSelectFile = () => {
        if (!fileRef.current) return;
        fileRef.current.value = "";
        fileRef.current.click();
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPreview(ev.target?.result || null);
            setPhotoFile(file);
        };
        reader.readAsDataURL(file);
    };

    const onRemoveFile = () => {
        setPreview(null);
        setPhotoFile(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const onSubmit = async () => {
        if (!title.trim()) {
            alert("문의 제목을 입력하세요.");
            return;
        }
        if (!content.trim()) {
            alert("내용을 입력하세요.");
            return;
        }

        const dto = {
            status, // 1~4
            title: title.trim(),
            content: content.trim(),
        };

        const formData = new FormData();
        formData.append(
            "dto",
            new Blob([JSON.stringify(dto)], { type: "application/json" })
        );
        if (photoFile) {
            formData.append("photo", photoFile);
        }

        try {
            setSubmitting(true);
            const res = await fetch(`/api/1on1/create-multipart`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "등록 실패");
            }

            alert("문의가 등록됐습니다.");

            // 입력 초기화
            setTitle("");
            setContent("");
            setPreview(null);
            setPhotoFile(null);
            setStatus(1);
            if (fileRef.current) fileRef.current.value = "";
        } catch (err) {
            console.error(err);
            alert("등록 중 오류가 발생했습니다.\n" + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="contact-wrap">
            {/* 상단 */}
            <header className="contact-top">
                <button
                    type="button"
                    className="contact-back"
                    onClick={() => (window.location.href = "/")}
                >
                    ←
                </button>
                <h1 className="contact-top-title">1:1 문의</h1>
            </header>

            {/* 문의 유형 */}
            <section className="contact-section">
                <div className="contact-category-row">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.code}
                            type="button"
                            className={`contact-category-btn ${
                                status === cat.code ? "is-active" : ""
                            }`}
                            onClick={() => setStatus(cat.code)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* 제목 */}
            <section className="contact-section">
                <label className="contact-label" htmlFor="contact-title">
                    문의 제목
                </label>
                <input
                    id="contact-title"
                    className="contact-input"
                    placeholder="예) 배송이 너무 늦습니다"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={50}
                />
            </section>

            {/* 내용 */}
            <section className="contact-section">
                <label className="contact-label" htmlFor="contact-content">
                    내용
                </label>
                <textarea
                    id="contact-content"
                    className="contact-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="접수된 문의는 순차적으로 답변해 드리고 있습니다. 정확한 답변을 위해 문의 내용을 상세히 작성해 주세요. 필요 시, 문의하신 내용에 대해 전화로 연락드릴 수 있습니다. - 운영 시간: 오전 9시 ~ 오후 6시 (평일)"
                />
            </section>

            {/* 사진 */}
            <section className="contact-section">
                <div className="contact-label">사진</div>
                <div className="contact-photo-row">
                    {preview ? (
                        <div
                            className="contact-photo-preview"
                            style={{ backgroundImage: `url(${preview})` }}
                        >
                            <button
                                type="button"
                                className="contact-photo-del"
                                onClick={onRemoveFile}
                            >
                                ×
                            </button>
                        </div>
                    ) : null}
                    <button
                        type="button"
                        className="contact-photo-add"
                        onClick={onSelectFile}
                    >
                        +
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={onFileChange}
                    />
                </div>
            </section>

            {/* 안내 */}
            <section className="contact-section">
                <ul className="contact-notice">
                    <li>
                        - 제품 사용, 오염, 전용 박스 손상, 라벨 제거, 사용품 및 부속 사용/분실 시,
                        교환/환불이 불가능합니다.
                    </li>
                    <li>- 1:1 문의 처리 내역은 마이페이지 &gt; 1:1 문의에서 확인하실 수 있습니다.</li>
                    <li>
                        - 상품 정보(사이즈, 실측, 예상 배송일 등) 관련 문의는 해당 상품 문의에
                        남겨 주세요.
                    </li>
                </ul>
            </section>

            {/* 버튼 */}
            <footer className="contact-bottom">
                <button
                    type="button"
                    className="contact-btn contact-btn-gray"
                    onClick={() => history.back()}
                >
                    취소
                </button>
                <button
                    type="button"
                    className="contact-btn contact-btn-black"
                    onClick={onSubmit}
                    disabled={submitting}
                >
                    {submitting ? "작성 중…" : "작성하기"}
                </button>
            </footer>
        </main>
    );
}
