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
    const { sellerId } = await props.params;
    const sp = await props.searchParams;

    const page = Number(sp?.page ?? 0);
    const size = Number(sp?.size ?? 20);
    const sort = String(sp?.sort ?? "recent");
    const status = String(sp?.status ?? "all");

    const baseItems =
        (await fetchSellerProducts({
            sellerId,
            page,
            size,
            sort,
            status,
        })) ?? [];

    let sellerFromProduct = null;

    const itemsWithDetail = await Promise.all(
        baseItems.map(async (it, idx) => {
            const id = it.id ?? it.pdIdx ?? it.pd_idx;
            if (!id) {
                return { ...it, __deleted: true };
            }

            try {
                const detail = await fetchProductDetail(id);

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
                    pdDel:
                        it.pdDel ??
                        it.pd_del ??
                        detail?.pdDel ??
                        detail?.pd_del ??
                        0,
                    pdEdate:
                        it.pdEdate ??
                        it.pd_edate ??
                        detail?.pdEdate ??
                        detail?.pd_edate ??
                        null,
                };
            } catch (e) {
                return { ...it, __deleted: true };
            }
        })
    );

    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    const aliveItems = itemsWithDetail.filter((it) => {
        if (it.__deleted) return false;

        const rawDel =
            it.pdDel ??
            it.pd_del ??
            it.product?.pdDel ??
            it.product?.pd_del ??
            0;
        const delStr = String(rawDel).trim().toLowerCase();
        const isDeleted =
            delStr === "1" ||
            delStr === "true" ||
            delStr === "y" ||
            delStr === "yes";
        if (isDeleted) return false;

        const dSellRaw =
            it.dsell ??
            it.dSell ??
            it.d_status ??
            it.dStatus ??
            0;
        const dSell = Number(dSellRaw) || 0;
        if (dSell !== 1) return true;

        if (!it.pdEdate) return true;
        const ed = new Date(String(it.pdEdate).replace(" ", "T")).getTime();
        if (Number.isNaN(ed)) return true;

        return ed >= now - threeDaysMs;
    });

    let filtered = aliveItems;
    if (status === "selling") {
        filtered = aliveItems.filter((it) => {
            const dSell =
                Number(
                    it.dsell ??
                    it.dSell ??
                    it.d_status ??
                    it.dStatus ??
                    0
                ) || 0;
            return dSell !== 1;
        });
    } else if (status === "sold") {
        filtered = aliveItems.filter((it) => {
            const dSell =
                Number(
                    it.dsell ??
                    it.dSell ??
                    it.d_status ??
                    it.dStatus ??
                    0
                ) || 0;
            return dSell === 1;
        });
    }

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
        const da = new Date(a.createdAt ?? a.pdCreate ?? 0).getTime();
        const db = new Date(b.createdAt ?? b.pdCreate ?? 0).getTime();
        return db - da;
    });

    const sellerForPanel =
        sellerFromProduct ?? {
            id: sellerId,
            nickname: "판매자",
            avatarUrl: null,
            freshness: 0,
            deals: 0,
            since: null,
        };

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
            <div className={styles.profilePanelWrap}>
                <SellerProfilePanel seller={sellerForPanel} />
            </div>

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
