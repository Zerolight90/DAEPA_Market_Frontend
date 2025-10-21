// src/lib/mockItems.js
import { CATEGORY_TREE } from "@/lib/categoryTree";

/** ✅ 실제 public/images 폴더와 1:1 매핑 */
const CATEGORY_DIR = {
    "전자제품": "electronics",
    "패션/의류": "fashion",
    "생활/가전": "appliances",
    "도서/음반": "books",
    "자동차": "car",
    "기타": "misc",

    // 아직 폴더 없으면 임시로 misc 사용
    "스포츠/레저": "misc",
    "반려동물": "misc",
};

/** 목업 타이틀 뱅크(폴더 키 기준) */
const TITLE_BANK = {
    electronics: ["iPhone 15 Pro","갤럭시 S24 Ultra","맥북 프로 14","게이밍 노트북","아이패드 에어","닌텐도 스위치","소니 WH-1000XM5","갤럭시 워치","울트라와이드 모니터","포터블 SSD"],
    fashion: ["오버핏 코트","트렌치코트","나이키 후드티","아디다스 팬츠","뉴발란스 530","가죽 크로스백","골덴 셔츠","롱 패딩","캐시미어 머플러","데님 자켓"],
    appliances: ["무선청소기","쿠쿠 밥솥","에어프라이어","공기청정기","인덕션","전자레인지","커피 그라인더","토스터기","건조기","식기세척기"],
    books: ["해리포터","토익 기출","데미안","미움받을 용기","클린 코드","이펙티브 자바","나미야 잡화점","불편한 편의점","어린왕자","라임오렌지나무"],
    car: ["블랙박스","차량용 공기청정기","대쉬캠","타이어 체인","트렁크 매트","핸들 커버","HUD","LED 실내등","충전 거치대","방향제"],
    misc: ["랜덤 박스","공구 세트","미니 빔프로젝터","LED 스탠드","보드게임","수납 박스","가습기 미니","우산 세트","USB 허브","팜레스트"],
};

/** 가격 랜덤 (폴더 키 기준) */
const randPrice = (dir) => {
    switch (dir) {
        case "electronics": return 50_000 + Math.floor(Math.random()*2_000_000);
        case "fashion":     return 10_000 + Math.floor(Math.random()*200_000);
        case "appliances":  return 20_000 + Math.floor(Math.random()*800_000);
        case "books":       return 5_000  + Math.floor(Math.random()*60_000);
        case "car":         return 10_000 + Math.floor(Math.random()*400_000);
        default:            return 5_000  + Math.floor(Math.random()*300_000);
    }
};

const REGIONS = [
    "서울 강남구","서울 마포구","인천 부평구","경기 부천시",
    "경기 성남시 분당구","경기 수원시 영통구","부산 해운대구",
    "대구 수성구","대전 유성구","광주 서구",
];
const TIMES = ["방금 전","1시간 전","3시간 전","어제","2일 전","3일 전","1주 전"];

let _id = 1;
const nextId = () => _id++;

/** 카테고리별 10개씩 생성 */
const PRESETS = Object.keys(CATEGORY_TREE)
    .filter((k) => !CATEGORY_TREE[k].aliasOf)
    .map((name) => ({ name, dir: CATEGORY_DIR[name] || "misc" }));

function makeItem(categoryName, dir, idx) {
    const id = nextId();

    // mid/sub (트리에서 가져오기)
    const node = CATEGORY_TREE[categoryName];
    const mids = node?.children?.map((c) => c.name) || ["기타"];
    const mid = mids[idx % mids.length];
    const subs = node?.children?.find((c) => c.name === mid)?.children?.map((s) => s.name) || ["기타"];
    const sub = subs[idx % subs.length];

    const titles = TITLE_BANK[dir] || TITLE_BANK.misc;
    const title = titles[idx % titles.length];

    const num = String((idx % 10) + 1).padStart(2, "0");

    return {
        id,
        title,
        img: `/images/${dir}/${num}.jpg`,     // ✅ 실제 폴더와 일치
        images: [
            `/images/${dir}/01.jpg`,
            `/images/${dir}/02.jpg`,
            `/images/${dir}/03.jpg`,
        ],
        price: randPrice(dir),
        region: REGIONS[id % REGIONS.length],
        timeAgo: TIMES[id % TIMES.length],
        category: categoryName,
        mid,
        sub,
        wishCount: Math.floor(Math.random()*40),
        viewCount: 30 + Math.floor(Math.random()*300),
        status: "SELLING",
        description: `${title} 중고 제품입니다.\n상세 상태는 사진 참고 부탁드려요.\n직거래/택배 모두 가능해요.`,
        detail: {
            상태: ["최상","상","보통"][id % 3],
            배송비: id % 2 === 0 ? "무료배송" : "착불",
            거래지역: REGIONS[id % REGIONS.length],
        },
        seller: {
            id: 100 + (id % 50),
            nickname: ["대파상점","신선거래","믿음직"][id % 3],
            avatarUrl: "/images/avatar-default.png",
            manner: 35 + (id % 10) * 0.3,
            deals: 10 + (id % 200),
            since: `202${id % 4}.${(id % 12) + 1} 가입`,
        },
    };
}

export const ALL_ITEMS = PRESETS.flatMap(({ name, dir }) =>
    Array.from({ length: 10 }, (_, i) => makeItem(name, dir, i))
);

export function getItemsByCategory(categoryName, opts = {}) {
    const { mid, sub } = opts;
    return ALL_ITEMS.filter((it) =>
        it.category === categoryName &&
        (!mid || it.mid === mid) &&
        (!sub || it.sub === sub)
    );
}

export function getItemById(id) {
    const nid = Number(id);
    return ALL_ITEMS.find((it) => Number(it.id) === nid) || null;
}

export function getRelatedItems(baseId, limit = 8) {
    const base = getItemById(baseId);
    if (!base) return [];
    return ALL_ITEMS
        .filter((it) => it.category === base.category && it.id !== base.id)
        .slice(0, limit);
}
