<template>
  <div class="section-grid">
    <p :class="['badge', validation.valid ? 'ok' : 'bad']">
      {{ validation.valid ? "当前配置可以导出" : "当前配置需要修复" }}
    </p>
    <ul v-if="validation.errors.length" class="messages error">
      <li v-for="message in validation.errors" :key="message">{{ message }}</li>
    </ul>
    <ul v-if="validation.warnings.length" class="messages warn">
      <li v-for="message in validation.warnings" :key="message">{{ message }}</li>
    </ul>
    <p v-if="!validation.errors.length && !validation.warnings.length" class="hint">
      暂无错误或警告。
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ValidationResult } from "@/game/editor/level-editor-utils";

defineProps<{
  validation: ValidationResult;
}>();
</script>

<style scoped>
.section-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  margin: 0;
}

.badge.ok {
  background: rgba(34, 197, 94, 0.15);
  color: #bbf7d0;
}

.badge.bad {
  background: rgba(239, 68, 68, 0.15);
  color: #fecaca;
}

.messages {
  margin: 0;
  padding-left: 18px;
}

.messages.error {
  color: #fecaca;
}

.messages.warn {
  color: #fde68a;
}

.hint {
  margin: 0;
  color: #94a3b8;
}
</style>
