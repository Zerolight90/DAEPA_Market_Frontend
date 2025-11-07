// src/app/category/[name]/page.js
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";
import {
    fetchUpperMeta,
    fetchMiddles,
    fetchLows,
    fetchUppers,     // ✅ 전체 대분류 가져오기
} from "@/lib/server/categories";

export const revalidate = 0;

export default async function CategoryPage(props) {
    // Next 15 비동기 params
    const { name } = await props.params;
    const sp = await props.searchParams;

    const read = (key, def) => {
        if (sp && typeof sp.get === "function") return sp.get(key) ?? def;
        return sp?.[key] ?? def;
    };

    // 대분류 이름
    const upperName = decodeURIComponent(name ?? "");

    // 쿼리
    const midRaw = read("mid", null);
    const lowRaw = read("low", null);

    const mid = midRaw != null ? Number(midRaw) : null;
    const low = lowRaw != null ? Number(lowRaw) : null;

    const page = Number(read("page", 0));
    const size = Number(read("size", 20));
    const sort = read("sort", "recent");

    // ✅ 현재 페이지의 대분류 정보
    const upper = await fetchUpperMeta(upperName);
    if (!upper) {
        return (
            <main className="container">
                <h1>{upperName}</h1>
                <p>해당 카테고리를 찾을 수 없습니다.</p>
            </main>
        );
    }

    // ✅ 전체 대분류 목록도 같이 불러와서 필터바에 주자
    const upperList = await fetchUppers();

    // 중분류 / 소분류 목록
    const middleList = await fetchMiddles(upper.id);
    const lowList = mid ? await fetchLows(mid) : [];

    // 상품 목록
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
                // 현재 대분류명
                categoryName={upper.name}
                // ✅ 여기 추가
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
