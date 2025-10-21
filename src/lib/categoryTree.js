// 대카테고리 트리
export const CATEGORY_TREE = {
    "전자제품": {
        countsText: "총 120만+",
        children: [
            { name: "모바일/태블릿", children: [{ name: "아이폰" }, { name: "갤럭시" }, { name: "아이패드" }, { name: "태블릿" }] },
            { name: "노트북/PC",   children: [{ name: "맥" }, { name: "게이밍 노트북" }, { name: "모니터" }, { name: "저장장치" }] },
            { name: "오디오/카메라", children: [{ name: "헤드폰/이어폰" }, { name: "블루투스 스피커" }, { name: "카메라/렌즈" }] },
            { name: "게임/기타",   children: [{ name: "닌텐도" }, { name: "플레이스테이션" }, { name: "기타 액세서리" }] },
        ],
    },
    "패션/의류": {
        countsText: "총 200만+",
        children: [
            { name: "아우터", children: [{ name: "패딩" }, { name: "코트" }, { name: "자켓/점퍼" }, { name: "가디건" }] },
            { name: "상의",  children: [{ name: "맨투맨" }, { name: "후드티" }, { name: "니트/스웨터" }, { name: "셔츠" }] },
            { name: "바지",  children: [{ name: "청바지" }, { name: "슬랙스" }, { name: "조거/트레이닝" }, { name: "반바지" }] },
            { name: "언더웨어/홈웨어", children: [{ name: "속옷" }, { name: "잠옷" }, { name: "내복/기모" }] },
        ],
    },
    "생활가전": {
        countsText: "총 80만+",
        children: [
            { name: "청소/세탁", children: [{ name: "무선청소기" }, { name: "세탁기" }, { name: "건조기" }] },
            { name: "주방가전", children: [{ name: "에어프라이어" }, { name: "밥솥" }, { name: "전자레인지" }] },
            { name: "공기/냉난방", children: [{ name: "공기청정기" }, { name: "히터/선풍기" }] },
            { name: "기타", children: [{ name: "전기/조명" }, { name: "생활소형가전" }] },
        ],
    },
    "도서/음반": {
        countsText: "총 30만+",
        children: [
            { name: "도서", children: [{ name: "소설" }, { name: "에세이" }, { name: "경영/경제" }, { name: "IT/개발" }] },
            { name: "음반", children: [{ name: "CD" }, { name: "LP" }, { name: "굿즈" }] },
            { name: "학습", children: [{ name: "자격증" }, { name: "어학" }, { name: "수험서" }] },
            { name: "만화/잡지", children: [{ name: "만화" }, { name: "잡지" }] },
        ],
    },
    "스포츠/레저": {
        countsText: "총 60만+",
        children: [
            { name: "구기", children: [{ name: "축구" }, { name: "농구" }, { name: "야구" }] },
            { name: "아웃도어", children: [{ name: "캠핑" }, { name: "등산" }, { name: "자전거" }] },
            { name: "피트니스", children: [{ name: "요가/필라테스" }, { name: "웨이트" }] },
            { name: "스포츠웨어", children: [{ name: "상의" }, { name: "하의" }, { name: "신발" }] },
        ],
    },
    "자동차": {
        countsText: "총 25만+",
        children: [
            { name: "차량용품", children: [{ name: "블랙박스" }, { name: "거치대/충전" }, { name: "공기청정기" }] },
            { name: "실내용품", children: [{ name: "방향제" }, { name: "매트" }, { name: "시트" }] },
            { name: "정비/부품", children: [{ name: "타이어/휠" }, { name: "오일/필터" }] },
            { name: "기타", children: [{ name: "세차용품" }, { name: "기타" }] },
        ],
    },
    "반려동물": {
        countsText: "총 15만+",
        children: [
            { name: "강아지용품", children: [{ name: "사료/간식" }, { name: "하네스/리드줄" }, { name: "하우스/방석" }] },
            { name: "고양이용품", children: [{ name: "사료/간식" }, { name: "모래/화장실" }, { name: "스크래쳐" }] },
            { name: "목욕/미용", children: [{ name: "샴푸/미스트" }, { name: "브러시/드라이" }] },
            { name: "기타", children: [{ name: "펫 유모차" }, { name: "펫 케이지" }] },
        ],
    },
    "기타": {
        countsText: "총 10만+",
        children: [
            { name: "취미", children: [{ name: "보드게임" }, { name: "프라모델" }] },
            { name: "문구/사무", children: [{ name: "필기구" }, { name: "노트/다이어리" }] },
            { name: "인테리어", children: [{ name: "조명" }, { name: "소품" }] },
            { name: "기타", children: [{ name: "잡화" }, { name: "나눔" }] },
        ],
    },

    // 별칭 → 실제 키 매핑 필요 시
    "남성의류": { aliasOf: "패션/의류" },
};

export function getCategoryMatrixData(bigNameRaw) {
    const big = decodeURIComponent(bigNameRaw || "").trim();
    const node = CATEGORY_TREE[big];
    if (!node) return null;
    if (node.aliasOf) return CATEGORY_TREE[node.aliasOf] || null;
    return node;
}
export function listBigCategories() {
    return Object.keys(CATEGORY_TREE).filter((k) => !CATEGORY_TREE[k].aliasOf);
}
export function flattenMidSub(bigNameRaw) {
    const big = decodeURIComponent(bigNameRaw || "").trim();
    const node = CATEGORY_TREE[big];
    const mids = node?.children?.map((c) => c.name) || [];
    const subsByMid = {};
    node?.children?.forEach((c) => (subsByMid[c.name] = (c.children || []).map((s) => s.name)));
    return { mids, subsByMid };
}
