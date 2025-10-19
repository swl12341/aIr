#!/bin/bash

echo "正在启动冰脉回航游戏..."
echo ""
echo "请确保您的浏览器支持摄像头功能"
echo "游戏将在默认浏览器中打开"
echo ""

# 尝试使用不同的命令打开浏览器
if command -v xdg-open &> /dev/null; then
    xdg-open index.html
elif command -v open &> /dev/null; then
    open index.html
else
    echo "请手动在浏览器中打开 index.html 文件"
fi

echo "游戏已启动！"
