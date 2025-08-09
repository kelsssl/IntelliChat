<template>
  <div class="left-sidebar">
    <!-- 先放一些占位图标 -->
    <div class="icon">🔍</div>
    <div class="icon">💬</div>
    <div class="icon">📄</div>
  </div>
</template>

<style scoped>
.left-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 1.5rem;
  background-color: #f1f3f5; /* 浅灰色背景 */
}
.icon {
  font-size: 1.5rem;
  cursor: pointer;
}
</style>
