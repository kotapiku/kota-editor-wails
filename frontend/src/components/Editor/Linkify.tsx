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

  function createDeco(view: EditorView) {
    let decorations: Range<Decoration>[] = [];
    let regex = /\[\[(.+?)\]\]/g;
    let match: RegExpExecArray | null;

    let cursor = view.state.selection.main.head;

    while ((match = regex.exec(view.state.doc.toString())) !== null) {
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

  function updateDeco(update: ViewUpdate, deco: DecorationSet) {
    if (update.docChanged || update.viewportChanged) {
      return createDeco(update.view);
    }
    let decorations: Range<Decoration>[] = [];
    let regex = /\[\[(.+?)\]\]/g;
    let match: RegExpExecArray | null;

    let previousCursor = update.startState.selection.main.head;
    let currentCursor = update.view.state.selection.main.head;

    // 昔のカーソルのところを追加する。
    let line = update.view.state.doc.lineAt(previousCursor);
    while ((match = regex.exec(line.text)) !== null) {
      if (
        update.view.hasFocus &&
        match.index + line.from <= previousCursor &&
        previousCursor <= match.index + match[0].length + line.from
      ) {
        let deco = Decoration.replace({
          widget: new LinkWidget(match[1]),
        }).range(
          match.index + line.from,
          match.index + match[0].length + line.from
        );
        decorations.push(deco);
      }
    }

    return deco
      .update({
        add: decorations,
      })
      .update({
        // 今のカーソルのところを消す。
        filter: (from, to, value) => {
          return !(
            update.view.hasFocus &&
            from <= currentCursor &&
            currentCursor <= to
          );
        },
      })
      .map(update.changes);
  }

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = createDeco(view);
      }
      update(update: ViewUpdate) {
        this.decorations = updateDeco(update, this.decorations);
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
