<template>
  <div class="top-ae-app">
    <button type="button" class="top-ae-app_burger" @click="drawerOpen = true">☰</button>

    <div class="top-ae-app_left" :class="{ 'top-ae-app_left-open': drawerOpen }">
      <button type="button" class="top-ae-app_close" @click="drawerOpen = false">×</button>
      <div class="top-ae-app_leftContent">
        <top-ae-endpointSelector
          :grouped="groupedEndpoints"
          :selected-operation-id="requestState.operationId"
          @select="onSelectOperation"
        />
        <top-ae-settings
          v-model="specUrlInput"
          @apply="applySpecUrl"
          @reset="resetSpec"
        />
      </div>
    </div>

    <main class="top-ae-app_center">
      <div v-if="isLoadingSpec" class="top-ae-app_state">Загрузка OpenAPI спецификации...</div>
      <div v-else-if="specError" class="top-ae-app_state top-ae-app_state-error">
        {{ specError }}
      </div>
      <top-ae-request
        v-else-if="selectedEndpoint"
        :endpoint="selectedEndpoint"
        :path-params="requestState.pathParams"
        :query-params="requestState.queryParams"
        :headers="requestState.headers"
        :body="requestState.body"
        :raw-body="requestState.rawBody"
        :api-key="apiKey"
        @update:path-params="requestState.pathParams = $event"
        @update:query-params="requestState.queryParams = $event"
        @update:headers="requestState.headers = $event"
        @update:body="requestState.body = $event"
        @update:raw-body="requestState.rawBody = $event"
        @update:api-key="apiKey = $event"
        @send="sendRequest"
      />
      <div v-else class="top-ae-app_state">Выберите endpoint из списка.</div>
    </main>

    <aside class="top-ae-app_right">
      <top-ae-response :response="response" />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { groupByTag, loadEmbeddedSpec, loadSpecFromUrl, parseEndpoints } from '../../openapi';
import {
  emptyRequestState,
  parseSpecUrlFromHash,
  parseStateFromHash,
  readApiKey,
  saveApiKey,
  saveSpecUrlToHash,
  saveStateToHash,
} from '../../state';
import type { ParsedEndpoint, ResponseState } from '../../types';
import TopAeEndpointSelector from '../top-ae-endpointSelector/top-ae-endpointSelector.vue';
import TopAeRequest from '../top-ae-request/top-ae-request.vue';
import TopAeResponse from '../top-ae-response/top-ae-response.vue';
import TopAeSettings from '../top-ae-settings/top-ae-settings.vue';

const requestState = ref(parseStateFromHash() ?? emptyRequestState());
const response = ref<ResponseState | null>(null);
const apiKey = ref(readApiKey());
const drawerOpen = ref(false);

const endpoints = ref<ParsedEndpoint[]>([]);
const groupedEndpoints = computed(() => groupByTag(endpoints.value));
const selectedEndpoint = computed(() => endpoints.value.find((item) => item.operation.operationId === requestState.value.operationId));

const isLoadingSpec = ref(false);
const specError = ref('');
const specUrlInput = ref(parseSpecUrlFromHash());
const currentServerUrl = ref(window.location.origin);

watch(
  requestState,
  (value) => saveStateToHash(value),
  { deep: true },
);

watch(apiKey, (value) => saveApiKey(value));

function resetRequestSelection(nextEndpoints: ParsedEndpoint[]): void {
  const activeOperationExists = nextEndpoints.some((item) => item.operation.operationId === requestState.value.operationId);
  if (!activeOperationExists) {
    requestState.value = {
      ...emptyRequestState(),
      operationId: nextEndpoints[0]?.operation.operationId ?? '',
    };
    return;
  }

  requestState.value = {
    ...requestState.value,
    pathParams: {},
    queryParams: {},
    headers: {},
    body: {},
    rawBody: '{}',
  };
}

