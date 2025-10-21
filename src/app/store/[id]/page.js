// src/app/store/[id]/page.js
import Link from "next/link";
import styles from "./page.module.css";
import { toKRW } from "@/lib/formatters";
import { catHref } from "@/lib/urls";
import { fetchProduct, fetchRelated } from "@/lib/api/products";

// ✅ 목업 폴백용 (API 실패/미설정 시 사용)
import { getItemById, getRelatedItems } from "@/lib/mockItems";

// Client
import ProductGallery from "@/components/product/ProductGallery";
import RightPanelClient from "@/components/product/RightPanelClient";
import { ModalProvider } from "@/components/ui/modal/ModalProvider";

// Server
import DetailsPanel from "@/components/product/DetailsPanel";
import SellerProfilePanel from "@/components/product/SellerProfilePanel";
import RelatedProducts from "@/components/product/RelateProducts";
// Client
import SellerOtherList from "@/components/product/SellerOtherList";

export const dynamic = "force-dynamic";

export default async function ProductPage(props) {
    const { id } = await props.params;

    // ✅ USE_MOCK=true 이면 강제 목업 모드
    const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    const HAS_API_BASE = !!process.env.NEXT_PUBLIC_API_BASE;

    let item = null;
    let related = [];

    if (!FORCE_MOCK && HAS_API_BASE) {
        // 1) API 시도
        try {
            item = await fetchProduct(id);
        } catch (e) {
            console.error("[fetchProduct failed]", e);
        }
        // 2) API 성공 시 연관상품도 API
        if (item) {
            try {
                related = (await fetchRelated(id, 10)) || [];
            } catch (e) {
                console.warn("[fetchRelated failed] → fallback to mock", e);
                related = getRelatedItems(id, 10);
            }
        }
    }

    // 3) API가 없거나 실패했으면 목업 폴백
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

    return (
        <div className={styles.page}>
            {/* 브레드크럼 */}
            <div className={`${styles.container} ${styles.bcWrap}`}>
                <Link href="/" className={styles.bc}>홈</Link>
                <span className={styles.sep}>›</span>
                <Link href={catHref(item.category)} className={styles.bc}>{item.category}</Link>
                {item.mid && (<><span className={styles.sep}>›</span><Link href={catHref(item.category, item.mid)} className={styles.bc}>{item.mid}</Link></>)}
                {item.sub && (<><span className={styles.sep}>›</span><Link href={catHref(item.category, item.mid, item.sub)} className={styles.bc}>{item.sub}</Link></>)}
            </div>

            <ModalProvider>
                <div className={styles.container}>
                    {/* 좌측 */}
                    <section className={styles.leftCol}>
                        <ProductGallery images={item.images?.length ? item.images : [item.img]} />
                        <DetailsPanel item={item} />

                        {related?.length > 0 && (
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
                            seller={item.seller}
                        />

                        <SellerProfilePanel seller={item.seller} />

                        <div className={styles.section}>
                            <h3 className={styles.h3}>판매자의 다른 상품</h3>
                            {/* 클라에서 API로 로딩, 실패 시 내부에서 자체 처리 */}
                            <SellerOtherList sellerId={item.seller?.id} excludeId={item.id} />
                        </div>
                    </aside>
                </div>
            </ModalProvider>
        </div>
    );
}
