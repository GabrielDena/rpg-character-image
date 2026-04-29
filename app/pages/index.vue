<script setup lang="ts">
interface Directory {
    name: string;
    path: string;
}

interface BrowseResult {
    current: string;
    parent: string | null;
    directories: Directory[];
}

interface PreviewImage {
    filename: string;
    url: string;
}

const toast = useToast();

const savedFolder = ref<string | null>(null);
const browseData = ref<BrowseResult | null>(null);
const pending = ref(false);
const browseError = ref<string | null>(null);
const saving = ref(false);
const previewImages = ref<PreviewImage[]>([]);

async function browse(path?: string) {
    pending.value = true;
    browseError.value = null;
    previewImages.value = [];
    try {
        const params = path ? `?path=${encodeURIComponent(path)}` : '';
        const [browse, preview] = await Promise.all([
            $fetch<BrowseResult>(`/api/folder/browse${params}`),
            $fetch<{ images: PreviewImage[] }>(`/api/folder/preview${params}`),
        ]);
        browseData.value = browse;
        previewImages.value = preview.images;
    } catch (e: unknown) {
        const err = e as { data?: { message?: string } };
        browseError.value = err?.data?.message ?? 'Could not read directory';
    } finally {
        pending.value = false;
    }
}

onMounted(async () => {
    try {
        const { folder } = await $fetch<{ folder: string | null }>('/api/folder');
        savedFolder.value = folder;
        await browse(folder ?? undefined);
    } catch {
        await browse();
    }
});

function navigate(path: string) {
    browse(path);
}

const pathSegments = computed(() => {
    const path = browseData.value?.current;
    if (!path) return [];
    const parts = path.split('/').filter(Boolean);
    return parts.map((part, i) => ({
        label: part,
        path: '/' + parts.slice(0, i + 1).join('/'),
    }));
});

const isCurrentSaved = computed(() => !!browseData.value?.current && browseData.value.current === savedFolder.value);

async function selectFolder() {
    const path = browseData.value?.current;
    if (!path) return;
    saving.value = true;
    try {
        await $fetch('/api/folder', { method: 'POST', body: { path } });
        savedFolder.value = path;
        toast.add({
            title: 'Folder selected',
            description: path,
            color: 'success',
            icon: 'i-heroicons-check-circle',
        });
    } catch (e: unknown) {
        const err = e as { data?: { message?: string } };
        toast.add({
            title: 'Could not select folder',
            description: err?.data?.message ?? 'Unknown error',
            color: 'error',
            icon: 'i-heroicons-exclamation-circle',
        });
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Path breadcrumb bar -->
        <div class="shrink-0 border-b border-gray-800 bg-gray-900">
            <div class="flex items-center gap-0.5 overflow-x-auto px-2 py-2 [&::-webkit-scrollbar]:hidden">
                <!-- Root home button -->
                <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    icon="i-heroicons-home"
                    class="shrink-0 text-gray-500"
                    @click="navigate('/')"
                />

                <!-- Path segments -->
                <template
                    v-for="(seg, i) in pathSegments"
                    :key="seg.path"
                >
                    <UIcon
                        name="i-heroicons-chevron-right"
                        class="size-3 shrink-0 text-gray-700"
                    />
                    <UButton
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        :label="seg.label"
                        class="max-w-36 shrink-0 truncate"
                        :class="
                            i === pathSegments.length - 1
                                ? 'cursor-default text-gray-100'
                                : 'text-gray-500 hover:text-gray-300'
                        "
                        @click="i < pathSegments.length - 1 ? navigate(seg.path) : undefined"
                    />
                </template>
            </div>
        </div>

        <!-- Image preview strip -->
        <div
            v-if="previewImages.length"
            class="shrink-0 border-b border-gray-800 bg-gray-950"
        >
            <div class="flex gap-1.5 overflow-x-auto px-2 py-2 [&::-webkit-scrollbar]:hidden">
                <img
                    v-for="img in previewImages"
                    :key="img.filename"
                    :src="img.url"
                    :alt="img.filename"
                    :title="img.filename"
                    class="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
            </div>
        </div>

        <!-- Folder list -->
        <div class="min-h-0 flex-1 overflow-y-auto">
            <!-- Loading skeleton -->
            <div
                v-if="pending"
                class="space-y-1 p-3"
            >
                <USkeleton
                    v-for="n in 10"
                    :key="n"
                    class="h-12 w-full rounded-xl"
                />
            </div>

            <!-- Error state -->
            <div
                v-else-if="browseError"
                class="p-4"
            >
                <UAlert
                    icon="i-heroicons-exclamation-triangle"
                    color="error"
                    variant="soft"
                    title="Cannot read directory"
                    :description="browseError"
                />
            </div>

            <!-- Empty state -->
            <UEmpty
                v-else-if="!browseData?.directories.length"
                icon="i-heroicons-folder-open"
                title="No subfolders"
                description="This folder contains no subdirectories"
                class="py-20"
            />

            <!-- Directory list -->
            <ul
                v-else
                class="space-y-0.5 p-2"
            >
                <li
                    v-for="dir in browseData.directories"
                    :key="dir.path"
                >
                    <button
                        class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-800 active:bg-gray-700"
                        @click="navigate(dir.path)"
                    >
                        <UIcon
                            name="i-heroicons-folder"
                            class="size-5 shrink-0 text-gray-500"
                        />
                        <span class="min-w-0 flex-1 truncate text-sm text-gray-200">
                            {{ dir.name }}
                        </span>
                        <UIcon
                            name="i-heroicons-chevron-right"
                            class="size-4 shrink-0 text-gray-600"
                        />
                    </button>
                </li>
            </ul>
        </div>

        <!-- Select footer -->
        <div class="shrink-0 border-t border-gray-800 bg-gray-950 p-4">
            <UButton
                block
                size="lg"
                :color="isCurrentSaved ? 'neutral' : 'primary'"
                :variant="isCurrentSaved ? 'outline' : 'solid'"
                :leading-icon="isCurrentSaved ? 'i-heroicons-check-circle' : 'i-heroicons-folder-open'"
                :disabled="!browseData?.current || pending"
                :loading="saving"
                @click="selectFolder"
            >
                {{ isCurrentSaved ? 'Current folder selected' : 'Select this folder' }}
            </UButton>
        </div>
    </div>
</template>

