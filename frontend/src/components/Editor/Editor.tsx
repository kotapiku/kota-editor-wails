import React, { useRef, useEffect, useState } from "react";
import { ReadFile, SaveFile } from "../../../wailsjs/go/main/App";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { keymap } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";

import { EditorView, Decoration } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
// import {EditorSelection} from "@codemirror/state"

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

  //   let linkify = EditorView.decorations.from({
  //     create: updateLinks,
  //     on: [EditorView.update],
  //   });

  //   let view = new EditorView({
  //     state: EditorState.create({
  //       doc: "[[hoge]]",
  //       extensions: [basicSetup, linkify],
  //     }),
  //     parent: document.body,
  //   });

  //   function updateLinks(view: EditorView) {
  //     let re = /\[\[(.*?)\]\]/g,
  //       m,
  //       decorations = [];
  //     while ((m = re.exec(view.state.doc.toString()))) {
  //       let from = m.index,
  //         to = m.index + m[0].length;
  //       let widget = document.createElement("a");
  //       widget.href = m[1];
  //       widget.textContent = m[1];
  //       decorations.push(Decoration.replace({ widget, from, to }));
  //     }
  //     return Decoration.set(decorations);
  //   }

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
      basicSetup={{
        lineNumbers: false,
      }}
    />
  );
};
