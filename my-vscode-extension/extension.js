const vscode = require('vscode');
const fs = require("node:fs");
const path = require("node:path");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const helloCommand = vscode.commands.registerCommand('ultimateAgent', () => {
    vscode.window.showInformationMessage('Hello from your ultimate agent VS Code extension demo!');
  });

  const dialogViewProvider = new DemoDialogViewProvider(context.extensionUri);
  const dialogView = vscode.window.registerWebviewViewProvider(
    'minimalDemo.chatView',
    dialogViewProvider
  );

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = '$(rocket) ultimate Ai';
  statusBarItem.tooltip = 'Open ultimate Ai';
  statusBarItem.command = 'ultimateAgent';
  statusBarItem.show();

  context.subscriptions.push(helloCommand, dialogView, statusBarItem);
}

function deactivate() { }

class DemoDialogViewProvider {
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
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, "webview-dist")
      ]
    };

    webviewView.webview.html = getWebviewHtml(webviewView.webview, this.extensionUri);

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command === 'send') {
        const text = String(message.text || '').trim();
        const reply = text
          ? `你刚刚说：“${text}”`
          : '先输入一句话，再点击发送。';

        webviewView.webview.postMessage({
          command: 'reply',
          text: reply
        });
      }
    });
  }
}

function getWebviewHtml(webview, extensionUri) {
  const distUri = vscode.Uri.joinPath(extensionUri, "webview-dist");
  const htmlPath = path.join(distUri.fsPath, "index.html");

  if (!fs.existsSync(htmlPath)) {
    return getMissingBuildHtml();
  }

  const html = fs.readFileSync(htmlPath, "utf8");

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
  <h3>ultimate Ai</h3>
  <p>Vue Webview 还没有构建。</p>
  <p>请先在扩展目录执行 <code>pnpm run build:webview</code>。</p>
</body>
</html>`;
}

module.exports = {
  activate,
  deactivate
};
