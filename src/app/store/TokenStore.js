import { create } from "zustand";


const TokeStore = create((set) => ({
    accessToken: null,

    //로그인시 토큰 저장
    setToken(token){
        set({ accessToken: token });
    },
    //로그아웃시 토큰 삭제
    clearToken: () => set({ accessToken: null }),

}));
export default TokeStore;