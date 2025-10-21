// app/category/[name]/page.js
import { getCategoryMatrixData, listBigCategories } from "@/lib/categoryTree";
import CategoryMatrix from "@/components/category/CategoryMatrix";
import ProductsGrid from "@/components/category/ProductsGrid";
import FilterBar from "@/components/category/FilterBar";
// import { fetchProducts } from "@/lib/server/products";

export const revalidate = 0;

export default async function CategoryPage(props) {
    const { name } = await props.params;                // 대카테고리 이름
    const sp = (await props.searchParams) || {};
    const big = decodeURIComponent(name || "");
    const mid = sp.mid || null;
    const sub = sp.sub || null;
    const sort = sp.sort || "recent";

    const matrixData = getCategoryMatrixData(big);
    const bigList = listBigCategories();

    // 👉 백엔드가 big/mid/sub 쿼리를 지원한다고 가정.
    // 만약 upperId/middleId/lowId 기반이라면, 여기서 이름→ID 매핑만 추가해주면 됨.
    const { items } = await fetchProducts({
        big,
        mid,
        sub,
        sort,
        page: Number(sp.page ?? 0),
        size: Number(sp.size ?? 40),
    });

    return (
        <div className="container">
            {matrixData && (
                <CategoryMatrix
                    bigName={big}
                    data={matrixData}
                    bigList={bigList}
                    currentMid={mid}
                    currentSub={sub}
                />
            )}

            <FilterBar categoryName={[big, mid, sub].filter(Boolean).join(" > ") || big} />

            <h3 style={{ marginTop: 16 }}>
                {big}{mid ? ` > ${mid}` : ""}{sub ? ` > ${sub}` : ""}
            </h3>

            <ProductsGrid items={items} />
        </div>
    );
}
