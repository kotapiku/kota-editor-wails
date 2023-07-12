import React, { useRef, useEffect, useState } from "react";
import { ReadFile, SaveFile } from "../../../wailsjs/go/main/App";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { useRecoilState } from "recoil";
import { fileAtom } from "../../FileAtom";
import { linkify } from "./Linkify";

export const Editor: React.FC = () => {
  const [filepath, setFilePath] = useRecoilState(fileAtom);
  const [content, setContent] = useState<string>("");

  const getContent = async () => {
    let content: string = await ReadFile(filepath);
    setContent(content);
  };

  const onChange = (value: string) => {
    setContent(value);
  };

  const myKeymap = [
    {
      key: "Mod-s",
      run: () => {
        if (filepath == "") {
          return true;
        }
        SaveFile(filepath, content);
        return true;
      },
    },
    ...defaultKeymap,
  ];

  function usePrevious(value: any) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    }, [value]);
    return ref.current;
  }

  const prevPath = usePrevious(filepath);
  useEffect(() => {
    if (prevPath != undefined) {
      SaveFile(prevPath, content).then(() => {
        getContent();
        console.log("change content", prevPath);
      });
    } else {
      getContent();
    }
  }, [filepath]);

  if (filepath == "") {
    return <div></div>;
  }
  return (
    <CodeMirror
      value={content}
      keymap=""
      extensions={[
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of(myKeymap),
        linkify(filepath, setFilePath),
      ]}
      onChange={onChange}
      height="100%"
      basicSetup={{
        lineNumbers: false,
      }}
    />
  );
};
