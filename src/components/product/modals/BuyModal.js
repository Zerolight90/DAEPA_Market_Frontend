"use client";

import { useState } from "react";
import BaseModal from "@/components/ui/modal/BaseModal";

export default function BuyModal({ id, close, itemId, title, price }) {
    const [qty, setQty] = useState(1);
    const total = (Number(price) || 0) * qty;

    const pay = () => {
        // TODO: 결제/주문 API
        console.log("BUY", { itemId, qty, total });
        alert("주문이 생성되었습니다. (모의)");
        close();
    };

    return (
        <BaseModal id={id} close={close} title="안전결제">
            <div style={{ marginBottom: 10, fontWeight: 700 }}>{title}</div>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom: 16 }}>
                <span>수량</span>
                <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e)=>setQty(Math.max(1, Number(e.target.value) || 1))}
                    style={{ width:80, border:"1px solid #ddd", padding:6, borderRadius:6 }}
                />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#008c6e", marginBottom: 16 }}>
                결제금액: {total.toLocaleString()} 원
            </div>
            <div>
                <button onClick={pay} style={primaryBtn}>결제하기</button>
                <button onClick={close} style={ghostBtn}>취소</button>
            </div>
        </BaseModal>
    );
}
const primaryBtn = { background: "#008c6e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer", marginRight: 8 };
const ghostBtn = { background: "#f4f4f4", color: "#333", border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px", cursor: "pointer" };
