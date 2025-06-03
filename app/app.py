from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import json
import requests
import sqlite3
import secrets
import csv
from io import StringIO

# アプリケーションの設定
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

# セッション設定
app.secret_key = secrets.token_hex(16)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///toyota_sales.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# データベース初期化
db = SQLAlchemy(app)

# ログイン管理の設定
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# モデル定義
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    
class History(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_type = db.Column(db.String(100), nullable=False)
    customer_details = db.Column(db.Text)
    dealer_info = db.Column(db.Text)
    proposal_data = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    car_model = db.Column(db.String(100))
    sales_talk = db.Column(db.Text)

class ApiSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    api_endpoint = db.Column(db.String(255), nullable=False)
    proposal_api_key = db.Column(db.String(255))
    qa_api_key = db.Column(db.String(255))
    salestalk_api_key = db.Column(db.String(255))
    last_tested = db.Column(db.DateTime)
    is_connected = db.Column(db.Boolean, default=False)

# ユーザーローダー
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ルート：トップページ
@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template('index.html')
    return redirect(url_for('login'))

# ルート：ログイン
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.password == password:  # 実際のアプリではハッシュ化すべき
            login_user(user)
            return redirect(url_for('index'))
        
        return render_template('login.html', error="ユーザー名またはパスワードが間違っています")
    
    return render_template('login.html')

# ルート：ログアウト
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# ルート：API設定の取得
@app.route('/api/settings', methods=['GET'])
@login_required
def get_api_settings():
    settings = ApiSettings.query.filter_by(user_id=current_user.id).first()
    
    if not settings:
        # デフォルト設定を返す
        return jsonify({
            'api_endpoint': 'http://54.92.0.96/v1',
            'proposal_api_key': '',
            'qa_api_key': '',
            'salestalk_api_key': '',
            'is_connected': False
        })
    
    return jsonify({
        'api_endpoint': settings.api_endpoint,
        'proposal_api_key': settings.proposal_api_key,
        'qa_api_key': settings.qa_api_key,
        'salestalk_api_key': settings.salestalk_api_key,
        'is_connected': settings.is_connected
    })

# ルート：API設定の保存
@app.route('/api/settings', methods=['POST'])
@login_required
def save_api_settings():
    data = request.get_json()
    
    settings = ApiSettings.query.filter_by(user_id=current_user.id).first()
    
    if not settings:
        settings = ApiSettings(user_id=current_user.id)
    
    settings.api_endpoint = data.get('api_endpoint')
    settings.proposal_api_key = data.get('proposal_api_key')
    settings.qa_api_key = data.get('qa_api_key')
    settings.salestalk_api_key = data.get('salestalk_api_key')
    
    db.session.add(settings)
    db.session.commit()
    
    return jsonify({'status': 'success'})

# ルート：API接続テスト
@app.route('/api/test-connection', methods=['POST'])
@login_required
def test_api_connection():
    settings = ApiSettings.query.filter_by(user_id=current_user.id).first()
    
    if not settings:
        return jsonify({'status': 'error', 'message': 'API設定が見つかりません'})
    
    # Dify API /info エンドポイントに接続テスト
    try:
        base_url = settings.api_endpoint
        headers = {
            "Authorization": f"Bearer {settings.proposal_api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{base_url}/info", headers=headers)
        
        if response.status_code == 200:
            settings.is_connected = True
            settings.last_tested = datetime.utcnow()
            db.session.commit()
            return jsonify({'status': 'success'})
        else:
            settings.is_connected = False
            db.session.commit()
            return jsonify({'status': 'error', 'message': f'API接続エラー: {response.status_code}'})
    
    except Exception as e:
        settings.is_connected = False
        db.session.commit()
        return jsonify({'status': 'error', 'message': f'API接続例外: {str(e)}'})

# ルート：提案内容生成
@app.route('/api/generate-proposal', methods=['POST'])
@login_required
def generate_proposal():
    data = request.get_json()
    
    settings = ApiSettings.query.filter_by(user_id=current_user.id).first()
    
    if not settings or not settings.is_connected:
        return jsonify({'status': 'error', 'message': 'API接続が設定されていないか、接続テストに失敗しています'})
    
    # Dify APIに送信するデータ
    customer_data = {
        'customer_name': data.get('customer_name', ''),
        'customer_details': data.get('customer_details', ''),
        'customer_type': data.get('customer_type', ''),
        'dealer_info': data.get('dealer_info', '')
    }
    
    # データサイズを確認してAPIの制限内に収まるようにする
    json_data = json.dumps(customer_data)
    if len(json_data) > 45000:  # 50000文字の制限に余裕を持たせる
        # 長いフィールドを切り詰める
        customer_data['customer_details'] = customer_data['customer_details'][:5000]
        customer_data['dealer_info'] = customer_data['dealer_info'][:2000]
    
    dify_data = {
        'inputs': {
            'input': json.dumps(customer_data)
        },
        'response_mode': 'streaming',
        'user': f"user-{current_user.id}"
    }
    
    base_url = settings.api_endpoint
    headers = {
        "Authorization": f"Bearer {settings.proposal_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{base_url}/workflows/run", headers=headers, json=dify_data, stream=True)
        
        if response.status_code != 200:
            return jsonify({'status': 'error', 'message': f'API呼び出しエラー: {response.status_code}'})
        
        # ストリームからの最終レスポンスを取得
        final_output = {}
        for line in response.iter_lines():
            if line:
                line_text = line.decode('utf-8')
                if line_text.startswith("data: "):
                    json_str = line_text[6:]
                    try:
                        event_data = json.loads(json_str)
                        event_type = event_data.get("event")
                        
                        if event_type == "workflow_finished":
                            final_output = event_data.get("data", {}).get("outputs", {})
                            break
                    except json.JSONDecodeError:
                        continue
        
        if not final_output:
            return jsonify({'status': 'error', 'message': 'API処理中にエラーが発生しました'})
        
        text_output = final_output.get("text", "{}")
        
        try:
            # テキスト出力がJSON文字列の場合、パースする
            content = json.loads(text_output) if isinstance(text_output, str) else text_output
            
            # contentがdictで、textキーがある場合は、そのテキストを再度パースする
            if isinstance(content, dict) and "text" in content:
                content = json.loads(content["text"]) if isinstance(content["text"], str) else content["text"]
            
            return jsonify({'status': 'success', 'proposal': content})
            
        except json.JSONDecodeError:
            # JSONでない場合は、テキストをそのまま返す
            return jsonify({'status': 'error', 'message': 'レスポンスの形式が正しくありません', 'raw_response': text_output})
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'API呼び出し例外: {str(e)}'})

