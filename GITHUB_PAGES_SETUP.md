# 🚀 GitHub Pages 设置指南

## 📋 手动设置步骤

### 第一步：启用GitHub Pages

1. **访问仓库设置**
   - 打开：https://github.com/swl12341/aIr
   - 点击仓库页面顶部的 **"Settings"** 选项卡

2. **找到Pages设置**
   - 在左侧菜单中向下滚动，找到 **"Pages"** 部分
   - 点击进入Pages设置页面

3. **配置部署源**
   - 在 **"Source"** 部分，选择 **"Deploy from a branch"**
   - **Branch**: 选择 `master`
   - **Folder**: 选择 `/ (root)`
   - 点击 **"Save"** 保存设置

### 第二步：等待部署完成

- ⏱️ **部署时间**: 通常需要 1-5 分钟
- 🔄 **自动部署**: GitHub Actions会自动构建和部署
- ✅ **完成标志**: 在Pages设置页面会显示绿色勾号

### 第三步：访问您的网站

部署完成后，您的网站将在以下地址可用：

**🌐 主链接**: https://swl12341.github.io/aIr/
**📱 移动端**: 同样支持手机浏览器访问

## 🔧 技术配置详情

### 已配置的文件

1. **`.github/workflows/deploy.yml`** - GitHub Actions部署工作流
2. **`_redirects`** - 重定向配置，确保所有路径指向index.html
3. **`index.html`** - 网站入口文件

### 部署流程

```yaml
触发条件: 推送到master分支
部署环境: GitHub Pages
构建过程: 直接部署静态文件
访问地址: https://swl12341.github.io/aIr/
```

## 🎯 验证部署

### 检查部署状态

1. **GitHub Actions页面**
   - 访问：https://github.com/swl12341/aIr/actions
   - 查看 "Deploy to GitHub Pages" 工作流状态

2. **Pages设置页面**
   - 在仓库Settings > Pages中查看部署状态
   - 绿色勾号表示部署成功

3. **直接访问测试**
   - 打开：https://swl12341.github.io/aIr/
   - 确认游戏正常加载

## 🛠️ 故障排除

### 常见问题

1. **404错误**
   - 检查是否选择了正确的分支（master）
   - 确认index.html文件存在

2. **部署失败**
   - 检查GitHub Actions日志
   - 确认工作流文件语法正确

3. **网站无法访问**
   - 等待几分钟让DNS传播
   - 清除浏览器缓存

### 重新部署

如果需要重新部署：

```bash
# 在本地执行
git commit --allow-empty -m "Trigger GitHub Pages rebuild"
git push origin master
```

## 📱 移动端优化

### 已配置的移动端支持

- ✅ 响应式设计
- ✅ 触摸手势支持
- ✅ 移动端摄像头权限处理
- ✅ 移动端性能优化

### 测试建议

1. **桌面端**: Chrome浏览器
2. **移动端**: Chrome Mobile或Safari
3. **摄像头**: 确保授权摄像头权限

## 🔗 分享链接

部署完成后，您可以使用以下链接分享：

```
🎮 冰脉回航在线体验
https://swl12341.github.io/aIr/

📱 支持手机和电脑浏览器
🎯 需要摄像头权限进行手势识别
```

## 📞 技术支持

如果遇到问题：

1. **GitHub Issues**: 在仓库中创建Issue
2. **文档参考**: 查看README.md和DEMO.md
3. **本地测试**: 使用start.bat或start.sh本地运行
