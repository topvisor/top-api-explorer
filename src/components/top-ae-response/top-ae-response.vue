<template>
  <section class="top-ae-response">
    <header class="top-ae-response_header">
      <div>Response</div>
      <div v-if="response" class="top-ae-response_status" :class="statusClass">
        <span class="top-ae-response_indicator" />
        {{ response.status }} {{ response.statusText }} · {{ response.elapsedMs }}ms
      </div>
    </header>
    <nav class="top-ae-response_tabs">
      <button type="button" class="top-ae-response_tab" :class="{ 'top-ae-response_tab-active': activeTab==='Body' }" @click="activeTab='Body'">Body</button>
      <button type="button" class="top-ae-response_tab" :class="{ 'top-ae-response_tab-active': activeTab==='Headers' }" @click="activeTab='Headers'">Headers</button>
    </nav>
    <div class="top-ae-response_content">
      <pre v-if="!response" class="top-ae-response_placeholder">Отправьте запрос, чтобы увидеть ответ.</pre>
      <pre v-else-if="activeTab === 'Body'">{{ prettyBody }}</pre>
      <pre v-else>{{ JSON.stringify(response.headers, null, 2) }}</pre>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ResponseState } from '../../types';

const props = defineProps<{ response: ResponseState | null }>();
const activeTab = ref<'Body' | 'Headers'>('Body');

const statusClass = computed(() => {
  const status = props.response?.status ?? 0;
  return status >= 200 && status < 300 ? 'top-ae-response_status-success' : 'top-ae-response_status-error';
});

const prettyBody = computed(() => {
  if (!props.response) return '';
  if (typeof props.response.body === 'string') return props.response.body;
  return JSON.stringify(props.response.body, null, 2);
});
</script>

<style scoped>
.top-ae-response { height:100%; display:grid; grid-template-rows:auto auto 1fr; border-left:1px solid #ececec; }
.top-ae-response_header { position:sticky; top:0; background:#fff; border-bottom:1px solid #ececec; padding:12px; z-index:2; display:flex; justify-content:space-between; }
.top-ae-response_tabs { position:sticky; top:49px; background:#fff; border-bottom:1px solid #ececec; padding:8px; display:flex; gap:8px; z-index:2; }
.top-ae-response_tab { border:1px solid #ddd; border-radius:6px; background:#fff; padding:6px 10px; }
.top-ae-response_tab-active { background:#f0f4ff; border-color:#b8c7ff; }
.top-ae-response_content { overflow-y:auto; min-height:0; padding:12px; }
.top-ae-response_placeholder { color:#787878; }
.top-ae-response_status { display:flex; align-items:center; gap:6px; font-size:12px; }
.top-ae-response_indicator { width:8px; height:8px; border-radius:50%; background:currentColor; }
.top-ae-response_status-success { color:#2e7d32; }
.top-ae-response_status-error { color:#c62828; }
</style>
