<template>
  <section class="top-ae-settings">
    <h2 class="top-ae-settings_title">Настройки</h2>
    <label class="top-ae-settings_field">
      <span>Ссылка на OpenAPI YAML</span>
      <input
        :value="modelValue"
        type="url"
        placeholder="https://example.com/openapi.yaml"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <small class="top-ae-settings_hint">Оставьте пустым, чтобы использовать встроенную demo-спецификацию.</small>
    </label>
    <div class="top-ae-settings_actions">
      <button type="button" class="top-ae-settings_apply" @click="$emit('apply')">Загрузить спецификацию</button>
      <button type="button" class="top-ae-settings_reset" @click="$emit('reset')">Сбросить</button>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>();

defineEmits<{
  'update:modelValue': [value: string];
  apply: [];
  reset: [];
}>();
</script>

<style scoped>
.top-ae-settings { border-top:1px solid #ececec; padding:12px; display:flex; flex-direction:column; gap:10px; }
.top-ae-settings_title { margin:0; font-size:16px; }
.top-ae-settings_field { display:flex; flex-direction:column; gap:6px; }
.top-ae-settings_hint { color:#777; }
.top-ae-settings_actions { display:flex; gap:8px; }
.top-ae-settings_apply, .top-ae-settings_reset { border:1px solid #d7d7d7; border-radius:8px; padding:8px 12px; background:#fff; }
.top-ae-settings_apply { background:#2864f0; border-color:#2864f0; color:#fff; }
</style>