async function setSpecFromSource(specUrl: string): Promise<void> {
  isLoadingSpec.value = true;
  specError.value = '';

  try {
    const spec = specUrl ? await loadSpecFromUrl(specUrl) : loadEmbeddedSpec();
    const parsedEndpoints = parseEndpoints(spec);

    if (!parsedEndpoints.length) {
      throw new Error('В спецификации не найдено ни одного endpoint.');
    }

    endpoints.value = parsedEndpoints;
    currentServerUrl.value = spec.servers?.[0]?.url ?? window.location.origin;
    resetRequestSelection(parsedEndpoints);
  } catch (error) {
    endpoints.value = [];
    specError.value = error instanceof Error ? error.message : 'Ошибка загрузки спецификации.';
  } finally {
    isLoadingSpec.value = false;
  }
}

function onSelectOperation(operationId: string): void {
  requestState.value.operationId = operationId;
  drawerOpen.value = false;
}

async function applySpecUrl(): Promise<void> {
  const normalized = specUrlInput.value.trim();
  saveSpecUrlToHash(normalized);
  await setSpecFromSource(normalized);
}

async function resetSpec(): Promise<void> {
  specUrlInput.value = '';
  saveSpecUrlToHash('');
  await setSpecFromSource('');
}

let controller: AbortController | null = null;

function cleanObject(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== null && !(value === '' && value !== 0)),
  );
}

async function sendRequest(): Promise<void> {
  const endpoint = selectedEndpoint.value;
  if (!endpoint) return;

  controller?.abort();
  controller = new AbortController();

  const startedAt = performance.now();

  const pathParams = cleanObject(requestState.value.pathParams);
  const queryParams = cleanObject(requestState.value.queryParams);
  const customHeaders = cleanObject(requestState.value.headers);

  const urlPath = endpoint.path.replace(/\{(.*?)\}/g, (_, key) => encodeURIComponent(String(pathParams[key] ?? '')));
  const url = new URL(urlPath, currentServerUrl.value);

  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, String(value));
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(customHeaders)) headers.set(key, String(value));
  if (apiKey.value) headers.set('Authorization', `Bearer ${apiKey.value}`);
  if (requestState.value.rawBody?.trim()) headers.set('Content-Type', 'application/json');

  let requestBody: BodyInit | undefined;
  if (endpoint.operation.requestBody) {
    requestBody = JSON.stringify(cleanObject(requestState.value.body));
  }

  try {
    const res = await fetch(url, {
      method: endpoint.method.toUpperCase(),
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json') ? await res.json() : await res.text();

    response.value = {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      body,
      elapsedMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') return;
    response.value = {
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: String(error),
      elapsedMs: Math.round(performance.now() - startedAt),
    };
  }
}

void setSpecFromSource(specUrlInput.value.trim());
</script>

<style scoped>
.top-ae-app { height:100vh; overflow:hidden; display:grid; grid-template-columns:300px 1fr 36%; }
.top-ae-app_left, .top-ae-app_center, .top-ae-app_right { min-height:0; overflow:hidden; }
.top-ae-app_leftContent { height:100%; display:grid; grid-template-rows:1fr auto; }
.top-ae-app_burger, .top-ae-app_close { display:none; }
.top-ae-app_state { padding:20px; }
.top-ae-app_state-error { color:#c62828; }

@media (max-width: 1024px) {
  .top-ae-app { grid-template-columns: 1fr 1fr; }
  .top-ae-app_left {
    position:fixed; inset:0 auto 0 0; width:320px; background:#fff; z-index:10;
    transform:translateX(-100%); transition:transform .2s;
    box-shadow:2px 0 12px rgba(0,0,0,.15);
  }
  .top-ae-app_left-open { transform:translateX(0); }
  .top-ae-app_burger { position:fixed; top:8px; left:8px; z-index:11; display:block; }
  .top-ae-app_close { display:block; margin:8px; }
}
</style>
