// src/app/category/[name]/page.js
import "server-only";
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";
import {
    fetchLows,
    fetchMiddles,
    fetchUpperMeta,
    fetchUppers,
} from "@/lib/server/categories";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }) {
    const categoryName = params.name;
    const middleCategoryName = searchParams.mid;
    const lowCategoryName = searchParams.low;

    // restSearchParams를 수동으로 구성해야 합니다.
    const restSearchParams = { ...searchParams };
    delete restSearchParams.mid;
    delete restSearchParams.low;

    // 1. 상위 카테고리 ID 조회
    const upperCategory = await fetchUpperMeta(categoryName);
    const upperId = upperCategory?.id;

    // 2. 전체 상위 카테고리 목록 (for GNB)
    const allUppers = await fetchUppers();

    // 3. 중간 카테고리 목록 조회
    const middles = await fetchMiddles(upperId);

    // 4. 하위 카테고리 목록 조회 (선택된 중간 카테고리가 있을 경우)
    const selectedMiddle =
        middles.find(
            (m) => m.name === middleCategoryName || String(m.id) === middleCategoryName
        ) ?? null;
    const middleId = selectedMiddle?.id;
    const lows = await fetchLows(middleId);

    // 5. 상품 목록 조회
    const selectedLow =
        lows.find(
            (l) => l.name === lowCategoryName || String(l.id) === lowCategoryName
        ) ?? null;
    const lowId = selectedLow?.id;

    const { items, total, page, size, error } = await fetchProducts({
        category: categoryName,
        upperId,
        middleId,
        lowId,
        ...restSearchParams,
    });

    if (error) {
        return (
            <main className="container">
                <h1>{categoryName}</h1>
                <p>상품을 불러오는 중 에러가 발생했습니다.</p>
            </main>
        );
    }

    return (
        <main className="container">
            <FilterBar
                categoryName={upperCategory.name}
                upperList={allUppers}
                currentUpperId={upperCategory.id}
                middleList={middles}
                lowList={lows}
                selected={{ mid: middleId, low: lowId }}
                currentSort={searchParams.sort ?? 'recent'}
            />

            <ProductsGrid items={items ?? []} />
        </main>
    );
}