import type { Product } from "@/types";

export function sortItems(items: Product[], sort: string): Product[] {
    const list = [...items];
    if (sort === "price_asc") return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "price_desc") return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return list;
}
