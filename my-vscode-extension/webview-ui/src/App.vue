<script setup>
import { onMounted, ref } from "vue";

const messages = ref([
  {
    role: "assistant",
    text: "你好，我是侧边栏里的插件对话框。"
  }
]);
const input = ref("");

const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;

function addMessage(text, role) {
  messages.value.push({ text, role });
}

function sendMessage() {
  const text = input.value.trim();

  if (text) {
    addMessage(text, "user");
  }

  vscode?.postMessage({
    command: "send",
    text
  });

  input.value = "";
}

onMounted(() => {
  window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.command === "reply") {
      addMessage(message.text, "assistant");
    }
  });
});
</script>

<template>
  <section class="dialog">
    <div class="dialog-header">ultimate Ai</div>
    <div class="messages">
      <div
        v-for="(message, index) in messages"
        :key="`${message.role}-${index}`"
        class="message"
        :class="message.role"
      >
        {{ message.text }}
      </div>
    </div>
    <form class="composer" @submit.prevent="sendMessage">
      <input v-model="input" type="text" placeholder="输入一句话..." />
      <button type="submit">发送</button>
    </form>
  </section>
</template>

<style>
body {
  margin: 0;
  padding: 16px;
  color: var(--vscode-foreground);
  background: var(--vscode-sideBar-background);
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
}

.dialog {
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  background: var(--vscode-editor-background);
  overflow: hidden;
}

.dialog-header {
  padding: 12px 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--vscode-panel-border);
  background: var(--vscode-sideBarSectionHeader-background);
}

.messages {
  min-height: 160px;
  padding: 12px;
}

.message {
  max-width: 90%;
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  line-height: 1.45;
  word-break: break-word;
}

.message.assistant {
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
}

.message.user {
  margin-left: auto;
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
}

.composer {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--vscode-panel-border);
}

input {
  min-width: 0;
  flex: 1;
  padding: 7px 8px;
  color: var(--vscode-input-foreground);
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  outline: none;
}

input:focus {
  border-color: var(--vscode-focusBorder);
}

button {
  padding: 7px 12px;
  color: var(--vscode-button-foreground);
  background: var(--vscode-button-background);
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: var(--vscode-button-hoverBackground);
}
</style>
