// app/oauth/page.js
import { Suspense } from "react";
import OAuthClient from "./OAuthClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: 24 }}>OAuth 페이지 로딩 중…</div>}>
            <OAuthClient />
        </Suspense>
    );
}
