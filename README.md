# Handry

一个可运行的 macOS 原型：打开本地静态 HTML 项目，在画布中点选元素，通过右侧面板实时调整常用 CSS，并以 inline style 保存回原 HTML。

## 运行

需要 Node.js 20+。

```bash
npm install
npm run dev
```

生产构建与启动：

```bash
npm run build
npm start
```

## 使用方式

1. 点击“打开文件夹”，授权一个包含静态 HTML 的目录。
2. 在左侧选择 `.html` 文件。
3. 在中间画布悬停、点击任意 DOM 元素。
4. 在右侧修改字号、颜色、背景、尺寸、间距或圆角。
5. 使用 Undo / Redo 试调；点击“保存”后修改写入该元素的 inline style。

保存前会确认磁盘文件仍与载入版本一致，并先写临时文件再原子替换。若文件已被其他程序修改，编辑器会拒绝覆盖。

## 第一版限制

- 面向静态 HTML；不映射 React/Vue/Svelte 源码。
- 只写 inline style，不修改外部 CSS 规则。
- 复杂、由脚本动态生成或浏览器自动补全结构的 DOM，可能无法安全映射回源文件，此时会拒绝保存。
- 当前 Undo / Redo 针对尚未保存的样式调整。
