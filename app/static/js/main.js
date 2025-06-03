// トヨタセールスAIアシスタント JavaScript

// DOM 読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    // 初期設定
    initApp();
    setupEventListeners();
    loadApiSettings();
});

// グローバル変数
let currentProposal = null;
let currentCustomerData = null;
let currentSalesTalk = null;

/**
 * アプリケーションの初期設定
 */
function initApp() {
    // アコーディオン初期化
    initAccordions();
    
    // プロポーザルタブ初期化
    initProposalTabs();
}

/**
 * イベントリスナーのセットアップ
 */
function setupEventListeners() {
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
    
    // 通知を閉じるボタン
    const notificationCloseBtn = document.querySelector('.notification-close');
    if (notificationCloseBtn) {
        notificationCloseBtn.addEventListener('click', function() {
            document.getElementById('notification').classList.add('hidden');
        });
    }
    
    // 提案内容生成ボタン
    const generateProposalBtn = document.getElementById('generate-proposal-btn');
    if (generateProposalBtn) {
        generateProposalBtn.addEventListener('click', handleGenerateProposal);
    }
    
    // セールストーク生成ボタン
    const generateSalesTalkBtn = document.getElementById('generate-salestalk-btn');
    if (generateSalesTalkBtn) {
        generateSalesTalkBtn.addEventListener('click', handleGenerateSalesTalk);
    }
    
    // ロールプレイセールストーク生成ボタン
    const generateRoleplayBtn = document.getElementById('generate-roleplay-btn');
    if (generateRoleplayBtn) {
        generateRoleplayBtn.addEventListener('click', handleGenerateRoleplaySalesTalk);
    }
    
    // 履歴に保存ボタン
    const saveProposalBtn = document.getElementById('save-proposal-btn');
    if (saveProposalBtn) {
        saveProposalBtn.addEventListener('click', handleSaveProposal);
    }
    
    // 履歴に保存ボタン（ロールプレイ画面）
    const saveHistoryBtn = document.getElementById('save-history-btn');
    if (saveHistoryBtn) {
        saveHistoryBtn.addEventListener('click', handleSaveProposal);
    }
    
    // 提案画面に戻るボタン
    const backToProposalBtn = document.getElementById('back-to-proposal-btn');
    if (backToProposalBtn) {
        backToProposalBtn.addEventListener('click', function() {
            changeTab('proposal');
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
    
    // セールストークコピーボタン
    const copySalesTalkBtn = document.getElementById('copy-sales-talk');
    if (copySalesTalkBtn) {
        copySalesTalkBtn.addEventListener('click', function() {
            const salesTalkContent = document.getElementById('salestalk-content');
            const textToCopy = salesTalkContent.innerText;
            
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    showNotification('セールストークをクリップボードにコピーしました', 'success');
                })
                .catch(err => {
                    showNotification('コピーに失敗しました', 'error');
                });
        });
    }
    
    // 履歴検索ボタン
    const historySearchBtn = document.getElementById('history-search-btn');
    if (historySearchBtn) {
        historySearchBtn.addEventListener('click', function() {
            loadHistoryData(1);
        });
    }
    
    // 履歴エクスポートボタン
    const historyExportBtn = document.getElementById('history-export-btn');
    if (historyExportBtn) {
        historyExportBtn.addEventListener('click', function() {
            const customerName = document.getElementById('history-search').value;
            const period = document.getElementById('history-period').value;
            
            const params = new URLSearchParams();
            if (customerName) params.append('customer_name', customerName);
            if (period) params.append('period', period);
            
            window.location.href = `/api/export-history?${params.toString()}`;
        });
    }
    
    // API設定フォーム送信
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', handleSaveApiSettings);
    }
    
    // API接続テストボタン
    const testConnectionBtn = document.getElementById('test-connection-btn');
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', handleTestApiConnection);
    }
    
    // パスワード表示切替ボタン
    const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.querySelector('i').classList.remove('fa-eye');
                this.querySelector('i').classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                this.querySelector('i').classList.remove('fa-eye-slash');
                this.querySelector('i').classList.add('fa-eye');
            }
        });
    });
    
    // 履歴詳細を閉じるボタン
    const closeDetailBtn = document.querySelector('.close-detail-btn');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', function() {
            document.getElementById('history-detail-card').classList.add('hidden');
        });
    }
    
    // すべてのFAQを表示するボタン
    const showAllQaBtn = document.getElementById('show-all-qa');
    if (showAllQaBtn) {
        showAllQaBtn.addEventListener('click', function() {
            const faqHeaders = document.querySelectorAll('.qa-accordion-header');
            faqHeaders.forEach(header => {
                if (!header.classList.contains('active')) {
                    // 直接クリックイベントを発火させて、イベントリスナーに処理を任せる
                    header.click();
                }
            });
        });
    }
    
    // 履歴ページが表示されたら、履歴データをロード
    const historyNavItem = document.querySelector('.nav-item[data-tab="history"]');
    if (historyNavItem) {
        historyNavItem.addEventListener('click', function() {
            loadHistoryData(1);
        });
    }
    
    // 提案内容コピーボタン
    const copyProposalBtn = document.getElementById('copy-proposal-btn');
    if (copyProposalBtn) {
        copyProposalBtn.addEventListener('click', copyProposalAsMarkdown);
    }
}

