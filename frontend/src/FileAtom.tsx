import { atom } from "recoil";

export const fileAtom = atom<string>({
  key: "filepath",
  default: "",
});
