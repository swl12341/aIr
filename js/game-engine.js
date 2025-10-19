/**
 * 游戏引擎核心
 * 管理游戏状态、场景切换和游戏逻辑
 */
class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gestureRecognition = null;
        this.particleSystem = null;
        this.audioManager = null;
        
        this.gameState = {
            currentScene: 'start',
            isPlaying: false,
            isPaused: false,
            score: 0,
            time: 0,
            energy: 100,
            progress: 0
        };
        
        this.scenes = {
            start: 'start-screen',
            game: 'game-screen',
            result: 'result-screen',
            pause: 'pause-screen'
        };
        
        this.gamePhases = [
            'engine_start',
            'avoid_asteroids', 
            'energy_gathering',
            'beacon_launch',
            'earth_rebirth'
        ];
        
        this.currentPhase = 0;
        this.phaseStartTime = 0;
        this.asteroids = [];
        this.asteroidSpawnRate = 0.02;
        this.playerPosition = { x: 0, y: 0 };
        this.spaceshipPosition = { x: 0, y: 0 }; // 飞船位置缓存
        this.difficultyLevel = 1;
        this.mirrorMode = true; // 镜像模式：true=方向一致，false=直接映射
        this.phaseTimeouts = {
            'engine_start': 10000,      // 10秒启动飞船
            'avoid_asteroids': 30000,   // 30秒避开陨石
            'energy_gathering': 20000,  // 20秒汇聚能量
            'beacon_launch': 10000      // 10秒发射信标
        };
        
        this.callbacks = {
            onPhaseComplete: null,
            onGameComplete: null
        };
    }

    /**
     * 初始化游戏引擎
     */
    async initialize() {
        try {
            // 获取画布和上下文
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            // 设置画布尺寸
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // 初始化各个系统
            this.gestureRecognition = new GestureRecognition();
            this.particleSystem = new ParticleSystem(document.getElementById('particles-container'));
            this.audioManager = new AudioManager();
            
            // 初始化各个系统
            await this.gestureRecognition.initialize();
            await this.audioManager.initialize();
            
            // 设置手势识别回调
            this.gestureRecognition.setGestureCallback((hands) => {
                this.handleGestureInput(hands);
            });
            
            this.gestureRecognition.setPoseCallback((pose) => {
                this.handlePoseInput(pose);
            });
            
            // 创建星空背景
            this.particleSystem.createStarField();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            console.log('游戏引擎初始化成功');
            return true;
        } catch (error) {
            console.error('游戏引擎初始化失败:', error);
            return false;
        }
    }

    /**
     * 设置画布尺寸
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 开始按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // 重新开始按钮
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 暂停/继续按钮
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        // 返回主菜单按钮
        document.getElementById('main-menu-btn').addEventListener('click', () => {
            this.returnToMenu();
        });
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.gameState.isPlaying) {
                    this.pauseGame();
                } else if (this.gameState.isPaused) {
                    this.resumeGame();
                }
            }
        });
    }

    /**
     * 开始游戏
     */
    async startGame() {
        this.switchScene('game');
        this.gameState.isPlaying = true;
        this.gameState.isPaused = false;
        this.gameState.time = 0;
        this.gameState.score = 0;
        this.gameState.energy = 100;
        this.gameState.progress = 0;
        this.currentPhase = 0;
        
        // 启动摄像头和手势识别
        try {
            await this.gestureRecognition.start();
            console.log('摄像头和手势识别已启动');
        } catch (error) {
            console.error('摄像头启动失败:', error);
            this.showCameraError();
            return;
        }
        
        this.startCurrentPhase();
        this.gameLoop();
        this.audioManager.playBackgroundMusic();
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        this.gameState.isPaused = true;
        this.switchScene('pause');
    }

    /**
     * 继续游戏
     */
    resumeGame() {
        this.gameState.isPaused = false;
        this.switchScene('game');
    }

    /**
     * 重新开始游戏
     */
    restartGame() {
        this.startGame();
    }

    /**
     * 返回主菜单
     */
    returnToMenu() {
        this.gameState.isPlaying = false;
        this.gameState.isPaused = false;
        this.switchScene('start');
        this.audioManager.stopBackgroundMusic();
    }

    /**
     * 切换场景
     */
    switchScene(sceneName) {
        // 隐藏所有场景
        Object.values(this.scenes).forEach(sceneId => {
            document.getElementById(sceneId).classList.remove('active');
        });
        
        // 显示目标场景
        document.getElementById(this.scenes[sceneName]).classList.add('active');
        this.gameState.currentScene = sceneName;
    }

    /**
     * 开始当前阶段
     */
    startCurrentPhase() {
        this.phaseStartTime = Date.now();
        const phase = this.gamePhases[this.currentPhase];
        
        console.log(`开始阶段: ${phase}, 当前飞船位置: X:${this.spaceshipPosition.x}, Y:${this.spaceshipPosition.y}`);
        
        switch (phase) {
            case 'engine_start':
                this.updatePrompt('请将手伸向屏幕启动飞船');
                break;
            case 'avoid_asteroids':
                this.updatePrompt('移动右手食指指尖控制飞船位置，避开陨石！');
                // 只在飞船位置完全无效时才初始化到屏幕中央
                if (!this.spaceshipPosition.x || this.spaceshipPosition.x === 0) {
                    this.spaceshipPosition = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
                    this.playerPosition = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
                    console.log('避开陨石阶段：初始化飞船位置');
                } else {
                    console.log(`避开陨石阶段：保持飞船位置 X:${this.spaceshipPosition.x}, Y:${this.spaceshipPosition.y}`);
                }
                this.startAsteroidField();
                break;
            case 'energy_gathering':
                this.updatePrompt('将双手合并汇聚能量');
                break;
            case 'beacon_launch':
                this.updatePrompt('上举手臂发射信标');
                break;
            case 'earth_rebirth':
                this.updatePrompt('任务完成，地球重生');
                this.completeGame();
                break;
        }
    }

    /**
     * 处理手势输入
     */
    handleGestureInput(hands) {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        const phase = this.gamePhases[this.currentPhase];
        
        // 更新手部检测状态
        this.updateHandDetectionStatus(hands.length);
        
        // 添加调试信息
        console.log(`手势输入: 检测到${hands.length}只手, 当前阶段: ${phase}`);
        
        switch (phase) {
            case 'engine_start':
                if (hands.length > 0) {
                    const gesture = this.gestureRecognition.detectGesture(hands[0]);
                    console.log('引擎启动阶段手势分析:', gesture);
                    if (gesture && gesture.isPointing) {
                        console.log('检测到指向手势，完成引擎启动');
                        this.completePhase();
                    }
                } else {
                    console.log('引擎启动阶段：未检测到手部');
                }
                break;
                
            case 'energy_gathering':
                if (hands.length >= 2) {
                    const handsTogether = this.gestureRecognition.detectHandsTogether(hands);
                    console.log('能量汇聚阶段双手合并检测:', handsTogether);
                    if (handsTogether) {
                        this.gatherEnergy();
                    }
                } else {
                    console.log('能量汇聚阶段：需要两只手');
                }
                break;
                
            case 'beacon_launch':
                if (hands.length > 0) {
                    const gesture = this.gestureRecognition.detectGesture(hands[0]);
                    console.log('信标发射阶段手势分析:', gesture);
                    if (gesture && gesture.isPointing) {
                        console.log('检测到指向手势，发射信标');
                        this.launchBeacon();
                    }
                } else {
                    console.log('信标发射阶段：未检测到手部');
                }
                break;
        }
    }

    /**
     * 处理姿态输入
     */
    handlePoseInput(pose) {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        const phase = this.gamePhases[this.currentPhase];
        
        // 更新姿态检测状态
        this.updatePoseDetectionStatus(pose);
        
        // 获取当前检测到的手部数据
        const currentHands = this.gestureRecognition.currentGestures.hands;
        
        // 使用食指指尖位置（更精确的控制）
        const rightIndexPosition = this.gestureRecognition.detectRightIndexFinger(currentHands, pose);
        
        // 只在检测到有效位置时更新玩家位置
        if (rightIndexPosition && rightIndexPosition.x !== 0.5 && rightIndexPosition.y !== 0.5) {
            this.updatePlayerPosition(rightIndexPosition);
            
            if (phase === 'avoid_asteroids') {
                // 安全地更新右手状态，避免DOM错误
                try {
                    this.updateRightHandStatus(pose);
                } catch (error) {
                    console.warn('更新右手状态时出错:', error);
                }
            }
        } else {
            // 没有检测到右手食指时，飞船保持静止（不更新位置）
            console.log('未检测到右手食指指尖，飞船保持静止');
        }
    }

    /**
     * 更新手部检测状态
     */
    updateHandDetectionStatus(handCount) {
        const handDetectionElement = document.getElementById('hand-detection');
        if (handCount > 0) {
            handDetectionElement.textContent = `手部检测: 检测到${handCount}只手`;
            handDetectionElement.className = 'detected';
        } else {
            handDetectionElement.textContent = '手部检测: 未检测到';
            handDetectionElement.className = 'not-detected';
        }
    }

    /**
     * 更新姿态检测状态
     */
    updatePoseDetectionStatus(pose) {
        const poseDetectionElement = document.getElementById('pose-detection');
        if (pose && pose.length > 0) {
            poseDetectionElement.textContent = '姿态检测: 已检测到';
            poseDetectionElement.className = 'detected';
        } else {
            poseDetectionElement.textContent = '姿态检测: 未检测到';
            poseDetectionElement.className = 'not-detected';
        }
    }

    /**
     * 更新玩家位置
     */
    updatePlayerPosition(position) {
        let canvasX, canvasY;
        
        if (this.mirrorMode) {
            // 镜像模式：修正X轴方向，使食指向右移动时飞船向右移动
            // 食指向右 -> 飞船向右（直观映射）
            // 食指向左 -> 飞船向左
            // 食指向上 -> 飞船向上
            // 食指向下 -> 飞船向下
            canvasX = Math.max(30, Math.min(this.canvas.width - 30, position.x * this.canvas.width));
            canvasY = Math.max(30, Math.min(this.canvas.height - 30, position.y * this.canvas.height));
        } else {
            // 直接映射模式：修正X轴方向，使食指向右移动时飞船向右移动
            // 使用 (1 - position.x) 来翻转X轴方向
            canvasX = Math.max(30, Math.min(this.canvas.width - 30, (1 - position.x) * this.canvas.width));
            canvasY = Math.max(30, Math.min(this.canvas.height - 30, position.y * this.canvas.height));
        }
        
        // 更新玩家位置（用于碰撞检测和飞船渲染）
        this.playerPosition = { x: canvasX, y: canvasY };
        
        // 调试信息：显示映射关系
        if (Math.floor(this.gameState.time * 10) % 30 === 0) {
            console.log(`食指位置映射: 相机(${position.x.toFixed(3)}, ${position.y.toFixed(3)}) -> 飞船(${canvasX.toFixed(1)}, ${canvasY.toFixed(1)}) [镜像模式: ${this.mirrorMode}]`);
        }
        
        // 检查与陨石的碰撞
        this.checkAsteroidCollisions(this.playerPosition);
        
        // 调试信息 - 减少输出频率
        if (Math.floor(this.gameState.time * 10) % 30 === 0) {
            console.log(`玩家位置更新: 相机坐标(${position.x.toFixed(3)}, ${position.y.toFixed(3)}) -> 游戏坐标(${canvasX.toFixed(1)}, ${canvasY.toFixed(1)}), 镜像模式: ${this.mirrorMode}, 阶段: ${this.gamePhases[this.currentPhase]}`);
        }
    }

    /**
     * 检查陨石碰撞
     */
    checkAsteroidCollisions(position) {
        const playerRadius = 30;
        
        this.asteroids.forEach((asteroid, index) => {
            const distance = Math.sqrt(
                Math.pow(asteroid.x - position.x, 2) + 
                Math.pow(asteroid.y - position.y, 2)
            );
            
            if (distance < playerRadius + asteroid.size) {
                // 碰撞发生
                this.handleCollision(asteroid);
                this.asteroids.splice(index, 1);
            }
        });
    }

    /**
     * 处理碰撞
     */
    handleCollision(asteroid) {
        this.gameState.energy -= 10;
        this.audioManager.playCollision();
        this.particleSystem.createExplosionEffect(asteroid.x, asteroid.y);
        
        if (this.gameState.energy <= 0) {
            this.gameOver();
        }
    }

    /**
     * 开始陨石场
     */
    startAsteroidField() {
        this.asteroids = [];
        this.asteroidSpawnRate = 0.02;
        
        // 只在飞船位置完全无效时才重置到屏幕中央
        if (!this.playerPosition || this.playerPosition.x === 0) {
            this.playerPosition = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
            this.spaceshipPosition = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
            console.log('避开陨石阶段：初始化飞船位置到屏幕中央');
        } else {
            // 保持飞船当前位置，不重置
            console.log(`陨石场开始 - 保持飞船位置: X:${this.spaceshipPosition.x}, Y:${this.spaceshipPosition.y}`);
        }
        
        // 只在飞船位置完全无效时才强制设置
        if (!this.spaceshipPosition.x || this.spaceshipPosition.x === 0) {
            this.spaceshipPosition = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
            this.playerPosition = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
            console.log('陨石场开始：强制设置飞船位置');
        }
    }

    /**
     * 更新陨石
     */
    updateAsteroids() {
        // 生成新陨石
        if (Math.random() < this.asteroidSpawnRate) {
            this.createAsteroid();
        }
        
        // 更新现有陨石
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            asteroid.rotation += asteroid.rotationSpeed;
        });
        
        // 移除屏幕外的陨石
        this.asteroids = this.asteroids.filter(asteroid => 
            asteroid.x > -50 && asteroid.x < this.canvas.width + 50 &&
            asteroid.y > -50 && asteroid.y < this.canvas.height + 50
        );
        
        // 调试信息：检查陨石状态
        if (Math.floor(this.gameState.time * 10) % 60 === 0 && this.asteroids.length > 0) {
            const firstAsteroid = this.asteroids[0];
            console.log(`陨石状态: 数量=${this.asteroids.length}, 第一个陨石位置=(${firstAsteroid.x.toFixed(1)}, ${firstAsteroid.y.toFixed(1)}), 速度=(${firstAsteroid.vx.toFixed(2)}, ${firstAsteroid.vy.toFixed(2)})`);
        }
    }

    /**
     * 创建陨石
     */
    createAsteroid() {
        const side = Math.floor(Math.random() * 4);
        let x, y, vx, vy;
        
        // 根据难度等级调整陨石速度
        const baseSpeed = 2;
        const speedMultiplier = 1 + (this.difficultyLevel - 1) * 0.3; // 每级增加30%速度
        const minSpeed = baseSpeed * speedMultiplier;
        const maxSpeed = (baseSpeed + 3) * speedMultiplier;
        
        switch (side) {
            case 0: // 从左边进入
                x = -50;
                y = Math.random() * this.canvas.height;
                vx = minSpeed + Math.random() * (maxSpeed - minSpeed);
                vy = (Math.random() - 0.5) * 2 * speedMultiplier;
                break;
            case 1: // 从右边进入
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                vx = -(minSpeed + Math.random() * (maxSpeed - minSpeed));
                vy = (Math.random() - 0.5) * 2 * speedMultiplier;
                break;
            case 2: // 从上方进入
                x = Math.random() * this.canvas.width;
                y = -50;
                vx = (Math.random() - 0.5) * 2 * speedMultiplier;
                vy = minSpeed + Math.random() * (maxSpeed - minSpeed);
                break;
            case 3: // 从下方进入
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                vx = (Math.random() - 0.5) * 2 * speedMultiplier;
                vy = -(minSpeed + Math.random() * (maxSpeed - minSpeed));
                break;
        }
        
        this.asteroids.push({
            x, y, vx, vy,
            size: 20 + Math.random() * 30,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1 * speedMultiplier,
            color: `hsl(${Math.random() * 60 + 20}, 70%, 50%)`
        });
        
        // 调试信息
        if (Math.floor(this.gameState.time * 10) % 30 === 0) {
            console.log(`创建陨石: 难度=${this.difficultyLevel}, 速度倍数=${speedMultiplier.toFixed(2)}, 速度=(${vx.toFixed(2)}, ${vy.toFixed(2)})`);
        }
    }


    /**
     * 汇聚能量
     */
    gatherEnergy() {
        this.gameState.energy = Math.min(100, this.gameState.energy + 1);
        this.particleSystem.createEnergyEffect(
            this.canvas.width / 2, 
            this.canvas.height / 2, 
            this.gameState.energy / 100
        );
        this.audioManager.playEnergyGathering();
    }

    /**
     * 发射信标
     */
    launchBeacon() {
        this.particleSystem.createBeaconEffect(
            this.canvas.width / 2, 
            this.canvas.height / 2
        );
        this.audioManager.playBeaconLaunch();
        this.completePhase();
    }

    /**
     * 完成当前阶段
     */
    completePhase() {
        // 保存当前飞船位置，避免在关卡升级时丢失
        const savedSpaceshipPosition = { 
            x: this.spaceshipPosition.x, 
            y: this.spaceshipPosition.y 
        };
        const savedPlayerPosition = { 
            x: this.playerPosition.x, 
            y: this.playerPosition.y 
        };
        
        // 增加分数
        this.gameState.score += 100 * this.difficultyLevel;
        
        this.currentPhase++;
        this.gameState.progress = (this.currentPhase / this.gamePhases.length) * 100;
        
        if (this.currentPhase >= this.gamePhases.length) {
            this.completeGame();
        } else {
            // 增加难度
            this.increaseDifficulty();
            
            // 恢复飞船位置，避免重置到中心
            if (savedSpaceshipPosition.x > 0 && savedSpaceshipPosition.y > 0) {
                this.spaceshipPosition = savedSpaceshipPosition;
                this.playerPosition = savedPlayerPosition;
                console.log(`关卡升级：保持飞船位置 X:${savedSpaceshipPosition.x}, Y:${savedSpaceshipPosition.y}`);
            }
            
            this.startCurrentPhase();
        }
        
        if (this.callbacks.onPhaseComplete) {
            this.callbacks.onPhaseComplete(this.currentPhase - 1);
        }
    }

    /**
     * 增加难度
     */
    increaseDifficulty() {
        this.difficultyLevel++;
        
        // 增加陨石生成率（每级增加20%）
        this.asteroidSpawnRate = Math.min(0.15, this.asteroidSpawnRate * 1.2);
        
        // 不修改阶段超时时间，保持原有时间
        // Object.keys(this.phaseTimeouts).forEach(phase => {
        //     this.phaseTimeouts[phase] = Math.max(5000, this.phaseTimeouts[phase] * 0.9);
        // });
        
        console.log(`难度提升到等级 ${this.difficultyLevel}，陨石生成率: ${this.asteroidSpawnRate.toFixed(3)}`);
    }

    /**
     * 完成游戏
     */
    completeGame() {
        this.gameState.isPlaying = false;
        this.audioManager.playSuccess();
        this.audioManager.stopBackgroundMusic();
        
        // 显示结果界面
        setTimeout(() => {
            this.switchScene('result');
            this.updateResultStats();
        }, 2000);
        
        if (this.callbacks.onGameComplete) {
            this.callbacks.onGameComplete();
        }
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.gameState.isPlaying = false;
        this.audioManager.stopBackgroundMusic();
        this.switchScene('result');
    }


    /**
     * 更新右手位置显示
     */
    updateRightHandStatus(pose) {
        if (pose && this.gamePhases[this.currentPhase] === 'avoid_asteroids') {
            const rightHandPos = this.gestureRecognition.detectRightHandPosition(pose);
            // 简化处理：只输出到控制台，避免DOM操作错误
            if (Math.floor(this.gameState.time * 10) % 30 === 0) {
                console.log(`右手位置: X:${rightHandPos.x.toFixed(2)}, Y:${rightHandPos.y.toFixed(2)}`);
            }
        }
    }

    /**
     * 显示摄像头错误
     */
    showCameraError() {
        this.updatePrompt('摄像头无法访问，请检查权限设置');
        setTimeout(() => {
            this.returnToMenu();
        }, 3000);
    }

    /**
     * 切换镜像模式
     */
    toggleMirrorMode() {
        this.mirrorMode = !this.mirrorMode;
        console.log(`镜像模式切换为: ${this.mirrorMode ? '开启' : '关闭'}`);
        
        // 更新提示信息
        if (this.mirrorMode) {
            this.updatePrompt('✅ 镜像模式：食指向右移动时飞船向右移动');
        } else {
            this.updatePrompt('📐 直接映射模式：食指向右移动时飞船向右移动');
        }
        
        // 3秒后恢复原来的提示
        setTimeout(() => {
            if (this.gamePhases[this.currentPhase] === 'avoid_asteroids') {
                this.updatePrompt('移动右手食指指尖控制飞船位置，避开陨石！');
            }
        }, 3000);
    }

    /**
     * 更新提示文本
     */
    updatePrompt(text) {
        document.getElementById('prompt-text').textContent = text;
    }

    /**
     * 更新结果统计
     */
    updateResultStats() {
        document.getElementById('final-time').textContent = this.formatTime(this.gameState.time);
        document.getElementById('energy-efficiency').textContent = `${this.gameState.energy}%`;
    }

    /**
     * 格式化时间
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;
        
        // 更新游戏状态
        this.updateGameState();
        
        // 渲染游戏
        this.render();
        
        // 确保手势识别继续工作
        if (this.gestureRecognition) {
            this.gestureRecognition.processVideo();
        }
        
        // 注意：姿态输入处理由手势识别模块自动调用，不需要强制处理
        
        // 调试信息：显示当前游戏阶段
        if (this.gameState.time % 60 === 0) { // 每秒输出一次
            console.log(`当前游戏阶段: ${this.gamePhases[this.currentPhase]}, 时间: ${this.gameState.time.toFixed(1)}s, 陨石数量: ${this.asteroids.length}, 难度: ${this.difficultyLevel}`);
        }
        
        // 继续循环
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 更新游戏状态
     */
    updateGameState() {
        this.gameState.time += 1/60; // 假设60FPS
        
        // 检查阶段超时
        this.checkPhaseTimeout();
        
        // 更新HUD
        document.getElementById('timer').textContent = this.formatTime(this.gameState.time);
        document.getElementById('energy-fill').style.width = `${this.gameState.energy}%`;
        document.getElementById('progress-fill').style.width = `${this.gameState.progress}%`;
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('difficulty').textContent = this.difficultyLevel;
        
        // 更新镜像模式状态显示
        const mirrorStatus = document.getElementById('mirror-status');
        if (mirrorStatus) {
            mirrorStatus.textContent = this.mirrorMode ? '✅ 镜像' : '📐 直接';
            mirrorStatus.title = this.mirrorMode ? '镜像模式：方向一致' : '直接映射模式';
        }
        
        // 更新陨石 - 在避开陨石阶段和能量汇聚阶段都更新陨石
        if (this.gamePhases[this.currentPhase] === 'avoid_asteroids' || this.gamePhases[this.currentPhase] === 'energy_gathering') {
            this.updateAsteroids();
        }
        
        // 更新粒子系统
        this.particleSystem.update();
    }

    /**
     * 检查阶段超时
     */
    checkPhaseTimeout() {
        const currentPhase = this.gamePhases[this.currentPhase];
        const timeout = this.phaseTimeouts[currentPhase];
        
        if (timeout && (Date.now() - this.phaseStartTime) > timeout) {
            // 阶段超时，减少能量
            this.gameState.energy -= 20;
            this.audioManager.playCollision();
            
            if (this.gameState.energy <= 0) {
                this.gameOver();
            } else {
                // 继续下一个阶段
                this.completePhase();
            }
        }
    }

    /**
     * 渲染游戏
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = 'rgba(0, 0, 17, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染粒子效果
        this.particleSystem.render(this.canvas, this.ctx);
        
        // 渲染游戏背景
        this.renderBackground();
        
        // 渲染飞船
        this.renderSpaceship();
        
        // 渲染陨石
        this.renderAsteroids();
        
        // 渲染玩家指示器
        this.renderPlayerIndicator();
        
        // 渲染位置映射指示器
        this.renderPositionMapping();
        
        // 渲染飞船位置测试指示器
        this.renderSpaceshipTestIndicator();
        
        // 渲染能量球
        this.renderEnergyBall();
    }

    /**
     * 渲染陨石
     */
    renderAsteroids() {
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            // 绘制陨石阴影
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            // 绘制陨石主体
            const gradient = this.ctx.createRadialGradient(
                -asteroid.size/3, -asteroid.size/3, 0,
                0, 0, asteroid.size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(0.5, asteroid.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, asteroid.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制陨石边缘
            this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, asteroid.size, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 绘制陨石表面纹理
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 * i) / 3;
                const x = Math.cos(angle) * (asteroid.size * 0.7);
                const y = Math.sin(angle) * (asteroid.size * 0.7);
                this.ctx.beginPath();
                this.ctx.arc(x, y, asteroid.size * 0.1, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }

    /**
     * 渲染游戏背景
     */
    renderBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 51, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 17, 0.9)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 渲染飞船
     */
    renderSpaceship() {
        // 根据玩家位置计算飞船位置
        let centerX, centerY;
        
        // 强制确保飞船位置始终有效
        if (!this.spaceshipPosition.x || this.spaceshipPosition.x === 0) {
            this.spaceshipPosition = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        }
        if (!this.playerPosition.x || this.playerPosition.x === 0) {
            this.playerPosition = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        }
        
        // 调试信息：显示飞船渲染开始
        if (Math.floor(this.gameState.time * 10) % 60 === 0) {
            console.log(`飞船渲染开始 - 阶段: ${this.gamePhases[this.currentPhase]}, 飞船位置: X:${this.spaceshipPosition.x}, Y:${this.spaceshipPosition.y}, 玩家位置: X:${this.playerPosition.x}, Y:${this.playerPosition.y}`);
        }
        
        if (this.gamePhases[this.currentPhase] === 'avoid_asteroids') {
            // 在避开陨石阶段，飞船跟随右手食指指尖位置
            if (this.playerPosition && this.playerPosition.x > 0) {
                centerX = this.playerPosition.x;
                centerY = this.playerPosition.y;
                this.spaceshipPosition = { x: centerX, y: centerY };
                if (Math.floor(this.gameState.time * 10) % 30 === 0) {
                    console.log(`飞船位置 (跟随右手食指指尖): X:${centerX.toFixed(1)}, Y:${centerY.toFixed(1)}`);
                }
            } else {
                // 没有检测到右手时，飞船保持静止（使用最后位置）
                centerX = this.spaceshipPosition.x || this.canvas.width / 2;
                centerY = this.spaceshipPosition.y || this.canvas.height / 2;
                if (Math.floor(this.gameState.time * 10) % 30 === 0) {
                    console.log(`飞船位置 (静止): X:${centerX.toFixed(1)}, Y:${centerY.toFixed(1)}`);
                }
            }
        } else if (this.playerPosition && this.playerPosition.x > 0 && this.playerPosition.y > 0) {
            // 其他阶段飞船跟随玩家位置，但更平滑
            const targetX = this.canvas.width / 2;
            const targetY = this.canvas.height / 2;
            
            // 使用平滑插值
            const smoothingFactor = 0.1;
            centerX = this.playerPosition.x + (targetX - this.playerPosition.x) * smoothingFactor;
            centerY = this.playerPosition.y + (targetY - this.playerPosition.y) * smoothingFactor;
            this.spaceshipPosition = { x: centerX, y: centerY };
            if (Math.floor(this.gameState.time * 10) % 30 === 0) {
                console.log(`飞船位置 (其他阶段): X:${centerX.toFixed(1)}, Y:${centerY.toFixed(1)}`);
            }
        } else {
            // 使用缓存的飞船位置或默认位置
            if (this.spaceshipPosition.x > 0) {
                centerX = this.spaceshipPosition.x;
                centerY = this.spaceshipPosition.y;
            } else {
                centerX = this.canvas.width / 2;
                centerY = this.canvas.height / 2;
                this.spaceshipPosition = { x: centerX, y: centerY };
            }
            if (Math.floor(this.gameState.time * 10) % 30 === 0) {
                console.log(`飞船位置 (缓存/默认): X:${centerX.toFixed(1)}, Y:${centerY.toFixed(1)}`);
            }
        }
        
        this.ctx.save();
        
        // 绘制飞船主体
        this.ctx.fillStyle = 'rgba(0, 212, 255, 0.8)';
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#00d4ff';
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - 20);
        this.ctx.lineTo(centerX + 15, centerY + 10);
        this.ctx.lineTo(centerX, centerY + 5);
        this.ctx.lineTo(centerX - 15, centerY + 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 绘制引擎尾焰
        if (this.gamePhases[this.currentPhase] !== 'engine_start') {
            this.ctx.fillStyle = 'rgba(255, 68, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 8, centerY + 5);
            this.ctx.lineTo(centerX, centerY + 25);
            this.ctx.lineTo(centerX + 8, centerY + 5);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    /**
     * 渲染能量球
     */
    renderEnergyBall() {
        if (this.gamePhases[this.currentPhase] === 'energy_gathering') {
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const energySize = (this.gameState.energy / 100) * 50;
            
            this.ctx.save();
            
            // 绘制能量球外圈
            this.ctx.strokeStyle = '#00d4ff';
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = '#00d4ff';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, energySize + 10, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 绘制能量球核心
            const gradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, energySize
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 100, 200, 0.3)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, energySize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }

    /**
     * 渲染玩家指示器
     */
    renderPlayerIndicator() {
        this.ctx.save();
        
        if (this.gamePhases[this.currentPhase] === 'avoid_asteroids' && this.playerPosition) {
            // 在避开陨石阶段，指示器跟随玩家位置
            this.ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(this.playerPosition.x, this.playerPosition.y, 30, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 添加目标指示器
            this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.playerPosition.x, this.playerPosition.y, 40, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            // 其他阶段在屏幕中央显示指示器
            this.ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 30, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    /**
     * 渲染位置映射指示器
     */
    renderPositionMapping() {
        if (this.gamePhases[this.currentPhase] === 'avoid_asteroids' && this.playerPosition) {
            this.ctx.save();
            
            // 绘制从摄像头位置到游戏位置的连接线
            const cameraX = this.canvas.width - 160; // 摄像头画面中心X
            const cameraY = 140; // 摄像头画面中心Y
            
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(cameraX, cameraY);
            this.ctx.lineTo(this.playerPosition.x, this.playerPosition.y);
            this.ctx.stroke();
            
            // 重置虚线
            this.ctx.setLineDash([]);
            
            this.ctx.restore();
        }
    }

    /**
     * 渲染飞船位置测试指示器
     */
    renderSpaceshipTestIndicator() {
        if (this.gamePhases[this.currentPhase] === 'avoid_asteroids') {
            this.ctx.save();
            
            // 绘制飞船位置测试点
            const testX = this.spaceshipPosition.x || this.canvas.width / 2;
            const testY = this.spaceshipPosition.y || this.canvas.height / 2;
            
            // 绘制一个移动的测试点
            const time = Date.now() * 0.001;
            const pulseSize = 10 + Math.sin(time * 3) * 5;
            
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(testX, testY, pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制飞船位置文字
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`飞船(食指指尖): ${testX.toFixed(0)}, ${testY.toFixed(0)}`, testX + 20, testY - 20);
            
            this.ctx.restore();
        }
    }
}

// 导出类
window.GameEngine = GameEngine;
