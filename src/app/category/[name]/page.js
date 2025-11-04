// src/app/category/[name]/page.js
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";
import {
    fetchUpperMeta,
    fetchMiddles,
    fetchLows,
} from "@/lib/server/categories";

export const revalidate = 0;

export default async function CategoryPage(props) {
    // Next 15 비동기 params
    const { name } = await props.params;
    const sp = await props.searchParams;

    // 안전 파서
    const read = (key, def) => {
        if (sp && typeof sp.get === "function") return sp.get(key) ?? def;
        return sp?.[key] ?? def;
    };

    // 대분류 이름
    const upperName = decodeURIComponent(name ?? "");

    // 쿼리에서 필터값들 꺼내기
    const midRaw = read("mid", null);
    const lowRaw = read("low", null);
    // 네가 지금 카테고리 id로 관리하는 것 같아서 숫자로 변환
    const mid = midRaw != null ? Number(midRaw) : null;
    const low = lowRaw != null ? Number(lowRaw) : null;

    // 0페이지부터 시작하도록 통일
    const page = Number(read("page", 0));
    const size = Number(read("size", 20));
    const sort = read("sort", "recent"); // ✅ 최신순 / 가격↑ / 가격↓

    // 대분류 메타
    const upper = await fetchUpperMeta(upperName);
    if (!upper) {
        return (
            <main className="container">
                <h1>{upperName}</h1>
                <p>해당 카테고리를 찾을 수 없습니다.</p>
            </main>
        );
    }

    // 중분류 / 소분류 목록
    const middleList = await fetchMiddles(upper.id);
    const lowList = mid ? await fetchLows(mid) : [];

    // 📦 실제 상품 목록
    // 이 함수 안에서 /api/products (id기반) 또는 /api/products/by-name 중 하나로 호출하게 해놨다고 봤음
    const data = await fetchProducts({
        upperId: upper.id,
        middleId: mid ?? undefined,
        lowId: low ?? undefined,
        sort,           // ← 여기서 백엔드로 그대로 내려감 ("recent" | "price_asc" | "price_desc")
        page,
        size,
    });

    return (
        <main className="container">
            {/* 상단 필터/정렬 바 */}
            <FilterBar
                categoryName={upper.name}
                middleList={middleList}
                lowList={lowList}
                selected={{ mid, low }}
                // 정렬은 필터바 안에서 searchParams 로 다시 읽으니까 안 줘도 되는데
                // 보기 좋게 넘겨둘 수도 있음
                currentSort={sort}
            />

            {/* 상품 목록 */}
            <ProductsGrid items={data.items ?? []} />
        </main>
    );
}
