// /app/chat/page.js  (Server Component 그대로 둬도 OK)
import MarketChat from "@/components/chat/MarketChat";

export default function Page() {
    return <MarketChat />;  // MarketChat 자체가 "use client"라서 자동으로 클라이언트 경계가 잡혀요.
}
