import React, { useRef, useEffect, useState } from "react";
import { ReadFile, SaveFile } from "../../../wailsjs/go/main/App";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { useRecoilState } from "recoil";
import { fileAtom, fileStatusAtom } from "../../FileAtom";
import { linkify } from "./Linkify";

export const Editor: React.FC = () => {
  const [filePath, setFilePath] = useRecoilState(fileAtom);
  const [fileStatus, setFileStatus] = useRecoilState(fileStatusAtom);
  const [content, setContent] = useState<string>("");

  const getContent = async () => {
    if (filePath == undefined) {
      return;
    }
    let content: string = await ReadFile(filePath);
    setContent(content);
  };

  const onChange = (value: string) => {
    setFileStatus("Unsaved");
    setContent(value);
  };

  const save = () => {
    if (filePath == undefined) {
      return;
    }
    setFileStatus("Saving");
    SaveFile(filePath, content);
    setFileStatus("Saved");
  };
  const onBlur = () => {
    save();
  };

  const myKeymap = [
    {
      key: "Mod-s",
      run: () => {
        save();
        return true;
      },
    },
    ...defaultKeymap,
  ];

  useEffect(() => {
    getContent();
  }, [filePath]);

  return filePath == undefined ? (
    <div></div>
  ) : (
    <CodeMirror
      value={content}
      keymap=""
      extensions={[
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of(myKeymap),
        linkify(filePath, setFilePath),
      ]}
      onChange={onChange}
      onBlur={onBlur}
      height="100%"
      basicSetup={{
        lineNumbers: false,
      }}
    />
  );
};
