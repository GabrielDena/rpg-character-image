<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { BackgroundWithUrl } from '~/components/AdventureBackgroundsTab.vue';
import type { CharacterWithUrl } from '~/components/CharacterCreateModal.vue';

interface DisplayCharacter extends CharacterWithUrl {
    profileImageUrl: string | null;
}

interface DisplayState {
    activeAdventureId: string | null;
    activeCharacters: DisplayCharacter[];
    selectedBackground: (BackgroundWithUrl & { url: string }) | null;
    galleryFitMode: 'cover' | 'contain';
}

const state = ref<DisplayState>({
    activeAdventureId: null,
    activeCharacters: [],
    selectedBackground: null,
    galleryFitMode: 'cover',
});

const container = ref<HTMLElement | null>(null);
const containerWidth = ref(0);
const containerHeight = ref(0);

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
    const ratio =
        containerWidth.value && containerHeight.value
            ? containerWidth.value / containerHeight.value
            : 16 / 9;

    let best = 1;
    let bestScore = Infinity;
    for (let c = 1; c <= count.value; c++) {
        const r = Math.ceil(count.value / c);
        const score = Math.abs(c / r - ratio);
        if (score < bestScore) {
            bestScore = score;
            best = c;
        }
    }
    return best;
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

