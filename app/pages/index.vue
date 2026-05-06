<script setup lang="ts">
import { removeBackground } from '@imgly/background-removal';

const BUCKET = 'adventures';
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'jfif', 'png', 'gif', 'webp', 'avif', 'bmp']);

interface StorageItem {
    name: string;
    id: string | null;
    metadata: Record<string, unknown> | null;
}

const supabase = useSupabase();
const store = useAppStore();
const toast = useToast();

// --- Auth ---
const isAuthenticated = ref(false);
const passwordInput = ref('');
const verifying = ref(false);
const passwordError = ref<string | null>(null);
const showPassword = ref(false);

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

async function verifyPassword() {
    if (!passwordInput.value) return;
    verifying.value = true;
    passwordError.value = null;
    try {
        await $fetch('/api/auth/verify', { method: 'POST', body: { password: passwordInput.value } });
        localStorage.setItem('app_password', passwordInput.value);
        isAuthenticated.value = true;
        await browse();
    } catch {
        passwordError.value = 'Incorrect password';
    } finally {
        verifying.value = false;
    }
}

// --- Browser state ---
const currentPath = ref('');
const items = ref<StorageItem[]>([]);
const pending = ref(false);
const fetchError = ref<string | null>(null);
const saving = ref(false);
const uploading = ref(false);
const showCreateForm = ref(false);
const newFolderName = ref('');
const creatingFolder = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);
const lastFolder = ref<string | null>(null);
const loadingLastFolder = ref(false);
const removeBgOnUpload = ref(true);
const saveBoth = ref(true);
const processingImages = ref(false);
const uploadProgress = ref({ current: 0, total: 0 });

const isDev = computed(() => import.meta.dev);

const pathSegments = computed(() => {
    if (!currentPath.value) return [];
    const parts = currentPath.value.split('/').filter(Boolean);
    return parts.map((part, i) => ({
        label: part,
        path: parts.slice(0, i + 1).join('/'),
    }));
});

const folders = computed(() => items.value.filter((item) => !item.id && item.name !== '.keep'));
const imageFiles = computed(() =>
    items.value.filter((item) => item.id && IMAGE_EXTS.has(item.name.split('.').pop()?.toLowerCase() ?? ''))
);
const previewUrls = computed(() =>
    imageFiles.value.slice(0, 12).map((img) => {
        const path = currentPath.value ? `${currentPath.value}/${img.name}` : img.name;
        return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    })
);

const isCurrentSaved = computed(() => !!currentPath.value && store.selectedFolder === currentPath.value);

async function browse(path = '') {
    pending.value = true;
    fetchError.value = null;
    showCreateForm.value = false;
    try {
        const { items: data } = await $fetch<{ items: StorageItem[] }>('/api/storage/list', {
            method: 'POST',
            body: { password: getPassword(), path },
        });
        items.value = data.filter((item) => item.name !== '.keep');
        currentPath.value = path;
    } catch (e: unknown) {
        fetchError.value = e instanceof Error ? e.message : 'Could not list bucket';
    } finally {
        pending.value = false;
    }
}

async function selectFolder(path?: string) {
    const folderPath = path || currentPath.value;
    if (!folderPath) return;
    saving.value = true;
    try {
        await $fetch('/api/folder', { method: 'POST', body: { path: folderPath, password: getPassword() } });
        store.selectedFolder = folderPath;
        store.selectedImages = [];
        lastFolder.value = folderPath;
        toast.add({
            title: 'Folder selected',
            description: folderPath,
            color: 'success',
            icon: 'i-heroicons-check-circle',
        });
    } catch {
        toast.add({ title: 'Could not select folder', color: 'error', icon: 'i-heroicons-exclamation-circle' });
    } finally {
        saving.value = false;
    }
}

async function selectLastFolder() {
    if (!lastFolder.value) return;
    loadingLastFolder.value = true;
    try {
        await selectFolder(lastFolder.value);
    } finally {
        loadingLastFolder.value = false;
    }
}

async function fetchLastFolder() {
    try {
        const { folder } = await $fetch<{ folder: string | null }>('/api/last-folder');
        lastFolder.value = folder;
    } catch {
        lastFolder.value = null;
    }
}