/**
 * アコーディオン機能の初期化
 * 新しい実装: 各FAQアイテムに直接イベントリスナーを割り当てる
 */
function initAccordions() {
    // カードのトグルボタンクリック時の処理
    document.querySelectorAll('.card-toggle').forEach(toggleBtn => {
        toggleBtn.addEventListener('click', function() {
            const card = this.closest('.card');
            const cardBody = card.querySelector('.card-body');
            
            if (cardBody.style.display === 'none') {
                cardBody.style.display = 'block';
                this.querySelector('i').style.transform = 'rotate(0deg)';
            } else {
                cardBody.style.display = 'none';
                this.querySelector('i').style.transform = 'rotate(180deg)';
        }
        });
    });
}

/**
 * プロポーザルタブの初期化
 */
function initProposalTabs() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.proposal-tab')) {
            const tab = e.target.closest('.proposal-tab');
            
            // 現在のアクティブタブを非アクティブにする
            document.querySelectorAll('.proposal-tab').forEach(t => {
                t.classList.remove('active');
            });
            
            // 現在のアクティブコンテンツを非アクティブにする
            document.querySelectorAll('.proposal-tab-content').forEach(c => {
                c.classList.remove('active');
            });
            
            // クリックされたタブをアクティブにする
            tab.classList.add('active');
            
            // 対応するコンテンツをアクティブにする
            const tabId = tab.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        }
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
    
    // コンテンツセクションのアクティブ状態を更新
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

/**
 * モーダルの表示・非表示切り替え
 * @param {string} modalId - モーダルのID
 * @param {boolean} show - trueで表示、falseで非表示
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
 * ローディングオーバーレイの表示・非表示切り替え
 * @param {boolean} show - trueで表示、falseで非表示
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
 * 通知を表示する
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 通知のタイプ（success, error, warning）
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageElement = notification.querySelector('.notification-message');
    const iconElement = notification.querySelector('.notification-icon');
    
    messageElement.textContent = message;
    
    // 既存のクラスをリセット
    notification.classList.remove('success', 'error', 'warning');
    iconElement.className = 'notification-icon';
    
    // タイプに応じたクラスを設定
    notification.classList.add(type);
    
    if (type === 'success') {
        iconElement.classList.add('fas', 'fa-check-circle');
    } else if (type === 'error') {
        iconElement.classList.add('fas', 'fa-exclamation-circle');
    } else if (type === 'warning') {
        iconElement.classList.add('fas', 'fa-exclamation-triangle');
    }
    
    // 通知を表示
    notification.classList.remove('hidden');
    
    // 5秒後に自動的に非表示
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

/**
 * API設定を読み込む
 */
function loadApiSettings() {
    fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            document.getElementById('api-endpoint').value = data.api_endpoint;
            document.getElementById('api-key-proposal').value = data.proposal_api_key;
            document.getElementById('api-key-qa').value = data.qa_api_key;
            document.getElementById('api-key-salestalk').value = data.salestalk_api_key;
            
            updateConnectionStatus(data.is_connected);
        })
        .catch(error => {
            console.error('設定の読み込みに失敗しました', error);
            showNotification('API設定の読み込みに失敗しました', 'error');
        });
}

/**
 * 接続ステータスを更新する
 * @param {boolean} isConnected - 接続状態
 */
