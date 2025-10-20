/**
 * 粒子系统
 * 用于创建各种视觉效果
 */
class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.effects = {
            energy: [],
            explosion: [],
            stars: [],
            engine: []
        };
    }

    /**
     * 创建能量粒子效果
     */
    createEnergyEffect(x, y, intensity = 1) {
        const particleCount = Math.floor(20 * intensity);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.01,
                size: 2 + Math.random() * 4,
                color: this.getEnergyColor(),
                type: 'energy'
            };
            this.effects.energy.push(particle);
        }
    }

    /**
     * 创建爆炸效果
     */
    createExplosionEffect(x, y, intensity = 1) {
        // 大幅增加粒子数量，让爆炸更壮观
        const particleCount = Math.floor(120 * intensity);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            // 增加爆炸速度，让粒子飞得更远
            const speed = 4 + Math.random() * 8;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                // 减慢衰减速度，让爆炸持续更久
                decay: 0.015 + Math.random() * 0.01,
                // 增大粒子尺寸，让爆炸更明显
                size: 5 + Math.random() * 12,
                color: this.getExplosionColor(),
                type: 'explosion'
            };
            this.effects.explosion.push(particle);
        }
        
        // 添加额外的火花效果
        this.createSparkEffect(x, y, intensity);
    }

    /**
     * 创建火花效果
     */
    createSparkEffect(x, y, intensity = 1) {
        const sparkCount = Math.floor(30 * intensity);
        
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 6 + Math.random() * 10;
            
            const spark = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.015,
                size: 2 + Math.random() * 4,
                color: this.getSparkColor(),
                type: 'spark'
            };
            this.effects.explosion.push(spark);
        }
    }

    /**
     * 创建星空背景
     */
    createStarField() {
        for (let i = 0; i < 150; i++) {
            const star = {
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 3,
                brightness: Math.random(),
                twinkle: Math.random() * 0.02,
                type: 'star',
                color: this.getStarColor()
            };
            this.effects.stars.push(star);
        }
    }

    /**
     * 获取星星颜色
     */
    getStarColor() {
        const colors = ['#ffffff', '#00d4ff', '#ffaa00', '#ff6600'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 创建引擎尾焰效果
     */
    createEngineEffect(x, y, direction = 0) {
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(direction) * (2 + Math.random() * 3),
                vy: Math.sin(direction) * (2 + Math.random() * 3),
                life: 0.8 + Math.random() * 0.2,
                decay: 0.02,
                size: 1 + Math.random() * 3,
                color: this.getEngineColor(),
                type: 'engine'
            };
            this.effects.engine.push(particle);
        }
    }

    /**
     * 创建信标发射效果
     */
    createBeaconEffect(x, y) {
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 100;
            
            const particle = {
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0,
                decay: 0.01,
                size: 4 + Math.random() * 6,
                color: '#00d4ff',
                type: 'beacon'
            };
            this.effects.energy.push(particle);
        }
    }

    /**
     * 更新所有粒子
     */
    update() {
        // 更新能量粒子
        this.effects.energy = this.effects.energy.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            return particle.life > 0;
        });

        // 更新爆炸粒子
        this.effects.explosion = this.effects.explosion.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            return particle.life > 0;
        });

        // 更新引擎粒子
        this.effects.engine = this.effects.engine.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            return particle.life > 0;
        });

        // 更新星星
        this.effects.stars.forEach(star => {
            star.brightness += star.twinkle;
            if (star.brightness > 1) {
                star.brightness = 1;
                star.twinkle = -Math.abs(star.twinkle);
            } else if (star.brightness < 0.3) {
                star.brightness = 0.3;
                star.twinkle = Math.abs(star.twinkle);
            }
        });
    }

    /**
     * 渲染所有粒子
     */
    render(canvas, ctx) {
        // 渲染星星
        this.effects.stars.forEach(star => {
            ctx.save();
            ctx.globalAlpha = star.brightness;
            ctx.fillStyle = star.color;
            ctx.shadowColor = star.color;
            ctx.shadowBlur = star.size * 2;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制星星光芒效果
            if (star.brightness > 0.8) {
                ctx.strokeStyle = star.color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(star.x - star.size * 3, star.y);
                ctx.lineTo(star.x + star.size * 3, star.y);
                ctx.moveTo(star.x, star.y - star.size * 3);
                ctx.lineTo(star.x, star.y + star.size * 3);
                ctx.stroke();
            }
            
            ctx.restore();
        });

        // 渲染能量粒子
        this.effects.energy.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 渲染爆炸粒子
        this.effects.explosion.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            
            // 添加发光效果
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = particle.size * 2 * particle.life;
            
            // 根据粒子类型设置不同的渲染效果
            if (particle.type === 'spark') {
                // 火花效果：更亮更小
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * particle.life * 0.8, 0, Math.PI * 2);
                ctx.fill();
                
                // 添加火花尾巴效果
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(
                    particle.x - particle.vx * 0.5, 
                    particle.y - particle.vy * 0.5
                );
                ctx.stroke();
            } else {
                // 爆炸效果：更大更亮
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
                ctx.fill();
                
                // 添加爆炸光环效果
                if (particle.life > 0.5) {
                    ctx.globalAlpha = particle.life * 0.3;
                    ctx.fillStyle = particle.color;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size * particle.life * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            ctx.restore();
        });

        // 渲染引擎粒子
        this.effects.engine.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    /**
     * 获取能量颜色
     */
    getEnergyColor() {
        const colors = ['#00d4ff', '#0099cc', '#0066ff', '#ffffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 获取爆炸颜色
     */
    getExplosionColor() {
        const colors = ['#ff6600', '#ff9900', '#ffcc00', '#ffffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 获取火花颜色
     */
    getSparkColor() {
        const colors = ['#ffaa00', '#ffcc00', '#ffff00', '#ffffff', '#ff8800'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 获取引擎颜色
     */
    getEngineColor() {
        const colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 清除所有效果
     */
    clear() {
        this.effects.energy = [];
        this.effects.explosion = [];
        this.effects.engine = [];
    }

    /**
     * 清除特定类型的效果
     */
    clearEffect(type) {
        if (this.effects[type]) {
            this.effects[type] = [];
        }
    }
}

// 导出类
window.ParticleSystem = ParticleSystem;