function validateFolderName(name: string): string | null {
    if (!name) return 'Folder name is required';
    if (name.length > 255) return 'Folder name is too long (max 255 characters)';
    
    const invalidChars = /[<>:"\/\\|?*\x00-\x1F]/;
    if (invalidChars.test(name)) {
        return 'Folder name contains invalid characters';
    }
    
    if (name === '.' || name === '..') {
        return 'Invalid folder name';
    }
    
    if (name.startsWith('.')) {
        return 'Folder name cannot start with a dot';
    }
    
    return null;
}

async function createFolder() {
    const name = newFolderName.value.trim();
    
    const validationError = validateFolderName(name);
    if (validationError) {
        toast.add({
            title: 'Invalid folder name',
            description: validationError,
            color: 'error',
            icon: 'i-heroicons-exclamation-circle',
        });
        return;
    }
    
    creatingFolder.value = true;
    try {
        const placeholderPath = currentPath.value ? `${currentPath.value}/${name}/.keep` : `${name}/.keep`;
        await $fetch('/api/storage/folder', {
            method: 'POST',
            body: { password: getPassword(), path: placeholderPath },
        });
        showCreateForm.value = false;
        newFolderName.value = '';
        await browse(currentPath.value);
        toast.add({ title: 'Folder created', description: name, color: 'success', icon: 'i-heroicons-folder-plus' });
    } catch (e: unknown) {
        toast.add({
            title: 'Could not create folder',
            description: e instanceof Error ? e.message : 'Unknown error',
            color: 'error',
            icon: 'i-heroicons-exclamation-circle',
        });
    } finally {
        creatingFolder.value = false;
    }
}

async function handleUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    const password = getPassword();
    uploading.value = true;
    const failed: string[] = [];
    
    try {
        let filesToUpload: { file: File | Blob; path: string }[] = [];
        
        if (removeBgOnUpload.value) {
            processingImages.value = true;
            uploadProgress.value = { current: 0, total: files.length };
            
            const noBgFolder = currentPath.value ? `${currentPath.value}/no-bg` : 'no-bg';
            
            try {
                await $fetch('/api/storage/folder', {
                    method: 'POST',
                    body: { password, path: `${noBgFolder}/.keep` },
                });
            } catch (error) {
                console.log('no-bg folder might already exist or creation failed:', error);
            }
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file) continue;
                
                if (saveBoth.value) {
                    const originalPath = currentPath.value ? `${currentPath.value}/${file.name}` : file.name;
                    filesToUpload.push({ file, path: originalPath });
                }
                
                try {
                    const blob = await removeBackground(file);
                    const fileName = file.name.replace(/(\.[^.]+)$/, '.png');
                    const path = `${noBgFolder}/${fileName}`;
                    filesToUpload.push({ file: blob, path });
                } catch (error) {
                    console.error(`Failed to remove background from ${file.name}:`, error);
                    if (!saveBoth.value) {
                        const path = currentPath.value ? `${currentPath.value}/${file.name}` : file.name;
                        filesToUpload.push({ file, path });
                    }
                }
                uploadProgress.value.current = i + 1;
            }
            processingImages.value = false;
        } else {
            filesToUpload = files.map(f => {
                const path = currentPath.value ? `${currentPath.value}/${f.name}` : f.name;
                return { file: f, path };
            });
        }
        
        const partialWarnings: string[] = [];
        
        await Promise.all(
            filesToUpload.map(async ({ file, path }) => {
                try {
                    const signed = await $fetch<{ token: string; path: string }>('/api/storage/sign-upload', {
                        method: 'POST',
                        body: { password, path },
                    });
                    const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(signed.path, signed.token, file);
                    if (error) {
                        const fileName = path.split('/').pop() || path;
                        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
                            partialWarnings.push(fileName);
                        } else {
                            failed.push(fileName);
                        }
                    }
                } catch (error) {
                    const fileName = path.split('/').pop() || path;
                    failed.push(fileName);
                }
            })
        );
        
        await browse(currentPath.value);
        
        if (failed.length) {
            toast.add({
                title: `${failed.length} file(s) failed to upload`,
                color: 'error',
                icon: 'i-heroicons-exclamation-circle',
            });
        } else if (partialWarnings.length) {
            const successCount = filesToUpload.length - partialWarnings.length;
            toast.add({
                title: `${successCount} file(s) uploaded`,
                description: `${partialWarnings.length} version(s) already existed`,
                color: 'warning',
                icon: 'i-heroicons-exclamation-triangle',
            });
        } else {
            toast.add({
                title: `${filesToUpload.length} image${filesToUpload.length !== 1 ? 's' : ''} uploaded`,
                color: 'success',
                icon: 'i-heroicons-cloud-arrow-up',
            });
        }
    } finally {
        uploading.value = false;
        processingImages.value = false;
        uploadProgress.value = { current: 0, total: 0 };
        input.value = '';
    }
}

