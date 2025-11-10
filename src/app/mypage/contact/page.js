"use client";

import { useEffect, useState } from "react";
import SideNav from "@/components/mypage/sidebar";
import "./mypage-contact.css";

const BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:8080";

const STATUS_LABELS = {
    1: "불편 신고",
    2: "거래 관련",
    3: "계정/로그인",
    4: "기타 문의",
};

export default function MyContactPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [filter, setFilter] = useState("all"); // all | wait | done

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/1on1/my`, {
                    credentials: "include",
                });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const data = await res.json();

                const normalized = (data || []).map((it) => ({
                    id: it.ooIdx ?? it.idx ?? it.id,
                    status: it.ooStatus ?? it.status,
                    title: it.ooTitle ?? it.title,
                    content: it.ooContent ?? it.content,
                    photo: it.ooPhoto ?? it.photo,
                    date: it.ooDate ?? it.date,
                    reply: it.ooRe ?? it.re,
                    writer:
                        it.writer ??
                        it.user?.uNickname ??
                        it.user?.uName ??
                        "나",
                }));

                setItems(normalized);
                setErr(null);
            } catch (e) {
                console.error(e);
                setErr("문의 목록을 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = items.filter((it) => {
        if (filter === "all") return true;
        if (filter === "wait") return !it.reply;
        if (filter === "done") return !!it.reply;
        return true;
    });

    return (
        <div className="mc-shell">
            {/* 왼쪽 패널 */}
            <SideNav />

            {/* 오른쪽 내용 */}
            <main className="mc-page">
                <header className="mc-header">
                    <h1 className="mc-title">1:1 문의 내역</h1>
                    <p className="mc-desc">내가 남긴 문의와 답변을 확인할 수 있습니다.</p>

                    <div className="mc-filter-row">
                        <button
                            className={filter === "all" ? "mc-filter-btn active" : "mc-filter-btn"}
                            onClick={() => setFilter("all")}
                        >
                            전체
                        </button>
                        <button
                            className={filter === "wait" ? "mc-filter-btn active" : "mc-filter-btn"}
                            onClick={() => setFilter("wait")}
                        >
                            답변대기
                        </button>
                        <button
                            className={filter === "done" ? "mc-filter-btn active" : "mc-filter-btn"}
                            onClick={() => setFilter("done")}
                        >
                            답변완료
                        </button>
                    </div>
                </header>

                {loading ? (
                    <p className="mc-state-text">불러오는 중…</p>
                ) : err ? (
                    <p className="mc-state-text mc-error">{err}</p>
                ) : filtered.length === 0 ? (
                    <p className="mc-state-text">해당 조건의 1:1 문의가 없습니다.</p>
                ) : (
                    <ul className="mc-list">
                        {filtered.map((item) => (
                            <li key={item.id} className="mc-card">
                                <div className="mc-card-top">
                  <span className="mc-badge">
                    {STATUS_LABELS[item.status] ?? "문의"}
                  </span>
                                    {item.reply ? (
                                        <span className="mc-badge-replied">답변완료</span>
                                    ) : (
                                        <span className="mc-badge-wait">답변대기</span>
                                    )}
                                </div>

                                <h2 className="mc-card-title">
                                    {item.title || "(제목 없음)"}
                                </h2>
                                <p className="mc-meta">
                                    {item.date ? item.date : ""}
                                    {item.writer ? ` · ${item.writer}` : ""}
                                </p>

                                {item.content && <p className="mc-content">{item.content}</p>}

                                {item.photo && (
                                    <div className="mc-photo-wrap">
                                        <img src={item.photo} alt="문의 첨부" className="mc-photo" />
                                    </div>
                                )}

                                {item.reply && (
                                    <div className="mc-reply-box">
                                        <p className="mc-reply-title">관리자 답변</p>
                                        <p className="mc-reply-text">{item.reply}</p>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}
