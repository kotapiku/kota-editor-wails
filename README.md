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

- project の右のボタン(左から)
  - 今日のノートを開く。config.toml の dailyDir で指定されたフォルダを探索。"YYYY-MM-DD.md"が存在したらそれを開いて、なかったら新規作成して開く。
  - ディレクトリを一つ選択して開く。projectPath が変更され、dailyDir は""になる。
- ディレクトリ上で右クリックで、new file/dir, rename, delete できる
  - delete は(今のところ)中が空のときのみできる
- ファイル上で右クリックで、rename, delete できる

### editor (codemirror 使用）

- 二重大かっこの中に相対パスを書くことでファイルのリンクができる
- cmd+s で保存。フォーカスを外したり別のファイルにとんでも保存される。
- 保存前は右下のアイコンが注意マークに、保存すると完了マークになる。
- vim extension が有効になっている。

### settings

- `~/.kota_editor/config.toml`が設定ファイル。なかったら自動でつくられる。
- `projectPath = "/path/to/project"`で project 指定できる。
- `dailyDir = "daily"`で daily ディレクトリの project からの相対パス指定。デフォルトは""で project を指す

### file search

- cmd+p でファイル名検索して開ける
- cmd+l でフォーカス
