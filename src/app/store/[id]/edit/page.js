// src/app/store/[id]/edit/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProductEditPage() {
    const { id } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // 기본 필드
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [content, setContent] = useState("");
    const [location, setLocation] = useState("");
    const [pdStatus, setPdStatus] = useState(0);
    const [dDeal, setDDeal] = useState("DELIVERY");

    // 카테고리
    const [upperList, setUpperList] = useState([]);
    const [middleList, setMiddleList] = useState([]);
    const [lowList, setLowList] = useState([]);

    const [upperId, setUpperId] = useState("");
    const [middleId, setMiddleId] = useState("");
    const [lowId, setLowId] = useState("");

    // 이미지
    const [existingImages, setExistingImages] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [imagesChanged, setImagesChanged] = useState(false);

    useEffect(() => {
        if (!id) return;

        // 상품 + 카테고리 같이 불러오기
        const loadAll = async () => {
            // 1) 상품
            const prodRes = await fetch(`/api/products/${id}`, { credentials: "include" });
            if (!prodRes.ok) {
                throw new Error("상품을 불러올 수 없습니다.");
            }
            const data = await prodRes.json();

            // 2) 카테고리들
            const [uRes, mRes, lRes] = await Promise.all([
                fetch("/api/categories/upper"),
                fetch("/api/categories/middle"),
                fetch("/api/categories/low"),
            ]);
            const [u, m, l] = await Promise.all([
                uRes.ok ? uRes.json() : [],
                mRes.ok ? mRes.json() : [],
                lRes.ok ? lRes.json() : [],
            ]);

            // 카테고리 목록 저장
            setUpperList(u);
            setMiddleList(m);
            setLowList(l);

            // 기본 필드 채우기
            setTitle(data.pdTitle ?? "");
            setPrice(data.pdPrice ?? "");
            setContent(data.pdContent ?? "");
            setLocation(data.pdLocation ?? data.location ?? "");
            setPdStatus(data.pdStatus ?? 0);
            setDDeal(data.dDeal ?? "DELIVERY");

            // 이미지 기존 것 채우기
            if (Array.isArray(data.images) && data.images.length > 0) {
                setExistingImages(data.images);
            } else if (data.pdThumb) {
                setExistingImages([data.pdThumb]);
            } else {
                setExistingImages([]);
            }

            // 여기서 이름으로 id 찾기 (백엔드가 upperId 안 주니까)
            let foundUpperId = "";
            let foundMiddleId = "";
            let foundLowId = "";

            // lowName -> lowId
            if (data.lowName) {
                const foundLow = l.find((x) => x.lowCt === data.lowName);
                if (foundLow) {
                    foundLowId = String(foundLow.lowIdx);
                    foundMiddleId = String(foundLow.middleIdx); // low가 middle_idx 갖고 있을 거라 가정
                }
            }

            // middleName -> middleId (위에서 못 찾았으면)
            if (!foundMiddleId && data.middleName) {
                const foundMid = m.find((x) => x.middleCt === data.middleName);
                if (foundMid) {
                    foundMiddleId = String(foundMid.middleIdx);
                    foundUpperId = String(foundMid.upperIdx);
                }
            }

            // upperName -> upperId (위에서 못 찾았으면)
            if (!foundUpperId && data.upperName) {
                const foundUp = u.find((x) => x.upperCt === data.upperName);
                if (foundUp) {
                    foundUpperId = String(foundUp.upperIdx);
                }
            }

            // low에서 middle/upper 못 채웠으면 한 번 더 보정
            if (foundLowId && !foundMiddleId) {
                const lowObj = l.find((x) => String(x.lowIdx) === foundLowId);
                if (lowObj) {
                    foundMiddleId = String(lowObj.middleIdx);
                }
            }
            if (foundMiddleId && !foundUpperId) {
                const midObj = m.find((x) => String(x.middleIdx) === foundMiddleId);
                if (midObj) {
                    foundUpperId = String(midObj.upperIdx);
                }
            }

            setUpperId(foundUpperId);
            setMiddleId(foundMiddleId);
            setLowId(foundLowId);

            setLoading(false);
        };

        loadAll().catch((e) => {
            console.error(e);
            setError(e.message);
            setLoading(false);
        });
    }, [id]);

    // 선택한 상위/중위에 맞춰 필터링
    const filteredMiddle = middleList.filter(
        (m) => !upperId || Number(m.upperIdx) === Number(upperId)
    );
    const filteredLow = lowList.filter(
        (l) => !middleId || Number(l.middleIdx) === Number(middleId)
    );

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        setNewFiles(files);
        setImagesChanged(true);
    };

    const handleRemoveExistingImage = (idx) => {
        const next = existingImages.filter((_, i) => i !== idx);
        setExistingImages(next);
        setImagesChanged(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");

        const dto = {
            title,
            price,
            content,
            location,
            pdStatus: Number(pdStatus),
            dDeal,
            upperId: Number(upperId),
            middleId: Number(middleId),
            lowId: Number(lowId),
            imageUrls: existingImages,
        };

        try {
            if (imagesChanged) {
                // 이미지도 같이 보낼 때 → 백엔드에서 만든 멀티파트 수정 API로
                const form = new FormData();
                form.append(
                    "dto",
                    new Blob([JSON.stringify(dto)], { type: "application/json" })
                );
                newFiles.forEach((f) => {
                    form.append("images", f);
                });

                const res = await fetch(`/api/products/${id}/update-multipart`, {
                    method: "PUT",
                    credentials: "include",
                    body: form,
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(txt || "이미지 포함 수정 실패");
                }
            } else {
                // 이미지 안 바꿈 → JSON 수정
                const res = await fetch(`/api/products/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(dto),
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(txt || "수정 실패");
                }
            }

            alert("수정되었습니다.");
            router.push(`/store/${id}`);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: 20 }}>불러오는 중…</div>;

    return (
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 64px" }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: 18 }}>
                상품 수정
            </h1>

            {error && (
                <div
                    style={{
                        background: "#ffe5e5",
                        border: "1px solid #ffb3b3",
                        padding: "10px 14px",
                        borderRadius: 8,
                        marginBottom: 18,
                        color: "#a30000",
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
                {/* 이미지 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>상품 이미지</div>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} />
                    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                        {existingImages.map((src, i) => (
                            <div key={i} style={{ position: "relative" }}>
                                <img
                                    src={src}
                                    alt=""
                                    style={{
                                        width: 90,
                                        height: 90,
                                        objectFit: "cover",
                                        borderRadius: 6,
                                        border: "1px solid #eee",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(i)}
                                    style={{
                                        position: "absolute",
                                        top: -6,
                                        right: -6,
                                        background: "#0008",
                                        color: "#fff",
                                        width: 20,
                                        height: 20,
                                        borderRadius: "50%",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {newFiles.map((f, i) => (
                            <div
                                key={"new-" + i}
                                style={{
                                    width: 90,
                                    height: 90,
                                    border: "1px dashed #ccc",
                                    borderRadius: 6,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 12,
                                }}
                            >
                                {f.name}
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                        이미지를 변경하면 이미지까지 함께 수정됩니다.
                    </p>
                </div>

                {/* 카테고리 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>카테고리</div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <select
                            value={upperId}
                            onChange={(e) => {
                                setUpperId(e.target.value);
                                setMiddleId("");
                                setLowId("");
                            }}
                            style={{ flex: 1, padding: "8px 10px" }}
                        >
                            <option value="">대분류를 선택하세요</option>
                            {upperList.map((u) => (
                                <option key={u.upperIdx} value={u.upperIdx}>
                                    {u.upperCt}
                                </option>
                            ))}
                        </select>

                        <select
                            value={middleId}
                            onChange={(e) => {
                                setMiddleId(e.target.value);
                                setLowId("");
                            }}
                            style={{ flex: 1, padding: "8px 10px" }}
                        >
                            <option value="">중분류를 선택하세요</option>
                            {filteredMiddle.map((m) => (
                                <option key={m.middleIdx} value={m.middleIdx}>
                                    {m.middleCt}
                                </option>
                            ))}
                        </select>

                        <select
                            value={lowId}
                            onChange={(e) => setLowId(e.target.value)}
                            style={{ flex: 1, padding: "8px 10px" }}
                        >
                            <option value="">소분류를 선택하세요</option>
                            {filteredLow.map((l) => (
                                <option key={l.lowIdx} value={l.lowIdx}>
                                    {l.lowCt}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 제목 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>상품명</div>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                        }}
                    />
                </div>

                {/* 가격 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>가격</div>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                        }}
                    />
                </div>

                {/* 설명 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>설명</div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                        }}
                    />
                </div>

                {/* 상품 상태 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>상품 상태</div>
                    <label style={{ marginRight: 14 }}>
                        <input
                            type="radio"
                            name="pdStatus"
                            value={0}
                            checked={Number(pdStatus) === 0}
                            onChange={(e) => setPdStatus(e.target.value)}
                        />{" "}
                        중고
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="pdStatus"
                            value={1}
                            checked={Number(pdStatus) === 1}
                            onChange={(e) => setPdStatus(e.target.value)}
                        />{" "}
                        새상품
                    </label>
                </div>

                {/* 거래 방법 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>거래 방법</div>
                    <label style={{ marginRight: 14 }}>
                        <input
                            type="radio"
                            name="dDeal"
                            value="DELIVERY"
                            checked={dDeal === "DELIVERY"}
                            onChange={(e) => setDDeal(e.target.value)}
                        />{" "}
                        택배거래
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="dDeal"
                            value="MEET"
                            checked={dDeal === "MEET"}
                            onChange={(e) => setDDeal(e.target.value)}
                        />{" "}
                        만나서 직거래
                    </label>
                </div>

                {/* 위치 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>거래 위치</div>
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        background: "#10b981",
                        color: "#fff",
                        border: "none",
                        padding: "11px 14px",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    {saving ? "수정 중..." : "수정하기"}
                </button>
            </form>
        </div>
    );
}
