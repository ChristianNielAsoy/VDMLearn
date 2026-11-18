<template>
  <div class="hotspot-wrap">
    <svg
      :viewBox="diagram.viewBox"
      xmlns="http://www.w3.org/2000/svg"
      style="width: 100%; height: auto; display: block"
      @click.self="$emit('regionClick', null)"
    >
      <!-- Base drawing — sanitized to prevent XSS via content-pack SVG -->
      <g v-html="sanitizedSvg" />

      <!-- Region markers -->
      <g v-for="region in diagram.regions" :key="region.id">
        <!-- Hit area -->
        <circle
          :cx="region.cx"
          :cy="region.cy"
          r="14"
          :fill="markerFill(region.id)"
          :stroke="markerStroke(region.id)"
          stroke-width="2"
          class="hotspot-marker"
          style="cursor: pointer"
          @click.stop="$emit('regionClick', region.id)"
        />
        <!-- Label number or checkmark -->
        <text
          :x="region.cx"
          :y="region.cy + 5"
          text-anchor="middle"
          font-size="11"
          font-weight="bold"
          :fill="labelColor(region.id)"
          style="pointer-events: none; user-select: none"
        >
          {{ markerText(region.id) }}
        </text>
      </g>
    </svg>

    <!-- Atlas tooltip / detail -->
    <q-card v-if="mode === 'atlas' && selectedRegion" class="dvmr-card q-pa-sm q-mt-sm">
      <div class="text-body2 text-weight-medium">{{ selectedRegion.label }}</div>
      <div v-if="selectedRegion.description" class="text-caption text-grey-6 q-mt-xs">
        {{ selectedRegion.description }}
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DOMPurify from 'dompurify';
import type { HotspotDiagram, HotspotRegion } from '@/types/hotspot';

const props = defineProps<{
  diagram: HotspotDiagram;
  mode: 'atlas' | 'quiz';
  /** In quiz mode: which region ids are correctly identified so far */
  correct?: string[];
  /** In quiz mode: which region is currently being asked */
  activeId?: string | null;
  /** In atlas mode: selected region id */
  selectedId?: string | null;
}>();

defineEmits<{ regionClick: [id: string | null] }>();

const sanitizedSvg = computed(() =>
  DOMPurify.sanitize(props.diagram.svgContent, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  }),
);

const selectedRegion = computed<HotspotRegion | null>(() => {
  if (!props.selectedId) return null;
  return props.diagram.regions.find((r) => r.id === props.selectedId) ?? null;
});

function regionIndex(id: string): number {
  return props.diagram.regions.findIndex((r) => r.id === id) + 1;
}

function markerFill(id: string): string {
  if (props.mode === 'quiz') {
    if (props.correct?.includes(id)) return '#86efac'; // green
    if (props.activeId === id) return '#93c5fd'; // blue (being asked)
    return '#e2e8f0';
  }
  return props.selectedId === id ? '#93c5fd' : '#fff';
}

function markerStroke(id: string): string {
  if (props.mode === 'quiz') {
    if (props.correct?.includes(id)) return '#16a34a';
    if (props.activeId === id) return '#2563eb';
    return '#94a3b8';
  }
  return props.selectedId === id ? '#2563eb' : '#94a3b8';
}

function labelColor(id: string): string {
  if (props.mode === 'quiz') {
    if (props.correct?.includes(id)) return '#166534';
    if (props.activeId === id) return '#1e40af';
    return '#64748b';
  }
  return props.selectedId === id ? '#1e40af' : '#475569';
}

function markerText(id: string): string {
  if (props.mode === 'atlas') return String(regionIndex(id));
  if (props.correct?.includes(id)) return '✓';
  return String(regionIndex(id));
}
</script>

<style scoped>
.hotspot-marker {
  transition:
    fill 0.15s,
    stroke 0.15s;
}
.hotspot-marker:hover {
  opacity: 0.85;
}
</style>
