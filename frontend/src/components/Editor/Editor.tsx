import React, { useEffect, useState } from "react";
import { Read, Save } from "../../../wailsjs/go/main/App";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";

export const Editor: React.FC = () => {
  const [content, setContent] = useState<string>("");

  const getContent = async () => {
    let content: string = await Read("hoge.md");

    setContent(content);
  };

  const onChange = (value: string) => {
    setContent(value);
  };

  const myKeymap = [
    {
      key: "Mod-s",
      run: () => {
        Save("hoge.md", content);
        return true;
      },
    },
    ...defaultKeymap,
  ];

  useEffect(() => {
    getContent();
  }, []);

  return (
    <CodeMirror
      value={content}
      keymap=""
      extensions={[
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of(myKeymap),
      ]}
      onChange={onChange}
    />
  );
};
