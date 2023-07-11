import React, { useRef, useEffect, useState } from "react";
import { ReadFile, SaveFile } from "../../../wailsjs/go/main/App";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";

export const Editor: React.FC<{ filepath: string | undefined }> = (props) => {
  const [content, setContent] = useState<string>("");

  const getContent = async () => {
    if (props.filepath == undefined) {
      return;
    }

    let content: string = await ReadFile(props.filepath);
    setContent(content);
  };

  const onChange = (value: string) => {
    setContent(value);
  };

  const myKeymap = [
    {
      key: "Mod-s",
      run: () => {
        if (props.filepath == undefined) {
          return true;
        }
        SaveFile(props.filepath, content);
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

  const prevPath = usePrevious(props.filepath);
  useEffect(() => {
    if (prevPath != undefined) {
      SaveFile(prevPath, content).then(() => {
        getContent();
        console.log("change content", prevPath);
      });
    } else {
      getContent();
    }
  }, [props.filepath]);

  if (props.filepath == undefined) {
    return <div></div>;
  }
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