# ルート：セールストーク生成
@app.route('/api/generate-salestalk', methods=['POST'])
@login_required
def generate_salestalk():
    data = request.get_json()
    
    settings = ApiSettings.query.filter_by(user_id=current_user.id).first()
    
    if not settings or not settings.is_connected:
        return jsonify({'status': 'error', 'message': 'API接続が設定されていないか、接続テストに失敗しています'})
    
    # Dify APIに送信するデータ
    conversation_data = {
        'customer_name': data.get('customer_name', ''),
        'customer_details': data.get('customer_details', ''),
        'customer_type': data.get('customer_type', ''),
        'proposal': data.get('proposal', {})
    }
    
    # データサイズを確認してAPIの制限内に収まるようにする
    json_data = json.dumps(conversation_data)
    if len(json_data) > 45000:  # 50000文字の制限に余裕を持たせる
        # customer_detailsとreasonを短く切り詰める
        conversation_data['customer_details'] = conversation_data['customer_details'][:2000]
        if 'proposal' in conversation_data and isinstance(conversation_data['proposal'], dict):
            for section in ['car', 'payment', 'timing', 'trade_in']:
                if section in conversation_data['proposal'] and 'reason' in conversation_data['proposal'][section]:
                    conversation_data['proposal'][section]['reason'] = conversation_data['proposal'][section]['reason'][:1000]
    
    dify_data = {
        'inputs': {
            'input': json.dumps(conversation_data)
        },
        'response_mode': 'streaming',
        'user': f"conversation-user-{current_user.id}"
    }
    
    base_url = settings.api_endpoint
    headers = {
        "Authorization": f"Bearer {settings.salestalk_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{base_url}/workflows/run", headers=headers, json=dify_data, stream=True)
        
        if response.status_code != 200:
            return jsonify({'status': 'error', 'message': f'API呼び出しエラー: {response.status_code}'})
        
        # ストリームからの最終レスポンスを取得
        final_output = {}
        for line in response.iter_lines():
            if line:
                line_text = line.decode('utf-8')
                if line_text.startswith("data: "):
                    json_str = line_text[6:]
                    try:
                        event_data = json.loads(json_str)
                        event_type = event_data.get("event")
                        
                        if event_type == "workflow_finished":
                            final_output = event_data.get("data", {}).get("outputs", {})
                            break
                    except json.JSONDecodeError:
                        continue
        
        if not final_output:
            return jsonify({'status': 'error', 'message': 'API処理中にエラーが発生しました'})
        
        text_output = final_output.get("text", "{}")
        
        try:
            # テキスト出力がJSON文字列の場合、パースする
            content = json.loads(text_output) if isinstance(text_output, str) else text_output
            
            # contentがdictで、textキーがある場合は、そのテキストを再度パースする
            if isinstance(content, dict) and "text" in content:
                content = json.loads(content["text"]) if isinstance(content["text"], str) else content["text"]
            
            return jsonify({'status': 'success', 'salestalk': content})
            
        except json.JSONDecodeError:
            # JSONでない場合は、テキストをそのまま返す
            return jsonify({'status': 'error', 'message': 'レスポンスの形式が正しくありません', 'raw_response': text_output})
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'API呼び出し例外: {str(e)}'})

