export const catHref = (big, mid, sub) => {
    const base = `/category/${encodeURIComponent(big)}`;
    const qs = new URLSearchParams();
    if (mid) qs.set("mid", mid);
    if (sub) qs.set("sub", sub);
    const q = qs.toString();
    return q ? `${base}?${q}` : base;
};
