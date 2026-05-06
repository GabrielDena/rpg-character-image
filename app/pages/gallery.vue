<script setup lang="ts">
import type { CSSProperties } from 'vue';

const BUCKET = 'adventures';

const supabase = useSupabase();
const store = useAppStore();

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

const count = computed(() => store.selectedImages.length);

const cols = computed(() => {
    if (count.value === 0) return 1;
    const ratio = containerWidth.value && containerHeight.value ? containerWidth.value / containerHeight.value : 16 / 9;

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

const maxImageHeight = computed(() => {
    if (!containerHeight.value) return 'none';
    const rows = Math.ceil(count.value / cols.value);
    const gap = 2;
    const usable = containerHeight.value - gap * (rows - 1);
    return `${Math.floor(usable / rows)}px`;
});

const fitMode = ref<'cover' | 'contain'>('cover');

const imageStyle = computed<CSSProperties>(() => ({
    maxHeight: maxImageHeight.value,
    marginBottom: '2px',
    breakInside: 'avoid',
    objectFit: fitMode.value,
    objectPosition: fitMode.value === 'cover' ? 'top' : 'center',
}));

const lightboxSrc = ref<string | null>(null);
const showBgModal = ref(false);
const backgroundImages = ref<string[]>([]);
const selectedBackground = ref<string | null>(null);
const loadingBackgrounds = ref(false);

onMounted(() => {
    if (import.meta.client) {
        const savedFitMode = localStorage.getItem('gallery_fitMode');
        if (savedFitMode === 'cover' || savedFitMode === 'contain') {
            fitMode.value = savedFitMode;
        }

        const savedBackground = localStorage.getItem('gallery_selectedBackground');
        if (savedBackground) {
            selectedBackground.value = savedBackground;
        }
    }
});

watch(fitMode, (newValue) => {
    if (import.meta.client) {
        localStorage.setItem('gallery_fitMode', newValue);
    }
});

watch(selectedBackground, (newValue) => {
    if (import.meta.client) {
        if (newValue) {
            localStorage.setItem('gallery_selectedBackground', newValue);
        } else {
            localStorage.removeItem('gallery_selectedBackground');
        }
    }
});

function getPublicUrl(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function openLightbox(path: string) {
    lightboxSrc.value = getPublicUrl(path);
}

function closeLightbox() {
    lightboxSrc.value = null;
}

async function fetchBackgroundImages() {
    if (!store.selectedFolder) return;

    loadingBackgrounds.value = true;
    try {
        const bgPath = `${store.selectedFolder}/backgrounds`;
        const password = import.meta.client ? (localStorage.getItem('app_password') ?? '') : '';

        const response = await $fetch<{ items: { name: string; id: string | null }[] }>('/api/storage/list', {
            method: 'POST',
            body: { password, path: bgPath },
        }).catch((err) => {
            console.error('Fetch error:', err);
            return { items: [] };
        });

        const items = response?.items || [];
        console.log('Background images data:', items);

        const imageExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp']);
        backgroundImages.value = items
            .filter((file) => {
                if (!file.name || file.name === '.keep' || !file.id) return false;
                const ext = file.name.split('.').pop()?.toLowerCase();
                return ext && imageExts.has(ext);
            })
            .map((file) => `${bgPath}/${file.name}`);

        console.log('Filtered background images:', backgroundImages.value);
    } catch (error) {
        console.error('Error fetching backgrounds:', error);
        backgroundImages.value = [];
    } finally {
        loadingBackgrounds.value = false;
    }
}

function openBgModal() {
    showBgModal.value = true;
    fetchBackgroundImages();
}

function selectBackground(path: string) {
    selectedBackground.value = path;
    showBgModal.value = false;
}

function clearBackground() {
    selectedBackground.value = null;
}
</script>

<template>
    <div
        ref="container"
        class="relative h-full w-full"
        :style="
            selectedBackground
                ? {
                      backgroundImage: `url(${getPublicUrl(selectedBackground)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                  }
                : {}
        "
    >
        <!-- Empty state -->
        <div
            v-if="count === 0"
            class="flex h-full flex-col items-center justify-center gap-3"
        >
            <UIcon
                name="i-heroicons-squares-2x2"
                class="size-12 text-gray-700"
            />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No images selected</p>
                <p class="mt-1 text-xs text-gray-600">Select images on the Select tab to display them here</p>
            </div>
        </div>

        <!-- Column layout -->
        <div
            v-else
            class="h-full w-full overflow-hidden"
            :style="{ columnCount: cols, columnGap: '2px' }"
        >
            <img
                v-for="path in store.selectedImages"
                :key="path"
                :src="getPublicUrl(path)"
                :alt="path.split('/').pop()"
                loading="lazy"
                class="block w-full cursor-pointer"
                :style="imageStyle"
                @click="openLightbox(path)"
            />
        </div>

        <!-- Action buttons -->
        <div
            v-if="count > 0"
            class="absolute top-2 right-2 flex gap-2"
        >
            <UButton
                size="xs"
                color="neutral"
                variant="solid"
                icon="i-heroicons-photo"
                class="text-white opacity-60 hover:opacity-100"
                :ui="{ base: 'bg-gray-900/80 backdrop-blur' }"
                @click="openBgModal"
            >
                Select BG
            </UButton>
            <UButton
                v-if="selectedBackground"
                size="xs"
                color="neutral"
                variant="solid"
                icon="i-heroicons-x-mark"
                class="text-white opacity-60 hover:opacity-100"
                :ui="{ base: 'bg-gray-900/80 backdrop-blur' }"
                @click="clearBackground"
            />
            <UButton
                size="xs"
                color="neutral"
                variant="solid"
                :icon="fitMode === 'cover' ? 'i-heroicons-arrows-pointing-out' : 'i-heroicons-arrows-pointing-in'"
                class="text-white opacity-60 hover:opacity-100"
                :ui="{ base: 'bg-gray-900/80 backdrop-blur' }"
                @click="fitMode = fitMode === 'cover' ? 'contain' : 'cover'"
            />
        </div>

        <!-- Lightbox -->
        <Transition name="lightbox">
            <div
                v-if="lightboxSrc"
                class="absolute inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/90"
                @click="closeLightbox"
            >
                <img
                    :src="lightboxSrc"
                    class="max-h-full max-w-full object-contain"
                />
            </div>
        </Transition>

        <!-- Background selection modal -->
        <Transition name="lightbox">
            <div
                v-if="showBgModal"
                class="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                @click.self="showBgModal = false"
            >
                <div class="w-full max-w-2xl rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-100">Select Background</h3>
                        <UButton
                            size="xs"
                            color="neutral"
                            variant="ghost"
                            icon="i-heroicons-x-mark"
                            @click="showBgModal = false"
                        />
                    </div>

                    <div
                        v-if="loadingBackgrounds"
                        class="flex items-center justify-center py-12"
                    >
                        <UIcon
                            name="i-heroicons-arrow-path"
                            class="size-8 animate-spin text-gray-500"
                        />
                    </div>

                    <div
                        v-else-if="backgroundImages.length === 0"
                        class="py-12 text-center"
                    >
                        <UIcon
                            name="i-heroicons-photo"
                            class="mx-auto size-12 text-gray-700"
                        />
                        <p class="mt-2 text-sm text-gray-400">No backgrounds found</p>
                        <p class="mt-1 text-xs text-gray-600">Add images to the "backgrounds" folder</p>
                    </div>

                    <div
                        v-else
                        class="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto"
                    >
                        <button
                            v-for="bgPath in backgroundImages"
                            :key="bgPath"
                            class="group relative aspect-video overflow-hidden rounded-lg border-2 transition-all hover:border-blue-500"
                            :class="selectedBackground === bgPath ? 'border-blue-500' : 'border-transparent'"
                            @click="selectBackground(bgPath)"
                        >
                            <img
                                :src="getPublicUrl(bgPath)"
                                :alt="bgPath.split('/').pop()"
                                class="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div
                                v-if="selectedBackground === bgPath"
                                class="absolute inset-0 flex items-center justify-center bg-blue-500/20"
                            >
                                <UIcon
                                    name="i-heroicons-check-circle"
                                    class="size-8 text-blue-500"
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.lightbox-enter-active,
.lightbox-leave-active {
    transition: opacity 0.2s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
    opacity: 0;
}
</style>

