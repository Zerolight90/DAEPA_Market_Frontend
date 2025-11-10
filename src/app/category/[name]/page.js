import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";
import {
    fetchUpperMeta,
    fetchMiddles,
    fetchLows,
    fetchUppers,
} from "@/lib/server/categories";

export const revalidate = 0;

export default async function CategoryPage(props) {
    const { name } = await props.params;
    const sp = await props.searchParams;

    const read = (key, def) => {
        if (sp && typeof sp.get === "function") return sp.get(key) ?? def;
        return sp?.[key] ?? def;
    };

    const upperName = decodeURIComponent(name ?? "");

    const midRaw = read("mid", null);
    const lowRaw = read("low", null);
    const mid = midRaw != null ? Number(midRaw) : null;
    const low = lowRaw != null ? Number(lowRaw) : null;

    const page = Number(read("page", 0));
    const size = Number(read("size", 20));
    const sort = read("sort", "recent");

    const minRaw = read("min", null);
    const maxRaw = read("max", null);
    const min = minRaw != null ? Number(minRaw) : null;
    const max = maxRaw != null ? Number(maxRaw) : null;

    // ✅ 새로 추가된 것들
    const dDeal = read("dDeal", null); // "MEET" | "DELIVERY" | null
    const excludeSold = read("excludeSold", null) === "true";

    const upper = await fetchUpperMeta(upperName);
    if (!upper) {
        return (
            <main className="container">
                <h1>{upperName}</h1>
                <p>해당 카테고리를 찾을 수 없습니다.</p>
            </main>
        );
    }

    const upperList = await fetchUppers();
    const middleList = await fetchMiddles(upper.id);
    const lowList = mid ? await fetchLows(mid) : [];

    const data = await fetchProducts({
        upperId: upper.id,
        middleId: mid ?? undefined,
        lowId: low ?? undefined,
        min: min ?? undefined,
        max: max ?? undefined,
        dDeal: dDeal ?? undefined,
        excludeSold,
        sort,
        page,
        size,
    });

    return (
        <main className="container">
            <FilterBar
                categoryName={upper.name}
                upperList={upperList}
                currentUpperId={upper.id}
                middleList={middleList}
                lowList={lowList}
                selected={{ mid, low }}
                currentSort={sort}
            />

            <ProductsGrid items={data.items ?? []} />
        </main>
    );
}
