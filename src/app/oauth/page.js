// app/oauth/page.js
import { Suspense } from "react";
import OAuthClient from "./OAuthClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function OAuthPage() {
    return (
        <Suspense fallback={<p style={{ padding: 24 }}>로그인 처리 중...</p>}>
            <OAuthClient />
        </Suspense>
    );
}