onMounted(() => {
    isAuthenticated.value = !!localStorage.getItem('app_password');
    if (isAuthenticated.value) {
        browse();
        fetchLastFolder();
    }
});
</script>

<template>
    <!-- Password gate -->
    <div
        v-if="!isAuthenticated"
        class="flex h-full flex-col items-center justify-center bg-gray-950 px-6"
    >
        <div class="w-full max-w-xs space-y-4">
            <p class="text-center text-sm font-medium text-gray-300">Enter password to continue</p>
            <UInput
                v-model="passwordInput"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password"
                size="lg"
                :disabled="verifying"
                autofocus
                @keyup.enter="verifyPassword"
            >
                <template #trailing>
                    <UButton
                        variant="link"
                        color="neutral"
                        size="xs"
                        :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                        :padded="false"
                        @click="showPassword = !showPassword"
                    />
                </template>
            </UInput>
            <p
                v-if="passwordError"
                class="text-center text-sm text-red-400"
            >
                {{ passwordError }}
            </p>
            <UButton
                block
                size="lg"
                :loading="verifying"
                :disabled="!passwordInput"
                @click="verifyPassword"
            >
                Continue
            </UButton>
        </div>
    </div>

    <!-- Main app -->
    <div
        v-else
        class="flex h-full flex-col"
    >
        <!-- Breadcrumb -->
        <div class="shrink-0 border-b border-gray-800 bg-gray-900">
            <div class="flex items-center gap-0.5 overflow-x-auto px-2 py-2 [&::-webkit-scrollbar]:hidden">
                <UButton
                    variant="ghost"
                    color="neutral"
                    size="xs"
                    icon="i-heroicons-circle-stack"
                    class="shrink-0 text-gray-500"
                    @click="browse('')"
                />
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
                        @click="i < pathSegments.length - 1 ? browse(seg.path) : undefined"
                    />
                </template>
            </div>
        </div>

        <!-- Image preview strip -->
        <div
            v-if="previewUrls.length"
            class="shrink-0 border-b border-gray-800 bg-gray-950"
        >
            <div class="flex gap-1.5 overflow-x-auto px-2 py-2 [&::-webkit-scrollbar]:hidden">
                <img
                    v-for="url in previewUrls"
                    :key="url"
                    :src="url"
                    class="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
            </div>
        </div>

        <!-- Folder list -->
        <div class="min-h-0 flex-1 overflow-y-auto">
            <div
                v-if="pending"
                class="space-y-1 p-3"
            >
                <USkeleton
                    v-for="n in 8"
                    :key="n"
                    class="h-12 w-full rounded-xl"
                />
            </div>

            <div
                v-else-if="fetchError"
                class="p-4"
            >
                <UAlert
                    icon="i-heroicons-exclamation-triangle"
                    color="error"
                    variant="soft"
                    title="Cannot load bucket"
                    :description="fetchError"
                />
            </div>

            <UEmpty
                v-else-if="!folders.length && !imageFiles.length"
                icon="i-heroicons-folder-open"
                title="Empty folder"
                description="No subfolders or images here"
                class="py-20"
            />

            <ul
                v-else
                class="space-y-0.5 p-2"
            >
                <li
                    v-for="folder in folders"
                    :key="folder.name"
                >
                    <button
                        class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-gray-800 active:bg-gray-700"
                        @click="browse(currentPath ? `${currentPath}/${folder.name}` : folder.name)"
                    >
                        <UIcon
                            name="i-heroicons-folder"
                            class="size-5 shrink-0 text-gray-500"
                        />
                        <span class="min-w-0 flex-1 truncate text-sm text-gray-200">{{ folder.name }}</span>
                        <UIcon
                            name="i-heroicons-chevron-right"
                            class="size-4 shrink-0 text-gray-600"
                        />
                    </button>
                </li>
            </ul>
        </div>

        <!-- Create folder inline form -->
        <div
            v-if="showCreateForm"
            class="shrink-0 border-t border-gray-800 bg-gray-900 px-4 py-3"
        >
            <div class="flex gap-2">
                <UInput
                    v-model="newFolderName"
                    placeholder="Folder name"
                    class="flex-1"
                    autofocus
                    @keyup.enter="createFolder"
                    @keyup.esc="
                        showCreateForm = false;
                        newFolderName = '';
                    "
                />
                <UButton
                    color="primary"
                    label="Create"
                    :loading="creatingFolder"
                    :disabled="!newFolderName.trim()"
                    @click="createFolder"
                />
                <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-heroicons-x-mark"
                    @click="
                        showCreateForm = false;
                        newFolderName = '';
                    "
                />
            </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 space-y-3 border-t border-gray-800 bg-gray-950 p-4">
            <BatchRemoveBackground
                v-if="isDev"
                :current-path="currentPath"
                @refresh="browse(currentPath)"
            />
            
            <!-- Upload processing indicator -->
            <div
                v-if="processingImages"
                class="rounded-lg border border-blue-800 bg-blue-950/30 px-3 py-2"
            >
                <div class="flex items-center gap-2">
                    <UIcon
                        name="i-heroicons-scissors"
                        class="size-4 text-blue-400"
                    />
                    <span class="text-sm text-blue-300">
                        Removing backgrounds... {{ uploadProgress.current }}/{{ uploadProgress.total }}
                    </span>
                </div>
            </div>
            
            <div class="flex gap-2">
                <label class="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5 transition-colors hover:bg-gray-800">
                    <input
                        v-model="removeBgOnUpload"
                        type="checkbox"
                        class="size-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <UIcon
                        name="i-heroicons-scissors"
                        class="size-4 text-gray-400"
                    />
                    <span class="flex-1 text-sm text-gray-300">Remove BG</span>
                </label>
                
                <label
                    v-if="removeBgOnUpload"
                    class="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5 transition-colors hover:bg-gray-800"
                >
                    <input
                        v-model="saveBoth"
                        type="checkbox"
                        class="size-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <UIcon
                        name="i-heroicons-document-duplicate"
                        class="size-4 text-gray-400"
                    />
                    <span class="flex-1 text-sm text-gray-300">Save Both</span>
                </label>
            </div>
            
            <div class="flex gap-2">
                <UButton
                    class="flex-1"
                    color="neutral"
                    variant="outline"
                    leading-icon="i-heroicons-folder-plus"
                    label="New folder"
                    @click="showCreateForm = !showCreateForm"
                />
                <UButton
                    class="flex-1"
                    color="neutral"
                    variant="outline"
                    leading-icon="i-heroicons-cloud-arrow-up"
                    label="Upload"
                    :loading="uploading"
                    @click="fileInput?.click()"
                />
                <input
                    ref="fileInput"
                    type="file"
                    multiple
                    accept="image/*"
                    class="hidden"
                    @change="handleUpload"
                />
            </div>
            <UButton
                block
                size="lg"
                :color="isCurrentSaved ? 'neutral' : 'primary'"
                :variant="isCurrentSaved ? 'outline' : 'solid'"
                :leading-icon="isCurrentSaved ? 'i-heroicons-check-circle' : 'i-heroicons-folder-open'"
                :disabled="!currentPath || pending"
                :loading="saving && !loadingLastFolder"
                @click="() => selectFolder()"
            >
                {{ isCurrentSaved ? 'Current folder selected' : 'Select this folder' }}
            </UButton>
            
            <div
                v-if="store.selectedFolder || lastFolder"
                class="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2"
            >
                <div class="min-w-0 flex-1">
                    <p class="text-xs text-gray-500">
                        {{ store.selectedFolder ? 'Current Selected Folder' : 'Last Selected Folder' }}
                    </p>
                    <p class="truncate text-sm text-gray-300">
                        {{ store.selectedFolder || lastFolder }}
                    </p>
                </div>
                <UButton
                    v-if="!store.selectedFolder && lastFolder"
                    color="primary"
                    variant="soft"
                    size="xs"
                    label="Select"
                    :loading="loadingLastFolder"
                    @click="selectLastFolder"
                />
            </div>
        </div>
    </div>
</template>
