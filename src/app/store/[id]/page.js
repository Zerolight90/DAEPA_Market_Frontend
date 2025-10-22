// src/app/store/[id]/page.js
import Link from "next/link";
import styles from "./page.module.css";
import { toKRW } from "@/lib/formatters";
import { catHref } from "@/lib/urls";
import { fetchProduct, fetchRelated } from "@/lib/api/products"; // ← 이 함수가 DTO→프론트형으로 변환해줘야 함

// mock fallback
import { getItemById, getRelatedItems } from "@/lib/mockItems";

// Client
import ProductGallery from "@/components/product/ProductGallery";
import RightPanelClient from "@/components/product/RightPanelClient";
import { ModalProvider } from "@/components/ui/modal/ModalProvider";

// Server
import DetailsPanel from "@/components/product/DetailsPanel";
import SellerProfilePanel from "@/components/product/SellerProfilePanel";
import RelatedProducts from "@/components/product/RelateProducts";
import SellerOtherList from "@/components/product/SellerOtherList";

export const dynamic = "force-dynamic";

export default async function ProductPage(props) {
    // ✅ Next 15: params 비동기(동적 API)
    const { id } = await props.params;

    const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    const HAS_API_BASE = !!process.env.NEXT_PUBLIC_API_BASE;

    let item = null;
    let related = [];

    if (!FORCE_MOCK && HAS_API_BASE) {
        try {
            // ✅ 백엔드 DTO를 프론트 구조로 변환해서 반환하도록 fetchProduct 구현
            item = await fetchProduct(id);
        } catch (e) {
            console.error("[fetchProduct failed]", e);
        }
        if (item) {
            try {
                related = (await fetchRelated(id, 10)) || [];
            } catch (e) {
                console.warn("[fetchRelated failed] → fallback to mock", e);
                related = getRelatedItems(id, 10);
            }
        }
    }

    // 폴백
    if (!item) {
        item = getItemById(id);
        related = getRelatedItems(id, 10);
    }

    if (!item) {
        return (
            <div className={styles.container} style={{ padding: "40px 0" }}>
                상품을 찾을 수 없습니다.
            </div>
        );
    }

    // ✅ 안전한 기본값들
    const images = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : (item.thumbnail ? [item.thumbnail] : (item.img ? [item.img] : []));

    const seller = item.seller ?? { id: null, name: "알 수 없음", avatar: "/no-image.png" };

    return (
        <div className={styles.page}>
            {/* 브레드크럼: 카테고리 정보가 없을 수 있으니 방어 */}
            <div className={`${styles.container} ${styles.bcWrap}`}>
                <Link href="/" className={styles.bc}>홈</Link>
                {item.category && (
                    <>
                        <span className={styles.sep}>›</span>
                        <Link href={catHref(item.category)} className={styles.bc}>{item.category}</Link>
                        {item.mid && (<><span className={styles.sep}>›</span><Link href={catHref(item.category, item.mid)} className={styles.bc}>{item.mid}</Link></>)}
                        {item.sub && (<><span className={styles.sep}>›</span><Link href={catHref(item.category, item.mid, item.sub)} className={styles.bc}>{item.sub}</Link></>)}
                    </>
                )}
            </div>

            <ModalProvider>
                <div className={styles.container}>
                    {/* 좌측 */}
                    <section className={styles.leftCol}>
                        <ProductGallery images={images} />
                        <DetailsPanel item={item} />

                        {Array.isArray(related) && related.length > 0 && (
                            <div className={styles.section}>
                                <h3 className={styles.h3}>연관 상품</h3>
                                <RelatedProducts items={related} />
                            </div>
                        )}
                    </section>

                    {/* 우측 */}
                    <aside className={styles.rightCol}>
                        <h1 className={styles.title}>{item.title}</h1>
                        <div className={styles.price}>{toKRW(item.price)}</div>

                        <RightPanelClient
                            itemId={item.id}
                            title={item.title}
                            price={item.price}
                            wishCount={item.wishCount ?? 0}
                            description={item.description || ""}
                            seller={seller}
                        />

                        <SellerProfilePanel seller={seller} />

                        <div className={styles.section}>
                            <h3 className={styles.h3}>판매자의 다른 상품</h3>
                            <SellerOtherList sellerId={seller.id} excludeId={item.id} />
                        </div>
                    </aside>
                </div>
            </ModalProvider>
        </div>
    );
}
