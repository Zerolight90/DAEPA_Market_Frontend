// ─── 공통 도메인 타입 ───────────────────────────────────────────────────────

/** 상품 */
export interface Product {
  // 기본 필드
  id: number;
  pdIdx?: number;
  pd_idx?: number;
  title: string;
  pdTitle?: string;
  pd_title?: string;
  price: number;
  pdPrice?: number;
  pd_price?: number;
  thumbnail?: string;
  pdThumb?: string;
  pd_thumb?: string;
  location?: string;
  pdLocation?: string;
  createdAt?: string;
  pdCreate?: string;
  pd_create?: string;
  // 삭제/만료 필드
  pdDel?: number | string;
  pd_del?: number | string;
  pdEdate?: string;
  pd_edate?: string;
  // 판매 상태 필드 (서버 응답 다양한 형태)
  dsell?: number | string;
  dSell?: number | string;
  d_sell?: number | string;
  d_status?: number | string;
  dStatus?: number | string;
  dstatus?: number | string;
  // 판매자 정보
  sellerId?: number;
  sellerNickname?: string;
  sellerAvatar?: string;
  // 기타
  description?: string;
  pdContent?: string;
  category?: string;
  status?: string;
  isSold?: boolean;
  isDDeal?: boolean;
  images?: string[];
  // 중첩 product 객체 (API 응답 일부)
  product?: Record<string, unknown>;
  // 내부 마킹 필드
  __deleted?: boolean;
}

/** 상품 목록 응답 */
export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  size: number;
  error?: string;
}

/** 카테고리 */
export interface UpperCategory {
  id: number;
  name: string;
  count?: number;
  upperIdx?: number;
  upperCt?: string;
}

export interface MiddleCategory {
  id: number;
  name: string;
  count?: number;
  middleIdx?: number;
  middleCt?: string;
}

export interface LowCategory {
  id: number;
  name: string;
  count?: number;
  lowIdx?: number;
  lowCt?: string;
}

/** 사용자 */
export interface User {
  userId?: number;
  id?: number;
  uIdx?: number;
  uId?: string;
  nickname?: string;
  nickName?: string;
  uNickname?: string;
  u_nickname?: string;
  unickname?: string;
  uname?: string;
  uName?: string;
  u_name?: string;
  email?: string;
  uEmail?: string;
  avatarUrl?: string;
  uProfile?: string;
  u_profile?: string;
  profileImage?: string;
  role?: string;
  uRole?: string;
  joinDate?: string;
  uDate?: string;
  name?: string;
  profile?: string;
  manner?: number;
  uManner?: number;
  accessToken?: string;
}

/** 배송지 */
export interface Address {
  locKey: number;
  locTitle: string;
  locAddress: string;
  locDetail?: string;
  locZip?: string;
  isDefault?: boolean;
}

/** 판매자 */
export interface Seller {
  sellerId?: number;
  id?: number;
  nickname?: string;
  avatarUrl?: string;
  profileImage?: string;
  deals?: number;
  rating?: number;
  since?: string;
  bio?: string;
}

/** 판매자 힌트 캐시 항목 */
export interface SellerHint {
  nickname?: string;
  avatarUrl?: string;
  freshness?: number;
  deals?: number;
  since?: string;
}

/** 주문 */
export interface Order {
  orderId?: string;
  orderIdx?: number;
  productId?: number;
  itemId?: number;
  qty?: number;
  amount?: number;
  status?: string;
  createdAt?: string;
  paymentKey?: string;
}

/** 포인트 결제 요청 */
export interface PointPayRequest {
  itemId: number;
  qty: number;
  amount: number;
}

/** 포인트 결제 응답 */
export interface PointPayResponse {
  remainingBalance?: number;
  success?: boolean;
}

/** 잔액 응답 */
export interface BalanceResponse {
  balance?: number;
}

/** 찜(favorite) 상태 응답 */
export interface FavoriteResponse {
  favorited: boolean;
  count: number;
}

/** 배너 */
export interface Banner {
  id?: number;
  bannerIdx?: number;
  imageUrl?: string;
  bannerImage?: string;
  link?: string;
  bannerLink?: string;
}

/** 공지사항 */
export interface Notice {
  id?: number;
  noticeIdx?: number;
  title?: string;
  noticeTitle?: string;
  content?: string;
  noticeContent?: string;
  createdAt?: string;
  viewCount?: number;
}

/** FAQ */
export interface Faq {
  id?: number;
  faqIdx?: number;
  question?: string;
  answer?: string;
  category?: string;
}

/** 리뷰 */
export interface Review {
  id?: number;
  reviewIdx?: number;
  rating?: number;
  content?: string;
  reviewContent?: string;
  createdAt?: string;
  reviewerNickname?: string;
  productId?: number;
}

/** 채팅방 */
export interface ChatRoom {
  roomId?: string | number;
  chatRoomId?: string | number;
  opponentNickname?: string;
  opponentAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  productId?: number;
  productTitle?: string;
  productThumb?: string;
}

/** 채팅 메시지 */
export interface ChatMessage {
  id?: string | number;
  messageId?: string | number;
  content?: string;
  senderId?: number | string;
  senderNickname?: string;
  createdAt?: string;
  type?: string;
  imageUrl?: string;
}

// ─── API 공통 래퍼 ──────────────────────────────────────────────────────────

export interface ApiPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ─── fetchProducts 파라미터 ──────────────────────────────────────────────────

export interface FetchProductsParams {
  category?: string;
  upperId?: number | string;
  middleId?: number | string;
  lowId?: number | string;
  page?: number;
  size?: number;
  sort?: string;
  min?: number;
  max?: number;
  dDeal?: string;
  excludeSold?: boolean;
}

// ─── View 타입 ──────────────────────────────────────────────────────────────

export type ViewMode = "grid" | "list";

// ─── 전역 Window 확장 ────────────────────────────────────────────────────────
declare global {
  interface Window {
    daum?: {
      Postcode: new (options: Record<string, unknown>) => { open: () => void };
    };
    Kakao?: {
      Share?: { sendDefault: (opts: Record<string, unknown>) => void };
      init?: (key: string) => void;
      isInitialized?: () => boolean;
    };
  }
}