function updateConnectionStatus(isConnected) {
    const indicator = document.getElementById('connection-indicator');
    const statusText = document.getElementById('connection-status-text');
    const details = document.getElementById('connection-details');
    
    indicator.className = 'status-indicator';
    
    if (isConnected === true) {
        indicator.classList.add('success');
        statusText.textContent = '接続OK';
        details.textContent = 'API接続が正常に確立されています。';
    } else if (isConnected === false) {
        indicator.classList.add('error');
        statusText.textContent = '接続エラー';
        details.textContent = 'API接続に問題があります。設定を確認して再度テストしてください。';
    } else {
        indicator.classList.add('warning');
        statusText.textContent = '未テスト';
        details.textContent = '接続テストを実行して、API設定が正しく機能しているか確認してください。';
    }
}

/**
 * API設定を保存する
 */
function handleSaveApiSettings() {
    const apiEndpoint = document.getElementById('api-endpoint').value;
    const proposalApiKey = document.getElementById('api-key-proposal').value;
    const qaApiKey = document.getElementById('api-key-qa').value;
    const salestalkApiKey = document.getElementById('api-key-salestalk').value;
    
    const data = {
        api_endpoint: apiEndpoint,
        proposal_api_key: proposalApiKey,
        qa_api_key: qaApiKey,
        salestalk_api_key: salestalkApiKey
    };
    
    fetch('/api/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('API設定を保存しました', 'success');
        } else {
            showNotification('API設定の保存に失敗しました', 'error');
        }
    })
    .catch(error => {
        console.error('API設定の保存に失敗しました', error);
        showNotification('API設定の保存に失敗しました', 'error');
    });
}

/**
 * API接続テストを実行する
 */
function handleTestApiConnection() {
    const indicator = document.getElementById('connection-indicator');
    const statusText = document.getElementById('connection-status-text');
    const details = document.getElementById('connection-details');
    
    indicator.className = 'status-indicator warning';
    statusText.textContent = 'テスト中...';
    details.textContent = 'API接続をテストしています...';
    
    fetch('/api/test-connection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            updateConnectionStatus(true);
            showNotification('API接続テストに成功しました', 'success');
        } else {
            updateConnectionStatus(false);
            showNotification(`API接続テストに失敗しました: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('API接続テストに失敗しました', error);
        updateConnectionStatus(false);
        showNotification('API接続テストに失敗しました', 'error');
    });
}

/**
 * 提案内容を生成する
 */
function handleGenerateProposal() {
    const customerName = document.getElementById('customer-name').value;
    
    if (!customerName) {
        showNotification('顧客名を入力してください', 'warning');
        return;
    }
    
    const customerDetails = document.getElementById('customer-details').value;
    const dealerInfo = document.getElementById('dealer-info').value;
    
    const data = {
        customer_name: customerName,
        customer_details: customerDetails,
        dealer_info: dealerInfo
    };
    
    // 顧客データを保存
    currentCustomerData = data;
    
    toggleLoading(true);
    
    fetch('/api/generate-proposal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        toggleLoading(false);
        
        if (data.status === 'success') {
            // 提案データを保存
            currentProposal = data.proposal;
            
            // 顧客情報サマリーを更新
            updateCustomerSummary();
            
            // 提案内容を表示
            displayProposal(data.proposal);
            
            // タブを提案内容に切り替え
            changeTab('proposal');
            
            showNotification('提案内容を生成しました', 'success');
        } else {
            showNotification(`提案生成に失敗しました: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        toggleLoading(false);
        console.error('提案生成に失敗しました', error);
        showNotification('提案生成に失敗しました', 'error');
    });
}

/**
 * 顧客情報サマリーを更新する
 */
function updateCustomerSummary() {
    if (!currentCustomerData) return;
    
    document.getElementById('summary-name').textContent = currentCustomerData.customer_name;
    document.getElementById('summary-details').textContent = currentCustomerData.customer_details;
}

/**
 * 提案内容を表示する
 * @param {Object} proposal - 提案内容のデータ
 */
