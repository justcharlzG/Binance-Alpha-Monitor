# Binance Alpha Monitor (币安 Alpha 代币监控)

这是一个基于 React 和 Tailwind CSS 的实时监控面板，用于追踪 Binance Alpha 列表中的代币。它可以展示代币的实时价格、链上持有者数量、24小时涨跌幅等信息，并提供历史数据的折线图（Sparklines）趋势预览。

## 功能特性

*   **实时数据获取**：直接从 Binance 公开 API 获取 Alpha 代币数据。
*   **自动监控**：支持自定义刷新频率（1分钟、5分钟、10分钟、30分钟），自动记录并展示趋势。
*   **数据可视化**：在表格中内嵌价格和持有者数量的微型折线图（Sparkline），直观展示短期趋势。
*   **数据过滤与保留**：
    *   自动过滤掉已经上线中心化交易所（Listing CEX）的代币。
    *   前端本地缓存历史数据，只保留最近 48 小时内的数据点。
*   **交互式表格**：支持自定义显示列、多维度排序（价格、市值、持有者等）以及搜索功能。
*   **详情视图**：点击代币可查看详细的图表和基本信息。

## 技术栈

*   **前端框架**: React 18+ (TypeScript)
*   **构建工具**: Vite
*   **样式库**: Tailwind CSS
*   **图表库**: Recharts
*   **图标库**: Lucide React
*   **CI/CD**: GitHub Actions

## 开发与部署指南

### 1. 环境准备

确保您的开发环境中安装了 [Node.js](https://nodejs.org/) (v18+)。

### 2. 安装依赖

```bash
npm install
```

### 3. 本地开发运行

```bash
npm run dev
```

打开浏览器访问终端显示的本地地址（通常是 `http://localhost:3000`）。

### 4. 编译打包

构建用于生产环境的静态文件：

```bash
npm run build
```

构建产物位于 `dist/` 目录下。这些全是静态文件，可以部署到任何静态托管服务（Nginx, Vercel, Netlify, AWS S3 等）。

### 5. 自动化构建 (GitHub Actions)

本项目包含 GitHub Workflows 配置 (`.github/workflows/deploy.yml`)。
当您将代码推送到 GitHub 时，它会自动触发构建流程：

1.  **触发条件**：推送到 `main` 或 `master` 分支。
2.  **执行动作**：安装依赖 -> 运行 TS 检查 -> 打包构建。
3.  **产物**：构建生成的 `dist/` 文件夹会被打包成 Artifact (名为 `production-dist`)，您可以在 GitHub Actions 的运行详情页面下载。

### 6. 关于跨域 (CORS) 问题

**注意**：本项目直接在浏览器端请求 Binance 的 API (`https://www.binance.com/...`)。
*   **开发环境**：建议安装 Chrome 插件 (如 "Allow CORS") 临时解决。
*   **生产环境**：由于 Binance API 安全策略，建议部署 Nginx 反向代理。

#### Nginx 代理示例：
```nginx
location /api/binance/ {
    proxy_pass https://www.binance.com/;
    proxy_set_header Host www.binance.com;
    proxy_set_header Origin https://www.binance.com;
}
```
然后在代码 `services/api.ts` 中将 `API_URL` 修改为你的代理地址。

## 文件结构说明

*   `src/index.tsx`: 入口文件。
*   `src/App.tsx`: 主应用逻辑。
*   `src/services/api.ts`: API 请求封装。
*   `.github/workflows/`: CI/CD 配置文件。
*   `vite.config.ts`: 构建配置。
