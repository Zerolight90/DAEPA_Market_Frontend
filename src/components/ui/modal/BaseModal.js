"use client";

export default function BaseModal({ id, close, title, children, footer }) {
    return (
        <div style={overlay} onClick={close}>
            <div style={wrap} onClick={(e) => e.stopPropagation()}>
                <div style={head}>
                    <strong>{title}</strong>
                    <button onClick={close} style={xbtn}>×</button>
                </div>
                <div style={body}>{children}</div>
                {footer && <div style={foot}>{footer}</div>}
            </div>
        </div>
    );
}
const overlay = { position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"grid", placeItems:"center", zIndex:1000 };
const wrap = { width:520, maxWidth:"92vw", background:"#fff", borderRadius:12, overflow:"hidden" };
const head = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid #eee" };
const xbtn = { border:"none", background:"transparent", fontSize:22, lineHeight:1, cursor:"pointer" };
const body = { padding:16 };
const foot = { padding:12, borderTop:"1px solid #eee" };
