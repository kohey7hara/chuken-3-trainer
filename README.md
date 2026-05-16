# 中検3級トレーナー

中国語検定3級合格を最初の目標にした、スマホ対応の静的Webアプリです。

ローカルサーバーを立てずに、GitHub Pages、Netlify、Cloudflare Pages などの静的ホスティングで公開できます。

## 公開URL

- Site: https://kohey7hara.github.io/chuken-3-trainer/
- Repository: https://github.com/kohey7hara/chuken-3-trainer

## 公開方法: GitHub Pages

1. GitHubで新しいリポジトリを作成する
2. このフォルダのファイルをリポジトリ直下にアップロードする
3. GitHubの `Settings` を開く
4. `Pages` を開く
5. `Build and deployment` の `Source` を `Deploy from a branch` にする
6. Branchを `main`、フォルダを `/root` にする
7. `Save` を押す

数分後、以下のようなURLで公開されます。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/
```

## 公開方法: Netlify

1. Netlifyにログインする
2. `Add new site` を選ぶ
3. このフォルダをドラッグ&ドロップする
4. 自動発行されたURLをスマホで開く

ビルドコマンドは不要です。

## ファイル構成

- `index.html`: 画面構造
- `styles.css`: スマホ対応デザイン
- `app.js`: 学習カード、進捗保存、音声再生
- `data.js`: 教材データ
- `manifest.json`: ホーム画面追加用の設定
- `.nojekyll`: GitHub Pages用の静的配信設定

## 現在の教材量

- レッスン: 20
- 総カード: 100
- 単語: 40
- 文法: 20
- リスニング: 20
- 音読: 20

## スマホでの使い方

公開URLをスマホのブラウザで開きます。
SafariまたはChromeの「ホーム画面に追加」を使うと、アプリのように起動できます。

## 次に追加する予定

- 20レッスン分の教材データ
- 単語SRS
- 文法カテゴリ別ドリル
- リスニング問題の増量
- 音読ログ
