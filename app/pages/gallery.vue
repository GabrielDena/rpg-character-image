<script setup lang="ts">
const store = useAppStore()

const container = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)

onMounted(() => {
    if (!container.value) return
    const ro = new ResizeObserver(([entry]) => {
        containerWidth.value = entry?.contentRect.width || 0
        containerHeight.value = entry?.contentRect.height || 0
    })
    ro.observe(container.value)
    onUnmounted(() => ro.disconnect())
})

const count = computed(() => store.selectedImages.length)

const cols = computed(() => {
    if (count.value === 0) return 1
    const ratio =
        containerWidth.value && containerHeight.value
            ? containerWidth.value / containerHeight.value
            : 16 / 9

    let best = 1
    let bestScore = Infinity
    for (let c = 1; c <= count.value; c++) {
        const r = Math.ceil(count.value / c)
        const score = Math.abs(c / r - ratio)
        if (score < bestScore) {
            bestScore = score
            best = c
        }
    }
    return best
})

const maxImageHeight = computed(() => {
    if (!containerHeight.value) return 'none'
    const rows = Math.ceil(count.value / cols.value)
    const gap = 2
    const usable = containerHeight.value - gap * (rows - 1)
    return `${Math.floor(usable / rows)}px`
})

const fitMode = ref<'cover' | 'contain'>('cover')

const imageStyle = computed(() => ({
    maxHeight: maxImageHeight.value,
    marginBottom: '2px',
    breakInside: 'avoid',
    objectFit: fitMode.value,
    objectPosition: fitMode.value === 'cover' ? 'top' : 'center',
}))

const lightboxSrc = ref<string | null>(null)

function openLightbox(filename: string) {
    lightboxSrc.value = `/api/image/${encodeURIComponent(filename)}`
}

function closeLightbox() {
    lightboxSrc.value = null
}
</script>

<template>
    <div ref="container" class="relative h-full w-full">
        <!-- Empty state -->
        <div
            v-if="count === 0"
            class="flex h-full flex-col items-center justify-center gap-3"
        >
            <UIcon name="i-heroicons-squares-2x2" class="size-12 text-gray-700" />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No images selected</p>
                <p class="mt-1 text-xs text-gray-600">
                    Select images on the Select tab to display them here
                </p>
            </div>
        </div>

        <!-- Column layout -->
        <div
            v-else
            class="h-full w-full overflow-hidden"
            :style="{ columnCount: cols, columnGap: '2px' }"
        >
            <img
                v-for="filename in store.selectedImages"
                :key="filename"
                :src="`/api/image/${encodeURIComponent(filename)}`"
                :alt="filename"
                loading="lazy"
                class="block w-full cursor-pointer"
                :style="imageStyle"
                @click="openLightbox(filename)"
            />
        </div>

        <!-- Fit toggle -->
        <UButton
            v-if="count > 0"
            size="xs"
            color="neutral"
            variant="solid"
            :icon="fitMode === 'cover' ? 'i-heroicons-arrows-pointing-out' : 'i-heroicons-arrows-pointing-in'"
            class="absolute right-2 top-2 opacity-60 hover:opacity-100"
            :ui="{ base: 'bg-gray-900/80 backdrop-blur' }"
            @click="fitMode = fitMode === 'cover' ? 'contain' : 'cover'"
        />

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
