import { atom } from "recoil";

export const fileAtom = atom<string>({
  key: "filePath",
  default: "",
});

export type FileStatus = "Saved" | "Unsaved" | "Saving";
export const fileStatusAtom = atom<FileStatus>({
  key: "fileStatus",
  default: "Saved",
});
