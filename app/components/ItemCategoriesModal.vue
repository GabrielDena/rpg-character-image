<script setup lang="ts">
import type { ItemCategory } from '#shared/types/models';

const props = defineProps<{
    open: boolean;
    adventureId: string;
    categories: ItemCategory[];
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    'category-added': [category: ItemCategory];
    'category-updated': [category: ItemCategory];
    'category-deleted': [id: string];
}>();

const toast = useToast();

const adding = ref(false);
const newName = ref('');
const editingId = ref<string | null>(null);
const editingName = ref('');

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

async function addCategory() {
    const name = newName.value.trim();
    if (!name) return;
    try {
        const { category } = await $fetch<{ category: ItemCategory }>('/api/item-categories', {
            method: 'POST',
            body: { name, adventureId: props.adventureId, password: getPassword() },
        });
        emit('category-added', category);
        newName.value = '';
        adding.value = false;
    } catch (e: unknown) {
        toast.add({
            title: 'Failed to add category',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    }
}

function cancelAdd() {
    adding.value = false;
    newName.value = '';
}

function startEdit(cat: ItemCategory) {
    editingId.value = cat.id;
    editingName.value = cat.name;
}

function cancelEdit() {
    editingId.value = null;
    editingName.value = '';
}

async function saveEdit(cat: ItemCategory) {
    const name = editingName.value.trim();
    if (!name) return;
    try {
        const { category } = await $fetch<{ category: ItemCategory }>(
            `/api/item-categories/${cat.id}`,
            { method: 'PATCH', body: { name, password: getPassword() } }
        );
        emit('category-updated', category);
        editingId.value = null;
    } catch (e: unknown) {
        toast.add({
            title: 'Rename failed',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    }
}

async function deleteCategory(cat: ItemCategory) {
    try {
        await $fetch(`/api/item-categories/${cat.id}`, {
            method: 'DELETE',
            body: { password: getPassword() },
        });
        emit('category-deleted', cat.id);
        toast.add({ title: 'Category deleted', color: 'success' });
    } catch (e: unknown) {
        toast.add({
            title: 'Delete failed',
            color: 'error',
            description: e instanceof Error ? e.message : 'Unknown error',
        });
    }
}
</script>

<template>
    <UModal
        :open="open"
        title="Manage Categories"
        :ui="{ content: 'sm:max-w-sm' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="space-y-1">
                <div
                    v-if="adding"
                    class="mb-2 flex items-center gap-2"
                >
                    <input
                        v-model="newName"
                        autofocus
                        placeholder="Category name"
                        class="min-w-0 flex-1 rounded-md bg-gray-700 px-2 py-1 text-sm text-gray-100 ring-1 ring-violet-500 outline-none"
                        @keyup.enter="addCategory"
                        @keyup.escape="cancelAdd"
                    />
                    <UButton
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        icon="i-heroicons-check"
                        @click="addCategory"
                    />
                    <UButton
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        icon="i-heroicons-x-mark"
                        @click="cancelAdd"
                    />
                </div>

                <div
                    v-if="!categories.length && !adding"
                    class="py-8 text-center text-sm text-gray-500"
                >
                    No categories yet
                </div>

                <div
                    v-for="cat in categories"
                    :key="cat.id"
                    class="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-800"
                >
                    <UIcon
                        name="i-heroicons-tag"
                        class="size-4 shrink-0 text-gray-500"
                    />
                    <div class="min-w-0 flex-1">
                        <input
                            v-if="editingId === cat.id"
                            v-model="editingName"
                            autofocus
                            class="w-full rounded-md bg-gray-700 px-2 py-1 text-sm text-gray-100 ring-1 ring-violet-500 outline-none"
                            @keyup.enter="saveEdit(cat)"
                            @keyup.escape="cancelEdit"
                            @blur="cancelEdit"
                        />
                        <p
                            v-else
                            class="truncate text-sm text-gray-200"
                        >
                            {{ cat.name }}
                        </p>
                    </div>
                    <div class="flex shrink-0 items-center gap-1">
                        <template v-if="editingId === cat.id">
                            <UButton
                                size="xs"
                                variant="ghost"
                                color="neutral"
                                icon="i-heroicons-check"
                                @mousedown.prevent="saveEdit(cat)"
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
                                @click="startEdit(cat)"
                            />
                            <UButton
                                size="xs"
                                variant="ghost"
                                color="error"
                                icon="i-heroicons-trash"
                                @click="deleteCategory(cat)"
                            />
                        </template>
                    </div>
                </div>
            </div>
        </template>

        <template #footer>
            <div class="flex items-center justify-between">
                <UButton
                    variant="ghost"
                    color="neutral"
                    leading-icon="i-heroicons-plus"
                    size="sm"
                    @click="adding = true; newName = ''"
                >
                    Add Category
                </UButton>
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="emit('update:open', false)"
                >
                    Done
                </UButton>
            </div>
        </template>
    </UModal>
</template>
