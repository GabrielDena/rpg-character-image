<script setup lang="ts">
interface ImageItem {
    filename: string;
    url: string;
}

const store = useAppStore();

const images = ref<ImageItem[]>([]);
const loadingImages = ref(false);
const imagesError = ref<string | null>(null);
const gridCols = ref(4);

const selectedSet = computed(() => new Set(store.selectedImages));
const selectedCount = computed(() => store.selectedImages.length);

async function fetchImages() {
    if (!store.selectedFolder) return;
    loadingImages.value = true;
    imagesError.value = null;
    try {
        const { images: imgs } = await $fetch<{ images: ImageItem[] }>('/api/images');
        images.value = imgs;
    } catch (e: unknown) {
        const err = e as { data?: { message?: string } };
        imagesError.value = err?.data?.message ?? 'Could not load images';
    } finally {
        loadingImages.value = false;
    }
}

// Refetch when folder changes (e.g. updated from another device via WS)
watch(
    () => store.selectedFolder,
    (folder) => {
        if (folder) fetchImages();
        else images.value = [];
    },
    { immediate: true }
);
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Status bar -->
        <div class="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-3">
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-400">
                    <template v-if="loadingImages">Loading…</template>
                    <template v-else-if="store.selectedFolder">
                        {{ images.length }} image{{ images.length !== 1 ? 's' : '' }}
                    </template>
                    <template v-else>No folder selected</template>
                </span>

                <div class="flex items-center gap-2">
                    <UBadge
                        v-if="selectedCount > 0"
                        color="primary"
                        variant="soft"
                        :label="`${selectedCount} selected`"
                    />
                    <UButton
                        v-if="selectedCount > 0"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        label="Clear"
                        @click="store.clearSelection()"
                    />
                    <div class="flex items-center gap-1">
                        <UButton
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            icon="i-heroicons-minus"
                            :disabled="gridCols >= 10"
                            @click="gridCols++"
                        />
                        <UButton
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            icon="i-heroicons-arrow-path"
                            @click="gridCols = 4"
                        />
                        <UButton
                            variant="ghost"
                            color="neutral"
                            size="xs"
                            icon="i-heroicons-plus"
                            :disabled="gridCols <= 2"
                            @click="gridCols--"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div class="min-h-0 flex-1 overflow-y-auto">
            <!-- No folder selected -->
            <UEmpty
                v-if="!store.selectedFolder"
                icon="i-heroicons-folder"
                title="No folder selected"
                description="Go to the Folder tab to choose a folder first"
                class="py-20"
            />

            <!-- Loading skeleton -->
            <div
                v-else-if="loadingImages"
                class="grid gap-0.5"
                :style="`grid-template-columns: repeat(${gridCols}, minmax(0, 1fr))`"
            >
                <USkeleton
                    v-for="n in 12"
                    :key="n"
                    class="aspect-square w-full"
                />
            </div>

            <!-- Error state -->
            <div
                v-else-if="imagesError"
                class="p-4"
            >
                <UAlert
                    icon="i-heroicons-exclamation-triangle"
                    color="error"
                    variant="soft"
                    title="Could not load images"
                    :description="imagesError"
                    :actions="[{ label: 'Retry', leadingIcon: 'i-heroicons-arrow-path', onClick: fetchImages }]"
                />
            </div>

            <!-- Empty folder -->
            <UEmpty
                v-else-if="!images.length"
                icon="i-heroicons-photo"
                title="No images found"
                description="This folder contains no supported image files"
                class="py-20"
            />

            <!-- Image grid -->
            <div
                v-else
                class="grid gap-0.5"
                :style="`grid-template-columns: repeat(${gridCols}, minmax(0, 1fr))`"
            >
                <button
                    v-for="image in images"
                    :key="image.filename"
                    class="group relative aspect-square overflow-hidden bg-gray-800 focus:outline-none"
                    @click="store.toggleImage(image.filename)"
                >
                    <img
                        :src="image.url"
                        :alt="image.filename"
                        loading="lazy"
                        class="size-full object-cover transition-opacity duration-150"
                        :class="selectedSet.has(image.filename) ? 'opacity-80' : 'opacity-100'"
                    />

                    <!-- Selection tint -->
                    <div
                        v-if="selectedSet.has(image.filename)"
                        class="bg-primary-500/20 pointer-events-none absolute inset-0"
                    />

                    <!-- Selection indicator -->
                    <div
                        class="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full transition-all duration-150"
                        :class="
                            selectedSet.has(image.filename)
                                ? 'bg-primary-500 ring-2 ring-white'
                                : 'bg-black/50 ring-1 ring-white/30'
                        "
                    >
                        <UIcon
                            v-if="selectedSet.has(image.filename)"
                            name="i-heroicons-check"
                            class="size-3 text-white"
                        />
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>

