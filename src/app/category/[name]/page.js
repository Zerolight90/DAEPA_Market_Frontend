// src/app/category/[name]/page.js
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";
import { fetchUpperMeta, fetchMiddles, fetchLows } from "@/lib/server/categories";

export const revalidate = 0; // 개발 중 실시간 반영

export default async function CategoryPage({ params, searchParams }) {
    // searchParams는 Server Component에선 일반 객체지만,
    // 클라이언트 네비게이션 시에도 안전하게 읽도록 래퍼 사용
    const sp = await searchParams;
    const read = (key, def) => {
        if (typeof sp?.get === "function") return sp.get(key) ?? def;
        return sp?.[key] ?? def;
    };

    // 상위 카테고리 이름 (URL 디코딩)
    const upperName = decodeURIComponent(params?.name || "");

    // 단계 선택값
    const mid = read("mid", null); // middleId
    const low = read("low", null); // lowId

    // 페이지네이션/정렬
    const page = Number(read("page", 1));
    const size = Number(read("size", 20));
    const sort = read("sort", "recent");

    // 상위 이름 → 상위 ID 메타
    const upper = await fetchUpperMeta(upperName); // { id, name }

    // 상단 칩 데이터: 중간은 항상, 하위는 mid가 있을 때만
    const middleList = await fetchMiddles(upper.id); // [{id,name,count?}]
    const lowList = mid ? await fetchLows(mid) : [];

    // 상품은 항상 노출(upper/mid/low 조합으로 필터)
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

            {/* 상단 바: 브레드크럼 + 카테고리 칩 + 정렬칩 */}
            <FilterBar
                categoryName={upper.name}
                middleList={middleList}
                lowList={lowList}
                selected={{ mid, low }}
            />

            {/* 상품 목록 */}
            <ProductsGrid items={data.items} />
        </main>
    );
}
