"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EditCategoryPicker from "./EditCategoryPicker";

export default function ProductEditPage() {
    const { id } = useParams();
    const router = useRouter();
    const fileRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // 폼 값
    const [form, setForm] = useState({
        upperId: null,
        middleId: null,
        lowId: null,
        title: "",
        price: "",
        content: "",
        location: "",
        pdStatus: 0,
        dDeal: "DELIVERY",
        files: [],
        previews: [],
        existing: [],
    });

    // 초기 카테고리 값은 따로 보관해서 다시 안 바뀌게
    const [initialCategory, setInitialCategory] = useState(null);

    useEffect(() => {
        if (!id) return;

        (async () => {
            try {
                const res = await fetch(`/api/products/${id}`, {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("상품을 불러올 수 없습니다.");
                const data = await res.json();

                // 👇 여기서 실제 오는 키들 중 하나를 선택
                // 백엔드가 ddeal 로 줌
                const rawDeal =
                    data.dDeal ??
                    data.ddeal ??
                    data.deal ??
                    data.dealType ??
                    null;

                const normalizedDeal = (() => {
                    if (!rawDeal) return "DELIVERY";
                    const v = rawDeal.toString().trim().toUpperCase();
                    if (v === "MEET" || v === "DIRECT" || v === "MEETUP") {
                        return "MEET";
                    }
                    return "DELIVERY";
                })();

                setForm((p) => ({
                    ...p,
                    upperId: data.upperId ?? null,
                    middleId: data.middleId ?? null,
                    lowId: data.lowId ?? null,
                    title: data.pdTitle ?? "",
                    price: data.pdPrice ? String(data.pdPrice) : "",
                    content: data.pdContent ?? "",
                    location: data.pdLocation ?? data.location ?? "",
                    pdStatus: data.pdStatus ?? 0,
                    dDeal: normalizedDeal,
                    existing: Array.isArray(data.images)
                        ? data.images
                        : data.pdThumb
                            ? [data.pdThumb]
                            : [],
                }));

                setInitialCategory({
                    upperId: data.upperId ?? null,
                    middleId: data.middleId ?? null,
                    lowId: data.lowId ?? null,
                });
            } catch (e) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // 카테고리 변경 콜백
    const handleCategoryChange = ({ upperId, middleId, lowId }) => {
        setForm((p) => ({
            ...p,
            upperId,
            middleId,
            lowId,
        }));
    };

    const onFiles = (e) => {
        const list = Array.from(e.target.files || []);
        const merged = [...form.files, ...list].slice(0, 10);
        const previews = merged.map((f) => ({
            name: f.name,
            url: URL.createObjectURL(f),
        }));
        setForm((p) => ({
            ...p,
            files: merged,
            previews,
        }));
    };

    const removeExisting = (idx) => {
        setForm((p) => ({
            ...p,
            existing: p.existing.filter((_, i) => i !== idx),
        }));
    };

    const removeNew = (idx) => {
        const nextFiles = form.files.filter((_, i) => i !== idx);
        const nextPreviews = form.previews.filter((_, i) => i !== idx);
        setForm((p) => ({ ...p, files: nextFiles, previews: nextPreviews }));
        if (fileRef.current) fileRef.current.value = "";
    };

    const submit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setSaving(true);
        setError("");

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
                dDeal: form.dDeal, // ← 여기로 그대로 감
                imageUrls: form.existing,
            };

            const fd = new FormData();
            fd.append(
                "dto",
                new Blob([JSON.stringify(dto)], { type: "application/json" })
            );
            (form.files || []).forEach((f) => fd.append("images", f));

            const res = await fetch(`/api/products/${id}/edit-multipart`, {
                method: "POST",
                credentials: "include",
                body: fd,
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "수정에 실패했습니다.");
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
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 16,
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
                {/* 이미지 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>상품 이미지</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {form.existing.map((src, i) => (
                            <div key={"exist-" + i} style={{ position: "relative" }}>
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
                                    onClick={() => removeExisting(i)}
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

                        {form.previews.map((p, i) => (
                            <div key={"new-" + i} style={{ position: "relative" }}>
                                <img
                                    src={p.url}
                                    alt={p.name}
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
                                    onClick={() => removeNew(i)}
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
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={onFiles}
                        style={{ marginTop: 10 }}
                    />
                </div>

                {/* 카테고리 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>카테고리</div>
                    {initialCategory ? (
                        <EditCategoryPicker
                            initialUpperId={initialCategory.upperId}
                            initialMiddleId={initialCategory.middleId}
                            initialLowId={initialCategory.lowId}
                            onChange={handleCategoryChange}
                        />
                    ) : (
                        <div style={{ fontSize: 13, color: "#888" }}>
                            카테고리를 불러오는 중입니다…
                        </div>
                    )}
                </div>

                {/* 상품명 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>상품명</div>
                    <input
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        style={{
                            width: "100%",
                            border: "1px solid #ddd",
                            borderRadius: 6,
                            padding: "8px 10px",
                        }}
                    />
                </div>

                {/* 가격 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>가격</div>
                    <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                        style={{
                            width: "100%",
                            border: "1px solid #ddd",
                            borderRadius: 6,
                            padding: "8px 10px",
                        }}
                    />
                </div>

                {/* 설명 */}
                <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>설명</div>
                    <textarea
                        value={form.content}
                        onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                        rows={6}
                        style={{
                            width: "100%",
                            border: "1px solid #ddd",
                            borderRadius: 6,
                            padding: "8px 10px",
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
                            checked={Number(form.pdStatus) === 0}
                            onChange={() => setForm((p) => ({ ...p, pdStatus: 0 }))}
                        />{" "}
                        중고
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="pdStatus"
                            value={1}
                            checked={Number(form.pdStatus) === 1}
                            onChange={() => setForm((p) => ({ ...p, pdStatus: 1 }))}
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
                            checked={form.dDeal === "DELIVERY"}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, dDeal: e.target.value }))
                            }
                        />{" "}
                        택배거래
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="dDeal"
                            value="MEET"
                            checked={form.dDeal === "MEET"}
                            onChange={(e) =>
                                setForm((p) => ({ ...p, dDeal: e.target.value }))
                            }
                        />{" "}
                        만나서 직거래
                    </label>
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
                    }}
                >
                    {saving ? "수정 중..." : "수정하기"}
                </button>
            </form>
        </div>
    );
}
