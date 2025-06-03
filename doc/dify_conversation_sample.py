import requests
import json
import time
import sys

# APIの設定
base_url = "http://54.92.0.96/v1"
api_key = "app-LinWfmWGaN8cYXOyilwouNLP"  # 商談会話用APIキー
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# リクエストデータ
customer_conversation_data = {
  "customer_name": "佐藤健一",
  "customer_details": "38歳男性、IT企業勤務。家族構成は妻（35歳）と小学3年生の息子（9歳）、幼稚園年長の娘（6歳）の4人家族。趣味はアウトドアとドライブ。現在所有車はホンダフィット（2015年式）で走行距離89,000km。週末の家族レジャーや日常の送迎に使用。予算は350万円前後で燃費と安全性を重視。",
  "customer_type": "商談進行中・2回目来店",
  "proposal": {
    "car": {
      "model": "トヨタ RAV4",
      "grade": "Adventure",
      "price": "3,538,000円",
      "reason": "佐藤様ご家族のアウトドア活動に最適なSUVとして、RAV4 Adventureをご提案します。アウトドア仕様の専用装備と2.0Lダイナミックフォースエンジン搭載で悪路走行性能に優れ、休日のキャンプやレジャーに適しています。室内空間が広く、お子様の成長にも対応できるサイズ感です。Toyota Safety Sense搭載で家族の安全も確保。さらに荷室容量が先代モデル比20%増となり、アウトドア用品の積載にも余裕があります。"
    },
    "payment": {
      "recommended_method": "残価設定型クレジット（トヨタのりかえスマイルプラン）",
      "simulation": "月々32,000円（ボーナス時70,000円×年2回）、頭金500,000円、支払期間60ヶ月、残価設定1,150,000円、総支払額3,690,000円",
      "reason": "将来の乗り換えを視野に入れた場合、残価設定型クレジットが最適です。通常ローンに比べ月々の支払いが約1万円抑えられ、家計への負担を軽減できます。現在実施中の低金利キャンペーン（1.9%）適用で、通常より総支払額を約15万円削減可能です。また5年後の選択肢（買取・返却・乗換）が自由に選べる柔軟性も魅力です。お子様の成長に合わせて5年後の車種変更も容易にできます。"
    },
    "timing": {
      "recommended_date": "2024年9月",
      "reason": "9月は当店の決算期であり、値引き額が年間で最大（現行モデルで最大15万円）となります。また、RAV4の現在の納期は約2ヶ月であり、9月契約で年内納車が可能です。さらに現在お乗りのフィットは来年2月が車検期限であり、車検費用（約10万円）が不要となるタイミングでもあります。決算期特別低金利キャンペーンと合わせ、経済的にも最も有利な時期といえます。"
    },
    "trade_in": {
      "recommendation": "下取り推奨",
      "assesment": "48万円～55万円",
      "reason": "現在お乗りのフィットは当店での整備履歴があり、状態も良好なため有利な査定額となっています。下取りの場合、9月の決算期特別査定で「プラス5万円キャンペーン」が適用可能です。また名義変更等の手続きも当店で一括対応するため、余計な手間がかかりません。査定額は市場相場と車両状態から48万円～55万円程度と見込んでおり、一般的な買取業者より有利な条件提示が可能です。"
    }
  }
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


def display_conversation(content):
    """会話内容を表示する関数"""
    if not isinstance(content, dict):
        print("会話内容を表示できません。データ形式が不正です。")
        return
    
    # キーポイント（要点）の表示
    if "key_points" in content and isinstance(content["key_points"], list):
        print("\n【会話の要点】")
        for i, point in enumerate(content["key_points"], 1):
            print(f"{i}. {point}")
    
    # 会話内容の表示
    if "messages" in content and isinstance(content["messages"], list):
        print("\n【会話内容】")
        prev_role = None
        
        for msg in content["messages"]:
            role = msg.get("role", "")
            content_text = msg.get("content", "")
            
            # 対話ポイント（解説）の場合は別形式で表示
            if role == "sales" and content_text.startswith("[対話ポイント]"):
                print(f"\n--- 営業担当の意図 ---")
                print(f"{content_text.replace('[対話ポイント] ', '')}")
                print("-------------------")
                continue
            
            # 通常の会話の場合
            if role != prev_role:
                if role == "customer":
                    print(f"\n【お客様】")
                elif role == "sales":
                    print(f"\n【営業担当】")
                else:
                    print(f"\n【{role}】")
            
            print(content_text)
            prev_role = role
    
    # 次のステップの表示
    if "next_steps" in content and isinstance(content["next_steps"], list):
        print("\n【次のステップ】")
        for i, step in enumerate(content["next_steps"], 1):
            print(f"{i}. {step}")
    
    # 上記形式に合わない場合はJSONで表示
    if not any(k in content for k in ["key_points", "messages", "next_steps"]):
        print("\n【レスポンス内容】")
        print(json.dumps(content, indent=2, ensure_ascii=False))


# ストリーミングモードで実行
def run_with_streaming():
    data = {
        "inputs": {
            "input": json.dumps(customer_conversation_data)
        },
        "response_mode": "streaming",
        "user": "conversation-user-123"
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
                                print("会話生成ワークフロー開始...")
                            elif event_type == "node_started":
                                node_title = event_data.get("data", {}).get("title", "不明")
                                print(f"ノード処理中: {node_title}")
                            elif event_type == "node_finished":
                                node_title = event_data.get("data", {}).get("title", "不明")
                                print(f"ノード完了: {node_title}")
                            elif event_type == "workflow_finished":
                                print("会話生成ワークフロー完了")
                                final_output = event_data.get("data", {}).get("outputs", {})
                                break
                        except json.JSONDecodeError:
                            print(f"JSON解析エラー: {json_str}")
            
            # 最終結果を表示
            if not final_output:
                print("会話内容が取得できませんでした")
                return
            
            print("\n生成された会話内容:")
            # JSONから会話部分を抽出して表示
            text_output = final_output.get("text", "{}")
            
            try:
                # データの抽出と整形
                content = extract_content(text_output)
                
                # 会話内容の表示
                display_conversation(content)
                    
            except json.JSONDecodeError:
                # JSONでない場合はそのまま表示
                print(text_output)
                
    except requests.exceptions.RequestException as e:
        print(f"リクエスト例外: {e}")


if __name__ == "__main__":
    # ストリーミングモードを使用
    run_with_streaming() 