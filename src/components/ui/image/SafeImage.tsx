"use client";
import { useState } from "react";

export default function SafeImage({ src, alt, fallback="/images/placeholder.png", ...rest }) {
    const [err, setErr] = useState(false);
    return <img src={err ? fallback : src} alt={alt} onError={() => setErr(true)} {...rest} />;
}
