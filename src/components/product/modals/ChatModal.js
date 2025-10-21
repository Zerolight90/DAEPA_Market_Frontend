"use client";

import { useState } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";

export default function ChatModal({ id, close, seller }) {
    const [msg, setMsg] = useState("");

    const send = () => {
        // TODO: 실제 채팅 API 연동
        console.log("CHAT_SEND", { to: seller?.id, msg });
        alert("메시지를 보냈습니다.");
        close();
    };

    return (
        <BaseModal id={id} close={close} title={`채팅하기 - ${seller?.nickname ?? "판매자"}`}
                   footer={<button onClick={send} style={primaryBtn}>보내기</button>}
        >
      <textarea
          value={msg}
          onChange={(e)=>setMsg(e.target.value)}
          placeholder="안녕하세요, 상품 상태가 궁금합니다."
          style={{ width:"100%", height:150, border:"1px solid #ddd", borderRadius:8, padding:10 }}
      />
        </BaseModal>
    );
}
const primaryBtn = { background: "#008c6e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer" };
