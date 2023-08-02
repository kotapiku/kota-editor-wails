import { atom } from "recoil";
import { main } from "../wailsjs/go/models";
import { GetConfig, SaveConfig } from "../wailsjs/go/main/App";
import type { DataNode } from "antd/es/tree";

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
        let config = { ...newValue }; // newValue is readonly
        if (newValue?.project_path == undefined) {
          config.project_path = "";
        }
        if (newValue?.daily_dir == undefined) {
          config.daily_dir = "";
        }
        SaveConfig(config);
      });
    },
  ],
});

export const dataNodeAtom = atom<DataNode | undefined>({
  key: "dataNode",
  default: undefined,
});
