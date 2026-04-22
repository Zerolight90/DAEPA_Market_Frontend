// ⚠️ 이 경로는 /sign/login 으로 이전되었습니다.
// 하위 호환성을 위한 리다이렉트 페이지입니다.
import { redirect } from "next/navigation";

export default function DeprecatedLoginPage() {
    redirect("/sign/login");
}
