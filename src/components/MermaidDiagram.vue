<template>
  <div class="mermaid-wrap">
    <div v-if="loading" class="text-center q-py-md">
      <q-spinner color="primary" size="1.5rem" />
    </div>
    <div v-else-if="error" class="text-caption text-negative q-pa-sm">
      <q-icon name="error_outline" class="q-mr-xs" />Diagram could not be rendered.
    </div>
    <div ref="el" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{ diagram: string }>();

const el = ref<HTMLElement | null>(null);
const loading = ref(true);
const error = ref(false);

let counter = 0;
let mermaidInitialized = false;

async function render() {
  if (!el.value || !props.diagram.trim()) return;
  loading.value = true;
  error.value = false;
  try {
    const mermaid = (await import('mermaid')).default;
    if (!mermaidInitialized) {
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' });
      mermaidInitialized = true;
    }
    const id = `mermaid-${++counter}`;
    const { svg } = await mermaid.render(id, props.diagram);
    if (el.value) el.value.innerHTML = svg;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(render);
watch(() => props.diagram, render);
</script>

<style scoped>
.mermaid-wrap :deep(svg) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}
</style>
