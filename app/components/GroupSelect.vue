<script setup lang="ts">
import type { CharacterGroup } from '#shared/types/models';

const props = defineProps<{
    modelValue: string[];
    groups: CharacterGroup[];
}>();

const emit = defineEmits<{
    'update:modelValue': [ids: string[]];
    create: [name: string];
}>();

const inputRef = ref<HTMLInputElement>();
const query = ref('');
const open = ref(false);

const selectedGroups = computed(() =>
    props.modelValue
        .map((id) => props.groups.find((g) => g.id === id))
        .filter(Boolean) as CharacterGroup[]
);

const filteredGroups = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return props.groups;
    return props.groups.filter((g) => g.name.toLowerCase().includes(q));
});

const showCreate = computed(() => {
    const q = query.value.trim();
    return q.length > 0 && !props.groups.some((g) => g.name.toLowerCase() === q.toLowerCase());
});

function toggle(group: CharacterGroup) {
    if (props.modelValue.includes(group.id)) {
        emit('update:modelValue', props.modelValue.filter((id) => id !== group.id));
    } else {
        emit('update:modelValue', [...props.modelValue, group.id]);
    }
    query.value = '';
    inputRef.value?.focus();
}

function remove(id: string) {
    emit('update:modelValue', props.modelValue.filter((v) => v !== id));
}

function handleCreate() {
    const name = query.value.trim();
    if (!name) return;
    emit('create', name);
    query.value = '';
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Backspace' && !query.value && props.modelValue.length) {
        remove(props.modelValue[props.modelValue.length - 1]!);
    }
    if (e.key === 'Escape') {
        open.value = false;
        inputRef.value?.blur();
    }
}

function onBlur() {
    setTimeout(() => {
        open.value = false;
    }, 150);
}
</script>

<template>
    <div class="relative">
        <div
            class="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-gray-700 bg-gray-900 px-2 py-1.5 transition-colors focus-within:border-violet-500"
            @click="inputRef?.focus(); open = true"
        >
            <span
                v-for="group in selectedGroups"
                :key="group.id"
                class="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-violet-500/20 text-violet-300"
            >
                {{ group.name }}
                <button
                    type="button"
                    class="ml-0.5 rounded hover:text-violet-100"
                    @click.stop="remove(group.id)"
                >
                    <UIcon
                        name="i-heroicons-x-mark"
                        class="size-3"
                    />
                </button>
            </span>
            <input
                ref="inputRef"
                v-model="query"
                type="text"
                placeholder="Add group…"
                class="min-w-24 flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-600"
                @focus="open = true"
                @blur="onBlur"
                @keydown="onKeydown"
            />
        </div>

        <div
            v-if="open && (filteredGroups.length || showCreate)"
            class="absolute z-50 mt-1 w-full rounded-md border border-gray-700 bg-gray-900 py-1 shadow-lg"
        >
            <button
                v-for="group in filteredGroups"
                :key="group.id"
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-800"
                :class="modelValue.includes(group.id) ? 'text-violet-300' : 'text-gray-200'"
                @mousedown.prevent="toggle(group)"
            >
                <UIcon
                    v-if="modelValue.includes(group.id)"
                    name="i-heroicons-check"
                    class="size-4 text-violet-400"
                />
                <UIcon
                    v-else
                    name="i-heroicons-user-group"
                    class="size-4 text-gray-500"
                />
                {{ group.name }}
            </button>
            <button
                v-if="showCreate"
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-sm text-violet-300 hover:bg-gray-800"
                @mousedown.prevent="handleCreate"
            >
                <UIcon
                    name="i-heroicons-plus"
                    class="size-4"
                />
                Create "{{ query.trim() }}"
            </button>
        </div>
    </div>
</template>
