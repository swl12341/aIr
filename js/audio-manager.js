/**
 * 音频管理器
 * 处理游戏中的音效和背景音乐
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.backgroundMusic = null;
        this.isMuted = false;
        this.volume = 0.7;
    }

    /**
     * 初始化音频上下文
     */
    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('音频管理器初始化成功');
            return true;
        } catch (error) {
            console.error('音频管理器初始化失败:', error);
            return false;
        }
    }

    /**
     * 创建音效
     */
    createSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
        
        return oscillator;
    }

    /**
     * 播放引擎启动音效
     */
    playEngineStart() {
        if (this.isMuted) return;
        
        // 创建引擎启动的复合音效
        this.createSound(80, 0.5, 'sawtooth'); // 低频引擎声
        setTimeout(() => {
            this.createSound(120, 0.3, 'square'); // 中频启动声
        }, 200);
        setTimeout(() => {
            this.createSound(200, 0.2, 'sine'); // 高频完成声
        }, 400);
    }

    /**
     * 播放能量汇聚音效
     */
    playEnergyGathering() {
        if (this.isMuted) return;
        
        // 创建能量汇聚的上升音效
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 1);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1);
    }

    /**
     * 播放信标发射音效
     */
    playBeaconLaunch() {
        if (this.isMuted) return;
        
        // 创建信标发射的爆发音效
        this.createSound(400, 0.1, 'square'); // 初始爆发
        setTimeout(() => {
            this.createSound(600, 0.2, 'sine'); // 上升音调
        }, 100);
        setTimeout(() => {
            this.createSound(800, 0.3, 'triangle'); // 持续音调
        }, 200);
    }

    /**
     * 播放碰撞音效
     */
    playCollision() {
        if (this.isMuted) return;
        
        // 创建碰撞的噪音音效
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        source.start(this.audioContext.currentTime);
    }

    /**
     * 播放成功音效
     */
    playSuccess() {
        if (this.isMuted) return;
        
        // 创建成功音效的和弦
        this.createSound(523, 0.5, 'sine'); // C5
        setTimeout(() => {
            this.createSound(659, 0.5, 'sine'); // E5
        }, 100);
        setTimeout(() => {
            this.createSound(784, 0.5, 'sine'); // G5
        }, 200);
    }

    /**
     * 播放背景音乐
     */
    playBackgroundMusic() {
        if (this.isMuted || this.backgroundMusic) return;
        
        // 创建环境背景音乐
        this.backgroundMusic = setInterval(() => {
            if (this.isMuted) return;
            
            // 创建低沉的氛围音
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(60 + Math.random() * 20, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 2);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 4);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 4);
        }, 3000);
    }

    /**
     * 停止背景音乐
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            clearInterval(this.backgroundMusic);
            this.backgroundMusic = null;
        }
    }

    /**
     * 设置音量
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 静音/取消静音
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        return this.isMuted;
    }

    /**
     * 播放空间音效（3D音效）
     */
    playSpatialSound(frequency, duration, x, y) {
        if (this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const pannerNode = this.audioContext.createPanner();
        
        oscillator.connect(gainNode);
        gainNode.connect(pannerNode);
        pannerNode.connect(this.audioContext.destination);
        
        // 设置3D位置
        pannerNode.panningModel = 'HRTF';
        pannerNode.setPosition(x, y, 0);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
}

// 导出类
window.AudioManager = AudioManager;
