import { atom } from "recoil";

export const fileAtom = atom<string | undefined>({
  key: "filePath",
  default: undefined,
});

export type FileStatus = "Saved" | "Unsaved" | "Saving";
export const fileStatusAtom = atom<FileStatus>({
  key: "fileStatus",
  default: "Saved",
});
