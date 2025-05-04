// トヨタセールスAIアシスタント JavaScript

// DOM 読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    // 初期設定
    initApp();
    setupEventListeners();
});

/**
 * アプリケーションの初期設定
 */
function initApp() {
    // ファイル選択の表示更新
    const voiceFileInput = document.getElementById('voice-file');
    if (voiceFileInput) {
        voiceFileInput.addEventListener('change', function() {
            const fileNameElement = document.getElementById('selected-file-name');
            if (this.files.length > 0) {
                fileNameElement.textContent = this.files[0].name;
                document.getElementById('process-voice-btn').disabled = false;
            } else {
                fileNameElement.textContent = '選択されていません';
                document.getElementById('process-voice-btn').disabled = true;
            }
        });
    }
    
    // アコーディオン初期化
    initAccordions();
}

/**
 * イベントリスナーのセットアップ
 */
function setupEventListeners() {
    // ログインフォーム送信
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // ナビゲーションタブ切り替え
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            changeTab(this.getAttribute('data-tab'));
        });
    });
    
    // 設定ボタン
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            toggleModal('settings-modal', true);
        });
    }
    
    // モーダルを閉じるボタン
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            toggleModal(modalId, false);
        });
    });
    
    // 提案内容生成ボタン
    const generateProposalBtn = document.getElementById('generate-proposal-btn');
    if (generateProposalBtn) {
        generateProposalBtn.addEventListener('click', handleGenerateProposal);
    }
    
    // ロールプレイ開始ボタン
    const startRoleplayBtn = document.getElementById('start-roleplay-btn');
    if (startRoleplayBtn) {
        startRoleplayBtn.addEventListener('click', function() {
            changeTab('roleplay');
        });
    }
    
    // セールス役ロールプレイボタン
    const salesRoleBtn = document.getElementById('sales-role-btn');
    if (salesRoleBtn) {
        salesRoleBtn.addEventListener('click', function() {
            const url = document.getElementById('sales-role-url')?.value || 'https://play.dify.ai/sales-role';
            window.open(url, '_blank');
        });
    }
    
    // 顧客役ロールプレイボタン
    const customerRoleBtn = document.getElementById('customer-role-btn');
    if (customerRoleBtn) {
        customerRoleBtn.addEventListener('click', function() {
            const url = document.getElementById('customer-role-url')?.value || 'https://play.dify.ai/customer-role';
            window.open(url, '_blank');
        });
    }
    
    // 質問送信ボタン
    const qaSubmitBtn = document.getElementById('qa-submit');
    if (qaSubmitBtn) {
        qaSubmitBtn.addEventListener('click', handleAskQuestion);
    }
    
    // 音声ファイル処理ボタン
    const processVoiceBtn = document.getElementById('process-voice-btn');
    if (processVoiceBtn) {
        processVoiceBtn.addEventListener('click', handleProcessVoice);
    }
    
    // ログアウトボタン
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

/**
 * アコーディオン機能の初期化
 */
function initAccordions() {
    const accordionHeaders = document.querySelectorAll('.qa-accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isActive = this.classList.contains('active');
            
            // アクティブ状態を切り替え
            this.classList.toggle('active');
            
            // コンテンツの表示切替
            if (isActive) {
                content.style.display = 'none';
                content.classList.remove('active');
            } else {
                content.style.display = 'flex';
                content.classList.add('active');
            }
        });
    });
}

/**
 * タブの切り替え処理
 * @param {string} tabId - 表示するタブのID
 */
function changeTab(tabId) {
    // ナビアイテムのアクティブ状態を更新
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');
    
    // コンテンツセクションの表示を切り替え
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

/**
 * モーダルの表示・非表示を切り替え
 * @param {string} modalId - モーダルのID
 * @param {boolean} show - 表示するかどうか
 */
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

/**
 * ローディングオーバーレイの表示・非表示を切り替え
 * @param {boolean} show - 表示するかどうか
 */
function toggleLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (show) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

/**
 * 通知を表示
 * @param {string} message - 通知メッセージ
 * @param {string} type - 通知タイプ（success, error, warning）
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const iconElement = notification.querySelector('.notification-icon');
    const messageElement = notification.querySelector('.notification-message');
    
    // タイプに応じたアイコンを設定
    notification.className = 'notification ' + type;
    
    switch (type) {
        case 'success':
            iconElement.className = 'notification-icon fas fa-check-circle';
            break;
        case 'error':
            iconElement.className = 'notification-icon fas fa-exclamation-circle';
            break;
        case 'warning':
            iconElement.className = 'notification-icon fas fa-exclamation-triangle';
            break;
        default:
            iconElement.className = 'notification-icon fas fa-info-circle';
    }
    
    // メッセージを設定
    messageElement.textContent = message;
    
    // 通知を表示
    notification.classList.remove('hidden');
    
    // 3秒後に自動的に閉じる
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

/**
 * ログイン処理
 * @param {Event} e - イベントオブジェクト
 */
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification('ユーザー名とパスワードを入力してください', 'error');
        return;
    }
    
    toggleLoading(true);
    
    // 実際の環境では、ここでサーバーに認証リクエストを送信
    // デモ用にタイマーで遅延を模倣
    setTimeout(() => {
        toggleLoading(false);
        
        // デモではどんな値でもログイン成功にする
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('user-name').textContent = username;
        
        // フォームをリセット
        document.getElementById('login-form').reset();
    }, 1000);
}

