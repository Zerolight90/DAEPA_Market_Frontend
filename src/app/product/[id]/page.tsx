"use client";
import { openChatRoom  } from "@/lib/chat/api";
import { useRouter } from "next/navigation";

export default function ProductDetail({ product }) {
    const router = useRouter();

    // 예시 데이터: 실제로는 로그인 상태 / 상품 데이터에서 가져옴
    const sellerId = product.sellerId; // 판매자
    const productId = product.id; // 상품 pk

    const handleChatClick = async () => {
        try {
            const { roomId } = await openChatRoom({
                sellerId,
                productId,
            });

            // ✅ 채팅 페이지로 이동
            router.push(`/chat?roomId=${roomId}`);
        } catch (err) {
            console.error(err);
            alert("채팅방을 생성할 수 없습니다.");
        }
    };

    return (
        <div>
            {/* 상품 정보 */}
            <h2>{product.title}</h2>
            <p>{product.price}원</p>
            <button onClick={handleChatClick}>💬 채팅하기</button>
        </div>
    );
}
