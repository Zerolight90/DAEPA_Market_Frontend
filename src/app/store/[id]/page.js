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
                related = [];
            }
        }
    }

    if (!item) {
        return (
            <div className={styles.container} style={{ padding: "40px 0" }}>
                상품을 찾을 수 없습니다.
            </div>
        );
    }

    // 1) 백엔드가 주는 거래 상태를 하나의 숫자로 통일
    const rawDeal =
        item.dsell ??
        item.dSell ??
        item.d_status ??
        item.dStatus ??
        item.dealStatus ??
        null;
    const dealState =
        rawDeal === null || rawDeal === undefined ? null : Number(rawDeal);

    // 2) "판매완료"로 볼 조건 (기존 로직 + dsell==1)
    const soldOut =
        item.dStatus === 1 ||
        item.d_status === 1 ||
        item.dealStatus === 1 ||
        item.dstatus === 1 ||
        item.dsell === 1 ||
        item.d_sell === 1 ||
        dealState === 1;

    // 이미지
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

    // 제목 옆에 띄울 라벨 텍스트
    const titleBadge =
        dealState === 2 ? "판매 중" : soldOut ? "판매완료" : null;

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
                    {/* 왼쪽 */}
                    <section className={styles.leftCol}>
                        {/* 👇 판매 상태(1:완료, 2:판매중) 둘 다 내려줌 */}
                        <ProductGallery
                            images={images}
                            soldOut={soldOut}
                            dealState={dealState}
                        />

                        <DetailsPanel item={item} />

                        {Array.isArray(related) && related.length > 0 && (
                            <div className={styles.section}>
                                <h3 className={styles.h3}>연관 상품</h3>
                                <RelatedProducts items={related} />
                            </div>
                        )}
                    </section>

                    {/* 오른쪽 */}
                    <aside className={styles.rightCol}>
                        <div className={styles.infoCard}>
                            <h1 className={styles.title}>
                                {item.title ?? item.pdTitle}
                                {titleBadge && (
                                    <span
                                        style={{
                                            marginLeft: 8,
                                            fontSize: 12,
                                            background:
                                                titleBadge === "판매 중" ? "#0f172a" : "#111827",
                                            color: "#fff",
                                            padding: "2px 8px",
                                            borderRadius: 9999,
                                            verticalAlign: "middle",
                                        }}
                                    >
                    {titleBadge}
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
                                dealState={dealState}
                            />
                        </div>

                        <SellerProfilePanel seller={seller} />
                    </aside>
                </div>
            </ModalProvider>
        </div>
    );
}
