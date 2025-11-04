"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../admin.module.css";

export default function EditNoticePage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "공지",
    content: "",
    isImportant: false,
    images: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/notices/${params.id}`);
        if (!res.ok) throw new Error("공지사항 불러오기 실패");

        const data = await res.json();
        
        // 백엔드 DTO -> UI 구조로 변환
        const mappedNotice = {
          title: data.nsubject,
          category: convertCategory(data.ncategory),
          content: data.ncontent,
          isImportant: data.ncategory === 1,
          images: [] // 기존 이미지는 별도 API로 가져와야 함
        };

        setFormData(mappedNotice);
      } catch (err) {
        console.error(err);
        alert("공지사항을 불러오는 중 오류가 발생했습니다.");
        router.push("/admin/notice");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchNotice();
    }
  }, [params.id, router]);

  const convertCategory = (num) => {
    switch (num) {
      case 1: return "공지";
      case 2: return "업데이트";
      case 3: return "안내";
      case 4: return "이벤트";
      default: return "기타";
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (files) => {
    setIsUploading(true);
    const uploadedImages = [];

    try {
      for (const file of files) {
        // 파일 크기 체크 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}은(는) 5MB를 초과합니다.`);
          continue;
        }

        // 이미지 파일 타입 체크
        if (!file.type.startsWith('image/')) {
          alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
          continue;
        }

        // 임시로 로컬 URL 생성
        const imageUrl = URL.createObjectURL(file);
        uploadedImages.push({
          id: Date.now() + Math.random(),
          file: file,
          url: imageUrl,
          name: file.name,
          size: file.size
        });
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleImageUpload(files);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);



      try {
          const payload = {
              nSubject: formData.title,
              nContent: formData.content,
              nCategory: formData.category === "공지" ? 1 :
                  formData.category === "업데이트" ? 2 :
                  formData.category === "안내" ? 3 :
                  formData.category === "이벤트" ? 4 : 0,
              // 이미지 업로드 기능은 나중 처리
          };

          const res = await fetch(`http://localhost:8080/api/admin/notices/${params.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
          });

          if (!res.ok) {
              throw new Error("수정 실패");
          }

          alert("공지사항이 성공적으로 수정되었습니다!");
          router.push(`/admin/notice/${params.id}`);

      } catch (error) {
          console.error("공지사항 수정 실패:", error);
          alert("공지사항 수정에 실패했습니다.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleCancel = () => {
      if (confirm("수정 중인 내용이 삭제됩니다. 정말 취소하시겠습니까?")){
          router.push(`/admin/notice/${params.id}`);
      }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "400px",
          fontSize: "1.125rem",
          color: "#64748b"
        }}>
          공지사항을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <Link 
              href={`/admin/notice/${params.id}`}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                color: "#64748b", 
                textDecoration: "none",
                fontSize: "0.875rem"
              }}
            >
              <ArrowLeft size={16} />
              상세보기로 돌아가기
            </Link>
          </div>
          <h1 className={styles.pageTitle}>공지사항 수정</h1>
          <p className={styles.pageSubtitle}>
            공지사항 내용을 수정하고 업데이트하세요
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.tableContainer}>
            <div style={{ padding: "2rem" }}>
              {/* 제목 */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  fontWeight: "600", 
                  color: "#374151",
                  fontSize: "0.875rem"
                }}>
                  제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="공지사항 제목을 입력하세요"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    background: "white",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                />
              </div>

              {/* 카테고리 및 중요도 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "0.5rem", 
                    fontWeight: "600", 
                    color: "#374151",
                    fontSize: "0.875rem"
                  }}>
                    카테고리 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      background: "white",
                      cursor: "pointer"
                    }}
                  >
                    <option value="공지">공지</option>
                    <option value="업데이트">업데이트</option>
                    <option value="안내">안내</option>
                    <option value="이벤트">이벤트</option>
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "0.5rem", 
                    fontWeight: "600", 
                    color: "#374151",
                    fontSize: "0.875rem"
                  }}>
                    중요도
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 0" }}>
                    <input
                      type="checkbox"
                      name="isImportant"
                      checked={formData.isImportant}
                      onChange={handleInputChange}
                      style={{ width: "1rem", height: "1rem" }}
                    />
                    <span style={{ fontSize: "0.875rem", color: "#374151" }}>
                      중요 공지사항으로 설정
                    </span>
                  </div>
                </div>
              </div>

              {/* 내용 */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  fontWeight: "600", 
                  color: "#374151",
                  fontSize: "0.875rem"
                }}>
                  내용 *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="공지사항 내용을 입력하세요"
                  required
                  rows={10}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    background: "white",
                    resize: "vertical",
                    minHeight: "200px",
                    fontFamily: "inherit",
                    lineHeight: "1.5"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                />
              </div>

              {/* 이미지 업로드 */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.5rem", 
                  fontWeight: "600", 
                  color: "#374151",
                  fontSize: "0.875rem"
                }}>
                  이미지 첨부
                </label>
                
                {/* 드래그 앤 드롭 영역 */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  style={{
                    border: "2px dashed #d1d5db",
                    borderRadius: "0.75rem",
                    padding: "2rem",
                    textAlign: "center",
                    backgroundColor: "#f9fafb",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "#3b82f6";
                    e.target.style.backgroundColor = "#f0f9ff";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.backgroundColor = "#f9fafb";
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer"
                    }}
                  />
                  
                  {isUploading ? (
                    <div style={{ color: "#3b82f6" }}>
                      <div style={{ 
                        width: "2rem", 
                        height: "2rem", 
                        border: "3px solid #e5e7eb",
                        borderTop: "3px solid #3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 1rem"
                      }}></div>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>이미지 업로드 중...</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} style={{ color: "#9ca3af", marginBottom: "0.5rem" }} />
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
                        이미지를 드래그하여 놓거나 클릭하여 선택하세요
                      </p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>
                        최대 5MB, JPG, PNG, GIF 형식 지원
                      </p>
                    </div>
                  )}
                </div>

                {/* 업로드된 이미지 목록 */}
                {formData.images.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h4 style={{ 
                      marginBottom: "0.75rem", 
                      fontWeight: "600", 
                      color: "#374151",
                      fontSize: "0.875rem"
                    }}>
                      첨부된 이미지 ({formData.images.length}개)
                    </h4>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", 
                      gap: "0.75rem" 
                    }}>
                      {formData.images.map((image) => (
                        <div key={image.id} style={{
                          position: "relative",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                          overflow: "hidden",
                          backgroundColor: "white"
                        }}>
                          <img
                            src={image.url}
                            alt={image.name}
                            style={{
                              width: "100%",
                              height: "80px",
                              objectFit: "cover"
                            }}
                          />
                          <div style={{
                            padding: "0.5rem",
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            backgroundColor: "#f9fafb"
                          }}>
                            <div style={{ 
                              overflow: "hidden", 
                              textOverflow: "ellipsis", 
                              whiteSpace: "nowrap",
                              marginBottom: "0.25rem"
                            }}>
                              {image.name}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                              {(image.size / 1024 / 1024).toFixed(1)}MB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleImageRemove(image.id)}
                            style={{
                              position: "absolute",
                              top: "0.25rem",
                              right: "0.25rem",
                              width: "1.5rem",
                              height: "1.5rem",
                              backgroundColor: "rgba(239, 68, 68, 0.9)",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem"
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 미리보기 */}
              {formData.title && formData.content && (
                <div style={{ marginBottom: "2rem" }}>
                  <h4 style={{ 
                    marginBottom: "1rem", 
                    fontWeight: "600", 
                    color: "#374151",
                    fontSize: "0.875rem"
                  }}>
                    미리보기
                  </h4>
                  <div style={{ 
                    padding: "1rem", 
                    border: "1px solid #e5e7eb", 
                    borderRadius: "0.5rem", 
                    backgroundColor: "#f9fafb"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                      {formData.isImportant && (
                        <span style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          중요
                        </span>
                      )}
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        backgroundColor: formData.category === "공지" ? "#fee2e2" : 
                                        formData.category === "업데이트" ? "#dbeafe" :
                                        formData.category === "안내" ? "#dcfce7" : "#fef3c7",
                        color: formData.category === "공지" ? "#dc2626" : 
                               formData.category === "업데이트" ? "#2563eb" :
                               formData.category === "안내" ? "#16a34a" : "#d97706"
                      }}>
                        {formData.category}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.5rem" }}>
                      {formData.title}
                    </h3>
                    <p style={{ color: "#64748b", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                      {formData.content}
                    </p>
                    
                    {/* 이미지 미리보기 */}
                    {formData.images.length > 0 && (
                      <div style={{ marginTop: "1rem" }}>
                        <h5 style={{ 
                          fontSize: "0.875rem", 
                          fontWeight: "600", 
                          color: "#374151", 
                          marginBottom: "0.5rem" 
                        }}>
                          첨부 이미지
                        </h5>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", 
                          gap: "0.5rem" 
                        }}>
                          {formData.images.map((image) => (
                            <img
                              key={image.id}
                              src={image.url}
                              alt={image.name}
                              style={{
                                width: "100%",
                                height: "80px",
                                objectFit: "cover",
                                borderRadius: "0.375rem",
                                border: "1px solid #e5e7eb"
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 버튼 */}
              <div style={{ 
                display: "flex", 
                justifyContent: "flex-end", 
                gap: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #e5e7eb"
              }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <X size={16} />
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title || !formData.content}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: isSubmitting || !formData.title || !formData.content ? "#9ca3af" : "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: isSubmitting || !formData.title || !formData.content ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <Save size={16} />
                  {isSubmitting ? "수정 중..." : "공지사항 수정"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

