import { WidgetType } from "@codemirror/view";
import { RelativePath } from "../../../wailsjs/go/main/App";
import { SetterOrUpdater } from "recoil";

import { Range } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

export function linkify(
  filepath: string,
  setFilePath: SetterOrUpdater<string>
) {
  class LinkWidget extends WidgetType {
    constructor(public href: string) {
      super();
    }
    toDOM() {
      let link = document.createElement("a");
      link.onclick = async (event) => {
        let path = await RelativePath(filepath, this.href);
        console.log("click", path);
        setFilePath(path);
      };
      link.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      link.textContent = this.href;
      return link;
    }
    ignoreEvent() {
      return false;
    }
  }

  function getDecorations(view: EditorView) {
    let state = view.state;
    let decorations: Range<Decoration>[] = [];
    let regex = /\[\[(.*?)\]\]/g;
    let match: RegExpExecArray | null;

    let cursor = state.selection.main.head;

    while ((match = regex.exec(state.doc.toString())) !== null) {
      if (
        view.hasFocus &&
        match.index <= cursor &&
        cursor <= match.index + match[0].length
      ) {
        continue;
      }
      let deco = Decoration.replace({
        widget: new LinkWidget(match[1]),
      }).range(match.index, match.index + match[0].length);
      decorations.push(deco);
    }

    return Decoration.set(decorations);
  }

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = getDecorations(view);
      }
      update(update: ViewUpdate) {
        this.decorations = getDecorations(update.view);
      }
    },
    {
      decorations: (v) => v.decorations,
      provide: (plugin) =>
        EditorView.atomicRanges.of((view) => {
          return view.plugin(plugin)?.decorations || Decoration.none;
        }),
    }
  );
}
