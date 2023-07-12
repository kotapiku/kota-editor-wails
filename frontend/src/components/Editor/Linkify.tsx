import { WidgetType } from "@codemirror/view";
import { RelativePath } from "../../../wailsjs/go/main/App";
import { SetterOrUpdater } from "recoil";

import {
  MatchDecorator,
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
      link.onclick = async () => {
        let path = await RelativePath(filepath, this.href);
        console.log("click", path);
        setFilePath(path);
      };
      link.textContent = this.href;
      return link;
    }
    ignoreEvent() {
      return false;
    }
  }

  const linkMatcher = new MatchDecorator({
    regexp: /\[\[(.*?)\]\]/g,
    decoration: (match: any) =>
      Decoration.replace({
        widget: new LinkWidget(match[1]),
      }),
  });

  return ViewPlugin.fromClass(
    class {
      placeholders: DecorationSet;
      constructor(view: EditorView) {
        this.placeholders = linkMatcher.createDeco(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.placeholders = linkMatcher.updateDeco(update, this.placeholders);
        }
      }
    },
    {
      decorations: (v) => v.placeholders,
      provide: (plugin) =>
        EditorView.atomicRanges.of((view) => {
          return view.plugin(plugin)?.placeholders || Decoration.none;
        }),
    }
  );
}
