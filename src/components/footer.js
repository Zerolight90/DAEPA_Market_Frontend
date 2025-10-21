import Link from "next/link";
import Image from "next/image";
import styles from "./css/footer.module.css";
import {Divider} from "@mui/material";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className="container">
                {/* 상단 2컬럼: 사업자정보 / 고객센터 & 보증안내 */}
                <div className={styles.topRow}>
                    {/* 사업자/회사 정보 */}
                    <section>
                        <h3 className={styles.blockTitle}>대파(주) 사업자정보</h3>
                        <ul className={styles.bizList}>
                            <li><span className={styles.k}>대표이사</span> 정상준</li>
                            <li><span className={styles.k}>사업자등록번호</span> 123-45-67890</li>
                            <li><span className={styles.k}>통신판매업신고</span> 2025-서울강남-0923</li>
                            <li><span className={styles.k}>EMAIL</span> help@daepa.co.kr</li>
                            <li><span className={styles.k}>FAX</span> 02-598-8241</li>
                            <li><span className={styles.k}>주소</span> 서울특별시 서초구 서초대로 38길 12, 7, 103층</li>
                        </ul>

                        <div className={styles.inlineLinks}>
                            <Link href="/biz-lookup">사업자정보 확인</Link>
                            <span className={styles.dot}>·</span>
                            <Link href="/hosting">호스팅서비스 제공자</Link>
                        </div>
                    </section>

                    {/* 고객센터 & 보증안내 */}
                    <section>
                        <div className={styles.csHeader}>
                            <div className={styles.csLabel}>고객센터</div>
                            <a href="tel:1670-2910" className={styles.csPhone}>1670-2910</a>
                            <p className={styles.csHours}>
                                운영시간 9시 - 18시 (주말/공휴일 휴무, 점심시간 12시 - 13시)
                            </p>
                            <div className={styles.csLinks}>
                                <Link href="/notice">공지사항</Link>
                                <Link href="/contact">1:1 문의하기</Link>
                                <Link href="/faq">자주 묻는 질문</Link>
                            </div>
                        </div>

                        <div className={styles.guarantee}>
                            <h4 className={styles.guaranteeTitle}>우리은행 채무지급보증 안내</h4>
                            <p className={styles.guaranteeText}>
                                대파(주)는 회사가 직접 판매하는 상품에 한해 고객님의 현금 결제 금액에 대해
                                우리은행과 채무지급보증 계약을 체결하여 안전거래를 보장하고 있습니다.
                            </p>
                            <Link href="/safety/guarantee" className={styles.linkUnderline}>
                                서비스 가입사실 확인
                            </Link>
                        </div>

                        <div className={styles.copyright}>
                            © {year} DAEPA Inc. All rights reserved.
                        </div>
                    </section>
                </div>

                <Divider className={styles.hr} />

                {/* 하단 인증/면책 고지 */}
                <div className={styles.bottomRow}>
                    <div className={styles.cert}>
                        <Image
                            src="/ISMS.png"
                            alt="ISMS 인증"
                            width={40}
                            height={40}
                            className={styles.certImg}
                        />
                        <div className={styles.certMeta}>
                            <p className={styles.certLine}>
                                [인증범위] 대파(주) 중고거래 플랫폼 서비스 운영 (심사받지 않은 물리적 인프라 제외)
                            </p>
                            <p className={styles.certLine}>[유효기간] 2024.05.18 ~ 2027.05.17</p>
                        </div>
                    </div>

                    <p className={styles.disclaimer}>
                        대파(주)는 통신판매중개자이며, 통신판매의 당사자가 아닙니다. 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령 및
                        대파(주) 이용약관에 따라 상품, 용역, 정보, 거래에 관한 책임은 개별 판매자에게 귀속됩니다.
                        대파(주)는 원칙적으로 원격 간편거래에 대하여 계약의 체결에 관여하지 않습니다. 다만, 간편거래의 일부 항목에 한해
                        특정 범주의 채무지급보증 제도를 적용할 수 있으며, 이에 관한 상세 내용은 안내 문서를 통해 고지됩니다.
                    </p>
                </div>
            </div>
        </footer>
    );
}
