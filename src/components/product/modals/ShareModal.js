'use client';

import { useEffect } from 'react';
import styles from './ShareModal.module.css';

export default function ShareModal({ open = true, onClose, title, url, image }) {
    // 페이지 스크롤 잠금
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    if (!open) return null;

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = title || '대파마켓';


    const handleKakao = async () => {
        // Kakao SDK 있으면 사용
        const { Kakao } = window;
        const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
        try {
            if (Kakao && appKey) {
                if (!Kakao.isInitialized()) Kakao.init(appKey);
                Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: shareTitle,
                        description: '대파마켓 상품 공유',
                        imageUrl: image || 'https://daepa-s3.s3.ap-northeast-2.amazonaws.com/products/KakaoTalk_20251104_145039505.jpg',
                        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
                    },
                    buttons: [
                        {
                            title: '바로 보기',
                            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
                        },
                    ],
                });
                return;
            }
            // SDK 없으면 URL 복사로 폴백
            await navigator.clipboard.writeText(shareUrl);
            alert('링크를 복사했어요. 카카오톡에 붙여넣기 해주세요!');
        } catch (e) {
            console.error(e);
            alert('공유 중 문제가 발생했습니다.');
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('URL이 복사되었습니다.');
        } catch {
            // fallback
            const temp = document.createElement('input');
            temp.value = shareUrl;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            alert('URL이 복사되었습니다.');
        }
    };

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>공유하기</h3>

                <div className={styles.row}>
                    {/*<button className={`${styles.circle} ${styles.kt}`} onClick={handleKakao} aria-label="카카오톡 공유">*/}
                    {/*    TALK*/}
                    {/*</button>*/}
                    <button className={`${styles.circle} ${styles.url}`} onClick={handleCopy} aria-label="URL 복사">
                        URL
                        <span className={styles.sub}>복사</span>
                    </button>
                </div>

                <button className={styles.close} onClick={onClose}>닫기</button>
            </div>
        </div>
    );
}