function displayProposal(proposal) {
    if (!proposal || !proposal.proposal) return;
    
    const p = proposal.proposal;
    
    // 車種の情報を表示
    if (p.car) {
        document.getElementById('car-model').textContent = p.car.model || '未設定';
        document.getElementById('car-grade').textContent = p.car.grade || '未設定';
        document.getElementById('car-price').textContent = p.car.price || '未設定';
        document.getElementById('car-reason').textContent = p.car.reason || '情報がありません';
    }
    
    // 支払方法の情報を表示
    if (p.payment) {
        document.getElementById('payment-method').textContent = p.payment.recommended_method || '未設定';
        document.getElementById('payment-simulation').textContent = p.payment.simulation || '支払いシミュレーション情報がありません';
        document.getElementById('payment-reason').textContent = p.payment.reason || '情報がありません';
    }
    
    // 購入時期の情報を表示
    if (p.timing) {
        document.getElementById('recommended-timing').textContent = p.timing.recommended_date || '未設定';
        document.getElementById('timing-reason').textContent = p.timing.reason || '情報がありません';
    }
    
    // 下取りの情報を表示
    if (p.trade_in) {
        document.getElementById('tradein-car').textContent = p.trade_in.owned_car || '情報なし';
        document.getElementById('tradein-price').textContent = p.trade_in.assesment || '未設定';
        document.getElementById('tradein-details').innerHTML = `
            <ul>
                <li>${p.trade_in.reason?.split('。')[0] || '情報がありません'}</li>
                <li>${p.trade_in.reason?.split('。')[1] || ''}</li>
                <li>${p.trade_in.reason?.split('。')[2] || ''}</li>
            </ul>
        `;
    }
    
    // FAQの表示
    if (p.faq) {
        const faqContainer = document.getElementById('faq-items');
        faqContainer.innerHTML = '';
        
        // FAQの項目を収集
        const faqPairs = [];
        let i = 1;
        while (true) {
            // 質問キーの候補
            const qKeys = [`question${i}`, `quesition${i}`];
            const aKey = `answer${i}`;
            
            // いずれかの質問キーが存在するか確認
            let qFound = false;
            for (const qKey of qKeys) {
                if (p.faq[qKey]) {
                    qFound = true;
                    faqPairs.push({ question: p.faq[qKey], answer: p.faq[aKey] });
                    break;
                }
            }
            
            // 質問が見つからなければ終了
            if (!qFound) {
                break;
            }
            
            i++;
        }
        
        // FAQペアをHTML要素として表示
        faqPairs.forEach(pair => {
            const faqItemHtml = `
                <div class="qa-accordion-item">
                    <div class="qa-accordion-header">
                        <span class="qa-badge">Q</span>
                        <p>${pair.question || '質問が見つかりません'}</p>
                        <i class="fas fa-chevron-down" style="transition: transform 0.3s ease;"></i>
                    </div>
                    <div class="qa-accordion-content" style="display: none;">
                        <span class="qa-badge">A</span>
                        <p>${pair.answer || '回答が見つかりません'}</p>
                    </div>
                </div>
            `;
            
            faqContainer.innerHTML += faqItemHtml;
        });
        
        // 各FAQアコーディオンヘッダーにイベントリスナーを直接追加
        const faqHeaders = faqContainer.querySelectorAll('.qa-accordion-header');
        faqHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const content = this.nextElementSibling;
                const isActive = this.classList.contains('active');
                
                // アクティブ状態を切り替え
                this.classList.toggle('active');
                
                // アイコンの回転を切り替え
                const icon = this.querySelector('.fas.fa-chevron-down');
                if (icon) {
                    if (isActive) {
                        icon.style.transform = 'rotate(0deg)';
                    } else {
                        icon.style.transform = 'rotate(180deg)';
                    }
                }
                
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
        
        // アコーディオン初期化（カードトグル用）
        initAccordions();
    }
}

/**
 * 質問を送信して回答を表示する
 */
function handleAskQuestion() {
    const question = document.getElementById('qa-question').value;
    
    if (!question) {
        showNotification('質問を入力してください', 'warning');
        return;
    }
    
    if (!currentCustomerData || !currentProposal) {
        showNotification('提案内容がありません。先に提案を生成してください。', 'warning');
        return;
    }
    
    const data = {
        ...currentCustomerData,
        proposal: currentProposal.proposal,
        question: question
    };
    
    // デバッグ出力
    console.log('質問データ:', data);
    
    toggleLoading(true);
    
    fetch('/api/ask-question', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        toggleLoading(false);
        
        console.log('APIレスポンス:', data);
        
        if (data.status === 'success') {
            displayAnswer(question, data.answer);
            document.getElementById('qa-question').value = '';
            showNotification('質問に回答しました', 'success');
        } else {
            // エラー詳細がある場合は表示
            let errorMessage = `質問応答に失敗しました: ${data.message}`;
            if (data.detail) {
                console.error('エラー詳細:', data.detail);
                if (typeof data.detail === 'object') {
                    errorMessage += ` (${JSON.stringify(data.detail)})`;
                }
            }
            showNotification(errorMessage, 'error');
        }
    })
    .catch(error => {
        toggleLoading(false);
        console.error('質問応答に失敗しました', error);
        showNotification('質問応答に失敗しました', 'error');
    });
}

