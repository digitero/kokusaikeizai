import requests
import json
import time
import sys

# APIの設定
base_url = "http://54.92.0.96/v1"
api_key = "app-BPfaAi8wwQXTJyFCQhD8ov9P"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# リクエストデータ
customer_data = {
  "customer_name": "田中雄一",
  "customer_details": "45歳男性、会社経営者。家族構成は妻（42歳）と高校生の息子（16歳）、中学生の娘（13歳）の4人家族。趣味はゴルフとアウトドア。現在の所有車はBMW 5シリーズで購入後5年経過。休日は家族でのドライブや旅行が多く、車内の快適性と走行性能を重視。予算は500〜700万円程度。環境への配慮から次回はハイブリッドまたはEVに興味あり。",
  "customer_type": "商談進行中・2回目来店",
  "dealer_info": "トヨタプレミアムディーラーとして認定。県内最大の試乗車ラインナップを常時20台以上完備。専属メカニックによる納車後10年間の無料点検サービス実施中。11月末までの成約でオプション20万円分プレゼントキャンペーン実施中。EVおよびPHV購入者向け自宅充電設備設置サポート（工事費最大10万円補助）あり。顧客満足度調査3年連続県内1位。"
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


def display_recommendation(content):
    """提案内容を表示する関数"""
    if not isinstance(content, dict):
        print("提案内容を表示できません。データ形式が不正です。")
        return
        
    # proposal キーがある場合の処理
    if "proposal" in content:
        proposal = content["proposal"]
        
        # 車両提案の表示
        if "car" in proposal:
            car = proposal["car"]
            print("\n【提案車両】")
            print(f"モデル: {car.get('model', '情報なし')}")
            print(f"グレード: {car.get('grade', '情報なし')}")
            print(f"価格帯: {car.get('price', '情報なし')}")
            print(f"提案理由: {car.get('reason', '情報なし')}")
        
        # 支払方法の表示
        if "payment" in proposal:
            payment = proposal["payment"]
            print("\n【お支払い方法】")
            print(f"推奨方法: {payment.get('recommended_method', '情報なし')}")
            print(f"シミュレーション: {payment.get('simulation', '情報なし')}")
            print(f"提案理由: {payment.get('reason', '情報なし')}")
        
        # 購入タイミングの表示
        if "timing" in proposal:
            timing = proposal["timing"]
            print("\n【おすすめ購入時期】")
            print(f"推奨時期: {timing.get('recommended_date', '情報なし')}")
            print(f"提案理由: {timing.get('reason', '情報なし')}")
        
        # 下取り情報の表示
        if "trade_in" in proposal:
            trade_in = proposal["trade_in"]
            print("\n【下取り情報】")
            print(f"推奨: {trade_in.get('recommendation', '情報なし')}")
            print(f"査定額: {trade_in.get('assesment', '情報なし')}")
            print(f"提案理由: {trade_in.get('reason', '情報なし')}")
        
        # FAQ情報の表示
        if "faq" in proposal:
            faq = proposal["faq"]
            print("\n【よくある質問】")
            
            # FAQの項目を収集
            faq_pairs = []
            i = 1
            while True:
                # 質問キーの候補
                q_keys = [f"question{i}", f"quesition{i}"]
                a_key = f"answer{i}"
                
                # いずれかの質問キーが存在するか確認
                q_found = False
                for q_key in q_keys:
                    if q_key in faq:
                        q_found = True
                        faq_pairs.append((q_key, a_key))
                        break
                
                # 質問が見つからなければ終了
                if not q_found:
                    break
                
                i += 1
            
            # 収集したFAQペアを表示
            for idx, (q_key, a_key) in enumerate(faq_pairs):
                print(f"\nQ{idx+1}: {faq.get(q_key, '情報なし')}")
                print(f"A: {faq.get(a_key, '情報なし')}")
    
    else:
        # 従来のフォーマットやその他の形式の場合は従来通りJSON表示
        print("\n【レスポンス内容】")
        print(json.dumps(content, indent=2, ensure_ascii=False))


# ストリーミングモードで実行
def run_with_streaming():
    data = {
        "inputs": {
            "input": json.dumps(customer_data)
        },
        "response_mode": "streaming",
        "user": "user-123"
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
                                print("ワークフロー開始...")
                            elif event_type == "node_started":
                                node_title = event_data.get("data", {}).get("title", "不明")
                                print(f"ノード処理中: {node_title}")
                            elif event_type == "node_finished":
                                node_title = event_data.get("data", {}).get("title", "不明")
                                print(f"ノード完了: {node_title}")
                            elif event_type == "workflow_finished":
                                print("ワークフロー完了")
                                final_output = event_data.get("data", {}).get("outputs", {})
                                break
                        except json.JSONDecodeError:
                            print(f"JSON解析エラー: {json_str}")
            
            # 最終結果を表示
            if not final_output:
                print("最終結果が取得できませんでした")
                return
            
            print("\n提案結果:")
            # JSONから回答部分を抽出して表示
            text_output = final_output.get("text", "{}")
            
            try:
                # データの抽出と整形
                content = extract_content(text_output)
                
                # 提案内容の表示
                display_recommendation(content)
                    
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