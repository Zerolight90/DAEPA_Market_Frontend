import "server-only";
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";
import { fetchUppers } from "@/lib/server/categories";

export const dynamic = "force-dynamic";

export default async function AllPage({ searchParams }) {
    const resolvedSearchParams = await searchParams;

    const page  = Number(resolvedSearchParams?.page  ?? 1);
    const size  = Number(resolvedSearchParams?.size  ?? 20);
    const sort  = resolvedSearchParams?.sort  ?? "recent";
    const min   = resolvedSearchParams?.min   ? Number(resolvedSearchParams.min)  : undefined;
    const max   = resolvedSearchParams?.max   ? Number(resolvedSearchParams.max)  : undefined;
    const dDeal = resolvedSearchParams?.dDeal ?? undefined;
    const excludeSold = resolvedSearchParams?.excludeSold === "true";

    const allUppers = await fetchUppers();

    const { items, total, error } = await fetchProducts({
        // 카테고리 파라미터 없음 → 전체 조회
        page,
        size,
        sort,
        min,
        max,
        dDeal,
        excludeSold,
    });

    if (error) {
        return (
            <main className="container">
                <h1>전체 상품</h1>
                <p>상품을 불러오는 중 오류가 발생했습니다.</p>
            </main>
        );
    }

    return (
        <main className="container">
            <FilterBar
                categoryName="전체 상품"
                upperList={allUppers}
                currentUpperId={null}
                middleList={[]}
                lowList={[]}
                selected={{ mid: null, low: null }}
                currentSort={sort}
            />

            {items.length === 0 ? (
                <p style={{ marginTop: "2rem", textAlign: "center", color: "#888" }}>
                    등록된 상품이 없습니다.
                </p>
            ) : (
                <ProductsGrid items={items} />
            )}
        </main>
    );
}
