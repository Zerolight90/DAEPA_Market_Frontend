// app/oauth/success/page.js
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
    return (
        <Suspense fallback={<p style={{ padding: 24 }}>소셜 로그인 중입니다…</p>}>
            <SuccessClient />
        </Suspense>
    );
}
