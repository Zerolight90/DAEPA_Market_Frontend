"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Edit,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2
} from "lucide-react";
import styles from "../admin.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""; // For image resolution fallback
const BANNER_ENDPOINT = "/api/admin/banners";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return url.startsWith("/") ? url : `/${url}`;
};

const initialFormState = (nextOrder = 1) => ({
  displayOrder: nextOrder,
  active: true,
  imageUrl: "",
  imageFile: null,
  previewUrl: ""
});

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR");
};

async function readError(response) {
  try {
    const data = await response.json();
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    return JSON.stringify(data);
  } catch {
    return response.statusText || "요청 처리에 실패했습니다.";
  }
}

export default function BannerManagementPage() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingBanner, setEditingBanner] = useState(null);
  const [form, setForm] = useState(initialFormState());
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBanners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(BANNER_ENDPOINT, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message ?? "배너 목록을 불러오는 중 문제가 발생했습니다.");
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    [banners]
  );

  const openCreateModal = () => {
    setModalMode("create");
    setEditingBanner(null);
    setForm(initialFormState(sortedBanners.length + 1));
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (banner) => {
    setModalMode("edit");
    setEditingBanner(banner);
    setForm({
      displayOrder: banner.displayOrder ?? "",
      active: Boolean(banner.active),
      imageUrl: banner.imageUrl ?? "",
      imageFile: null,
      previewUrl: resolveImageUrl(banner.imageUrl)
    });
    setFormError(null);
    setModalOpen(true);
  };

  const resetForm = (nextOrder = 1) => {
    if (form.previewUrl && form.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.previewUrl);
    }
    setForm(initialFormState(nextOrder));
    setFormError(null);
  };

  const closeModal = () => {
    resetForm(sortedBanners.length + 1);
    setEditingBanner(null);
    setModalOpen(false);
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    handleInputChange(field, event.target.checked);
  };

  const handleImageUrlChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      imageUrl: value,
      imageFile: null,
      previewUrl: resolveImageUrl(value)
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (form.previewUrl && form.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.previewUrl);
    }
    setForm((prev) => ({
      ...prev,
      imageFile: file,
      previewUrl: file ? URL.createObjectURL(file) : prev.imageUrl ? resolveImageUrl(prev.imageUrl) : ""
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const isCreate = modalMode === "create";
    const hasExistingImage = !isCreate && Boolean(editingBanner?.imageUrl);
    const hasNewImageFile =
      form.imageFile instanceof File && form.imageFile.size && form.imageFile.size > 0;
    const hasImageUrl = Boolean(form.imageUrl && form.imageUrl.trim());

    // if (!hasNewImageFile && !hasImageUrl && !hasExistingImage) {
    //   setFormError("배너 이미지를 등록해주세요.");
    //   return;
    // }

    const formData = new FormData();

    if (form.displayOrder) {
      formData.append("displayOrder", String(form.displayOrder));
    }
    formData.append("active", form.active ? "true" : "false");
    if (hasNewImageFile) {
      formData.append("imageFile", form.imageFile);
    } else if (hasImageUrl) {
      formData.append("imageUrl", form.imageUrl.trim());
    }

    setIsSubmitting(true);
    try {
      const url = editingBanner ? `${BANNER_ENDPOINT}/${editingBanner.id}` : BANNER_ENDPOINT;
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData
      });

      if (!res.ok) {
        throw new Error(await readError(res));
      }

      await loadBanners();
      closeModal();
    } catch (err) {
      setFormError(err.message ?? "배너 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (bannerId) => {
    setBusyId(bannerId);
    try {
      const res = await fetch(`${BANNER_ENDPOINT}/${bannerId}/toggle`, { method: "PATCH" });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      await loadBanners();
    } catch (err) {
      alert(err.message ?? "배너 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!confirm("선택한 배너를 삭제하시겠습니까?")) return;
    setBusyId(bannerId);
    try {
      const res = await fetch(`${BANNER_ENDPOINT}/${bannerId}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      await loadBanners();
    } catch (err) {
      alert(err.message ?? "배너 삭제 중 오류가 발생했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (bannerId, direction) => {
    const currentIndex = sortedBanners.findIndex((item) => item.id === bannerId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedBanners.length) return;

    const reordered = [...sortedBanners];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];

    const payload = reordered.map((item, index) => ({
      id: item.id,
      displayOrder: index + 1
    }));

    setBusyId(bannerId);
    try {
      const res = await fetch(`${BANNER_ENDPOINT}/order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      await loadBanners();
    } catch (err) {
      alert(err.message ?? "배너 순서 변경 중 오류가 발생했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const columnTemplate = "160px 200px 180px 1fr 200px";

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>배너 관리</h1>
        <p className={styles.pageSubtitle}>메인 상단 배너를 등록하고 노출 순서를 관리하세요.</p>
      </div>

      <div className={styles.bannerActionsRow}>
        <button type="button" className={styles.bannerAddButton} onClick={openCreateModal} disabled={isLoading}>
          <Plus size={18} />
          새 배너 등록
        </button>
      </div>

      {error && (
        <div className={styles.bannerErrorNotice}>
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button className={styles.bannerRetryButton} onClick={loadBanners} disabled={isLoading}>
            <RefreshCcw size={16} />
            다시 시도
          </button>
        </div>
      )}

      {isLoading ? (
        <div className={styles.bannerLoading}>
          <Loader2 className={styles.spinning} size={32} />
          <span>배너 정보를 불러오는 중입니다...</span>
        </div>
      ) : sortedBanners.length === 0 ? (
        <div className={styles.emptyState}>
          <ImageIcon size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>등록된 배너가 없습니다</h3>
          <p className={styles.emptyStateDescription}>
            배너를 추가하여 방문자에게 주요 소식을 안내하세요.
          </p>
          <button type="button" className={styles.bannerAddButton} onClick={openCreateModal}>
            <Plus size={18} />
            배너 추가하기
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div className={styles.tableRow} style={{ display: "grid", gridTemplateColumns: columnTemplate }}>
              <div className={styles.tableCell}>미리보기</div>
              <div className={styles.tableCell} style={{ textAlign: "center" }}>노출 순서</div>
              <div className={styles.tableCell} style={{ textAlign: "center" }}>상태</div>
              <div className={styles.tableCell}>일시</div>
            <div className={styles.tableCell} style={{ textAlign: "center" }}>관리</div>
            </div>
          </div>
          <div className={styles.tableBody}>
            {sortedBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={styles.tableRow}
                style={{ display: "grid", gridTemplateColumns: columnTemplate }}
              >
                <div className={styles.tableCell}>
                  <div className={styles.bannerTablePreview}>
                    {banner.imageUrl ? (
                      <img src={resolveImageUrl(banner.imageUrl)} alt={`배너 ${banner.id}`} />
                    ) : (
                      <div className={styles.bannerPreviewFallback}>
                        <ImageIcon size={24} />
                        <span>이미지 없음</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.tableCell} style={{ textAlign: "center" }}>
                  <div className={styles.bannerOrderStack}>
                    <span className={styles.bannerOrderBadgeSmall}>#{banner.displayOrder ?? index + 1}</span>
                    <div className={styles.bannerOrderControls}>
                      <button
                        type="button"
                        className={styles.bannerOrderButton}
                        onClick={() => handleMove(banner.id, "up")}
                        disabled={busyId === banner.id || index === 0}
                        title="위로 이동"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className={styles.bannerOrderButton}
                        onClick={() => handleMove(banner.id, "down")}
                        disabled={busyId === banner.id || index === sortedBanners.length - 1}
                        title="아래로 이동"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.tableCell} style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    className={`${styles.bannerToggleButton} ${banner.active ? styles.bannerToggleActive : styles.bannerToggleInactive}`}
                    onClick={() => handleToggle(banner.id)}
                    disabled={busyId === banner.id}
                  >
                    {busyId === banner.id ? (
                      <Loader2 size={16} className={styles.spinning} />
                    ) : banner.active ? (
                      <>
                        <Eye size={16} />
                        노출 중
                      </>
                    ) : (
                      <>
                        <EyeOff size={16} />
                        숨김
                      </>
                    )}
                  </button>
                </div>

              <div className={styles.tableCell}>
                <div className={styles.bannerMetaStack}>
                  <span className={styles.bannerTimestamp}>생성 {formatDateTime(banner.createdAt)}</span>
                </div>
              </div>

              <div className={styles.tableCell} style={{ textAlign: "center" }}>
                  <div className={styles.bannerActionButtons}>

                    <button
                      type="button"
                      className={`${styles.bannerActionButton} ${styles.bannerActionDanger}`}
                      onClick={() => handleDelete(banner.id)}
                      disabled={busyId === banner.id}
                    >
                      <Trash2 size={15} />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className={styles.bannerModalOverlay} onClick={closeModal}>
          <div className={styles.bannerModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.bannerModalHeader}>
              <h2 className={styles.bannerModalTitle}>
                {modalMode === "create" ? "새 배너 등록" : "배너 수정"}
              </h2>
            </div>

            <form className={styles.bannerForm} onSubmit={handleSubmit}>
              <div className={styles.bannerModalBody}>
                <div className={styles.bannerFormRow}>
                  <label className={styles.bannerFormLabel} htmlFor="banner-order">
                    노출 순서
                  </label>
                  <input
                    id="banner-order"
                    type="number"
                    min={1}
                    className={styles.bannerFormInput}
                    value={form.displayOrder ?? ""}
                    onChange={(event) => handleInputChange("displayOrder", event.target.value)}
                    disabled={isSubmitting}
                  />
                  <span className={styles.bannerFormHint}>비워두면 자동으로 마지막 순서에 배치됩니다.</span>
                </div>

                <div className={styles.bannerFormRow}>
                  <label className={styles.bannerFormLabel} htmlFor="banner-image-url">
                    이미지 주소
                  </label>
                  <input
                    id="banner-image-url"
                    type="url"
                    className={styles.bannerFormInput}
                    placeholder="https://example.com/banner.jpg"
                    value={form.imageUrl}
                    onChange={handleImageUrlChange}
                    disabled={isSubmitting}
                  />
                  <span className={styles.bannerFormHint}>이미지 URL을 입력하거나, 아래에서 직접 업로드할 수 있습니다.</span>
                </div>

                <div className={styles.bannerFormRow}>
                  <label className={styles.bannerFormLabel}>배너 이미지 업로드</label>
                  <div className={styles.bannerUploadField}>
                    <label className={styles.bannerUploadLabel}>
                      이미지를 선택하세요
                      <input type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} />
                    </label>
                    <span className={styles.bannerFormHint}>권장 비율 16:9, 최대 5MB</span>
                    {form.previewUrl && (
                      <div className={styles.bannerPreviewSmall}>
                        <img src={form.previewUrl} alt="미리보기" />
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.bannerFormRowCheckbox}>
                  <label className={styles.bannerFormCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={handleCheckboxChange("active")}
                      disabled={isSubmitting}
                    />
                    등록과 동시에 노출하기
                  </label>
                </div>

                {formError && <div className={styles.bannerFormError}>{formError}</div>}
              </div>

              <div className={styles.bannerModalFooter}>
                <button type="button" className={styles.bannerModalButtonSecondary} onClick={closeModal} disabled={isSubmitting}>
                  취소
                </button>
                <button type="submit" className={styles.bannerModalButtonPrimary} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className={styles.spinning} size={18} /> : modalMode === "create" ? "등록" : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
