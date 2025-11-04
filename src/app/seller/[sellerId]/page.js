// src/app/seller/[sellerId]/page.js
import ProductsGrid from "@/components/category/ProductsGrid";
import { fetchSeller, fetchSellerProducts } from "@/lib/server/sellers";

export const revalidate = 0;

export default async function SellerPage({ params, searchParams }) {
    const sellerId = params?.sellerId;
    const page = Number(searchParams?.page ?? 0);
    const size = Number(searchParams?.size ?? 20);
    const sort = String(searchParams?.sort ?? "recent");

    const seller = await fetchSeller(sellerId);
    const items = await fetchSellerProducts({ sellerId, page, size, sort });

    return (
        <main className="container" style={{ paddingTop: 24, paddingBottom: 40 }}>
            <header style={{ marginBottom: 16 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>
                    {seller?.nickname ?? `판매자 #${sellerId}`}의 상품
                </h1>
            </header>

            {items.length > 0 ? (
                <ProductsGrid items={items} />
            ) : (
                <p style={{ color: "#777", marginTop: 24 }}>등록된 상품이 없습니다.</p>
            )}
        </main>
    );
}
