# 🚀 项目部署指南

## GitHub Pages 部署

### 自动部署步骤

1. **访问仓库设置**
   - 进入：https://github.com/swl12341/space-2045-1/settings
   - 点击左侧菜单的 "Pages"

2. **配置部署源**
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)

3. **保存并等待**
   - 点击 "Save" 按钮
   - 等待几分钟让GitHub构建页面

4. **访问在线链接**
   - 部署完成后，您的项目将在以下链接可用：
   - **https://swl12341.github.io/space-2045-1/**

### 手动部署（如果需要）

```bash
# 克隆仓库
git clone https://github.com/swl12341/space-2045-1.git
cd space-2045-1

# 创建gh-pages分支
git checkout -b gh-pages

# 推送分支
git push origin gh-pages
```

## 🌐 其他部署选项

### Netlify
1. 访问 https://netlify.com
2. 连接GitHub账户
3. 选择仓库进行部署

### Vercel
1. 访问 https://vercel.com
2. 导入GitHub仓库
3. 自动部署

## 📱 移动端支持

项目已优化支持移动设备：
- 响应式设计
- 触摸手势支持
- 移动端摄像头访问

## 🔧 本地开发

```bash
# 克隆项目
git clone https://github.com/swl12341/space-2045-1.git
cd space-2045-1

# 启动本地服务器
# 使用Python
python -m http.server 8000

# 使用Node.js
npx http-server

# 使用PHP
php -S localhost:8000
```

## 🎮 游戏链接

部署完成后，您可以通过以下链接访问游戏：

- **GitHub Pages**: https://swl12341.github.io/space-2045-1/
- **GitHub仓库**: https://github.com/swl12341/space-2045-1

## 📝 注意事项

1. **HTTPS要求**：摄像头访问需要HTTPS环境
2. **浏览器兼容性**：建议使用Chrome、Firefox、Safari最新版本
3. **摄像头权限**：首次访问需要允许摄像头权限
4. **网络环境**：确保网络连接稳定

## 🆘 故障排除

### 常见问题

1. **页面无法加载**
   - 检查GitHub Pages是否已启用
   - 确认仓库设置为公开

2. **摄像头无法访问**
   - 确保使用HTTPS链接
   - 检查浏览器权限设置

3. **游戏运行缓慢**
   - 关闭其他占用资源的应用
   - 使用现代浏览器

## 📞 技术支持

如有问题，请：
1. 检查GitHub Issues
2. 提交新的Issue
3. 联系项目维护者