/**
 * ログアウト処理
 */
function handleLogout() {
    // 実際の環境では、ここでサーバーにログアウトリクエストを送信
    
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    
    // フォームをリセット
    document.getElementById('login-form').reset();
}

/**
 * 音声ファイル処理
 */
function handleProcessVoice() {
    const fileInput = document.getElementById('voice-file');
    if (!fileInput.files.length) {
        showNotification('ファイルが選択されていません', 'error');
        return;
    }
    
    const progressStatus = document.querySelector('.processing-status');
    progressStatus.classList.remove('hidden');
    
    const progressBar = document.getElementById('processing-progress');
    const statusText = document.getElementById('processing-status');
    
    // 進行状況を更新する関数
    const updateProgress = (percent) => {
        progressBar.style.width = `${percent}%`;
        statusText.textContent = `${percent}%`;
    };
    
    // 処理開始
    updateProgress(0);
    
    // 疑似的な進行状況の更新（実際のAPIリクエストでは、進行状況に応じて更新）
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        updateProgress(progress);
        
        if (progress >= 100) {
            clearInterval(interval);
            
            // 処理完了後の擬似データ（実際はAPIからの応答を利用）
            const extractedText = "山田太郎様（35歳・男性）、家族構成は妻と子供2人（5歳・2歳）。現在は軽自動車を所有しており、家族でのドライブや買い物での使用が多い。子供の成長に伴い、より広い室内空間を求めている。予算は300万円前後で、燃費性能も重視している。";
            
            // テキストエリアに抽出した情報を設定
            document.getElementById('customer-details').value = extractedText;
            
            showNotification('音声ファイルの処理が完了しました', 'success');
        }
    }, 100);
}

/**
 * 提案内容生成処理
 */
function handleGenerateProposal() {
    const customerName = document.getElementById('customer-name').value;
    const customerType = document.querySelector('input[name="customer-type"]:checked').value;
    const customerDetails = document.getElementById('customer-details').value;
    
    if (!customerName) {
        showNotification('顧客名を入力してください', 'error');
        return;
    }
    
    if (!customerDetails) {
        showNotification('顧客情報詳細を入力してください', 'warning');
    }
    
    toggleLoading(true);
    
    // APIリクエストの準備（実際の環境ではDify APIにリクエスト）
    const requestData = {
        customerName,
        customerType,
        customerDetails
    };
    
    console.log('提案生成リクエストデータ:', requestData);
    
    // 疑似的な遅延を作成（実際のAPIリクエストではこの部分を置き換え）
    setTimeout(() => {
        toggleLoading(false);
        
        // 提案内容画面に切り替え
        changeTab('proposal');
        
        showNotification('提案内容の生成が完了しました', 'success');
    }, 2000);
}

/**
 * 質問応答処理
 */
function handleAskQuestion() {
    const questionInput = document.getElementById('qa-question');
    const question = questionInput.value.trim();
    
    if (!question) {
        showNotification('質問を入力してください', 'warning');
        return;
    }
    
    toggleLoading(true);
    
    // 疑似的な遅延を作成（実際のAPIリクエストではこの部分を置き換え）
    setTimeout(() => {
        toggleLoading(false);
        
        // デモ用に固定の回答を表示
        const answer = "シエンタの燃費性能は、ハイブリッドモデルで約25km/Lと非常に優れています。これは同クラスのミニバンでトップクラスの数値で、年間の燃料費を大幅に抑えることができます。また、CO2排出量も少なく、環境にも優しい車です。";
        
        // 回答を表示
        const qaResponsesContainer = document.getElementById('qa-responses');
        
        // コンテナが非表示の場合は表示する
        if (qaResponsesContainer.classList.contains('hidden')) {
            qaResponsesContainer.classList.remove('hidden');
        }
        
        const newQAItem = document.createElement('div');
        newQAItem.className = 'qa-item';
        newQAItem.innerHTML = `
            <div class="qa-question">
                <span class="qa-badge">Q</span>
                <p>${question}</p>
            </div>
            <div class="qa-answer">
                <span class="qa-badge">A</span>
                <p>${answer}</p>
            </div>
        `;
        
        // 新しい質問回答を先頭に追加
        qaResponsesContainer.prepend(newQAItem);
        
        // 入力フィールドをクリア
        questionInput.value = '';
    }, 1500);
} 