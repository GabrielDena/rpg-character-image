<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { DisplayCharacter, DisplayState } from '~/types/display';

const state = ref<DisplayState>({
    activeAdventureId: null,
    activeCharacters: [],
    selectedBackground: null,
    galleryFitMode: 'cover',
});

const container = ref<HTMLElement | null>(null);
const containerWidth = ref(import.meta.client ? window.innerWidth : 1920);
const containerHeight = ref(import.meta.client ? window.innerHeight : 1080);

onMounted(() => {
    if (!container.value) return;
    const ro = new ResizeObserver(([entry]) => {
        containerWidth.value = entry?.contentRect.width || 0;
        containerHeight.value = entry?.contentRect.height || 0;
    });
    ro.observe(container.value);
    onUnmounted(() => ro.disconnect());
});

async function fetchState() {
    const data = await $fetch<DisplayState>('/api/display-state');
    state.value = data;
}

onMounted(fetchState);

const store = useAppStore();
watch(() => store.displayStateVersion, fetchState);

// ── Layout computation ──────────────────────────────────────────────────────
const count = computed(() => state.value.activeCharacters.length);

const cols = computed(() => {
    if (count.value === 0) return 1;
    const maxCols = containerWidth.value > 1980 ? 5 : 3;
    return Math.min(count.value, maxCols);
});

const imageStyle = computed<CSSProperties>(() => {
    if (!containerHeight.value) return {};
    const rows = Math.ceil(count.value / cols.value);
    const gap = 4;
    const maxH = Math.floor((containerHeight.value - gap * (rows - 1)) / rows);
    return {
        maxHeight: `${maxH}px`,
        breakInside: 'avoid',
        objectFit: state.value.galleryFitMode,
        objectPosition: state.value.galleryFitMode === 'cover' ? 'top' : 'center',
    };
});
</script>

<template>
    <div
        ref="container"
        class="relative h-full w-full"
        :style="
            state.selectedBackground?.url
                ? {
                      backgroundImage: `url(${state.selectedBackground.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                  }
                : {}
        "
    >
        <!-- Empty state -->
        <Transition name="fade">
            <div
                v-if="count === 0"
                class="flex h-full flex-col items-center justify-center gap-3"
            >
                <UIcon
                    name="i-heroicons-squares-2x2"
                    class="size-12 text-gray-700"
                />
                <p class="text-sm text-gray-500">No characters in scene</p>
            </div>
        </Transition>

        <!-- Character images -->
        <Transition name="fade">
            <div
                v-if="count > 0"
                class="h-full w-full overflow-hidden"
                :style="{ columnCount: cols, columnGap: '4px' }"
            >
                <img
                    v-for="character in state.activeCharacters"
                    :key="character.id"
                    :src="character.profileImageUrl ?? character.avatarUrl ?? undefined"
                    :alt="character.name"
                    class="block w-full"
                    :style="imageStyle"
                />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>

