/**
 * 主入口文件
 * 初始化游戏并启动
 */
class Game {
    constructor() {
        this.gameEngine = null;
        this.isInitialized = false;
    }

    /**
     * 初始化游戏
     */
    async initialize() {
        try {
            console.log('正在初始化游戏...');
            
            // 创建游戏引擎
            this.gameEngine = new GameEngine();
            
            // 初始化游戏引擎
            const success = await this.gameEngine.initialize();
            
            if (success) {
                this.isInitialized = true;
                console.log('游戏初始化完成');
                this.showStartScreen();
            } else {
                throw new Error('游戏引擎初始化失败');
            }
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.showErrorMessage('游戏初始化失败，请刷新页面重试');
        }
    }

    /**
     * 显示启动界面
     */
    showStartScreen() {
        // 确保启动界面可见
        document.getElementById('start-screen').classList.add('active');
        
        // 添加启动动画
        this.addStartupAnimation();
    }

    /**
     * 添加启动动画
     */
    addStartupAnimation() {
        const title = document.querySelector('.game-title');
        const subtitle = document.querySelector('.game-subtitle');
        const description = document.querySelector('.game-description');
        const startButton = document.querySelector('.start-button');
        
        // 依次显示元素
        setTimeout(() => {
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }, 500);
        
        setTimeout(() => {
            subtitle.style.opacity = '1';
            subtitle.style.transform = 'translateY(0)';
        }, 800);
        
        setTimeout(() => {
            description.style.opacity = '1';
            description.style.transform = 'translateY(0)';
        }, 1100);
        
        setTimeout(() => {
            startButton.style.opacity = '1';
            startButton.style.transform = 'translateY(0)';
        }, 1400);
    }

    /**
     * 显示错误信息
     */
    showErrorMessage(message) {
        const startScreen = document.getElementById('start-screen');
        startScreen.innerHTML = `
            <div class="error-container">
                <h2 class="error-title">游戏加载失败</h2>
                <p class="error-message">${message}</p>
                <button class="retry-button" onclick="location.reload()">重新加载</button>
            </div>
    `;
    }

    /**
     * 显示摄像头权限错误
     */
    showCameraPermissionError() {
        const startScreen = document.getElementById('start-screen');
        startScreen.innerHTML = `
            <div class="error-container">
                <h2 class="error-title">需要摄像头权限</h2>
                <p class="error-message">此游戏需要摄像头进行手势识别。请允许摄像头权限后重新开始。</p>
                <div class="camera-instructions">
                    <h3>如何允许摄像头权限：</h3>
                    <ol>
                        <li>点击浏览器地址栏左侧的摄像头图标</li>
                        <li>选择"允许"</li>
                        <li>刷新页面重新开始游戏</li>
                    </ol>
                </div>
                <button class="retry-button" onclick="location.reload()">重新加载</button>
            </div>
    `;
    }


    /**
     * 开始游戏
     */
    async startGame() {
        if (this.isInitialized && this.gameEngine) {
            // 检查摄像头权限
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop()); // 停止测试流
                await this.gameEngine.startGame();
            } catch (error) {
                console.error('摄像头权限被拒绝:', error);
                this.showCameraPermissionError();
            }
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        if (this.gameEngine) {
            this.gameEngine.pauseGame();
        }
    }

    /**
     * 继续游戏
     */
    resumeGame() {
        if (this.gameEngine) {
            this.gameEngine.resumeGame();
        }
    }

    /**
     * 重新开始游戏
     */
    restartGame() {
        if (this.gameEngine) {
            this.gameEngine.restartGame();
        }
    }

    /**
     * 返回主菜单
     */
    returnToMenu() {
        if (this.gameEngine) {
            this.gameEngine.returnToMenu();
        }
    }
}

// 全局游戏实例
let game;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', async () => {
    console.log('页面加载完成，开始初始化游戏');
    
    // 创建游戏实例
    game = new Game();
    
    // 初始化游戏
    await game.initialize();
    
    // 设置全局事件监听器
    setupGlobalEventListeners();
});

/**
 * 设置全局事件监听器
 */
function setupGlobalEventListeners() {
    // 处理页面可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game && game.gameEngine && game.gameEngine.gameState.isPlaying) {
            game.pauseGame();
        }
    });
    
    // 处理窗口大小变化
    window.addEventListener('resize', () => {
        if (game && game.gameEngine) {
            game.gameEngine.resizeCanvas();
        }
    });
    
    // 处理页面卸载
    window.addEventListener('beforeunload', () => {
        if (game && game.gameEngine) {
            game.gameEngine.audioManager.stopBackgroundMusic();
        }
    });
    
    // 处理键盘事件
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (game && game.gameEngine && game.gameEngine.gameState.isPlaying) {
                game.pauseGame();
            }
        } else if (event.key === 'm' || event.key === 'M') {
            // 按M键切换镜像模式
            if (game && game.gameEngine) {
                game.gameEngine.toggleMirrorMode();
            }
        }
    });
}

// 导出全局函数供HTML调用
window.startGame = () => game.startGame();
window.pauseGame = () => game.pauseGame();
window.resumeGame = () => game.resumeGame();
window.restartGame = () => game.restartGame();
window.returnToMenu = () => game.returnToMenu();

// 添加CSS动画样式
const style = document.createElement('style');
style.textContent = `
    .game-title, .game-subtitle, .game-description, .start-button {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s ease-out;
    }
    
    .error-container {
        text-align: center;
        color: #ff4444;
    }
    
    .error-title {
        font-size: 2rem;
        margin-bottom: 1rem;
    }
    
    .error-message {
        font-size: 1.1rem;
        margin-bottom: 2rem;
        color: #aaa;
    }
    
    .retry-button {
        background: linear-gradient(45deg, #ff4444, #cc0000);
        border: none;
        padding: 15px 40px;
        font-size: 1.2rem;
        color: white;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
    }
    
    .retry-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 68, 68, 0.4);
    }
`;
document.head.appendChild(style);
