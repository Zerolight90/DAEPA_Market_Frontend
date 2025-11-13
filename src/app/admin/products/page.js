"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  RefreshCcw,
  Trash2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import styles from "../admin.module.css";


const PAGE_SIZE = 15; // 5 columns * 3 rows

const formatCurrency = (value) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
};

const resolveImageUrl = (url) => {
  if (!url) return "/images/placeholder.jpg";
  if (url.startsWith("http")) return url;
  return url.startsWith("/") ? url : `/${url}`;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMutating, setIsMutating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function fetchProducts() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(Math.max(currentPage - 1, 0)),
          size: String(PAGE_SIZE)
        });
        const response = await fetch(`/api/admin/products?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`상품 목록을 불러오는 중 오류가 발생했습니다. (status ${response.status})`);
        }
        const data = await response.json();
        if (!ignore) {
          setProducts(Array.isArray(data.content) ? data.content : []);
          setTotalPages(data.totalPages ?? 0);
          setTotalElements(data.totalElements ?? 0);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError(err.message ?? "상품 목록을 불러오는 중 오류가 발생했습니다.");
          setProducts([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();
    return () => {
      ignore = true;
    };
  }, [currentPage, reloadKey]);

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };

  const getVisiblePages = useMemo(() => {
    if (totalPages <= 1) return [1];

    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  const handleDelete = async (product) => {
    if (!product?.id) return;
    if (!confirm(`"${product.title}" 상품을 삭제 처리하시겠습니까?`)) return;

    setIsMutating(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE"
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("상품 삭제에 실패했습니다.");
      }
      setReloadKey((prev) => prev + 1);
      alert("상품이 삭제 처리되었습니다.");
    } catch (err) {
      console.error(err);
      alert(err.message ?? "상품 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>상품 관리</h1>
        <p className={styles.pageSubtitle}>
          판매자들이 등록한 전체 상품을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      <div className={styles.productsToolbar}>
        <div className={styles.productSummary}>
          총 <strong>{totalElements}</strong>개의 상품
        </div>
        {totalPages > 1 && (
          <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
            {currentPage} / {totalPages} 페이지
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorNotice}>
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={handleRetry} className={styles.retryButton}>
            <RefreshCcw size={16} />
            다시 시도
          </button>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loadingState}>
          <Loader2 className={styles.loadingIcon} size={28} />
          <span>상품을 불러오는 중입니다...</span>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>표시할 상품이 없습니다</h3>
          <p className={styles.emptyStateDescription}>
            판매자가 등록한 상품이 없거나 모든 상품을 삭제했습니다.
          </p>
        </div>
      ) : (
        <div className={styles.productGrid}>
          {products.map((product) => (
            <article
              key={product.id}
              className={`${styles.productCard} ${product.reported ? styles.productCardReported : ""}`}
            >
              <div className={styles.productCardImage}>
                <img src={resolveImageUrl(product.thumbnail)} alt={product.title} />
                {product.reported && (
                  <div className={styles.productBadges}>
                    <span className={`${styles.productBadge} ${styles.reportedBadge}`}>신고된 사용자</span>
                  </div>
                )}
              </div>

              <div className={styles.productCardBody}>
                <div className={styles.productCardHeader}>
                  <h3 title={product.title}>{product.title}</h3>
                  <p className={styles.productPrice}>₩{formatCurrency(product.price ?? 0)}</p>
                </div>

                <div className={styles.productMeta}>
                  <span>{product.category ?? "카테고리 미지정"}</span>
                  <span>{formatDate(product.createdAt)}</span>
                </div>
              </div>

              <div className={styles.productCardFooter}>
                <div className={styles.productSeller}>
                  판매자 <strong>{product.sellerName ?? `#${product.sellerId}`}</strong>
                </div>
                {product.reported && (
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(product)}
                    disabled={isMutating}
                  >
                    <Trash2 size={16} />
                    {isMutating ? "처리 중..." : "신고 상품 삭제"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
        <div className={styles.paginationWrapper}>
          <button
            className={styles.paginationNavButton}
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1 || isLoading || isMutating}
            title="첫 페이지"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            className={styles.paginationNavButton}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading || isMutating}
            title="이전 페이지"
          >
            <ChevronLeft size={16} />
          </button>

          <div className={styles.paginationInfo}>
            {getVisiblePages.map((pageItem, index) =>
              pageItem === "..." ? (
                <span key={`dots-${index}`} className={styles.paginationButton} style={{ cursor: "default" }}>
                  ...
                </span>
              ) : (
                <button
                  key={pageItem}
                  className={`${styles.paginationButton} ${currentPage === pageItem ? styles.active : ""}`}
                  onClick={() => setCurrentPage(pageItem)}
                  disabled={isLoading || isMutating}
                >
                  {pageItem}
                </button>
              )
            )}
          </div>

          <button
            className={styles.paginationNavButton}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || isLoading || isMutating}
            title="다음 페이지"
          >
            <ChevronRight size={16} />
          </button>

          <button
            className={styles.paginationNavButton}
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || isLoading || isMutating}
            title="마지막 페이지"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
