// src/app/category/[name]/page.js
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";
import { fetchUpperMeta, fetchMiddles, fetchLows } from "@/lib/server/categories";

export const revalidate = 0;

export default async function CategoryPage(props) {
    // ✅ Next 15: 프레임워크가 Promise 형태로 줄 수 있으니 await
    const { name } = await props.params;
    const sp = await props.searchParams;

    // ✅ 안전 파서 (URLSearchParams/일반 객체 모두 지원)
    const read = (key, def) => {
        if (sp && typeof sp.get === "function") return sp.get(key) ?? def;
        return sp?.[key] ?? def;
    };

    const upperName = decodeURIComponent(name ?? "");

    const midRaw = read("mid", null);
    const lowRaw = read("low", null);
    const mid = midRaw != null ? Number(midRaw) : null;
    const low = lowRaw != null ? Number(lowRaw) : null;

    const page = Number(read("page", 1));
    const size = Number(read("size", 20));
    const sort = read("sort", "recent");

    const upper = await fetchUpperMeta(upperName);
    if (!upper) {
        return (
            <main className="container">
                <h1>{upperName}</h1>
                <p>해당 카테고리를 찾을 수 없습니다.</p>
            </main>
        );
    }

    const middleList = await fetchMiddles(upper.id);
    const lowList = mid ? await fetchLows(mid) : [];

    const data = await fetchProducts({
        category: upper.name,
        upperId: upper.id,
        middleId: mid ?? undefined,
        lowId: low ?? undefined,
        page,
        size,
        sort,
    });

    return (
        <main className="container">
            <h1>{upper.name}</h1>
            <FilterBar
                categoryName={upper.name}
                middleList={middleList}
                lowList={lowList}
                selected={{ mid, low }}
            />
            <ProductsGrid items={data.items ?? []} />
        </main>
    );
}
