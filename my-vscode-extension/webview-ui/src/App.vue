<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

// 在 VS Code Webview 里通过这个对象和扩展侧进行消息通信。
const vscodeApi = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;

// 输入框内容。
const draftMessage = ref("");

// 默认给一条欢迎消息，让侧边栏第一次打开时就像一个可用的聊天面板。
const chatMessages = ref([
  {
    id: "assistant-welcome",
    role: "assistant",
    text: "你好，我是 ultimate ai。请输入你的问题。",
    time: formatCurrentTime()
  }
]);

// 用于在新增消息后把滚动条移动到最底部。
const messageListRef = ref(null);

function formatCurrentTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

// 统一创建消息对象，避免多处手写相同结构。
function createChatMessage(role, text) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    time: formatCurrentTime()
  };
}

function scrollMessagesToBottom() {
  nextTick(() => {
    const messageListElement = messageListRef.value;

    messageListElement?.scrollTo({
      top: messageListElement.scrollHeight,
      behavior: "smooth"
    });
  });
}

function appendChatMessage(role, text) {
  chatMessages.value.push(createChatMessage(role, text));
  scrollMessagesToBottom();
}

function sendMessage() {
  const text = draftMessage.value.trim();

  if (!text) {
    return;
  }

  // 先在前端把用户消息显示出来，再发给扩展侧处理。
  appendChatMessage("user", text);
  vscodeApi?.postMessage({
    command: "send",
    text
  });

  draftMessage.value = "";
}

function handleExtensionMessage(event) {
  const message = event.data;

  if (message.command === "reply" && message.text) {
    appendChatMessage("assistant", message.text);
  }
}

onMounted(() => {
  window.addEventListener("message", handleExtensionMessage);
  scrollMessagesToBottom();
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleExtensionMessage);
});
</script>

<template>
  <section class="chat-panel">
    <header class="chat-header">
      <div>
        <h1 class="chat-title">ultimate ai</h1>
        <p class="chat-subtitle">VS Code 侧边栏聊天面板</p>
      </div>
    </header>

    <main ref="messageListRef" class="message-list">
      <article v-for="message in chatMessages" :key="message.id" class="message-item"
        :class="`message-item-${message.role}`">
        <div class="message-label">
          {{ message.role === "assistant" ? "ultimate ai" : "我" }}
        </div>
        <div class="message-bubble">
          <p class="message-text">{{ message.text }}</p>
          <span class="message-time">{{ message.time }}</span>
        </div>
      </article>
    </main>

    <form class="composer" @submit.prevent="sendMessage">
      <textarea v-model="draftMessage" class="composer-input" rows="3" placeholder="请输入你的问题..."></textarea>
      <button class="send-button" type="submit">发送</button>
    </form>
  </section>
</template>

<style>
:root {
  color-scheme: dark;
}

html,
body,
#app {
  margin: 0;
  height: 100%;
}

body {
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  background: var(--vscode-sideBar-background);
}

* {
  box-sizing: border-box;
}

button,
textarea {
  font: inherit;
}

/* 整个聊天面板采用最简单的上下结构：头部、消息区、输入区。 */
.chat-panel {
  display: flex;
  height: 100vh;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}

.chat-header {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.chat-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chat-subtitle {
  margin: 4px 0 0;
  color: var(--vscode-descriptionForeground);
}

/* 消息区单独滚动，保证输入框始终固定在底部。 */
.message-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-item-user {
  align-items: flex-end;
}

.message-label {
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
}

.message-bubble {
  display: flex;
  max-width: 88%;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 10px;
  background: var(--vscode-editor-background);
}

.message-item-user .message-bubble {
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
  border-color: var(--vscode-button-background);
}

.message-text {
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-time {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
}

/* 输入区保持简洁，只保留多行输入框和发送按钮。 */
.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--vscode-panel-border);
}

.composer-input {
  width: 100%;
  resize: vertical;
  min-height: 80px;
  padding: 10px 12px;
  color: var(--vscode-input-foreground);
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 8px;
  outline: none;
}

.composer-input:focus {
  border-color: var(--vscode-focusBorder);
}

.send-button {
  align-self: flex-end;
  padding: 8px 16px;
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}

.send-button:hover {
  background: var(--vscode-button-hoverBackground);
}
</style>