/**
 * 質問と回答を表示する
 * @param {string} question - 質問内容
 * @param {Object} answer - 回答データ
 */
function displayAnswer(question, answer) {
    const qaResponses = document.getElementById('qa-responses');
    
    let summary = '';
    let details = '';
    
    // 形式に応じてデータを取得
    if (answer.sales_response) {
        summary = answer.sales_response.summary || '情報なし';
        details = answer.sales_response.details || '情報なし';
    } else {
        summary = answer.回答要約 || '情報なし';
        details = answer.詳細説明 || '情報なし';
    }
    
    const qaItemHtml = `
        <div class="qa-item">
            <div class="qa-question">
                <span class="qa-badge">Q</span>
                <p>${question}</p>
            </div>
            <div class="qa-answer">
                <span class="qa-badge">A</span>
                <div>
                    <p><strong>${summary}</strong></p>
                    <p>${details}</p>
                </div>
            </div>
        </div>
    `;
    
    qaResponses.innerHTML += qaItemHtml;
}

/**
 * セールストークを生成する
 */
function handleGenerateSalesTalk() {
    if (!currentCustomerData || !currentProposal) {
        showNotification('提案内容がありません。先に提案を生成してください。', 'warning');
        return;
    }
    
    const data = {
        ...currentCustomerData,
        proposal: currentProposal.proposal
    };
    
    toggleLoading(true);
    
    fetch('/api/generate-salestalk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        toggleLoading(false);
        
        if (data.status === 'success') {
            // セールストークデータを保存
            currentSalesTalk = data.salestalk;
            
            // セールストークを表示
            displaySalesTalk(data.salestalk);
            
            // タブをロールプレイに切り替え
            changeTab('roleplay');
            
            showNotification('セールストークを生成しました', 'success');
        } else {
            showNotification(`セールストーク生成に失敗しました: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        toggleLoading(false);
        console.error('セールストーク生成に失敗しました', error);
        showNotification('セールストーク生成に失敗しました', 'error');
    });
}

/**
 * セールストークを表示する
 * @param {Object} salestalk - セールストークデータ
 */
function displaySalesTalk(salestalk) {
    const salesTalkContent = document.getElementById('salestalk-content');
    
    if (!salestalk || (!salestalk.messages && !salestalk.key_points)) {
        salesTalkContent.innerHTML = '<p class="text-muted">セールストークの生成に失敗しました。</p>';
        return;
    }
    
    let html = '';
    
    // キーポイントがある場合は表示
    if (salestalk.key_points && Array.isArray(salestalk.key_points)) {
        html += '<div class="sales-talk-section"><h3>会話の要点</h3><ul>';
        salestalk.key_points.forEach(point => {
            html += `<li>${point}</li>`;
        });
        html += '</ul></div>';
    }
    
    // 会話内容を表示
    if (salestalk.messages && Array.isArray(salestalk.messages)) {
        html += '<div class="sales-talk-section"><h3>会話内容</h3>';
        
        let prevRole = null;
        
        salestalk.messages.forEach(msg => {
            const role = msg.role || '';
            const content = msg.content || '';
            
            // 対話ポイント（解説）の場合は別形式で表示
            if (role === 'sales' && content.startsWith('[対話ポイント]')) {
                html += `<div class="sales-point"><p>${content.replace('[対話ポイント] ', '')}</p></div>`;
                return;
            }
            
            // 通常の会話の場合
            if (role !== prevRole) {
                if (role === 'customer') {
                    html += '<div class="sales-talk-customer"><strong>【お客様】</strong>';
                } else if (role === 'sales') {
                    html += '<div class="sales-talk-sales"><strong>【営業担当】</strong>';
                } else {
                    html += `<div class="sales-talk-other"><strong>【${role}】</strong>`;
                }
            } else {
                html += '<div>';
            }
            
            html += `<p>${content}</p></div>`;
            prevRole = role;
        });
        
        html += '</div>';
    }
    
    // 次のステップがある場合は表示
    if (salestalk.next_steps && Array.isArray(salestalk.next_steps)) {
        html += '<div class="sales-talk-section"><h3>次のステップ</h3><ol>';
        salestalk.next_steps.forEach(step => {
            html += `<li>${step}</li>`;
        });
        html += '</ol></div>';
    }
    
    html += '<button id="copy-sales-talk" class="btn btn-text"><i class="fas fa-copy"></i> 全文コピー</button>';
    
    salesTalkContent.innerHTML = html;
    
    // コピーボタンのイベントリスナーを再設定
    document.getElementById('copy-sales-talk').addEventListener('click', function() {
        const textToCopy = salesTalkContent.innerText;
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showNotification('セールストークをクリップボードにコピーしました', 'success');
            })
            .catch(err => {
                showNotification('コピーに失敗しました', 'error');
            });
    });
}

/**
 * 提案内容を履歴に保存する
 */
function handleSaveProposal() {
    if (!currentCustomerData || !currentProposal) {
        showNotification('提案内容がありません。先に提案を生成してください。', 'warning');
        return;
    }
    
    const data = {
        ...currentCustomerData,
        proposal: currentProposal.proposal,
        car_model: currentProposal.proposal.car?.model || '',
        sales_talk: currentSalesTalk ? JSON.stringify(currentSalesTalk) : ''
    };
    
    fetch('/api/save-history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('提案内容を履歴に保存しました', 'success');
        } else {
            showNotification('履歴の保存に失敗しました', 'error');
        }
    })
    .catch(error => {
        console.error('履歴の保存に失敗しました', error);
        showNotification('履歴の保存に失敗しました', 'error');
    });
}

/**
 * 履歴データを読み込む
 * @param {number} page - ページ番号
 */
function loadHistoryData(page) {
    const customerName = document.getElementById('history-search').value;
    const period = document.getElementById('history-period').value;
    
    const params = new URLSearchParams();
    params.append('page', page);
    if (customerName) params.append('customer_name', customerName);
    if (period) params.append('period', period);
    
    fetch(`/api/get-history?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            displayHistoryData(data);
        })
        .catch(error => {
            console.error('履歴データの読み込みに失敗しました', error);
            showNotification('履歴データの読み込みに失敗しました', 'error');
        });
}

/**
 * 履歴データを表示する
 * @param {Object} data - APIから取得した履歴データ
 */
function displayHistoryData(data) {
    const tableBody = document.getElementById('history-table-body');
    const pagination = document.getElementById('history-pagination');
    
    // テーブルの内容をクリア
    tableBody.innerHTML = '';
    
    // データがない場合
    if (!data.items || data.items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">該当する履歴がありません</td>
            </tr>
        `;
        pagination.innerHTML = '';
        return;
    }
    
    // 履歴データの表示
    data.items.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.created_at}</td>
            <td>${item.customer_name}</td>
            <td>${item.car_model || '-'}</td>
            <td>${item.customer_type}</td>
            <td>
                <button class="btn btn-icon view-detail-btn" data-id="${item.id}" title="詳細表示">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-icon delete-history-btn" data-id="${item.id}" title="削除">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // ページネーションの表示
    displayPagination(data.current_page, data.pages);
    
    // 詳細表示ボタンのイベントリスナーを設定
    const viewDetailBtns = document.querySelectorAll('.view-detail-btn');
    viewDetailBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const historyId = this.getAttribute('data-id');
            showHistoryDetail(historyId);
        });
    });
    
    // 削除ボタンのイベントリスナーを設定
    const deleteHistoryBtns = document.querySelectorAll('.delete-history-btn');
    deleteHistoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const historyId = this.getAttribute('data-id');
            
            if (confirm('この履歴を削除してもよろしいですか？')) {
                deleteHistory(historyId);
            }
        });
    });
}

/**
 * ページネーションを表示する
 * @param {number} currentPage - 現在のページ番号
 * @param {number} totalPages - 総ページ数
 */
function displayPagination(currentPage, totalPages) {
    const pagination = document.getElementById('history-pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // 前のページへのリンク
    const prevLi = document.createElement('li');
    prevLi.classList.add('page-item');
    if (currentPage === 1) {
        prevLi.classList.add('disabled');
    }
    
    const prevLink = document.createElement('a');
    prevLink.classList.add('page-link');
    prevLink.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevLink.href = '#';
    
    if (currentPage > 1) {
        prevLink.addEventListener('click', function(e) {
            e.preventDefault();
            loadHistoryData(currentPage - 1);
        });
    }
    
    prevLi.appendChild(prevLink);
    pagination.appendChild(prevLi);
    
    // ページ番号のリンク
    for (let i = 1; i <= totalPages; i++) {
        if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
            // ページ数が多い場合は省略
            if (i === 3 && currentPage > 4) {
                const ellipsisLi = document.createElement('li');
                ellipsisLi.classList.add('page-item', 'disabled');
                ellipsisLi.innerHTML = '<span class="page-link">...</span>';
                pagination.appendChild(ellipsisLi);
            }
            continue;
        }
        
        const li = document.createElement('li');
        li.classList.add('page-item');
        if (i === currentPage) {
            li.classList.add('active');
        }
        
        const link = document.createElement('a');
        link.classList.add('page-link');
        link.textContent = i;
        link.href = '#';
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            loadHistoryData(i);
        });
        
        li.appendChild(link);
        pagination.appendChild(li);
    }
    
    // 次のページへのリンク
    const nextLi = document.createElement('li');
    nextLi.classList.add('page-item');
    if (currentPage === totalPages) {
        nextLi.classList.add('disabled');
    }
    
    const nextLink = document.createElement('a');
    nextLink.classList.add('page-link');
    nextLink.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextLink.href = '#';
    
    if (currentPage < totalPages) {
        nextLink.addEventListener('click', function(e) {
            e.preventDefault();
            loadHistoryData(currentPage + 1);
        });
    }
    
    nextLi.appendChild(nextLink);
    pagination.appendChild(nextLi);
}

/**
 * 履歴詳細を表示する
 * @param {number} historyId - 履歴ID
 */
function showHistoryDetail(historyId) {
    fetch(`/api/history/${historyId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                showNotification(data.message, 'error');
                return;
            }
            
            // 詳細データを表示
            document.getElementById('detail-customer-name').textContent = `${data.customer_name}様 - ${data.created_at}`;
            document.getElementById('detail-car-model').textContent = data.car_model || '未設定';
            document.getElementById('detail-payment-method').textContent = data.proposal?.payment?.recommended_method || '未設定';
            document.getElementById('detail-customer-type').textContent = data.customer_type;
            document.getElementById('detail-customer-info').textContent = data.customer_details;
            
            // 詳細カードを表示
            document.getElementById('history-detail-card').classList.remove('hidden');
            
            // 提案内容を再表示するボタンのイベントリスナー
            document.getElementById('show-proposal-again-btn').onclick = function() {
                // 提案内容を現在の変数に設定
                currentCustomerData = {
                    customer_name: data.customer_name,
                    customer_type: data.customer_type,
                    customer_details: data.customer_details,
                    dealer_info: data.dealer_info
                };
                
                currentProposal = {
                    proposal: data.proposal
                };
                
                // セールストークがあれば設定
                if (data.sales_talk) {
                    try {
                        currentSalesTalk = JSON.parse(data.sales_talk);
                    } catch (e) {
                        console.error('セールストークのパースに失敗しました', e);
                    }
                }
                
                // 提案内容を表示
                updateCustomerSummary();
                displayProposal(currentProposal);
                
                // タブを提案内容に切り替え
                changeTab('proposal');
                
                // 詳細カードを非表示
                document.getElementById('history-detail-card').classList.add('hidden');
            };
            
            // 新規提案に利用するボタンのイベントリスナー
            document.getElementById('use-for-new-proposal-btn').onclick = function() {
                // 顧客情報入力欄に値を設定
                document.getElementById('customer-name').value = data.customer_name;
                
                const customerTypeRadios = document.querySelectorAll('input[name="customer-type"]');
                customerTypeRadios.forEach(radio => {
                    if (radio.value === data.customer_type) {
                        radio.checked = true;
                    }
                });
                
                document.getElementById('customer-details').value = data.customer_details;
                document.getElementById('dealer-info').value = data.dealer_info;
                
                // タブを顧客情報入力に切り替え
                changeTab('customer-input');
                
                // 詳細カードを非表示
                document.getElementById('history-detail-card').classList.add('hidden');
            };
        })
        .catch(error => {
            console.error('履歴詳細の取得に失敗しました', error);
            showNotification('履歴詳細の取得に失敗しました', 'error');
        });
}

