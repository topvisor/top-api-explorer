<template>
  <aside class="top-ae-endpointSelector">
    <header class="top-ae-endpointSelector_header">Endpoints</header>
    <div class="top-ae-endpointSelector_content">
      <details v-for="(items, tag) in grouped" :key="tag" class="top-ae-endpointSelector_group" open>
        <summary class="top-ae-endpointSelector_groupTitle">{{ tag }}</summary>
        <button
          v-for="endpoint in items"
          :key="endpoint.operation.operationId"
          type="button"
          class="top-ae-endpointSelector_item"
          :class="{ 'top-ae-endpointSelector_item-active': endpoint.operation.operationId === selectedOperationId }"
          @click="$emit('select', endpoint.operation.operationId)"
        >
          <span class="top-ae-endpointSelector_method" :class="`top-ae-endpointSelector_method-${endpoint.method}`">{{ endpoint.method.toUpperCase() }}</span>
          <span>{{ endpoint.operation.summary || endpoint.path }}</span>
        </button>
      </details>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { ParsedEndpoint } from '../../types';

defineProps<{
  grouped: Record<string, ParsedEndpoint[]>;
  selectedOperationId: string;
}>();

defineEmits<{ select: [operationId: string] }>();
</script>

<style scoped>
.top-ae-endpointSelector { display:flex; flex-direction:column; height:100%; border-right:1px solid #e8e8e8; }
.top-ae-endpointSelector_header { position:sticky; top:0; padding:12px; font-weight:600; background:#fff; z-index:1; }
.top-ae-endpointSelector_content { overflow-y:auto; padding:8px; }
.top-ae-endpointSelector_group { border:1px solid #eee; border-radius:8px; margin-bottom:8px; }
.top-ae-endpointSelector_groupTitle { cursor:pointer; padding:8px; font-weight:600; }
.top-ae-endpointSelector_item { display:flex; width:100%; gap:8px; padding:8px; border:0; background:transparent; text-align:left; cursor:pointer; }
.top-ae-endpointSelector_item-active { background:#f2f6ff; }
.top-ae-endpointSelector_method { min-width:58px; font-size:12px; border-radius:12px; padding:2px 8px; color:#fff; text-align:center; }
.top-ae-endpointSelector_method-get { background:#2e7d32; }
.top-ae-endpointSelector_method-post { background:#1565c0; }
.top-ae-endpointSelector_method-put, .top-ae-endpointSelector_method-patch { background:#ef6c00; }
.top-ae-endpointSelector_method-delete { background:#c62828; }
</style>
