import React, { useEffect, useState } from "react";
import { ReadFile, SaveFile } from "../../../wailsjs/go/main/App";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { keymap, EditorView } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { useRecoilState, useSetRecoilState } from "recoil";
import { fileAtom, fileStatusAtom } from "../../FileAtom";
import { linkify } from "./Linkify";
import { Skeleton, message } from "antd";
import { vim } from "@replit/codemirror-vim";

export const Editor: React.FC = () => {
  const [filePath, setFilePath] = useRecoilState(fileAtom);
  const setFileStatus = useSetRecoilState(fileStatusAtom);
  const [content, setContent] = useState<string>("");
  const [messageApi, contextHolder] = message.useMessage();

  const getContent = () => {
    if (filePath == undefined) {
      return;
    }
    ReadFile(filePath)
      .then((content) => {
        setContent(content);
      })
      .catch((err) => {
        messageApi.error(err);
      });
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
    SaveFile(filePath, content)
      .then(() => {
        setFileStatus("Saved");
      })
      .catch((err) => {
        messageApi.error(err);
        setFileStatus("Unsaved");
      });
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
    <Skeleton />
  ) : (
    <>
      {contextHolder}
      <CodeMirror
        value={content}
        extensions={[
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          keymap.of(myKeymap),
          linkify(filePath, setFilePath),
          EditorView.lineWrapping,
          vim(),
        ]}
        onChange={onChange}
        onBlur={() => save()}
        height="100%"
        basicSetup={{
          lineNumbers: false,
          lineWrapping: true,
        }}
      />
    </>
  );
};
