//inputBar
"use client";
import { useRef, useState, useEffect } from "react";
import { IconButton, Tooltip } from "@mui/material";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import ImageIcon from "@mui/icons-material/Image";
import EmojiPicker from "emoji-picker-react";
import s from "./MarketChat.module.css";

export default function InputBar({ onSend }) {
    const [text, setText] = useState("");
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [pendingImage, setPendingImage] = useState(null);
    const fileInputRef = useRef(null);
    const textAreaRef = useRef(null);

    // ESC로 이모지 닫기
    useEffect(() => {
        if (!emojiOpen) return;
        const onEsc = (e) => e.key === "Escape" && setEmojiOpen(false);
        window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [emojiOpen]);

    const insertEmoji = (emoji) => {
        const ta = textAreaRef.current;
        if (!ta) return setText((t) => (t || "") + emoji);
        const start = ta.selectionStart || 0;
        const end = ta.selectionEnd || 0;
        setText((t) => t.slice(0, start) + emoji + t.slice(end));
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setPendingImage({ file, previewUrl });
    };

    const onPaste = (e) => {
        const item = Array.from(e.clipboardData.items).find((x) => x.type.startsWith("image/"));
        if (item) {
            const file = item.getAsFile();
            if (file) setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
        }
    };

    const doSend = async () => {
        await onSend({ text, file: pendingImage?.file || null });
        setText("");
        setPendingImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <form
            className={s.inputBar}
            onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); doSend(); }}
            onPaste={onPaste}
        >
            <div className={s.composer}>
                <div className={s.inputTools}>
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFileChange} />
                    <Tooltip title="이미지 보내기">
                        <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="이모지">
                        <IconButton size="small" onClick={() => setEmojiOpen((v) => !v)}>
                            <InsertEmoticonIcon />
                        </IconButton>
                    </Tooltip>
                </div>

                <div className={s.inputMain}>
                    {emojiOpen && (
                        <div style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 10, zIndex: 10 }}>
                            <EmojiPicker
                                onEmojiClick={(e) => insertEmoji(e.emoji)}
                                previewConfig={{ showPreview: false }}
                                searchDisabled
                                lazyLoadEmojis
                                height={340}
                                width={320}
                            />
                        </div>
                    )}

                    {!!pendingImage && (
                        <div className={s.imagePreview}>
                            <img src={pendingImage.previewUrl} alt="" />
                            <button
                                type="button"
                                className={s.removePreview}
                                onClick={() => { setPendingImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <textarea
                        ref={textAreaRef}
                        className={s.input}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="메시지를 입력하세요 (Enter: 전송, Shift+Enter: 줄바꿈)"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); doSend(); }
                        }}
                        rows={1}
                    />
                </div>
            </div>

            <button className={s.sendBtn} type="submit" disabled={!text.trim() && !pendingImage}>
                보내기
            </button>
        </form>
    );
}