/**
 * 履歴を削除する
 * @param {number} historyId - 履歴ID
 */
function deleteHistory(historyId) {
    fetch(`/api/history/${historyId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('履歴を削除しました', 'success');
            
            // 履歴一覧を再読み込み
            loadHistoryData(1);
            
            // 詳細カードが表示されている場合は非表示
            document.getElementById('history-detail-card').classList.add('hidden');
        } else {
            showNotification(`履歴の削除に失敗しました: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('履歴の削除に失敗しました', error);
        showNotification('履歴の削除に失敗しました', 'error');
    });
}

/**
 * ロールプレイ用セールストークを生成する
 */
function handleGenerateRoleplaySalesTalk() {
    if (!currentCustomerData || !currentProposal) {
        showNotification('提案内容がありません。先に提案を生成してください。', 'warning');
        return;
    }
    
    const data = {
        ...currentCustomerData,
        proposal: currentProposal.proposal
    };
    
    // JSONデータを圧縮して文字数を削減
    const compressedData = {
        customer_name: data.customer_name,
        customer_type: data.customer_type,
        customer_details: data.customer_details.substring(0, 1000), // 詳細は1000文字に制限
        proposal: {
            car: data.proposal.car,
            payment: data.proposal.payment,
            timing: data.proposal.timing, 
            trade_in: data.proposal.trade_in
        }
    };
    
    // デバッグ用にデータサイズを確認
    console.log('リクエストデータサイズ:', JSON.stringify(compressedData).length);
    
    toggleLoading(true);
    
    fetch('/api/generate-conversation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(compressedData)
    })
    .then(response => response.json())
    .then(data => {
        toggleLoading(false);
        
        if (data.status === 'success') {
            // セールストークデータを保存
            currentSalesTalk = data.conversation;
            
            // セールストークを表示
            displaySalesTalk(data.conversation);
            
            showNotification('ロールプレイ用セールストークを生成しました', 'success');
        } else {
            showNotification(`セールストーク生成に失敗しました: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        toggleLoading(false);
        console.error('セールストーク生成に失敗しました', error);
        showNotification('セールストーク生成に失敗しました', 'error');
    });
}

/**
 * 提案内容をマークダウン形式でクリップボードにコピーする
 */
function copyProposalAsMarkdown() {
    if (!currentProposal || !currentProposal.proposal) {
        showNotification('コピーする提案内容がありません', 'warning');
        return;
    }
    
    const p = currentProposal.proposal;
    let markdownText = `# ${currentCustomerData?.customer_name || '顧客'}様 提案内容\n\n`;
    
    // 車種情報
    if (p.car) {
        markdownText += `## 提案車種\n\n`;
        markdownText += `**モデル:** ${p.car.model || '未設定'}\n`;
        markdownText += `**グレード:** ${p.car.grade || '未設定'}\n`;
        markdownText += `**価格帯:** ${p.car.price || '未設定'}\n`;
        markdownText += `**提案理由:** ${p.car.reason || '情報がありません'}\n\n`;
    }
    
    // 支払方法
    if (p.payment) {
        markdownText += `## 支払方法\n\n`;
        markdownText += `**推奨方法:** ${p.payment.recommended_method || '未設定'}\n`;
        markdownText += `**シミュレーション:** ${p.payment.simulation || '支払いシミュレーション情報がありません'}\n`;
        markdownText += `**提案理由:** ${p.payment.reason || '情報がありません'}\n\n`;
    }
    
    // 購入時期
    if (p.timing) {
        markdownText += `## 購入時期\n\n`;
        markdownText += `**推奨時期:** ${p.timing.recommended_date || '未設定'}\n`;
        markdownText += `**提案理由:** ${p.timing.reason || '情報がありません'}\n\n`;
    }
    
    // 下取り
    if (p.trade_in) {
        markdownText += `## 下取り\n\n`;
        markdownText += `**現在の車:** ${p.trade_in.owned_car || '情報なし'}\n`;
        markdownText += `**査定額:** ${p.trade_in.assesment || '未設定'}\n`;
        markdownText += `**理由:** ${p.trade_in.reason || '情報がありません'}\n\n`;
    }
    
    // クリップボードにコピー
    navigator.clipboard.writeText(markdownText)
        .then(() => {
            showNotification('提案内容をマークダウン形式でコピーしました', 'success');
        })
        .catch(err => {
            console.error('クリップボードへのコピーに失敗しました', err);
            showNotification('コピーに失敗しました', 'error');
        });
} 