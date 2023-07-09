import React, { useEffect, useState } from "react";
import { ReadFile, SaveFile } from "../../../wailsjs/go/main/App";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";

export const Editor: React.FC<{ filepath: string | undefined }> = (props) => {
  const [content, setContent] = useState<string>("");

  const getContent = async () => {
    let filepath = props.filepath == undefined ? "" : props.filepath;
    console.log(filepath);

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
        SaveFile(props.filepath == undefined ? "" : props.filepath, content);
        return true;
      },
    },
    ...defaultKeymap,
  ];

  useEffect(() => {
    getContent();
  }, [props.filepath]);

  return (
    <CodeMirror
      value={content}
      keymap=""
      extensions={[
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of(myKeymap),
      ]}
      onChange={onChange}
      height="100%"
    />
  );
};
