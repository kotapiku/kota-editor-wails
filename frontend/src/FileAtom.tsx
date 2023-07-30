import { atom } from "recoil";
import { main } from "../wailsjs/go/models";
import { GetConfig, SaveConfig } from "../wailsjs/go/main/App";

export const fileAtom = atom<string | undefined>({
  key: "filePath",
  default: undefined,
});

export type FileStatus = "Saved" | "Unsaved" | "Saving";
export const fileStatusAtom = atom<FileStatus>({
  key: "fileStatus",
  default: "Saved",
});

export const configAtom = atom<main.Config>({
  key: "config",
  default: GetConfig(),
  effects: [
    ({ onSet }) => {
      onSet((newValue, _) => {
        if (newValue?.project_path == undefined) {
          newValue.project_path = "";
        }
        if (newValue?.daily_dir == undefined) {
          newValue.daily_dir = "";
        }
        if (newValue?.daily_template == undefined) {
          newValue.daily_template = "";
        }
        SaveConfig(newValue);
      });
    },
  ],
});