# ルート：質問応答
@app.route('/api/ask-question', methods=['POST'])
@login_required
def ask_question():
    data = request.get_json()
    
    settings = ApiSettings.query.filter_by(user_id=current_user.id).first()
    
    if not settings or not settings.is_connected:
        return jsonify({'status': 'error', 'message': 'API接続が設定されていないか、接続テストに失敗しています'})
    
    # Dify APIに送信するデータ
    qa_data = {
        'customer_name': data.get('customer_name', ''),
        'customer_details': data.get('customer_details', ''),
        'customer_type': data.get('customer_type', ''),
        'proposal': json.dumps(data.get('proposal', {})),  # オブジェクトを文字列化
        'sales_question': data.get('question', '')  # questionをsales_questionとして送信
    }
    
    # データサイズを確認してAPIの制限内に収まるようにする
    json_data = json.dumps(qa_data)
    if len(json_data) > 45000:  # 50000文字の制限に余裕を持たせる
        # customer_detailsと提案説明文を短く切り詰める
        qa_data['customer_details'] = qa_data['customer_details'][:2000]
        proposal_obj = data.get('proposal', {})
        if isinstance(proposal_obj, dict):
            for section in ['car', 'payment', 'timing', 'trade_in']:
                if section in proposal_obj and 'reason' in proposal_obj[section]:
                    proposal_obj[section]['reason'] = proposal_obj[section]['reason'][:1000]
            qa_data['proposal'] = json.dumps(proposal_obj)
    
    dify_data = {
        'inputs': {
            'input': json.dumps(qa_data)
        },
        'response_mode': 'streaming',
        'user': f"qa-user-{current_user.id}"
    }
    
    base_url = settings.api_endpoint
    headers = {
        "Authorization": f"Bearer {settings.qa_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{base_url}/workflows/run", headers=headers, json=dify_data, stream=True)
        
        if response.status_code != 200:
            # エラーレスポンスの詳細を返す
            try:
                error_detail = response.json()
                return jsonify({'status': 'error', 'message': f'API呼び出しエラー: {response.status_code}', 'detail': error_detail})
            except:
                return jsonify({'status': 'error', 'message': f'API呼び出しエラー: {response.status_code}'})
        
        # ストリームからの最終レスポンスを取得
        final_output = {}
        for line in response.iter_lines():
            if line:
                line_text = line.decode('utf-8')
                if line_text.startswith("data: "):
                    json_str = line_text[6:]
                    try:
                        event_data = json.loads(json_str)
                        event_type = event_data.get("event")
                        
                        if event_type == "workflow_finished":
                            final_output = event_data.get("data", {}).get("outputs", {})
                            break
                    except json.JSONDecodeError:
                        continue
        
        if not final_output:
            return jsonify({'status': 'error', 'message': 'API処理中にエラーが発生しました'})
        
        text_output = final_output.get("text", "{}")
        
        try:
            # サンプルコードと同様の抽出処理を実装
            content = json.loads(text_output) if isinstance(text_output, str) else text_output
            
            # textキーがある場合はその中身を取得（サンプルコードのextract_content関数と同等）
            if isinstance(content, dict) and "text" in content:
                content = json.loads(content["text"]) if isinstance(content["text"], str) else content["text"]
            
            return jsonify({'status': 'success', 'answer': content})
            
        except json.JSONDecodeError:
            # JSONでない場合は、テキストをそのまま返す
            return jsonify({'status': 'error', 'message': 'レスポンスの形式が正しくありません', 'raw_response': text_output})
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'API呼び出し例外: {str(e)}'})

