"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { API_BASE, Endpoints } from "@/app/sell/api";   // ✅ API 경로 정의
import styles from "./ProductCard.module.css";

export default function ProductCard({ item, hrefBase = "/store" }) {
    const router = useRouter();
    const [fav, setFav] = useState(false);  // 현재 찜 여부
    const [count, setCount] = useState(0);  // 찜 개수

    // ✅ 첫 렌더링 시 찜 상태/개수 불러오기
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}${Endpoints.favoriteStatus(item.id)}`, {
                    credentials: "include",  // 쿠키 포함
                });
                if (res.ok) {
                    const data = await res.json();
                    setFav(!!data.favorited);
                    setCount(data.count ?? 0);
                }
            } catch (e) {
                console.error("찜 상태 조회 실패:", e);
            }
        })();
    }, [item.id]);

    // ✅ 하트 클릭 시
    const onToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const url = `${API_BASE}${Endpoints.favoriteToggle(item.id)}`;
        try {
            console.log("[favoriteToggle] url =", url);       // ✅ 최종 요청 URL 확인용
            const res = await fetch(url, {
                method: "POST",
                credentials: "include",
            });

            if (res.status === 401) {
                alert("로그인이 필요합니다.");
                return; // 리다이렉트 X
            }

            // 200이 아니면 서버 에러 메시지 보여주고 종료
            if (!res.ok) {
                const msg = await res.text().catch(() => res.statusText);
                console.error("[favoriteToggle] HTTP", res.status, msg);
                alert(`찜 처리 실패 (${res.status})\n${msg}`);
                return;
            }

            // OK
            const data = await res.json();
            setFav(!!data.favorited);
            setCount(data.count ?? 0);
        } catch (err) {
            // fetch 자체 실패 (프록시/도메인/네트워크)
            console.error("[favoriteToggle] fetch error:", err);
            alert(`찜 처리 중 오류가 발생했습니다.\n${String(err)}`);
        }
    };


    return (
        <li className={styles.card}>
            <Link href={`${hrefBase}/${item.id}`} className={styles.link}>
                {/* ✅ 상품 썸네일 */}
                <div className={styles.thumbWrap}>
                    <img
                        src={item.thumbnail || "/no-image.png"}
                        alt={item.title}
                        className={styles.thumb}
                    />

                    {/* ✅ 하트 버튼 */}
                    <button
                        className={styles.heartBtn}
                        onClick={onToggle}
                        aria-label="찜하기"
                        title="찜하기"
                    >
                        {fav ? (
                            <FavoriteIcon className={styles.heartOn} />
                        ) : (
                            <FavoriteBorderIcon className={styles.heartOff} />
                        )}
                        <span className={styles.heartCnt}>{count}</span>
                    </button>
                </div>

                {/* ✅ 상품 정보 */}
                <div className={styles.meta}>
                    <h3 className={styles.name}>{item.title}</h3>
                    <div className={styles.price}>{item.price.toLocaleString()}원</div>
                    <div className={styles.sub}>
                        <span>{item.location}</span>
                        <span className={styles.dot}>•</span>
                        <span>{item.createdAt?.slice(0, 10) ?? ""}</span>
                    </div>
                </div>
            </Link>
        </li>
    );
}
