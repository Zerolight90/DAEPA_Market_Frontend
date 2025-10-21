export function sortItems(items, sort) {
    const list = [...items];
    if (sort === "price_asc") return list.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") return list.sort((a, b) => b.price - a.price);

    return list;
}