# ルート：会話生成
@app.route('/api/generate-conversation', methods=['POST'])
@login_required
def generate_conversation():
    data = request.get_json()
    
    settings = ApiSettings.query.filter_by(user_id=current_user.id).first()
    
    if not settings or not settings.is_connected:
        return jsonify({'status': 'error', 'message': 'API接続が設定されていないか、接続テストに失敗しています'})
    
    # Dify APIに送信するデータ
    conversation_data = {
        'customer_name': data.get('customer_name', ''),
        'customer_details': data.get('customer_details', ''),
        'customer_type': data.get('customer_type', ''),
        'proposal': data.get('proposal', {})
    }
    
    # データサイズを確認してAPIの制限内に収まるようにする
    json_data = json.dumps(conversation_data)
    if len(json_data) > 45000:  # 50000文字の制限に余裕を持たせる
        # customer_detailsとreasonを短く切り詰める
        conversation_data['customer_details'] = conversation_data['customer_details'][:2000]
        if 'proposal' in conversation_data and isinstance(conversation_data['proposal'], dict):
            for section in ['car', 'payment', 'timing', 'trade_in']:
                if section in conversation_data['proposal'] and 'reason' in conversation_data['proposal'][section]:
                    conversation_data['proposal'][section]['reason'] = conversation_data['proposal'][section]['reason'][:1000]
    
    dify_data = {
        'inputs': {
            'input': json.dumps(conversation_data)
        },
        'response_mode': 'streaming',
        'user': f"conversation-user-{current_user.id}"
    }
    
    base_url = settings.api_endpoint
    headers = {
        "Authorization": f"Bearer {settings.salestalk_api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{base_url}/workflows/run", headers=headers, json=dify_data, stream=True)
        
        if response.status_code != 200:
            # エラーレスポンスの詳細を返す
            try:
                error_detail = response.json()
                return jsonify({'status': 'error', 'message': f'API呼び出しエラー: {response.status_code}', 'detail': error_detail})
            except:
                return jsonify({'status': 'error', 'message': f'API呼び出しエラー: {response.status_code}'})
        
        # ストリームからの最終レスポンスを取得
        final_output = {}
        for line in response.iter_lines():
            if line:
                line_text = line.decode('utf-8')
                if line_text.startswith("data: "):
                    json_str = line_text[6:]
                    try:
                        event_data = json.loads(json_str)
                        event_type = event_data.get("event")
                        
                        if event_type == "workflow_finished":
                            final_output = event_data.get("data", {}).get("outputs", {})
                            break
                    except json.JSONDecodeError:
                        continue
        
        if not final_output:
            return jsonify({'status': 'error', 'message': 'API処理中にエラーが発生しました'})
        
        text_output = final_output.get("text", "{}")
        
        try:
            # テキスト出力がJSON文字列の場合、パースする
            content = json.loads(text_output) if isinstance(text_output, str) else text_output
            
            # contentがdictで、textキーがある場合は、そのテキストを再度パースする
            if isinstance(content, dict) and "text" in content:
                content = json.loads(content["text"]) if isinstance(content["text"], str) else content["text"]
            
            return jsonify({'status': 'success', 'conversation': content})
            
        except json.JSONDecodeError:
            # JSONでない場合は、テキストをそのまま返す
            return jsonify({'status': 'error', 'message': 'レスポンスの形式が正しくありません', 'raw_response': text_output})
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'API呼び出し例外: {str(e)}'})

# ルート：履歴保存
@app.route('/api/save-history', methods=['POST'])
@login_required
def save_history():
    data = request.get_json()
    
    history = History(
        user_id=current_user.id,
        customer_name=data.get('customer_name', ''),
        customer_type=data.get('customer_type', ''),
        customer_details=data.get('customer_details', ''),
        dealer_info=data.get('dealer_info', ''),
        proposal_data=json.dumps(data.get('proposal', {})),
        car_model=data.get('car_model', ''),
        sales_talk=data.get('sales_talk', '')
    )
    
    db.session.add(history)
    db.session.commit()
    
    return jsonify({'status': 'success', 'id': history.id})

