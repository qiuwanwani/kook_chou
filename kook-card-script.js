// ==UserScript==
// @name         78 截屏
// @namespace    http://tampermonkey.net/
// @version      7.8
// @description  78 截屏
// @author       秋晚晚吖
// @match        https://www.kookapp.cn/*
// @icon         https://img.kookapp.cn/icons/2024-12/bJPPwaraU706j06j.png
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 专区号映射
    const zoneIds = {
        '闲聊专区': '2896483261489458',
        '闲聊专区2': '7720045957209233',
        '活动专区': '5252361905010508'
    };

    // 从API获取数据并显示
    function fetchAndDisplayData(zoneName) {
        const zoneId = zoneIds[zoneName];
        if (zoneId) {
            console.log(`Kook脚本：获取${zoneName}数据，专区ID: ${zoneId}`);

            // 显示加载状态
            const printContent = document.querySelector('#print-content');
            if (printContent) {
                printContent.innerHTML = '<div class="loading">加载中...</div>';
            }

            // 构建API URL
            const apiUrl = `https://www.kookapp.cn/api/v2/messages/${zoneId}`;

            // 获取当前页面的cookie
            const cookies = document.cookie;

            // 调用API，添加credentials选项携带认证信息和更多请求头模拟浏览器环境
            fetch(apiUrl, {
                credentials: 'include', // 包含cookie等认证信息
                headers: {
                    'User-Agent': navigator.userAgent,
                    'Accept': '*/*',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': window.location.href,
                    'Authorization': cookies // 添加Authorization头，值为cookie内容
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP错误，状态码: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(`Kook脚本：获取数据成功`, data);
                    // 显示数据
                    displayApiData(data, zoneName);
                })
                .catch(error => {
                    console.error('Kook脚本：获取数据失败:', error);
                    // 显示错误信息
                    const printContent = document.querySelector('#print-content');
                    if (printContent) {
                        printContent.innerHTML = `
                            <div class="error">
                                <p>获取数据失败</p>
                                <p>错误信息: ${error.message}</p>
                            </div>
                        `;
                    }
                });
        }
    }
    // 显示API返回的数据（只显示最后一条，并展示发送者信息）
    function displayApiData(data, zoneName) {
        const printContent = document.querySelector('#print-content');
        if (!printContent) return;

        // 格式化数据显示
        let contentHTML = '';

        if (typeof data === 'object' && data !== null) {
            // 假设data是一个数组或包含消息数组的对象
            let lastItem = null;

            // 尝试获取最后一条数据
            if (Array.isArray(data)) {
                // 如果data是数组，取最后一个元素
                lastItem = data[data.length - 1];
            } else if (Array.isArray(data.items) || Array.isArray(data.messages)) {
                // 如果data是对象，检查是否有items或messages数组
                const itemsArray = data.items || data.messages;
                lastItem = itemsArray[itemsArray.length - 1];
            } else {
                // 如果不是数组，假设data本身就是单条数据
                lastItem = data;
            }

            if (lastItem) {
                // 构建用户信息展示
                contentHTML += '<div class="user-info">';

                // 检查是否有author信息
                if (lastItem.author && typeof lastItem.author === 'object') {
                    const author = lastItem.author;
                    const avatar = author.avatar ? author.avatar.replace(/`/g, '').trim() : ''; // 清理头像URL中的反引号
                    const nickname = author.nickname || author.username || '未知用户';
                    const userId = author.id; // 用户ID

                    // 显示用户头像和昵称
                    contentHTML += '<div class="user-header">';
                    if (avatar) {
                        contentHTML += `<img src="${avatar}" alt="${nickname}" class="user-avatar">`;
                    } else {
                        contentHTML += '<div class="user-avatar-placeholder"></div>';
                    }
                    contentHTML += `<div class="nickname-container">`;
                    contentHTML += `<div class="user-nickname">${nickname}</div>`;
                    contentHTML += `<button class="copy-nickname-btn" data-nickname="${nickname}">复制</button>`;
                    contentHTML += `</div>`;
                    contentHTML += '</div>';
                } else {
                    contentHTML += '<div class="user-header">';
                contentHTML += '<div class="user-avatar-placeholder"></div>';
                contentHTML += '<div class="user-nickname">未知用户</div>';
                contentHTML += '</div>';
                }

                // 显示消息内容（添加长度限制和省略功能）
                if (lastItem.content) {
                    const maxLength = 12; // 设置最大显示长度
                    const content = lastItem.content;
                    const truncatedContent = content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
                    contentHTML += `<div class="message-content">消息内容: ${truncatedContent}</div>`;
                }

                // 显示发送时间
                if (lastItem.create_at) {
                    const timestamp = lastItem.create_at;
                    const date = new Date(timestamp);
                    const formattedDate = date.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                    contentHTML += `<div class="message-time">发送时间: ${formattedDate}</div>`;
                }

                contentHTML += '</div>';

                // 不再显示完整数据的JSON预览
            } else {
                contentHTML += '<p>没有找到数据</p>';
            }
        } else {
            contentHTML += `<p>返回数据类型: ${typeof data}</p>`;
            contentHTML += `<p>数据内容: ${data}</p>`;
        }

        printContent.innerHTML = contentHTML;

        // 添加复制昵称按钮的点击事件
        const copyButtons = printContent.querySelectorAll('.copy-nickname-btn');
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const nickname = this.getAttribute('data-nickname');
                const originalText = this.textContent;

                // 使用现代的剪贴板API复制文本
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(nickname).then(() => {
                        // 按钮显示已复制状态
                        this.textContent = '已复制';
                        this.classList.add('copied');
                        // 2秒后恢复
                        setTimeout(() => {
                            this.textContent = originalText;
                            this.classList.remove('copied');
                        }, 2000);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                } else {
                    // 降级方案：使用传统的方法复制文本
                    const textArea = document.createElement('textarea');
                    textArea.value = nickname;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();

                    try {
                        document.execCommand('copy');
                        // 按钮显示已复制状态
                        this.textContent = '已复制';
                        this.classList.add('copied');
                        // 2秒后恢复
                        setTimeout(() => {
                            this.textContent = originalText;
                            this.classList.remove('copied');
                        }, 2000);
                    } catch (err) {
                        console.error('复制失败:', err);
                    } finally {
                        document.body.removeChild(textArea);
                    }
                }
            });
        });

        // 移除了全局提示框函数，改为按钮自身显示复制状态
    }

    // 创建并显示卡片
    function createAndShowCard() {
        console.log('Kook脚本：开始创建卡片');

        // 检查是否是指定的URL
        const targetUrl = 'https://www.kookapp.cn/app/channels/3981628548806694';
        if (!window.location.href.includes(targetUrl)) {
            console.log('Kook脚本：当前URL不符合条件，不显示卡片');
            // 移除已存在的卡片（如果有）
            const existingCard = document.getElementById('kook-script-card');
            if (existingCard) {
                existingCard.remove();
            }
            return;
        }

        // 检查body是否存在
        if (!document.body) {
            console.log('Kook脚本：body尚未加载，等待重试');
            setTimeout(createAndShowCard, 500);
            return;
        }

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #kook-script-card {
                position: fixed;
                bottom: 20px;
                right: 20px;
                min-width: 350px;
                max-width: 500px;
                max-height: 70vh;
                background: #2d2d2d;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                padding: 20px;
                z-index: 999999;
                border: 1px solid #444;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow-y: auto;
                transition: all 0.3s ease;
                color: #e0e0e0;
            }

            #kook-script-card .minimize-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: #444;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #ccc;
                transition: all 0.3s ease;
            }

            #kook-script-card .minimize-btn:hover {
                background: #555;
                color: #fff;
            }

            #kook-script-card.minimized {
                width: 60px;
                height: 60px;
                min-width: 0;
                padding: 0;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }

            #kook-script-card.minimized .card-content {
                display: none;
            }

            #kook-script-card.minimized {
                background: transparent;
                border: none;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            #kook-script-card.minimized .minimize-btn {
                top: 0;
                left: 0;
                transform: none;
                width: 100%;
                height: 100%;
                border: none;
                background: transparent;
                cursor: pointer;
                padding: 0;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0;
            }

            #kook-script-card.minimized .minimize-btn img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                border-radius: 50%;
            }

            #kook-script-card .print-section h3 {
                margin-top: 0;
                margin-bottom: 12px;
                color: #e0e0e0;
                font-size: 18px;
            }

            #kook-script-card .print-content {
                margin: 8px 0;
                color: #e0e0e0;
                font-size: 14px;
                line-height: 1.5;
                padding: 10px;
                background-color: #383838;
                border-radius: 4px;
                min-height: 150px;
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid #444;
            }

            #kook-script-card .user-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }

            #kook-script-card .user-avatar {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                margin-right: 12px;
                object-fit: cover;
                border: 2px solid #e8e8e8;
            }

            #kook-script-card .user-avatar-placeholder {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                margin-right: 12px;
                background-color: #444;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #bbb;
                font-weight: bold;
            }

            #kook-script-card .nickname-container {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            #kook-script-card .user-nickname {
                font-size: 16px;
                font-weight: 600;
                color: #fff;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            #kook-script-card .copy-nickname-btn {
                background-color: #4a4a4a;
                color: #e0e0e0;
                border: 1px solid #555;
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            #kook-script-card .copy-nickname-btn:hover {
                background-color: #5a5a5a;
                border-color: #666;
            }

            #kook-script-card .copy-nickname-btn:active {
                background-color: #3a3a3a;
            }

            #kook-script-card .copy-nickname-btn.copied {
                background-color: #36d399;
                color: #000;
                border-color: #28b485;
                font-weight: 500;
                transition: all 0.2s ease;
            }

            #kook-script-card .copy-nickname-btn.copied:hover {
                background-color: #28b485;
                border-color: #1e9e74;
            }

            /* 移除私信按钮样式 */

            #kook-script-card .message-content {
                padding: 8px 0;
                border-top: 1px solid #444;
                border-bottom: 1px solid #444;
                margin: 8px 0;
                color: #d0d0d0;
            }

            #kook-script-card .message-time {
                font-size: 12px;
                color: #aaa;
                margin-top: 8px;
            }

            /* 已移除JSON切换按钮相关样式 */

            #kook-script-card .print-content pre {
                background-color: #444;
                border-radius: 3px;
                padding: 12px;
                overflow-x: auto;
                white-space: pre-wrap;
                word-break: break-word;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.4;
                margin: 10px 0 0 0;
                color: #e0e0e0;
            }

            #kook-script-card .print-content h4 {
                margin: 0 0 10px 0;
                color: #e0e0e0;
                font-size: 16px;
            }

            #kook-script-card .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 80px;
                color: #bbb;
            }

            #kook-script-card .welcome {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 80px;
                color: #aaa;
                font-style: italic;
            }

            #kook-script-card .error {
                color: #f36;
                padding: 10px;
                background-color: rgba(247, 66, 102, 0.1);
                border-radius: 4px;
                border: 1px solid rgba(247, 66, 102, 0.2);
            }

            #kook-script-card .success {
                color: #36d399;
                padding: 10px;
                background-color: rgba(54, 211, 153, 0.1);
                border-radius: 4px;
                border: 1px solid rgba(54, 211, 153, 0.2);
            }

            #kook-script-card .click-hint {
                font-size: 12px;
                color: #aaa;
                margin-top: 8px;
                font-style: italic;
            }

            #kook-script-card .card-content {
                padding: 0;
            }

            #kook-script-card .quick-access-section {
                padding: 15px;
                border-bottom: 1px solid #444;
            }

            #kook-script-card .print-section {
                background-color: #333;
            }

            #kook-script-card .zone-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 15px;
            }

            #kook-script-card .zone-button {
                background: #4a4a4a;
                color: #e0e0e0;
                border: 1px solid #555;
                border-radius: 6px;
                padding: 12px 16px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            #kook-script-card .zone-button:hover {
                transform: translateY(-2px);
                background: #5a5a5a;
                border-color: #666;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            #kook-script-card .zone-button:active {
                transform: translateY(0);
                background: #3a3a3a;
            }

            #kook-script-card .zone-button:nth-child(2) {
                background: #4a4a4a;
            }

            #kook-script-card .zone-button:nth-child(2):hover {
                background: #5a5a5a;
            }

            #kook-script-card .zone-button:nth-child(3) {
                background: #4a4a4a;
            }

            #kook-script-card .zone-button:nth-child(3):hover {
                background: #5a5a5a;
            }
        `;

        // 检查样式是否已存在，避免重复添加
        if (!document.querySelector('style[data-kook-script]')) {
            style.setAttribute('data-kook-script', 'true');
            document.head.appendChild(style);
        }

        // 检查卡片是否已存在，如果存在则更新内容
        let card = document.getElementById('kook-script-card');
        let isMinimized = true; // 默认设置为最小化状态

        if (card) {
            console.log('Kook脚本：更新现有卡片');
            isMinimized = card.classList.contains('minimized');
        } else {
            console.log('Kook脚本：创建新卡片');
            card = document.createElement('div');
            card.id = 'kook-script-card';
            card.classList.add('minimized'); // 默认添加最小化类
        }

        // 设置卡片内容
        let cardHTML = `
            <div class="card-content">
                <!-- 第一部分：快速访问按钮 -->
                <div class="quick-access-section">
                    <div class="zone-buttons">
                        ${Object.keys(zoneIds).map(zoneName => `
                            <button class="zone-button" data-zone="${zoneName}">${zoneName}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- 第二部分：打印内容区域 -->
                <div class="print-section">
                    <div id="print-content" class="print-content">
                        <div class="welcome">点击上方按钮查看</div>
                    </div>
                </div>
            </div>
        `;

        card.innerHTML = cardHTML;

        // 绑定按钮事件
        const buttons = card.querySelectorAll('.zone-button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                fetchAndDisplayData(this.textContent);
            });
        });

        // 初始化打印区域
        const printContent = card.querySelector('#print-content');
        if (printContent) {
            printContent.innerHTML = '<div class="welcome">点击上方按钮查看</div>';
        }

        // 创建最小化按钮
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'minimize-btn';

        // 存储自动缩小计时器ID
        let autoMinimizeTimer = null;

        // 根据初始状态设置按钮内容
        if (isMinimized) {
            // 默认最小化状态显示图片
            minimizeBtn.textContent = '';
            const img = document.createElement('img');
            img.src = "https://img.kookapp.cn/icons/2024-12/bJPPwaraU706j06j.png";
            img.alt = "Kook快速访问";
            minimizeBtn.appendChild(img);
        } else {
            // 非最小化状态显示减号
            minimizeBtn.textContent = '-';
            // 初始非最小化状态也启动计时器
            startAutoMinimizeTimer();
        }

        // 启动自动缩小计时器函数
        function startAutoMinimizeTimer() {
            // 清除可能存在的旧计时器
            if (autoMinimizeTimer) {
                clearTimeout(autoMinimizeTimer);
            }
            // 设置新的计时器，60秒后自动缩小
            autoMinimizeTimer = setTimeout(function() {
                const cardElement = document.getElementById('kook-script-card');
                if (!cardElement.classList.contains('minimized')) {
                    // 自动最小化卡片
                    cardElement.classList.add('minimized');
                    // 更新按钮内容
                    minimizeBtn.textContent = '';
                    const img = document.createElement('img');
                    img.src = "https://img.kookapp.cn/icons/2024-12/bJPPwaraU706j06j.png";
                    img.alt = "Kook快速访问";
                    minimizeBtn.appendChild(img);
                    console.log('Kook脚本：卡片已自动缩小（展开超过一分钟）');
                }
            }, 60000); // 60000毫秒 = 1分钟
        }

        minimizeBtn.addEventListener('click', function() {
            const cardElement = document.getElementById('kook-script-card');
            if (cardElement.classList.contains('minimized')) {
                // 还原卡片
                cardElement.classList.remove('minimized');
                // 移除图片元素
                const img = this.querySelector('img');
                if (img) img.remove();
                this.textContent = '-';
                // 启动自动缩小计时器
                startAutoMinimizeTimer();
            } else {
                // 最小化卡片
                cardElement.classList.add('minimized');
                // 清空内容并添加图片元素
                this.textContent = '';
                const img = document.createElement('img');
                img.src = "https://img.kookapp.cn/icons/2024-12/bJPPwaraU706j06j.png";
                img.alt = "Kook快速访问";
                this.appendChild(img);
                // 清除计时器
                if (autoMinimizeTimer) {
                    clearTimeout(autoMinimizeTimer);
                    autoMinimizeTimer = null;
                }
            }
        });

        // 添加最小化按钮
        card.appendChild(minimizeBtn);

        // 恢复最小化状态
        if (isMinimized) {
            card.classList.add('minimized');
            minimizeBtn.textContent = '';
            const img = document.createElement('img');
            img.src = "https://img.kookapp.cn/icons/2024-12/bJPPwaraU706j06j.png";
            img.alt = "Kook快速访问";
            minimizeBtn.appendChild(img);
        }

        // 添加到页面中（如果是新卡片）
        if (!document.getElementById('kook-script-card')) {
            document.body.appendChild(card);
        }

        console.log('Kook脚本：卡片创建/更新成功');
    }

    // 使用多种方式确保卡片能显示
    function init() {
        console.log('Kook脚本：初始化');
        console.log('当前URL:', window.location.href);

        // 立即尝试创建（DOMContentLoaded可能已经触发）
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                console.log('Kook脚本：DOMContentLoaded触发');
                createAndShowCard();
            });
        } else {
            console.log('Kook脚本：DOM已加载，直接创建');
            createAndShowCard();
        }

        // 同时也监听load事件作为备份
        window.addEventListener('load', function() {
            console.log('Kook脚本：load事件触发');
            createAndShowCard();
        });

        // 最后添加一个延迟创建作为保障
        setTimeout(function() {
            console.log('Kook脚本：延迟创建触发');
            createAndShowCard();
        }, 2000);
    }

    // 直接调用初始化函数
    init();

})();
