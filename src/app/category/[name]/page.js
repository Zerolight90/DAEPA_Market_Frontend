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
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const decode = (v) => {
        if (!v) return v;
        try {
            return decodeURIComponent(v);
        } catch (e) {
            return v;
        }
    };

    const categoryName = decode(resolvedParams?.name);
    const middleCategoryName = resolvedSearchParams?.mid;
    const lowCategoryName = resolvedSearchParams?.low;

    const restSearchParams = { ...(resolvedSearchParams ?? {}) };
    delete restSearchParams.mid;
    delete restSearchParams.low;

    const upperCategory = await fetchUpperMeta(categoryName);
    const upperId = upperCategory?.id;

    const allUppers = await fetchUppers();
    const middles = await fetchMiddles(upperId);

    const selectedMiddle =
        middles.find(
            (m) => m.name === middleCategoryName || String(m.id) === middleCategoryName
        ) ?? null;
    const middleId = selectedMiddle?.id;
    const lows = await fetchLows(middleId);

    const selectedLow =
        lows.find(
            (l) => l.name === lowCategoryName || String(l.id) === lowCategoryName
        ) ?? null;
    const lowId = selectedLow?.id;

    const { items, error } = await fetchProducts({
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
                <p>상품을 불러오는 중 오류가 발생했습니다.</p>
            </main>
        );
    }

    return (
        <main className="container">
            <FilterBar
                categoryName={upperCategory?.name ?? categoryName}
                upperList={allUppers}
                currentUpperId={upperCategory?.id ?? null}
                middleList={middles}
                lowList={lows}
                selected={{ mid: middleId, low: lowId }}
                currentSort={resolvedSearchParams?.sort ?? "recent"}
            />

            <ProductsGrid items={items ?? []} />
        </main>
    );
}
