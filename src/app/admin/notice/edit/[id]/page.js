"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, X, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import styles from "../../../admin.module.css";

export default function EditNoticePage() {
  // 폼 입력 데이터(제목, 카테고리, 내용)를 관리하는 상태
  const [formData, setFormData] = useState({
    title: "",
    category: "공지",
    content: "",
  });
  
  // (이미지) 새로 선택한 파일 객체를 관리하는 상태
  const [file, setFile] = useState(null);
  // (이미지) 새로 선택한 파일의 미리보기 URL을 관리하는 상태
  const [imagePreview, setImagePreview] = useState(null);
  // (이미지) 서버에서 불러온 기존 이미지의 URL을 관리하는 상태
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  // (이미지) 사용자가 이미지 삭제 버튼을 눌렀는지 여부를 관리하는 상태
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  // 폼 제출 진행 및 데이터 로딩 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();

  // 컴포넌트 마운트 시, 공지사항 ID를 사용하여 기존 데이터를 불러옴
  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/notices/${params.id}`);
        if (!res.ok) throw new Error("공지사항 불러오기 실패");

        const data = await res.json();
        
        // 백엔드 데이터(snake_case)를 프론트엔드 상태(camelCase)에 맞게 매핑
        const mappedNotice = {
          title: data.nsubject,
          category: convertCategory(data.ncategory),
          content: data.ncontent,
        };

        setFormData(mappedNotice);
        
        // 기존 이미지가 있는 경우, URL 상태를 업데이트
        if (data.nimg) {
          setExistingImageUrl(data.nimg);
        }
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

  // 숫자 카테고리를 문자열로 변환하는 헬퍼 함수
  const convertCategory = (num) => {
    const categoryMap = { 1: "공지", 2: "업데이트", 3: "안내", 4: "이벤트" };
    return categoryMap[num] || "기타";
  };

  // 텍스트 입력 필드 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 새 이미지 파일 선택 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setIsImageDeleted(false); // 중요: 새 파일을 선택하면 '삭제' 상태는 취소됨
    }
  };

  // 이미지 삭제 버튼 클릭 핸들러
  const handleImageDelete = () => {
    if (confirm("현재 이미지를 삭제하시겠습니까? '공지사항 저장' 버튼을 눌러야 최종 반영됩니다.")) {
      setIsImageDeleted(true);
      setFile(null);
      setImagePreview(null);
      setExistingImageUrl(null); // UI에서 즉시 이미지를 안보이게 처리
    }
  };

  // 폼 제출 핸들러 (수정 로직)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        const categoryMap = { "공지": 1, "업데이트": 2, "안내": 3, "이벤트": 4 };
        
        // 1. 전송할 JSON 데이터(`req` 파트) 기본 구조 생성
        const noticeUpdateData = {
            nSubject: formData.title,
            nContent: formData.content,
            nCategory: categoryMap[formData.category] || 0,
            nImg: existingImageUrl // 기본적으로 기존 이미지 URL을 유지하도록 설정
        };

        // 2. 이미지 관련 시나리오에 따라 `noticeUpdateData.nImg` 값을 조정
        // 시나리오 B: '이미지 삭제' 버튼을 눌렀을 경우
        if (isImageDeleted) {
            noticeUpdateData.nImg = null; // 백엔드에 이미지 삭제를 요청하기 위해 null로 설정
        }
        // 시나리오 A: 새로운 이미지를 선택한 경우, `file`에 파일이 있으므로 `nImg`는 백엔드에서 덮어쓰기됨
        // 시나리오 C: 이미지 변경이 없는 경우, 맨 처음 설정한 `existingImageUrl`이 그대로 전송됨

        // 3. FormData 객체 생성 및 데이터 추가
        const formDataToSend = new FormData();
        formDataToSend.append('req', new Blob([JSON.stringify(noticeUpdateData)], { type: "application/json" }));

        // 시나리오 A: 새로운 이미지 파일이 있을 경우에만 'file' 파트를 추가
        if (file) {
            formDataToSend.append('file', file);
        }

        // 4. 서버에 PUT 요청
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/notices/${params.id}`, {
            method: "PUT",
            body: formDataToSend,
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Server response:", errorText);
            throw new Error("수정 실패. 서버 응답을 확인하세요.");
        }

        alert("공지사항이 성공적으로 수정되었습니다!");
        router.push(`/admin/notice`);

    } catch (error) {
        console.error("공지사항 수정 실패:", error);
        alert("공지사항 수정에 실패했습니다.");
    } finally {
        setIsSubmitting(false);
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
      if (confirm("수정 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?")){
          router.back();
      }
  };

  // 데이터 로딩 중 UI
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontSize: "1.125rem", color: "#64748b" }}>
          공지사항을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <button 
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", background: "none", border: "none", cursor: "pointer", marginBottom: "1rem", fontSize: "0.875rem" }}
          >
            <ArrowLeft size={16} />
            이전으로 돌아가기
          </button>
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
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "0.875rem", background: "white" }}
                />
              </div>

              {/* 카테고리 */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  카테고리 *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "0.875rem", background: "white", cursor: "pointer" }}
                >
                  <option value="공지">공지</option>
                  <option value="업데이트">업데이트</option>
                  <option value="안내">안내</option>
                  <option value="이벤트">이벤트</option>
                </select>
              </div>

              {/* 내용 */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                  내용 *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={10}
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontSize: "0.875rem", background: "white", resize: "vertical", minHeight: "200px" }}
                />
              </div>

              {/* 이미지 표시 및 수정 UI */}
              <div style={{ marginBottom: "2rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#374151", fontSize: "0.875rem" }}>
                      첨부 이미지
                  </label>
                  {/* 이미지 미리보기 영역 */}
                  <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", backgroundColor: "#f9fafb", marginBottom: "1rem" }}>
                      {isImageDeleted ? (
                          <p style={{ color: "#ef4444", textAlign: "center", padding: "2rem 0" }}>이미지가 삭제됩니다.</p>
                      ) : imagePreview ? (
                          <img src={imagePreview} alt="새 이미지 미리보기" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "0.5rem", margin: "auto", display: "block" }} />
                      ) : existingImageUrl ? (
                          <img src={existingImageUrl} alt="기존 이미지" style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "0.5rem", margin: "auto", display: "block" }} />
                      ) : (
                          <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem 0" }}>업로드된 이미지가 없습니다.</p>
                      )}
                  </div>
                  
                  {/* 이미지 변경/삭제 버튼 영역 */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }} // 실제 input은 숨기고 label로 디자인
                    />
                    <label htmlFor="file-upload" style={{ flexGrow: 1, textAlign: 'center', padding: "0.6rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", background: "white", cursor: "pointer", fontWeight: "500" }}>
                      이미지 변경/추가
                    </label>
                    {/* 기존 또는 새로 추가한 이미지가 있고, 삭제 상태가 아닐 때만 '이미지 삭제' 버튼을 보여줌 */}
                    {(existingImageUrl || imagePreview) && !isImageDeleted && (
                      <button
                        type="button"
                        onClick={handleImageDelete}
                        style={{ padding: "0.6rem 1rem", border: "1px solid #ef4444", borderRadius: "0.5rem", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "0.5rem" }}
                      >
                        <Trash2 size={16} />
                        이미지 삭제
                      </button>
                    )}
                  </div>
              </div>

              {/* 폼 제출/취소 버튼 */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{ padding: "0.75rem 1.5rem", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "0.5rem", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <X size={16} />
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title || !formData.content}
                  style={{ padding: "0.75rem 1.5rem", background: (isSubmitting || !formData.title || !formData.content) ? "#9ca3af" : "#3b82f6", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: "600", cursor: (isSubmitting || !formData.title || !formData.content) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <Save size={16} />
                  {isSubmitting ? "수정 중..." : "공지사항 저장"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
