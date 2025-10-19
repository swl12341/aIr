/**
 * 手势识别模块
 * 使用MediaPipe进行手势和姿态识别，并显示关键点
 */
class GestureRecognition {
    constructor() {
        this.hands = null;
        this.pose = null;
        this.video = null;
        this.cameraCanvas = null;
        this.cameraCtx = null;
        this.isInitialized = false;
        this.isProcessing = false; // 防止重复处理
        this.currentGestures = {
            hands: [],
            pose: null
        };
        this.callbacks = {
            onGestureDetected: null,
            onPoseDetected: null
        };
    }

    /**
     * 初始化MediaPipe
     */
    async initialize() {
        try {
            // 获取摄像头视频元素
            this.video = document.getElementById('camera-video');
            this.cameraCanvas = document.getElementById('camera-canvas');
            this.cameraCtx = this.cameraCanvas.getContext('2d');
            
            // 设置画布尺寸 - 确保与视频尺寸匹配
            this.cameraCanvas.width = 320;
            this.cameraCanvas.height = 240;

            // 初始化手势识别
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results) => {
                this.currentGestures.hands = results.multiHandLandmarks || [];
                this.drawHands(results);
                
                // 调试信息：显示手部关键点坐标
                if (this.currentGestures.hands.length > 0) {
                    const firstHand = this.currentGestures.hands[0];
                    console.log('手部关键点坐标:', {
                        wrist: { x: firstHand[0].x.toFixed(3), y: firstHand[0].y.toFixed(3) },
                        thumb: { x: firstHand[4].x.toFixed(3), y: firstHand[4].y.toFixed(3) },
                        index: { x: firstHand[8].x.toFixed(3), y: firstHand[8].y.toFixed(3) }
                    });
                }
                
                if (this.callbacks.onGestureDetected) {
                    this.callbacks.onGestureDetected(this.currentGestures.hands);
                }
            });

            // 初始化姿态识别
            this.pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.pose.onResults((results) => {
                this.currentGestures.pose = results.poseLandmarks;
                this.drawPose(results);
                
                // 调试信息：显示姿态关键点坐标
                if (results.poseLandmarks) {
                    console.log('姿态关键点坐标:', {
                        rightWrist: { x: results.poseLandmarks[16].x.toFixed(3), y: results.poseLandmarks[16].y.toFixed(3) },
                        leftWrist: { x: results.poseLandmarks[15].x.toFixed(3), y: results.poseLandmarks[15].y.toFixed(3) },
                        nose: { x: results.poseLandmarks[0].x.toFixed(3), y: results.poseLandmarks[0].y.toFixed(3) }
                    });
                }
                
                if (this.callbacks.onPoseDetected) {
                    this.callbacks.onPoseDetected(this.currentGestures.pose);
                }
            });

