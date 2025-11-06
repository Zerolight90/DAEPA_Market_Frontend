// src/app/store/[id]/page.js
import Link from "next/link";
import styles from "./page.module.css";
import { toKRW } from "@/lib/formatters";
import { catHref } from "@/lib/urls";
import { fetchProduct, fetchRelated } from "@/lib/api/products";

import ProductGallery from "@/components/product/ProductGallery";
import RightPanelClient from "@/components/product/RightPanelClient";
import { ModalProvider } from "@/components/ui/modal/ModalProvider";
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
                // related = getRelatedItems(id, 10);
                related = [];
            }
        }
    }

    // 폴백 (필요하면 너네 mock 불러오던 거 다시 넣어)
    if (!item) {
        // item = getItemById(id);
        // related = getRelatedItems(id, 10);
    }

    if (!item) {
        return (
            <div className={styles.container} style={{ padding: "40px 0" }}>
                상품을 찾을 수 없습니다.
            </div>
        );
    }

    // ✅ 여기서 판매완료 여부 하나로 만든다
    // 백엔드 JSON 예시:
    // "dstatus": 1, "dsell": 1, "ddeal": "DELIVERY"
    const soldOut =
        item.dStatus === 1 ||
        item.d_status === 1 ||
        item.dealStatus === 1 ||
        item.dstatus === 1 || // 소문자 키
        item.dsell === 1 ||
        item.d_sell === 1;

    const images =
        Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : item.thumbnail
                ? [item.thumbnail]
                : item.img
                    ? [item.img]
                    : [];

    const seller =
        item.seller ??
        {
            id: item.sellerId ?? item.seller_id ?? null,
            name: item.sellerName ?? "알 수 없음",
            avatar: item.sellerAvatar ?? "/no-image.png",
            manner: item.sellerManner ?? 0,
        };

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
                                <Link
                                    href={catHref(item.category, item.mid)}
                                    className={styles.bc}
                                >
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
                        {/* 👇 판매완료 여부 내려줌 */}
                        <ProductGallery images={images} soldOut={soldOut} />

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
                            <h1 className={styles.title}>
                                {item.title ?? item.pdTitle}
                                {soldOut && (
                                    <span
                                        style={{
                                            marginLeft: 8,
                                            fontSize: 12,
                                            background: "#111827",
                                            color: "#fff",
                                            padding: "2px 8px",
                                            borderRadius: 9999,
                                            verticalAlign: "middle",
                                        }}
                                    >
                    판매완료
                  </span>
                                )}
                            </h1>
                            <div className={styles.price}>
                                {toKRW(item.price ?? item.pdPrice)}
                            </div>

                            <TradeInfoPanel
                                condition={item.condition}
                                dealType={item.dealType ?? item.ddeal ?? item.deal_type}
                                meetLocation={item.meetLocation ?? item.location}
                            />

                            {/* 오른쪽 액션 패널 */}
                            <RightPanelClient
                                itemId={item.id ?? item.pdIdx}
                                title={item.title ?? item.pdTitle}
                                price={item.price ?? item.pdPrice}
                                wishCount={item.wishCount ?? 0}
                                description={item.description || item.pdContent || ""}
                                seller={seller}
                                soldOut={soldOut}
                            />
                        </div>

                        <SellerProfilePanel seller={seller} />
                    </aside>
                </div>
            </ModalProvider>
        </div>
    );
}
