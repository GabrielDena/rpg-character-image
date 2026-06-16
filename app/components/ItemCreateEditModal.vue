<script setup lang="ts">
import type { Item, ItemCategory } from '#shared/types/models';

const props = defineProps<{
    open: boolean;
    adventureId: string;
    systemId: string;
    item?: Item | null;
    categories: ItemCategory[];
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    created: [];
    updated: [];
    deleted: [];
}>();

const isEditing = computed(() => !!props.item);

const toast = useToast();

const formName = ref('');
const formDescription = ref('');
const formCategoryId = ref('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement>();
const clearImage = ref(false);
const saving = ref(false);
const saveError = ref<string | null>(null);
const showDeleteConfirm = ref(false);
const deleting = ref(false);

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

watch(
    () => props.open,
    (val) => {
        if (!val) return;
        saveError.value = null;
        selectedFile.value = null;
        clearImage.value = false;
        if (props.item) {
            formName.value = props.item.name;
            formDescription.value = props.item.description ?? '';
            formCategoryId.value = props.item.categoryId ?? '';
            previewUrl.value = props.item.url ?? null;
        } else {
            formName.value = '';
            formDescription.value = '';
            formCategoryId.value = '';
            if (previewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value);
            previewUrl.value = null;
        }
    }
);

function handleFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (previewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value);
    selectedFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
    clearImage.value = false;
    (e.target as HTMLInputElement).value = '';
}

function removeImage() {
    if (previewUrl.value?.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value);
    selectedFile.value = null;
    previewUrl.value = null;
    clearImage.value = true;
    if (fileInputRef.value) fileInputRef.value.value = '';
}

async function save() {
    const name = formName.value.trim();
    if (!name) return;

    saving.value = true;
    saveError.value = null;

    try {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('description', formDescription.value.trim());
        fd.append('categoryId', formCategoryId.value);
        fd.append('password', getPassword());
        if (selectedFile.value) fd.append('file', selectedFile.value);

        if (isEditing.value) {
            fd.append('systemId', props.systemId);
            fd.append('adventureId', props.adventureId);
            if (clearImage.value) fd.append('clearImage', 'true');
            await $fetch(`/api/items/${props.item!.id}`, { method: 'PATCH', body: fd });
            emit('updated');
        } else {
            fd.append('adventureId', props.adventureId);
            fd.append('systemId', props.systemId);
            await $fetch('/api/items', { method: 'POST', body: fd });
            emit('created');
        }

        emit('update:open', false);
        toast.add({
            title: isEditing.value ? 'Item updated' : 'Item created',
            color: 'success',
            icon: 'i-heroicons-check-circle',
        });
    } catch (e: unknown) {
        saveError.value = e instanceof Error ? e.message : 'Something went wrong';
    } finally {
        saving.value = false;
    }
}

async function confirmDelete() {
    if (!props.item) return;
    deleting.value = true;
    try {
        await $fetch(`/api/items/${props.item.id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        emit('deleted');
        emit('update:open', false);
        toast.add({ title: 'Item deleted', color: 'success', icon: 'i-heroicons-check-circle' });
    } catch {
        toast.add({ title: 'Failed to delete item', color: 'error' });
    } finally {
        deleting.value = false;
        showDeleteConfirm.value = false;
    }
}
</script>

<template>
    <UModal
        :open="open"
        :title="isEditing ? 'Edit Item' : 'New Item'"
        :ui="{ content: 'sm:max-w-lg' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-5">
                <!-- Image -->
                <UFormField label="Image">
                    <div class="flex items-start gap-4">
                        <div
                            class="relative h-32 w-32 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 transition-colors hover:border-violet-500"
                            @click="fileInputRef?.click()"
                        >
                            <img
                                v-if="previewUrl"
                                :src="previewUrl"
                                alt="Item image"
                                class="size-full object-cover"
                            />
                            <div
                                v-else
                                class="flex size-full items-center justify-center"
                            >
                                <UIcon
                                    name="i-heroicons-photo"
                                    class="size-8 text-gray-600"
                                />
                            </div>
                        </div>
                        <div class="space-y-2 pt-1">
                            <UButton
                                size="sm"
                                color="neutral"
                                variant="outline"
                                leading-icon="i-heroicons-arrow-up-tray"
                                @click="fileInputRef?.click()"
                            >
                                {{ previewUrl ? 'Replace' : 'Upload image' }}
                            </UButton>
                            <UButton
                                v-if="previewUrl"
                                size="sm"
                                color="error"
                                variant="ghost"
                                leading-icon="i-heroicons-trash"
                                @click="removeImage"
                            >
                                Remove
                            </UButton>
                            <p class="text-xs text-gray-500">Optional</p>
                        </div>
                        <input
                            ref="fileInputRef"
                            type="file"
                            accept="image/*"
                            class="hidden"
                            @change="handleFileSelect"
                        />
                    </div>
                </UFormField>

                <!-- Name -->
                <UFormField
                    label="Name"
                    required
                >
                    <UInput
                        v-model="formName"
                        placeholder="e.g. Ancient Map"
                        autofocus
                    />
                </UFormField>

                <!-- Description -->
                <UFormField label="Description">
                    <UTextarea
                        v-model="formDescription"
                        placeholder="Optional description or notes"
                        :rows="3"
                    />
                </UFormField>

                <!-- Category -->
                <UFormField label="Category">
                    <div
                        v-if="categories.length"
                        class="flex flex-wrap gap-2"
                    >
                        <button
                            type="button"
                            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                            :class="
                                formCategoryId === ''
                                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            "
                            @click="formCategoryId = ''"
                        >
                            None
                        </button>
                        <button
                            v-for="cat in categories"
                            :key="cat.id"
                            type="button"
                            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                            :class="
                                formCategoryId === cat.id
                                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                            "
                            @click="formCategoryId = cat.id"
                        >
                            {{ cat.name }}
                        </button>
                    </div>
                    <p
                        v-else
                        class="text-xs text-gray-500"
                    >
                        No categories yet. Use the tag icon in the items list to create some.
                    </p>
                </UFormField>

                <p
                    v-if="saveError"
                    class="text-sm text-red-400"
                >
                    {{ saveError }}
                </p>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between gap-2">
                <UButton
                    v-if="isEditing"
                    color="error"
                    variant="ghost"
                    leading-icon="i-heroicons-trash"
                    @click="showDeleteConfirm = true"
                >
                    Delete
                </UButton>
                <div
                    v-else
                    class="flex-1"
                />
                <div class="flex gap-2">
                    <UButton
                        color="neutral"
                        variant="ghost"
                        @click="emit('update:open', false)"
                    >
                        Cancel
                    </UButton>
                    <UButton
                        :loading="saving"
                        :disabled="!formName.trim()"
                        @click="save"
                    >
                        {{ isEditing ? 'Save' : 'Create' }}
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>

    <UModal
        :open="showDeleteConfirm"
        title="Delete Item"
        :ui="{ content: 'sm:max-w-sm' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="showDeleteConfirm = $event"
    >
        <template #body>
            <p class="text-sm text-gray-300">
                Are you sure you want to delete
                <span class="font-medium text-gray-100">{{ props.item?.name }}</span>? This action
                cannot be undone.
            </p>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    :disabled="deleting"
                    @click="showDeleteConfirm = false"
                >
                    Cancel
                </UButton>
                <UButton
                    color="error"
                    :loading="deleting"
                    @click="confirmDelete"
                >
                    Delete
                </UButton>
            </div>
        </template>
    </UModal>
</template>
