import requests
import json
import time
import sys

# APIの設定
base_url = "http://54.92.0.96/v1"
api_key = "app-4X7z4ccPPRi1fGwGGygxMXa2"  # 質問回答用の新しいAPIキー
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# リクエストデータ
customer_qa_data = {
  "customer_name": "佐藤健太",
  "customer_details": "40代男性、家族構成：妻、小学4年生と1年生の子供2人。趣味はアウトドア活動で週末は家族でキャンプやハイキングに出かけることが多い。現在の車種：2015年式トヨタカローラフィールダー。",
  "customer_type": "即納車希望",
  "proposal": "ご家族でのアウトドア活動に最適なトヨタ カローラクロスG（価格298万円）をご提案します。広い荷室スペースと高い走行性能で、キャンプ道具の積載やアウトドアフィールドへのアクセスに便利です。11月中のご契約で年内納車が可能で、現在実施中の特別金利1.9%キャンペーンもご利用いただけます。下取り車の査定額は65〜75万円程度を見込んでおります。",
  "sales_question": "カローラクロスの納期について最新情報を教えてください。また、ルーフレールやキャンプ用品の積載に便利なオプションを紹介すべきでしょうか？"
}


def extract_content(text_output):
    """APIレスポンスからコンテンツを抽出する関数"""
    # 文字列の場合はJSONパースを試みる
    if isinstance(text_output, str):
        parsed_data = json.loads(text_output)
    else:
        parsed_data = text_output
    
    # textキーがある場合はその中身を取得
    if isinstance(parsed_data, dict) and "text" in parsed_data:
        return parsed_data["text"]
    
    return parsed_data


def display_response(content):
    """コンテンツに基づいて回答を表示する関数"""
    # sales_responseキーがある場合の処理
    if isinstance(content, dict) and "sales_response" in content:
        sr = content["sales_response"]
        print("【質問】")
        print(sr.get("sales_question", "質問が見つかりません"))
        print("\n【回答要約】")
        print(sr.get("summary", "回答要約が見つかりません"))
        print("\n【詳細説明】")
        print(sr.get("details", "詳細説明が見つかりません"))
    else:
        # 従来の形式の場合
        print("【質問】")
        print(content.get("質問", "質問が見つかりません"))
        print("\n【回答要約】")
        print(content.get("回答要約", "回答要約が見つかりません"))
        print("\n【詳細説明】")
        print(content.get("詳細説明", "詳細説明が見つかりません"))


# ストリーミングモードで実行
def run_with_streaming():
    data = {
        "inputs": {
            "input": json.dumps(customer_qa_data)  # 質問を含む顧客データを渡す
        },
        "response_mode": "streaming",
        "user": "qa-user-123"  # QA用のユーザー識別子
    }
    
    print("ストリーミングモードでリクエスト送信中...")
    try:
        with requests.post(f"{base_url}/workflows/run", headers=headers, json=data, stream=True) as response:
            if response.status_code != 200:
                print(f"エラー: {response.status_code}")
                print(response.text)
                return
                
            final_output = {}
            for line in response.iter_lines():
                if line:
                    # 'data: ' プレフィックスを削除
                    line_text = line.decode('utf-8')
                    if line_text.startswith("data: "):
                        json_str = line_text[6:]
                        try:
                            event_data = json.loads(json_str)
                            event_type = event_data.get("event")
                            
                            # 進行状況を表示
                            if event_type == "workflow_started":
                                print("Q&Aワークフロー開始...")
                            elif event_type == "node_started":
                                node_title = event_data.get("data", {}).get("title", "不明")
                                print(f"ノード処理中: {node_title}")
                            elif event_type == "node_finished":
                                node_title = event_data.get("data", {}).get("title", "不明")
                                print(f"ノード完了: {node_title}")
                            elif event_type == "workflow_finished":
                                print("Q&Aワークフロー完了")
                                final_output = event_data.get("data", {}).get("outputs", {})
                                break
                        except json.JSONDecodeError:
                            print(f"JSON解析エラー: {json_str}")
            
            # 最終結果を表示（回答JSONを整形して表示）
            if not final_output:
                print("回答が取得できませんでした")
                return
            
            print("\n回答結果:")
            # JSONから回答部分を抽出して表示
            text_output = final_output.get("text", "{}")
            
            try:
                # データの抽出と整形
                content = extract_content(text_output)
                
                # 回答の表示
                display_response(content)
                    
            except json.JSONDecodeError:
                # JSONでない場合はそのまま表示
                print(text_output)
                
    except requests.exceptions.RequestException as e:
        print(f"リクエスト例外: {e}")


if __name__ == "__main__":
    # ストリーミングモードを使用（推奨）
    run_with_streaming()
    
    # または、ブロッキングモードを使用（タイムアウトの可能性あり）
    # run_with_blocking()