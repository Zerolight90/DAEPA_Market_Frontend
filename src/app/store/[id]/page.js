// src/app/store/[id]/page.js
import Link from "next/link";
import styles from "./page.module.css";
import { toKRW } from "@/lib/formatters";
import { catHref } from "@/lib/urls";
import { fetchProduct, fetchRelated } from "@/lib/api/products";

// mock fallback
import { getItemById, getRelatedItems } from "@/lib/mockItems";

// Client
import ProductGallery from "@/components/product/ProductGallery";
import RightPanelClient from "@/components/product/RightPanelClient";
import { ModalProvider } from "@/components/ui/modal/ModalProvider";

// Server-ish
import DetailsPanel from "@/components/product/DetailsPanel";
import SellerProfilePanel from "@/components/product/SellerProfilePanel";
import RelatedProducts from "@/components/product/RelateProducts";
import TradeInfoPanel from "@/components/product/TradeInfoPanel";

export const dynamic = "force-dynamic";

export default async function ProductPage(props) {
    const { id } = await props.params;

    const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
    const HAS_API_BASE = !!process.env.NEXT_PUBLIC_API_BASE;

    let item = null;
    let related = [];

    if (!FORCE_MOCK && HAS_API_BASE) {
        try {
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

    const images =
        Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : item.thumbnail
                ? [item.thumbnail]
                : item.img
                    ? [item.img]
                    : [];

    const seller =
        item.seller ?? { id: null, name: "알 수 없음", avatar: "/no-image.png" };

    return (
        <div className={styles.page}>
            {/* 브레드크럼 */}
            <div className={`${styles.container} ${styles.bcWrap}`}>
                <Link href="/" className={styles.bc}>
                    홈
                </Link>
                {item.category && (
                    <>
                        <span className={styles.sep}>›</span>
                        <Link href={catHref(item.category)} className={styles.bc}>
                            {item.category}
                        </Link>
                        {item.mid && (
                            <>
                                <span className={styles.sep}>›</span>
                                <Link href={catHref(item.category, item.mid)} className={styles.bc}>
                                    {item.mid}
                                </Link>
                            </>
                        )}
                        {item.sub && (
                            <>
                                <span className={styles.sep}>›</span>
                                <Link
                                    href={catHref(item.category, item.mid, item.sub)}
                                    className={styles.bc}
                                >
                                    {item.sub}
                                </Link>
                            </>
                        )}
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
                        <div className={styles.infoCard}>
                            <h1 className={styles.title}>{item.title}</h1>
                            <div className={styles.price}>{toKRW(item.price)}</div>

                            {/* ✅ 여기! 개별 필드로 넘겨야 함 */}
                            <TradeInfoPanel
                                condition={item.condition}
                                dealType={item.dealType}
                                meetLocation={item.meetLocation}
                            />

                            <RightPanelClient
                                itemId={item.id}
                                title={item.title}
                                price={item.price}
                                wishCount={item.wishCount ?? 0}
                                description={item.description || ""}
                                seller={seller}
                            />
                        </div>

                        <SellerProfilePanel seller={seller} />
                        
                    </aside>
                </div>
            </ModalProvider>
        </div>
    );
}
