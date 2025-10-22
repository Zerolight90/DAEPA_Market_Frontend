// src/app/category/[name]/page.js
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
import { fetchProducts } from "@/lib/server/products";

export const revalidate = 0; // 개발 중 실시간 반영

export default async function CategoryPage({ params, searchParams }) {
    // ✅ searchParams는 비동기(dynamic) 객체이므로 await 필요
    const sp = await searchParams;

    // ✅ 안전하게 값 읽는 유틸 함수
    const read = (key, def) => {
        // searchParams가 URLSearchParams이면 get()으로 접근
        if (typeof sp?.get === "function") return sp.get(key) ?? def;
        // 그렇지 않으면 단순 객체로 접근
        return sp?.[key] ?? def;
    };

    // ✅ 카테고리명 (URL 디코딩)
    const name = decodeURIComponent(params?.name || "");

    // ✅ page, size, sort 등 파라미터 안전 파싱
    const page = Number(read("page", 1));
    const size = Number(read("size", 20));
    const sort = read("sort", "recent");

    // ✅ 상품 목록 API 호출
    const data = await fetchProducts({ category: name, page, size, sort });

    return (
        <main className="container">
            <h1>{name}</h1>
            <FilterBar />
            <ProductsGrid items={data.items} />
        </main>
    );
}
