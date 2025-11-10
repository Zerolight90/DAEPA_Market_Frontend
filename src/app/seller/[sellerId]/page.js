// src/app/seller/[sellerId]/page.js
import SellerProfilePanel from "@/components/product/SellerProfilePanel";
import {
    fetchSellerProducts,
    fetchProductDetail,
} from "@/lib/server/sellers";
import SellerProductsGrid from "@/components/seller/SellerProductsGrid";
import styles from "./SellerPage.module.css";

export const revalidate = 0;

export default async function SellerPage(props) {
    // Next 15 스타일
    const { sellerId } = await props.params;
    const sp = await props.searchParams;

    const page = Number(sp?.page ?? 0);
    const size = Number(sp?.size ?? 20);
    const sort = String(sp?.sort ?? "recent");  // 최신순/낮은가격순/높은가격순
    const status = String(sp?.status ?? "all"); // 전체/판매중/판매완료

    // 1) 이 판매자의 상품 목록
    const baseItems =
        (await fetchSellerProducts({
            sellerId,
            page,
            size,
            sort,
            status,
        })) ?? [];

    // 2) 첫 번째 상품으로부터 판매자 정보·dsell 정보 보강
    let sellerFromProduct = null;

    const itemsWithDetail = await Promise.all(
        baseItems.map(async (it, idx) => {
            const id = it.id ?? it.pdIdx;
            if (!id) return it;

            try {
                const detail = await fetchProductDetail(id);

                // 첫 번째 아이템의 상세에서 판매자 정보 한 번만 가져오면 됨
                if (idx === 0 && detail) {
                    sellerFromProduct = {
                        id:
                            detail.sellerId ??
                            detail.sellerIdx ??
                            detail.seller?.uIdx ??
                            sellerId,
                        nickname: detail.sellerName ?? "판매자",
                        avatarUrl: detail.sellerAvatar ?? detail.sellerProfile ?? null,
                        freshness:
                            detail.sellerManner ??
                            detail.sellerScore ??
                            0,
                        deals: 0,
                        since: null,
                    };
                }

                return {
                    ...it,
                    dsell:
                        detail?.dsell ??
                        detail?.dSell ??
                        detail?.d_status ??
                        detail?.dStatus ??
                        it?.dsell ??
                        0,
                    dstatus:
                        detail?.dstatus ??
                        detail?.dStatus ??
                        it?.dstatus ??
                        0,
                    thumbnail: it.thumbnail ?? it.pdThumb ?? detail?.pdThumb ?? null,
                    createdAt: it.createdAt ?? detail?.pdCreate ?? it?.pdCreate ?? null,
                    price: it.price ?? it.pdPrice ?? detail?.pdPrice ?? null,
                };
            } catch {
                return it;
            }
        })
    );

    // 3) 프론트에서 탭 필터링
    let filtered = itemsWithDetail;
    if (status === "selling") {
        // 판매중: d_sell != 1
        filtered = itemsWithDetail.filter(
            (it) => Number(it.dsell ?? it.dSell ?? 0) !== 1
        );
    } else if (status === "sold") {
        // 판매완료: d_sell == 1
        filtered = itemsWithDetail.filter(
            (it) => Number(it.dsell ?? it.dSell ?? 0) === 1
        );
    }

    // 4) 프런트에서 정렬
    const sorted = [...filtered].sort((a, b) => {
        if (sort === "price_asc") {
            const pa = Number(a.price ?? a.pdPrice ?? 0);
            const pb = Number(b.price ?? b.pdPrice ?? 0);
            return pa - pb;
        }
        if (sort === "price_desc") {
            const pa = Number(a.price ?? a.pdPrice ?? 0);
            const pb = Number(b.price ?? b.pdPrice ?? 0);
            return pb - pa;
        }
        // 최신순
        const da = new Date(a.createdAt ?? a.pdCreate ?? 0).getTime();
        const db = new Date(b.createdAt ?? b.pdCreate ?? 0).getTime();
        return db - da;
    });

    // 5) 패널에 줄 데이터 (상품이 아예 없으면 기본값)
    const sellerForPanel =
        sellerFromProduct ?? {
            id: sellerId,
            nickname: "판매자",
            avatarUrl: null,
            freshness: 0,
            deals: 0,
            since: null,
        };

    // 탭/정렬 링크
    const makeQuery = (next = {}) => {
        const q = new URLSearchParams();
        q.set("page", String(page));
        q.set("size", String(size));
        q.set("sort", next.sort ?? sort);
        q.set("status", next.status ?? status);
        return `?${q.toString()}`;
    };

    return (
        <main className={styles.page}>
            {/* 판매자 카드 */}
            <div className={styles.profilePanelWrap}>
                <SellerProfilePanel seller={sellerForPanel} />
            </div>

            {/* 탭 + 정렬 */}
            <section className={styles.tabsRow}>
                <div className={styles.tabs}>
                    <a
                        href={makeQuery({ status: "all" })}
                        className={`${styles.tab} ${
                            status === "all" ? styles.tabActive : ""
                        }`}
                    >
                        전체
                    </a>
                    <a
                        href={makeQuery({ status: "selling" })}
                        className={`${styles.tab} ${
                            status === "selling" ? styles.tabActive : ""
                        }`}
                    >
                        판매중
                    </a>
                    <a
                        href={makeQuery({ status: "sold" })}
                        className={`${styles.tab} ${
                            status === "sold" ? styles.tabActive : ""
                        }`}
                    >
                        판매완료
                    </a>
                </div>

                <div className={styles.sort}>
                    <a
                        href={makeQuery({ sort: "recent" })}
                        className={`${styles.sortItem} ${
                            sort === "recent" ? styles.sortActive : ""
                        }`}
                    >
                        최신순
                    </a>
                    <span className={styles.sortSep}>|</span>
                    <a
                        href={makeQuery({ sort: "price_asc" })}
                        className={`${styles.sortItem} ${
                            sort === "price_asc" ? styles.sortActive : ""
                        }`}
                    >
                        낮은가격순
                    </a>
                    <span className={styles.sortSep}>|</span>
                    <a
                        href={makeQuery({ sort: "price_desc" })}
                        className={`${styles.sortItem} ${
                            sort === "price_desc" ? styles.sortActive : ""
                        }`}
                    >
                        높은가격순
                    </a>
                </div>
            </section>

            {/* 상품 리스트 – 너 원래 쓰던 ProductCard 그대로 들어감 */}
            <section className={styles.productsSection}>
                {sorted.length > 0 ? (
                    <SellerProductsGrid items={sorted} />
                ) : (
                    <p className={styles.empty}>해당 조건의 상품이 없습니다.</p>
                )}
            </section>
        </main>
    );
}
