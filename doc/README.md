# トヨタセールスAIアシスタント

トヨタセールスAIアシスタントは、自動車販売店の営業担当者向けに設計された支援ツールです。顧客情報に基づいて最適な車種提案、質問応答、セールストークの生成を行い、効果的な商談をサポートします。

## 主な機能

- **車種提案**: 顧客情報に基づいた最適な車種、グレードの提案
- **質問応答**: 顧客からの質問に対する回答生成
- **セールストーク**: 提案内容をもとにした効果的なセールストークの生成
- **商談会話シミュレーション**: 顧客との会話例の生成
- **商談履歴管理**: 過去の商談内容の保存と参照

## 構築手順

### Windows環境での構築

#### 前提条件

- Python 3.9以上
- pip（Pythonパッケージマネージャー）
- Git（ソースコード管理）

#### インストール手順

1. ソースコードを任意のディレクトリに展開（ここではtoyota-sales-assistantというフォルダを想定）

2. Powershellで展開したフォルダに移動

3. 依存パッケージのインストール

```powershell
pip install -r prototype/requirements.txt
```

4. データベースの初期化

```powershell
cd prototype
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

5. アプリケーションの実行

```powershell
python app.py
```

6. ブラウザでアクセス

ブラウザで [http://localhost:5000](http://localhost:5000) にアクセスし、以下のデフォルトアカウントでログイン：
- ユーザー名: admin
- パスワード: password

#### API設定

初回ログイン後、以下の手順でAPIを設定します：

1. 設定画面を開く
2. APIエンドポイントを入力: `http://54.92.0.96/v1`
3. 各APIキーを入力:
   - 提案API: `app-BPfaAi8wwQXTJyFCQhD8ov9P`
   - 質問応答API: `app-4X7z4ccPPRi1fGwGGygxMXa2`
   - セールストークAPI: `app-LinWfmWGaN8cYXOyilwouNLP`
4. 「接続テスト」をクリックして接続を確認

### AWS環境での構築

#### 前提条件

- AWS アカウント
- EC2インスタンスの作成権限
- RDSインスタンスの作成権限（オプション）

#### EC2インスタンス設定

1. EC2インスタンスの作成
   - Amazon Linux 2023 AMI を選択
   - t2.micro 以上のインスタンスタイプを推奨
   - セキュリティグループで以下のポートを開放:
     - SSH (22)
     - HTTP (80)
     - HTTPS (443)

2. インスタンスに接続してセットアップ

```bash
# 必要なパッケージのインストール
sudo dnf update -y
sudo dnf install git python3-pip python3-devel -y

# リポジトリのクローン
git clone https://github.com/your-repo/toyota-sales-assistant.git
cd toyota-sales-assistant

# 依存パッケージのインストール
pip3 install -r prototype/requirements.txt

# アプリケーションの初期化
cd prototype
python3 -c "from app import app, db; app.app_context().push(); db.create_all()"
```

3. Nginx のインストールと設定

```bash
# Nginxのインストール
sudo dnf install nginx -y

# Nginxの設定
sudo tee /etc/nginx/conf.d/toyota-sales.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# デフォルト設定の無効化
sudo rm /etc/nginx/conf.d/default.conf

# Nginxの起動と自動起動設定
sudo systemctl start nginx
sudo systemctl enable nginx
```

4. アプリケーションをサービスとして実行

```bash
# サービス設定ファイルの作成
sudo tee /etc/systemd/system/toyota-sales.service > /dev/null << 'EOF'
[Unit]
Description=Toyota Sales AI Assistant
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/toyota-sales-assistant/prototype
ExecStart=/usr/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# サービスの有効化と開始
sudo systemctl daemon-reload
sudo systemctl start toyota-sales
sudo systemctl enable toyota-sales
```

5. ブラウザでアクセス

EC2インスタンスのパブリックIPアドレスにブラウザでアクセスし、以下のデフォルトアカウントでログイン：
- ユーザー名: demo
- パスワード: demo

#### RDSを使用する場合（オプション）

1. RDSインスタンスの作成
   - MySQL 8.0 エンジンを選択
   - デベロップメント用の小さなインスタンスクラスを選択
   - セキュリティグループでEC2からのアクセスを許可

2. アプリケーション設定の変更

```bash
# 環境変数ファイルの作成
cd ~/toyota-sales-assistant/prototype
touch instance/config.py

# 設定ファイルの編集
cat > instance/config.py << EOF
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://username:password@your-rds-endpoint:3306/toyota_sales'
EOF

# MySQLクライアントとPyMySQLのインストール
pip3 install pymysql

# データベースの再初期化
python3 -c "from app import app, db; app.app_context().push(); db.drop_all(); db.create_all()"

# アプリケーションの再起動
sudo systemctl restart toyota-sales
```

## トラブルシューティング

### よくある問題と解決策

1. API接続エラー
   - APIエンドポイントとAPIキーが正しく設定されているか確認
   - ネットワーク接続を確認

2. 提案画面の「よくある質問と回答」でトグルが動作しない
   - ブラウザのキャッシュをクリア
   - ブラウザの開発者ツールでJavaScriptエラーを確認

3. API呼び出しで400エラーが発生する場合
   - リクエスト形式を確認
   - APIへのデータ送信時の文字列変換方法を確認

### サンプルスクリプト

デモでは以下のサンプルスクリプトを使用して各API機能をテストできます：

- `dify_recommendreq_sample.py` - 提案生成API呼び出しサンプル
- `dify_qa_sample.py` - 質問応答API呼び出しサンプル
- `dify_conversation_sample.py` - 会話生成API呼び出しサンプル

## 参考情報

- Flask ドキュメント: [https://flask.palletsprojects.com/](https://flask.palletsprojects.com/)
- Dify API ドキュメント: [https://docs.dify.ai/](https://docs.dify.ai/) 