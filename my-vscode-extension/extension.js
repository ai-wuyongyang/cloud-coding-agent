const vscode = require("vscode");
const fs = require("node:fs");
const path = require("node:path");

// 集中声明扩展里会复用的 ID，避免 package.json 和代码里的字符串散落各处。
const SIDEBAR_CONTAINER_ID = "ultimateAiSidebar";
const CHAT_VIEW_ID = "ultimateAiChatView";
const OPEN_SIDEBAR_COMMAND_ID = "ultimateAi.openSidebar";
const WEBVIEW_BUILD_DIR = "webview-dist";

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // 注册一个命令，方便从命令面板直接聚焦到 ultimate ai 侧边栏。
  const openSidebarCommand = vscode.commands.registerCommand(OPEN_SIDEBAR_COMMAND_ID, async () => {
    await vscode.commands.executeCommand(`workbench.view.extension.${SIDEBAR_CONTAINER_ID}`);
  });

  // 注册侧边栏里的 Webview 视图提供者。
  const chatViewProvider = new UltimateAiSidebarProvider(context.extensionUri);
  const chatViewRegistration = vscode.window.registerWebviewViewProvider(
    CHAT_VIEW_ID,
    chatViewProvider
  );

  context.subscriptions.push(openSidebarCommand, chatViewRegistration);
}

function deactivate() { }

class UltimateAiSidebarProvider {
  /**
   * @param {vscode.Uri} extensionUri
   */
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }

  /**
   * @param {vscode.WebviewView} webviewView
   */
  resolveWebviewView(webviewView) {
    // 只允许 Webview 读取构建产物目录，避免不必要的本地文件访问范围。
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, WEBVIEW_BUILD_DIR)
      ]
    };

    webviewView.webview.html = getWebviewHtml(webviewView.webview, this.extensionUri);

    // 这里负责接收前端发来的聊天消息，并返回一个最简单的演示回复。
    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === "send") {
        const text = String(message.text || "").trim();
        const reply = text
          ? `ultimate ai 已收到你的消息：${text}`
          : "先输入一句话，再点击发送。";

        webviewView.webview.postMessage({
          command: "reply",
          text: reply
        });
      }
    });
  }
}

function getWebviewHtml(webview, extensionUri) {
  // Webview 实际加载的是构建后的静态资源，而不是源码目录。
  const distUri = vscode.Uri.joinPath(extensionUri, WEBVIEW_BUILD_DIR);
  const htmlPath = path.join(distUri.fsPath, "index.html");

  if (!fs.existsSync(htmlPath)) {
    return getMissingBuildHtml();
  }

  const html = fs.readFileSync(htmlPath, "utf8");

  // Vite 构建出的相对资源路径需要转换成 VS Code Webview 可访问的安全 URI。
  return html.replace(/(src|href)="([^"]+)"/g, (full, attribute, resourcePath) => {
    if (
      resourcePath.startsWith("http") ||
      resourcePath.startsWith("https") ||
      resourcePath.startsWith("data:") ||
      resourcePath.startsWith("#")
    ) {
      return full;
    }

    const normalizedPath = resourcePath.replace(/^\.\//, "");
    const resourceUri = vscode.Uri.joinPath(distUri, normalizedPath);
    const webviewUri = webview.asWebviewUri(resourceUri);

    return `${attribute}="${webviewUri}"`;
  });
}

function getMissingBuildHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      padding: 16px;
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
    }
  </style>
</head>
<body>
  <h3>ultimate ai</h3>
  <p>Vue Webview 还没有构建。</p>
  <p>请先在扩展目录执行 <code>pnpm run build:webview</code>。</p>
</body>
</html>`;
}

module.exports = {
  activate,
  deactivate
};