# ルート：履歴取得
@app.route('/api/get-history', methods=['GET'])
@login_required
def get_history():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    
    # フィルタリング条件
    customer_name = request.args.get('customer_name', '')
    period = request.args.get('period', 'all')
    
    query = History.query.filter_by(user_id=current_user.id)
    
    if customer_name:
        query = query.filter(History.customer_name.like(f'%{customer_name}%'))
    
    if period != 'all':
        now = datetime.utcnow()
        if period == 'week':
            # 1週間以内
            from_date = now.replace(day=now.day-7)
        elif period == 'month':
            # 1ヶ月以内
            from_date = now.replace(month=now.month-1)
        elif period == 'quarter':
            # 3ヶ月以内
            from_date = now.replace(month=now.month-3)
        
        query = query.filter(History.created_at >= from_date)
    
    pagination = query.order_by(History.created_at.desc()).paginate(page=page, per_page=per_page)
    
    result = []
    for item in pagination.items:
        result.append({
            'id': item.id,
            'customer_name': item.customer_name,
            'customer_type': item.customer_type,
            'car_model': item.car_model,
            'created_at': item.created_at.strftime('%Y/%m/%d')
        })
    
    return jsonify({
        'items': result,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

# ルート：履歴詳細
@app.route('/api/history/<int:history_id>', methods=['GET'])
@login_required
def get_history_detail(history_id):
    history = History.query.filter_by(id=history_id, user_id=current_user.id).first()
    
    if not history:
        return jsonify({'status': 'error', 'message': '履歴が見つかりません'})
    
    return jsonify({
        'id': history.id,
        'customer_name': history.customer_name,
        'customer_type': history.customer_type,
        'customer_details': history.customer_details,
        'dealer_info': history.dealer_info,
        'proposal': json.loads(history.proposal_data),
        'car_model': history.car_model,
        'sales_talk': history.sales_talk,
        'created_at': history.created_at.strftime('%Y/%m/%d %H:%M')
    })

# ルート：履歴削除
@app.route('/api/history/<int:history_id>', methods=['DELETE'])
@login_required
def delete_history(history_id):
    history = History.query.filter_by(id=history_id, user_id=current_user.id).first()
    
    if not history:
        return jsonify({'status': 'error', 'message': '履歴が見つかりません'})
    
    db.session.delete(history)
    db.session.commit()
    
    return jsonify({'status': 'success'})

# ルート：履歴CSVエクスポート
@app.route('/api/export-history', methods=['GET'])
@login_required
def export_history():
    # フィルタリング条件
    customer_name = request.args.get('customer_name', '')
    period = request.args.get('period', 'all')
    
    query = History.query.filter_by(user_id=current_user.id)
    
    if customer_name:
        query = query.filter(History.customer_name.like(f'%{customer_name}%'))
    
    if period != 'all':
        now = datetime.utcnow()
        if period == 'week':
            # 1週間以内
            from_date = now.replace(day=now.day-7)
        elif period == 'month':
            # 1ヶ月以内
            from_date = now.replace(month=now.month-1)
        elif period == 'quarter':
            # 3ヶ月以内
            from_date = now.replace(month=now.month-3)
        
        query = query.filter(History.created_at >= from_date)
    
    # CSVの生成
    si = StringIO()
    cw = csv.writer(si)
    
    # ヘッダー
    cw.writerow(['日時', '顧客名', '顧客タイプ', '車種', '詳細'])
    
    # データ
    for item in query.order_by(History.created_at.desc()).all():
        cw.writerow([
            item.created_at.strftime('%Y/%m/%d %H:%M'),
            item.customer_name,
            item.customer_type,
            item.car_model,
            item.customer_details[:50] + ('...' if len(item.customer_details) > 50 else '')
        ])
    
    # CSVレスポンスの生成
    output = si.getvalue()
    
    return output, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=toyota_sales_history.csv'
    }

# メイン実行
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # テスト用のユーザーがいない場合は作成
        if not User.query.filter_by(username='demo').first():
            demo_user = User(username='demo', password='demo')
            db.session.add(demo_user)
            db.session.commit()

    app.run(debug=True, host='0.0.0.0', port=5000) 