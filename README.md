# README

## About

This is the official Wails React-TS template.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.

---

## 仕様
### sidebar
- projectの右のボタン(左から)
  - 今日のノートを開く。config.tomlのdailyDirで指定されたフォルダを探索。"YYYY-MM-DD.md"が存在したらそれを開いて、なかったら新規作成して開く。
  - ディレクトリを一つ選択して開く。projectPathが変更され、dailyDirは""になる。
- ディレクトリ上で右クリックで、new file/dir, rename, deleteできる
  - deleteは(今のところ)中が空のときのみできる
- ファイル上で右クリックで、rename, deleteできる

### editor (codemirror使用）
- 二重大かっこの中に相対パスを書くことでファイルのリンクができる
- cmd+sで保存。フォーカスを外したり別のファイルにとんでも保存される。
- 保存前は右下のアイコンが注意マークに、保存すると完了マークになる。

### settings
- `~/.kota_editor/config.toml`が設定ファイル。なかったら自動でつくられる。
- `projectPath = "/path/to/project"`でproject指定できる。
- `dailyDir = "daily"`でdailyディレクトリのprojectからの相対パス指定。デフォルトは""でprojectを指す

### file search
- cmd+pでファイル名検索して開ける
- cmd+lでフォーカス
