// src/app/category/[name]/page.js
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";
import {
    fetchUpperMeta,
    fetchMiddles,
    fetchLows,
    fetchUppers,              // ✅ 전체 상위 목록
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

    // 현재 선택된 상위
    const upper = await fetchUpperMeta(upperName);
    if (!upper) {
        return (
            <main className="container">
                <h1>{upperName}</h1>
                <p>해당 카테고리를 찾을 수 없습니다.</p>
            </main>
        );
    }

    // ✅ 여기서 전체 상위 목록도 불러온다
    const upperList = await fetchUppers();

    const middleList = await fetchMiddles(upper.id);
    const lowList = mid ? await fetchLows(mid) : [];

    const data = await fetchProducts({
        upperId: upper.id,
        middleId: mid ?? undefined,
        lowId: low ?? undefined,
        sort,
        page,
        size,
    });

    return (
        <main className="container">
            <FilterBar
                categoryName={upper.name}
                upperList={upperList}                // ✅ 추가
                middleList={middleList}
                lowList={lowList}
                selected={{ upper: upper.id, mid, low }}  // ✅ 상위까지 같이 넘김
                currentSort={sort}
            />
            <ProductsGrid items={data.items ?? []} />
        </main>
    );
}