            this.isInitialized = true;
            console.log('手势识别初始化成功');
            return true;
        } catch (error) {
            console.error('手势识别初始化失败:', error);
            return false;
        }
    }

    /**
     * 开始手势识别
     */
    async start() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        try {
            // 获取摄像头流
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            
            this.video.srcObject = stream;
            this.video.play();
            
            // 注意：不要在这里启动processVideo循环
            // 游戏引擎会负责调用processVideo方法
            
            console.log('摄像头和手势识别已启动');
            return true;
        } catch (error) {
            console.error('摄像头启动失败:', error);
            throw error;
        }
    }

    /**
     * 处理视频帧
     */
    async processVideo() {
        // 防止重复处理
        if (this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        
        try {
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                // 处理手势识别
                if (this.hands) {
                    await this.hands.send({ image: this.video });
                }
                
                // 处理姿态识别
                if (this.pose) {
                    await this.pose.send({ image: this.video });
                }
            }
        } catch (error) {
            console.error('处理视频帧时出错:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 测试关键点移动 - 添加一个简单的测试点
     */
    testKeypointMovement() {
        if (this.cameraCtx) {
            // 在画布上绘制一个移动的测试点
            const time = Date.now() * 0.001;
            const testX = 160 + Math.sin(time) * 50; // 在画布中心左右摆动
            const testY = 120 + Math.cos(time * 0.5) * 30; // 在画布中心上下摆动
            
            this.cameraCtx.fillStyle = '#ffff00';
            this.cameraCtx.beginPath();
            this.cameraCtx.arc(testX, testY, 8, 0, 2 * Math.PI);
            this.cameraCtx.fill();
            
            // 只在特定时间输出调试信息，避免控制台刷屏
            if (Math.floor(time * 10) % 50 === 0) {
                console.log(`测试点位置: x=${testX.toFixed(1)}, y=${testY.toFixed(1)}`);
            }
        }
    }

    /**
     * 绘制手部关键点
     */
    drawHands(results) {
        this.cameraCtx.save();
        this.cameraCtx.clearRect(0, 0, this.cameraCanvas.width, this.cameraCanvas.height);
        
        // 添加测试点来验证画布是否正常工作
        this.testKeypointMovement();
        
        if (results.multiHandLandmarks) {
            for (let landmarks of results.multiHandLandmarks) {
                this.drawHandLandmarks(landmarks);
            }
        }
        
        this.cameraCtx.restore();
    }

    /**
     * 绘制手部关键点
     */
    drawHandLandmarks(landmarks) {
        console.log('绘制手部关键点，landmarks数量:', landmarks.length);
        
        // 绘制连接线
        this.cameraCtx.strokeStyle = '#00d4ff';
        this.cameraCtx.lineWidth = 2;
        this.cameraCtx.shadowColor = '#00d4ff';
        this.cameraCtx.shadowBlur = 5;
        
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],  // 拇指
            [0, 5], [5, 6], [6, 7], [7, 8],  // 食指
            [0, 9], [9, 10], [10, 11], [11, 12], // 中指
            [0, 13], [13, 14], [14, 15], [15, 16], // 无名指
            [0, 17], [17, 18], [18, 19], [19, 20], // 小指
            [5, 9], [9, 13], [13, 17] // 手掌连接
        ];
        
        for (let [start, end] of connections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            // 直接使用MediaPipe的坐标（已经是0-1范围）
            const startX = startPoint.x * this.cameraCanvas.width;
            const startY = startPoint.y * this.cameraCanvas.height;
            const endX = endPoint.x * this.cameraCanvas.width;
            const endY = endPoint.y * this.cameraCanvas.height;
            
            this.cameraCtx.beginPath();
            this.cameraCtx.moveTo(startX, startY);
            this.cameraCtx.lineTo(endX, endY);
            this.cameraCtx.stroke();
        }
        
        // 绘制关键点
        this.cameraCtx.shadowColor = '#ff4444';
        this.cameraCtx.shadowBlur = 8;
        this.cameraCtx.fillStyle = '#ff4444';
        for (let i = 0; i < landmarks.length; i++) {
            const landmark = landmarks[i];
            const x = landmark.x * this.cameraCanvas.width;
            const y = landmark.y * this.cameraCanvas.height;
            
            console.log(`关键点 ${i}: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
            
            this.cameraCtx.beginPath();
            this.cameraCtx.arc(x, y, 4, 0, 2 * Math.PI);
            this.cameraCtx.fill();
        }
        
        // 重置阴影
        this.cameraCtx.shadowBlur = 0;
        
        // 绘制手掌中心点
        const palmCenter = this.getHandCenter(landmarks);
        const centerX = palmCenter.x * this.cameraCanvas.width;
        const centerY = palmCenter.y * this.cameraCanvas.height;
        
        this.cameraCtx.fillStyle = '#00ff44';
        this.cameraCtx.beginPath();
        this.cameraCtx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
        this.cameraCtx.fill();
        
        // 绘制手掌中心圆圈
        this.cameraCtx.strokeStyle = '#00ff44';
        this.cameraCtx.lineWidth = 2;
        this.cameraCtx.beginPath();
        this.cameraCtx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
        this.cameraCtx.stroke();
    }

    /**
     * 绘制姿态关键点
     */
    drawPose(results) {
        if (results.poseLandmarks) {
            console.log('绘制姿态关键点，landmarks数量:', results.poseLandmarks.length);
            
            this.cameraCtx.save();
            this.cameraCtx.strokeStyle = '#00ff44';
            this.cameraCtx.lineWidth = 3;
            this.cameraCtx.shadowColor = '#00ff44';
            this.cameraCtx.shadowBlur = 5;
            
            // 绘制姿态连接线
            const connections = [
                [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // 手臂
                [11, 23], [12, 24], [23, 24], // 躯干
                [23, 25], [24, 26], [25, 27], [26, 28] // 腿部
            ];
            
            for (let [start, end] of connections) {
                const startPoint = results.poseLandmarks[start];
                const endPoint = results.poseLandmarks[end];
                
                // 直接使用MediaPipe的坐标（已经是0-1范围）
                const startX = startPoint.x * this.cameraCanvas.width;
                const startY = startPoint.y * this.cameraCanvas.height;
                const endX = endPoint.x * this.cameraCanvas.width;
                const endY = endPoint.y * this.cameraCanvas.height;
                
                this.cameraCtx.beginPath();
                this.cameraCtx.moveTo(startX, startY);
                this.cameraCtx.lineTo(endX, endY);
                this.cameraCtx.stroke();
            }
            
            // 绘制关键点
            this.cameraCtx.shadowColor = '#ffaa00';
            this.cameraCtx.shadowBlur = 8;
            this.cameraCtx.fillStyle = '#ffaa00';
            for (let i = 0; i < results.poseLandmarks.length; i++) {
                const landmark = results.poseLandmarks[i];
                const x = landmark.x * this.cameraCanvas.width;
                const y = landmark.y * this.cameraCanvas.height;
                
                console.log(`姿态关键点 ${i}: x=${x.toFixed(1)}, y=${y.toFixed(1)}`);
                
                this.cameraCtx.beginPath();
                this.cameraCtx.arc(x, y, 5, 0, 2 * Math.PI);
                this.cameraCtx.fill();
            }
            
            // 重置阴影
            this.cameraCtx.shadowBlur = 0;
            
            // 高亮显示右手位置（用于飞船控制）
            const rightWrist = results.poseLandmarks[16];
            if (rightWrist) {
                const wristX = rightWrist.x * this.cameraCanvas.width;
                const wristY = rightWrist.y * this.cameraCanvas.height;
                
                this.cameraCtx.fillStyle = '#ff0066';
                this.cameraCtx.beginPath();
                this.cameraCtx.arc(wristX, wristY, 8, 0, 2 * Math.PI);
                this.cameraCtx.fill();
                
                // 绘制右手控制圆圈
                this.cameraCtx.strokeStyle = '#ff0066';
                this.cameraCtx.lineWidth = 2;
                this.cameraCtx.beginPath();
                this.cameraCtx.arc(wristX, wristY, 15, 0, 2 * Math.PI);
                this.cameraCtx.stroke();
            }
            
            this.cameraCtx.restore();
        }
    }

    /**
     * 停止手势识别
     */
    stop() {
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    /**
     * 设置手势检测回调
     */
    setGestureCallback(callback) {
        this.callbacks.onGestureDetected = callback;
    }

    /**
     * 设置姿态检测回调
     */
    setPoseCallback(callback) {
        this.callbacks.onPoseDetected = callback;
    }

    /**
     * 检测特定手势
     */
    detectGesture(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;

        const gesture = this.analyzeHandGesture(landmarks);
        return gesture;
    }

    /**
     * 分析手势
     */
    analyzeHandGesture(landmarks) {
        const tips = [4, 8, 12, 16, 20]; // 指尖索引
        const mcp = [2, 5, 9, 13, 17]; // 指关节索引
        
        let extendedFingers = 0;
        let isThumbUp = false;
        let isPointing = false;
        let isFist = false;

        // 检查拇指
        if (landmarks[4].x > landmarks[3].x) {
            extendedFingers++;
            isThumbUp = true;
        }

        // 检查其他手指
        for (let i = 1; i < 5; i++) {
            const tipIndex = tips[i];
            const mcpIndex = mcp[i];
            
            if (landmarks[tipIndex].y < landmarks[mcpIndex].y) {
                extendedFingers++;
            }
        }

        // 判断手势类型
        if (extendedFingers === 0) {
            isFist = true;
        } else if (extendedFingers === 1 && landmarks[8].y < landmarks[6].y) {
            isPointing = true;
        }

        return {
            extendedFingers,
            isThumbUp,
            isPointing,
            isFist,
            landmarks
        };
    }

    /**
     * 检测双手合并手势
     */
    detectHandsTogether(hands) {
        if (hands.length < 2) return false;

        const leftHand = hands[0];
        const rightHand = hands[1];
        
        // 计算双手中心点距离
        const leftCenter = this.getHandCenter(leftHand);
        const rightCenter = this.getHandCenter(rightHand);
        
        const distance = Math.sqrt(
            Math.pow(leftCenter.x - rightCenter.x, 2) + 
            Math.pow(leftCenter.y - rightCenter.y, 2)
        );

        return distance < 0.3; // 阈值可调整
    }

    /**
     * 获取手部中心点
     */
    getHandCenter(landmarks) {
        let x = 0, y = 0;
        landmarks.forEach(landmark => {
            x += landmark.x;
            y += landmark.y;
        });
        return {
            x: x / landmarks.length,
            y: y / landmarks.length
        };
    }

    /**
     * 检测上举手臂动作
     */
    detectRaisedArms(pose) {
        if (!pose) return false;

        // 检查左右肩膀和手腕的高度
        const leftShoulder = pose[11];
        const rightShoulder = pose[12];
        const leftWrist = pose[15];
        const rightWrist = pose[16];

        const leftRaised = leftWrist.y < leftShoulder.y;
        const rightRaised = rightWrist.y < rightShoulder.y;

        return leftRaised || rightRaised;
    }

    /**
     * 检测右手位置
     */
    detectRightHandPosition(pose) {
        if (!pose || !pose[16]) return { x: 0.5, y: 0.5 }; // 默认屏幕中央

        // 使用右手腕位置 (landmark 16)
        const rightWrist = pose[16];
        
        // 添加平滑处理，避免位置跳动
        if (!this.lastRightHandPosition) {
            this.lastRightHandPosition = { x: rightWrist.x, y: rightWrist.y };
        }
        
        // 使用线性插值进行平滑
        const smoothingFactor = 0.3;
        const smoothedX = this.lastRightHandPosition.x + (rightWrist.x - this.lastRightHandPosition.x) * smoothingFactor;
        const smoothedY = this.lastRightHandPosition.y + (rightWrist.y - this.lastRightHandPosition.y) * smoothingFactor;
        
        this.lastRightHandPosition = { x: smoothedX, y: smoothedY };
        
        return {
            x: smoothedX,
            y: smoothedY
        };
    }

    /**
     * 检测右手食指指尖位置
     */
    detectRightIndexFinger(hands, pose) {
        // 优先使用手势识别检测食指指尖
        if (hands && hands.length > 0) {
            // 查找右手
            let rightHand = null;
            if (hands.length === 1) {
                // 如果只检测到一只手，需要结合姿态识别来判断是否是右手
                if (pose && pose[16]) {
                    const poseRightWrist = pose[16];
                    const handCenter = this.getHandCenter(hands[0]);
                    
                    const distance = Math.sqrt(
                        Math.pow(handCenter.x - poseRightWrist.x, 2) + 
                        Math.pow(handCenter.y - poseRightWrist.y, 2)
                    );
                    
                    if (distance < 0.2) {
                        rightHand = hands[0];
                        console.log('检测到右手（单只手）');
                    } else {
                        console.log('检测到左手，忽略');
                        return { x: 0.5, y: 0.5 };
                    }
                } else {
                    rightHand = hands[0];
                    console.log('检测到单只手，假设是右手');
                }
            } else if (hands.length === 2) {
                // 如果有两只手，通过位置和姿态识别来判断哪只是右手
                if (pose && pose[16]) {
                    const poseRightWrist = pose[16];
                    let minDistance = Infinity;
                    let rightHandIndex = -1;
                    
                    for (let i = 0; i < hands.length; i++) {
                        const handCenter = this.getHandCenter(hands[i]);
                        const distance = Math.sqrt(
                            Math.pow(handCenter.x - poseRightWrist.x, 2) + 
                            Math.pow(handCenter.y - poseRightWrist.y, 2)
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            rightHandIndex = i;
                        }
                    }
                    
                    if (rightHandIndex >= 0 && minDistance < 0.3) {
                        rightHand = hands[rightHandIndex];
                        console.log(`检测到右手（两只手中的第${rightHandIndex + 1}只）`);
                    } else {
                        console.log('无法确定哪只是右手，忽略');
                        return { x: 0.5, y: 0.5 };
                    }
                } else {
                    rightHand = hands[0].x > hands[1].x ? hands[0] : hands[1];
                    console.log('通过位置判断右手');
                }
            }
            
            if (rightHand) {
                // 使用食指指尖位置（landmark 8）
                const indexFinger = rightHand[8];
                
                // 添加平滑处理
                if (!this.lastRightIndexPosition) {
                    this.lastRightIndexPosition = { x: indexFinger.x, y: indexFinger.y };
                }
                
                const smoothingFactor = 0.4;
                const smoothedX = this.lastRightIndexPosition.x + (indexFinger.x - this.lastRightIndexPosition.x) * smoothingFactor;
                const smoothedY = this.lastRightIndexPosition.y + (indexFinger.y - this.lastRightIndexPosition.y) * smoothingFactor;
                
                this.lastRightIndexPosition = { x: smoothedX, y: smoothedY };
                
                console.log(`右手食指指尖: x=${smoothedX.toFixed(3)}, y=${smoothedY.toFixed(3)}`);
                return { x: smoothedX, y: smoothedY };
            }
        }
        
        // 如果手势识别失败，回退到姿态识别的手腕位置
        if (pose && pose[16]) {
            const rightWrist = pose[16];
            
            if (!this.lastRightIndexPosition) {
                this.lastRightIndexPosition = { x: rightWrist.x, y: rightWrist.y };
            }
            
            const smoothingFactor = 0.3;
            const smoothedX = this.lastRightIndexPosition.x + (rightWrist.x - this.lastRightIndexPosition.x) * smoothingFactor;
            const smoothedY = this.lastRightIndexPosition.y + (rightWrist.y - this.lastRightIndexPosition.y) * smoothingFactor;
            
            this.lastRightIndexPosition = { x: smoothedX, y: smoothedY };
            
            console.log(`右手手腕位置（回退）: x=${smoothedX.toFixed(3)}, y=${smoothedY.toFixed(3)}`);
            return { x: smoothedX, y: smoothedY };
        }
        
        // 如果都检测不到，返回默认位置
        return { x: 0.5, y: 0.5 };
    }

    /**
     * 检测右手手掌中心位置（保留原方法作为备用）
     */
    detectRightPalmCenter(hands, pose) {
        // 优先使用手势识别的手掌中心（更精确）
        if (hands && hands.length > 0) {
            // 查找右手 - 使用更可靠的右手识别方法
            let rightHand = null;
            if (hands.length === 1) {
                // 如果只检测到一只手，需要结合姿态识别来判断是否是右手
                if (pose && pose[16]) {
                    // 使用姿态识别的右手腕位置来验证
                    const poseRightWrist = pose[16];
                    const handCenter = this.getHandCenter(hands[0]);
                    
                    // 计算手掌中心与右手腕的距离
                    const distance = Math.sqrt(
                        Math.pow(handCenter.x - poseRightWrist.x, 2) + 
                        Math.pow(handCenter.y - poseRightWrist.y, 2)
                    );
                    
                    // 如果距离很近，说明这是右手
                    if (distance < 0.2) {
                        rightHand = hands[0];
                        console.log('检测到右手（单只手）');
                    } else {
                        console.log('检测到左手，忽略');
                        return { x: 0.5, y: 0.5 }; // 返回默认位置
                    }
                } else {
                    // 没有姿态信息时，假设是右手
                    rightHand = hands[0];
                    console.log('检测到单只手，假设是右手');
                }
            } else if (hands.length === 2) {
                // 如果有两只手，通过位置和姿态识别来判断哪只是右手
                if (pose && pose[16]) {
                    const poseRightWrist = pose[16];
                    let minDistance = Infinity;
                    let rightHandIndex = -1;
                    
                    // 找到与右手腕距离最近的手
                    for (let i = 0; i < hands.length; i++) {
                        const handCenter = this.getHandCenter(hands[i]);
                        const distance = Math.sqrt(
                            Math.pow(handCenter.x - poseRightWrist.x, 2) + 
                            Math.pow(handCenter.y - poseRightWrist.y, 2)
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            rightHandIndex = i;
                        }
                    }
                    
                    if (rightHandIndex >= 0 && minDistance < 0.3) {
                        rightHand = hands[rightHandIndex];
                        console.log(`检测到右手（两只手中的第${rightHandIndex + 1}只）`);
                    } else {
                        console.log('无法确定哪只是右手，忽略');
                        return { x: 0.5, y: 0.5 };
                    }
                } else {
                    // 没有姿态信息时，通过位置判断（右手通常在屏幕右侧）
                    rightHand = hands[0].x > hands[1].x ? hands[0] : hands[1];
                    console.log('通过位置判断右手');
                }
            }
            
            if (rightHand) {
                const palmCenter = this.getHandCenter(rightHand);
                
                // 添加平滑处理
                if (!this.lastRightPalmPosition) {
                    this.lastRightPalmPosition = { x: palmCenter.x, y: palmCenter.y };
                }
                
                const smoothingFactor = 0.4;
                const smoothedX = this.lastRightPalmPosition.x + (palmCenter.x - this.lastRightPalmPosition.x) * smoothingFactor;
                const smoothedY = this.lastRightPalmPosition.y + (palmCenter.y - this.lastRightPalmPosition.y) * smoothingFactor;
                
                this.lastRightPalmPosition = { x: smoothedX, y: smoothedY };
                
                console.log(`右手手掌中心: x=${smoothedX.toFixed(3)}, y=${smoothedY.toFixed(3)}`);
                return { x: smoothedX, y: smoothedY };
            }
        }
        
        // 如果手势识别失败，回退到姿态识别的手腕位置
        if (pose && pose[16]) {
            const rightWrist = pose[16];
            
            if (!this.lastRightPalmPosition) {
                this.lastRightPalmPosition = { x: rightWrist.x, y: rightWrist.y };
            }
            
            const smoothingFactor = 0.3;
            const smoothedX = this.lastRightPalmPosition.x + (rightWrist.x - this.lastRightPalmPosition.x) * smoothingFactor;
            const smoothedY = this.lastRightPalmPosition.y + (rightWrist.y - this.lastRightPalmPosition.y) * smoothingFactor;
            
            this.lastRightPalmPosition = { x: smoothedX, y: smoothedY };
            
            console.log(`右手手腕位置（回退）: x=${smoothedX.toFixed(3)}, y=${smoothedY.toFixed(3)}`);
            return { x: smoothedX, y: smoothedY };
        }
        
        // 如果都检测不到，返回默认位置
        return { x: 0.5, y: 0.5 };
    }

    /**
     * 检测身体移动
     */
    detectBodyMovement(pose) {
        if (!pose) return { x: 0, y: 0 };

        // 使用肩膀中心点作为身体位置参考
        const leftShoulder = pose[11];
        const rightShoulder = pose[12];
        
        return {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2
        };
    }
}

// 导出类
window.GestureRecognition = GestureRecognition;