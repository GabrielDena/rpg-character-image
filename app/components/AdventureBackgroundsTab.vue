<script setup lang="ts">
import type { BackgroundWithUrl } from '~/types/background';

const props = defineProps<{
    adventureId: string;
    systemId: string;
}>();

const toast = useToast();

const list = ref<BackgroundWithUrl[]>([]);
const loading = ref(false);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const editingId = ref<string | null>(null);
const editingName = ref('');
const search = ref('');

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return list.value;
    return list.value.filter((bg) => bg.name.toLowerCase().includes(q));
});

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

async function fetchBackgrounds() {
    loading.value = true;
    try {
        const { backgrounds } = await $fetch<{ backgrounds: BackgroundWithUrl[] }>(
            '/api/backgrounds',
            { query: { adventureId: props.adventureId } }
        );
        list.value = backgrounds;
    } finally {
        loading.value = false;
    }
}

async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploading.value = true;
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('adventureId', props.adventureId);
        formData.append('systemId', props.systemId);
        formData.append('name', file.name.replace(/\.[^.]+$/, ''));
        formData.append('password', getPassword());
        await $fetch('/api/backgrounds', { method: 'POST', body: formData });
        await fetchBackgrounds();
        toast.add({ title: 'Background uploaded', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch (e: unknown) {
        toast.add({ title: 'Upload failed', color: 'error', description: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
        uploading.value = false;
        input.value = '';
    }
}

function startEdit(bg: BackgroundWithUrl) {
    editingId.value = bg.id;
    editingName.value = bg.name;
}

function cancelEdit() {
    editingId.value = null;
    editingName.value = '';
}

async function saveEdit(bg: BackgroundWithUrl) {
    const name = editingName.value.trim();
    if (!name) return;
    try {
        await $fetch(`/api/backgrounds/${bg.id}`, {
            method: 'PATCH',
            body: { name, password: getPassword() },
        });
        bg.name = name;
        editingId.value = null;
    } catch (e: unknown) {
        toast.add({ title: 'Rename failed', color: 'error', description: e instanceof Error ? e.message : 'Unknown error' });
    }
}

async function deleteBackground(bg: BackgroundWithUrl) {
    try {
        await $fetch(`/api/backgrounds/${bg.id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        list.value = list.value.filter((b) => b.id !== bg.id);
        toast.add({ title: 'Background deleted', color: 'success' });
    } catch (e: unknown) {
        toast.add({ title: 'Delete failed', color: 'error', description: e instanceof Error ? e.message : 'Unknown error' });
    }
}

onMounted(fetchBackgrounds);
</script>

<template>
    <div>
        <div class="space-y-2 p-4 pb-2">
            <div class="flex items-center justify-between">
                <p class="text-xs text-gray-500">
                    {{ filtered.length }} background{{ filtered.length !== 1 ? 's' : '' }}
                </p>
                <UButton
                    size="sm"
                    leading-icon="i-heroicons-arrow-up-tray"
                    :loading="uploading"
                    @click="fileInputRef?.click()"
                >
                    Upload
                </UButton>
                <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleFileSelect"
                />
            </div>
            <UInput
                v-model="search"
                placeholder="Search backgrounds…"
                leading-icon="i-heroicons-magnifying-glass"
                size="sm"
                :ui="{ root: 'w-full' }"
            />
        </div>

        <div
            v-if="loading"
            class="space-y-2 p-4"
        >
            <USkeleton
                v-for="n in 3"
                :key="n"
                class="h-16 w-full rounded-xl"
            />
        </div>

        <div
            v-else-if="!list.length"
            class="flex flex-col items-center justify-center gap-4 px-6 py-20"
        >
            <UIcon
                name="i-heroicons-photo"
                class="size-12 text-gray-700"
            />
            <div class="text-center">
                <p class="text-sm font-medium text-gray-400">No backgrounds yet</p>
                <p class="mt-1 text-xs text-gray-600">Upload images to use as backgrounds</p>
            </div>
        </div>

        <p
            v-else-if="search && !filtered.length"
            class="px-4 py-8 text-center text-sm text-gray-500"
        >
            No backgrounds match "{{ search }}"
        </p>

        <ul
            v-else
            class="space-y-px p-2"
        >
            <li
                v-for="bg in filtered"
                :key="bg.id"
                class="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-800"
            >
                <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                    <img
                        v-if="bg.url"
                        :src="bg.url"
                        :alt="bg.name"
                        class="size-full object-cover"
                    />
                </div>

                <div class="min-w-0 flex-1">
                    <input
                        v-if="editingId === bg.id"
                        v-model="editingName"
                        autofocus
                        class="w-full rounded-md bg-gray-700 px-2 py-1 text-sm text-gray-100 ring-1 ring-violet-500 outline-none"
                        @keyup.enter="saveEdit(bg)"
                        @keyup.escape="cancelEdit"
                        @blur="cancelEdit"
                    />
                    <p
                        v-else
                        class="truncate text-sm text-gray-200"
                    >
                        {{ bg.name }}
                    </p>
                </div>

                <div class="flex shrink-0 items-center gap-1">
                    <template v-if="editingId === bg.id">
                        <UButton
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            icon="i-heroicons-check"
                            @mousedown.prevent="saveEdit(bg)"
                        />
                        <UButton
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            icon="i-heroicons-x-mark"
                            @mousedown.prevent="cancelEdit"
                        />
                    </template>
                    <template v-else>
                        <UButton
                            size="xs"
                            variant="ghost"
                            color="neutral"
                            icon="i-heroicons-pencil"
                            @click="startEdit(bg)"
                        />
                        <UButton
                            size="xs"
                            variant="ghost"
                            color="error"
                            icon="i-heroicons-trash"
                            @click="deleteBackground(bg)"
                        />
                    </template>
                </div>
            </li>
        </ul>
    </div>
</template>
