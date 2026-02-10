<template>
  <section class="top-ae-request">
    <header class="top-ae-request_header">
      <div class="top-ae-request_method" :class="`top-ae-request_method-${endpoint.method}`">{{ endpoint.method.toUpperCase() }}</div>
      <div>{{ endpoint.path }}</div>
    </header>

    <nav class="top-ae-request_tabs">
      <button v-for="tab in visibleTabs" :key="tab" type="button" class="top-ae-request_tab" :class="{ 'top-ae-request_tab-active': activeTab===tab }" @click="activeTab = tab">{{ tab }}</button>
    </nav>

    <div class="top-ae-request_content">
      <div v-if="activeTab==='Path' || activeTab==='Query' || activeTab==='Headers'" class="top-ae-request_fields">
        <label v-for="param in activeParameters" :key="param.name" class="top-ae-request_field">
          <span>{{ param.name }}<strong v-if="param.required">*</strong></span>
          <select
            v-if="param.schema?.enum"
            :value="resolveModel(param) as any"
            @change="updateModel(param, ($event.target as HTMLSelectElement).value)"
          >
            <option value="__unset__">Не указывать</option>
            <option v-for="option in param.schema.enum" :key="String(option)" :value="option === null ? '__null__' : String(option)">{{ option === '' ? '"" (пустая строка)' : option === null ? 'null' : option }}</option>
          </select>
          <input v-else :value="String(resolveModel(param) ?? '')" @input="updateModel(param, ($event.target as HTMLInputElement).value)" />
        </label>
      </div>

      <div v-else-if="activeTab==='Auth'" class="top-ae-request_fields">
        <label class="top-ae-request_field">
          <span>Bearer Token</span>
          <input :value="apiKey" @input="$emit('update:apiKey', ($event.target as HTMLInputElement).value)" placeholder="Введите API ключ" />
        </label>
      </div>

      <div v-else-if="activeTab==='Body'" class="top-ae-request_fields">
        <label v-for="field in bodyProperties" :key="field" class="top-ae-request_field">
          <span>{{ field }}<strong v-if="requiredBodyFields.includes(field)">*</strong></span>
          <input :value="String(body[field] ?? '')" @input="onBodyField(field, ($event.target as HTMLInputElement).value)" />
        </label>
      </div>

      <div v-else class="top-ae-request_fields">
        <textarea class="top-ae-request_jsonEditor" :value="rawBody" @input="onRawBody(($event.target as HTMLTextAreaElement).value)" />
      </div>
    </div>

    <footer class="top-ae-request_footer">
      <button type="button" class="top-ae-request_sendButton" @click="$emit('send')">Send Request</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { OpenApiParameter, ParsedEndpoint } from '../../types';

const props = defineProps<{
  endpoint: ParsedEndpoint;
  pathParams: Record<string, unknown>;
  queryParams: Record<string, unknown>;
  headers: Record<string, unknown>;
  body: Record<string, unknown>;
  rawBody: string;
  apiKey: string;
}>();

const emit = defineEmits<{
  'update:pathParams': [value: Record<string, unknown>];
  'update:queryParams': [value: Record<string, unknown>];
  'update:headers': [value: Record<string, unknown>];
  'update:body': [value: Record<string, unknown>];
  'update:rawBody': [value: string];
  'update:apiKey': [value: string];
  send: [];
}>();

const activeTab = ref('Path');

const parameters = computed(() => props.endpoint.operation.parameters ?? []);
const pathParameters = computed(() => parameters.value.filter((item) => item.in === 'path'));
const queryParameters = computed(() => parameters.value.filter((item) => item.in === 'query'));
const headerParameters = computed(() => parameters.value.filter((item) => item.in === 'header'));

const requestSchema = computed<any>(() => props.endpoint.operation.requestBody?.content?.['application/json']?.schema ?? null);
const bodyProperties = computed(() => Object.keys(requestSchema.value?.properties ?? {}));
const requiredBodyFields = computed(() => requestSchema.value?.required ?? []);

const visibleTabs = computed(() => {
  const tabs: string[] = [];
  if (pathParameters.value.length) tabs.push('Path');
  if (queryParameters.value.length) tabs.push('Query');
  tabs.push('Auth');
  if (bodyProperties.value.length) {
    tabs.push('Body');
    tabs.push('Body JSON');
  }
  tabs.push('Headers');
  return tabs;
});

const activeParameters = computed(() => {
  if (activeTab.value === 'Path') return pathParameters.value;
  if (activeTab.value === 'Query') return queryParameters.value;
  return headerParameters.value;
});

watch(
  visibleTabs,
  (tabs) => {
    if (!tabs.includes(activeTab.value)) {
      activeTab.value = tabs[0] ?? 'Auth';
    }
  },
  { immediate: true },
);

function resolveModel(param: OpenApiParameter): unknown {
  if (param.in === 'path') return props.pathParams[param.name];
  if (param.in === 'query') return props.queryParams[param.name];
  return props.headers[param.name];
}

function normalizeValue(value: string): unknown {
  if (value === '__unset__') return undefined;
  if (value === '__null__') return null;
  return value;
}

function updateModel(param: OpenApiParameter, value: string): void {
  const normalizedValue = normalizeValue(value);
  if (param.in === 'path') emit('update:pathParams', { ...props.pathParams, [param.name]: normalizedValue });
  if (param.in === 'query') emit('update:queryParams', { ...props.queryParams, [param.name]: normalizedValue });
  if (param.in === 'header') emit('update:headers', { ...props.headers, [param.name]: normalizedValue });
}

function onBodyField(field: string, value: string): void {
  const nextBody = { ...props.body, [field]: value };
  emit('update:body', nextBody);
  emit('update:rawBody', JSON.stringify(nextBody, null, 2));
}

function onRawBody(value: string): void {
  emit('update:rawBody', value);
  try {
    emit('update:body', JSON.parse(value));
  } catch {
    // ignored while typing
  }
}
</script>

<style scoped>
.top-ae-request { display:grid; grid-template-rows:auto auto 1fr auto; height:100%; }
.top-ae-request_header { position:sticky; top:0; z-index:2; background:#fff; border-bottom:1px solid #ececec; padding:12px; display:flex; gap:8px; align-items:center; }
.top-ae-request_method { color:#fff; border-radius:12px; padding:2px 8px; font-size:12px; }
.top-ae-request_method-get { background:#2e7d32; }
.top-ae-request_method-post { background:#1565c0; }
.top-ae-request_method-put, .top-ae-request_method-patch { background:#ef6c00; }
.top-ae-request_method-delete { background:#c62828; }
.top-ae-request_tabs { position:sticky; top:49px; display:flex; gap:8px; overflow-x:auto; border-bottom:1px solid #ececec; padding:8px; background:#fff; z-index:2; }
.top-ae-request_tab { border:1px solid #ddd; border-radius:6px; background:#fff; padding:6px 10px; }
.top-ae-request_tab-active { background:#f0f4ff; border-color:#b8c7ff; }
.top-ae-request_content { overflow-y:auto; min-height:0; }
.top-ae-request_fields { padding:12px; display:flex; flex-direction:column; gap:10px; }
.top-ae-request_field { display:flex; flex-direction:column; gap:4px; }
.top-ae-request_footer { position:sticky; bottom:0; background:#fff; border-top:1px solid #ececec; padding:12px; }
.top-ae-request_sendButton { width:100%; background:#2864f0; color:#fff; border:0; border-radius:8px; padding:10px; }
.top-ae-request_jsonEditor { min-height:320px; font-family:monospace; }
</style>
