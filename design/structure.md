
# トヨタセールスAIアシスタント フロントエンドデザインデータ構造

本ディレクトリには、トヨタセールスAIアシスタントのフロントエンド（HTML, CSS, JavaScript）に関するデザインデータが含まれています。

design/
├── css/
│ ├── responsive.css
│ └── style.css
├── images/
│ └── toyota-logo.jpg
├── js/
│ └── main.js
└── index.html

各ファイル・ディレクトリの役割は以下の通りです。

-   **`design/index.html`**:
    -   アプリケーション全体の骨組みとなるHTMLファイルです。
    -   ログイン画面、メインアプリケーションのヘッダー、ナビゲーション、各コンテンツセクション（顧客情報入力、提案内容、ロールプレイ、履歴）、設定モーダル、フッター、ローディングオーバーレイ、通知などの要素が含まれています。
    -   `css/style.css`、`css/responsive.css`、`js/main.js`を読み込んでいます。
    -   Font Awesome (アイコン) や Google Fonts (Noto Sans JP) の外部CSSも参照しています。
    -   トヨタロゴ画像 (`images/toyota-logo.jpg`) を参照しています。

-   **`design/css/` ディレクトリ**:
    -   スタイルシート（CSS）ファイルが格納されます。
    -   **`style.css`**: アプリケーション全体の基本的なスタイルを定義します。
    -   **`responsive.css`**: 様々なデバイスサイズに対応するためのレスポンシブスタイルを定義します。

-   **`design/images/` ディレクトリ**:
    -   アプリケーションで使用される画像ファイルが格納されます。
    -   **`toyota-logo.jpg`**: トヨタのロゴ画像ファイルです。

-   **`design/js/` ディレクトリ**:
    -   JavaScriptファイルが格納されます。
    -   **`main.js`**: アプリケーションの主要なJavaScriptロジックが含まれています。DOM操作、イベントハンドリング、UIの動的な制御などを担当します。提案生成などのAPI連携のクライアント側処理（デモ用）も含みます。

この構造は、HTMLでページの基本構成を、CSSで装飾を、JavaScriptで動的な振る舞いを担当するという、一般的なWebサイト/Webアプリケーション開発の構成に基づいています。`responsive.css` と `images/` ディレクトリが追加されることで、完全なデザインデータの構成となります。