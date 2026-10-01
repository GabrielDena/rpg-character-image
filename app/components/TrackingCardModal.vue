<script setup lang="ts">
import type { TrackingCard, TrackingCardType } from '#shared/types/models';
import type { CharacterWithUrl } from '~/types/character';

const props = defineProps<{
    open: boolean;
    adventureId: string;
    card?: TrackingCard | null;
    characters?: CharacterWithUrl[];
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    created: [card: TrackingCard];
    updated: [card: TrackingCard];
}>();

const isEditing = computed(() => !!props.card);

function getPassword() {
    return localStorage.getItem('app_password') ?? '';
}

const saving = ref(false);

// ── Form state ────────────────────────────────────────────────────────────────
const formTitle = ref('');
const formType = ref<TrackingCardType>('tag');
const formValue = ref<number | null>(null);
const formCharacterId = ref<string | null>(null);

const characterOptions = computed(() => [
    { label: 'None', value: null },
    ...(props.characters ?? []).map((c) => ({ label: c.name, value: c.id })),
]);

watch(
    () => props.open,
    (val) => {
        if (!val) return;
        formTitle.value = props.card?.title ?? '';
        formType.value = (props.card?.type as TrackingCardType) ?? 'tag';
        formValue.value = props.card?.value ?? null;
        formCharacterId.value = props.card?.characterId ?? null;
    },
);

// ── Progression ───────────────────────────────────────────────────────────────
const STEPS = [0, 1, 2, 2.5, 3, 3.33, 3.66, 4, 4.25, 4.5, 4.75, 5, 5.2, 5.4, 5.6, 5.8, 6];

const BAR_SEGMENTS = STEPS.slice(1).map((s) => ({
    stepValue: s,
    label: Number.isInteger(s) ? String(s) : '',
}));

function segmentFilled(stepValue: number) {
    return (formValue.value ?? 0) >= stepValue;
}

function clickSegment(stepValue: number) {
    if (formValue.value === stepValue) {
        const idx = STEPS.indexOf(stepValue);
        formValue.value = idx <= 1 ? null : (STEPS[idx - 1] ?? null);
    } else {
        formValue.value = stepValue;
    }
}

function stepBack() {
    const cur = formValue.value ?? 0;
    const idx = STEPS.indexOf(cur);
    formValue.value = idx <= 0 ? null : (STEPS[idx - 1] ?? null);
}

function stepForward() {
    const cur = formValue.value ?? 0;
    const idx = STEPS.indexOf(cur);
    if (idx === -1 || idx === STEPS.length - 1) return;
    formValue.value = STEPS[idx + 1] ?? null;
}

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: TrackingCardType; label: string; bg: string }[] = [
    { value: 'clue', label: 'Clue', bg: 'bg-blue-500' },
    { value: 'juice', label: 'Juice', bg: 'bg-amber-500' },
    { value: 'tag', label: 'Tag', bg: 'bg-rose-600' },
    { value: 'status', label: 'Status', bg: 'bg-emerald-500' },
];

const TYPE_BG: Record<TrackingCardType, string> = {
    clue: 'bg-blue-500',
    juice: 'bg-amber-500',
    tag: 'bg-rose-600',
    status: 'bg-emerald-500',
};

// ── Save ──────────────────────────────────────────────────────────────────────
async function save() {
    if (!formTitle.value.trim()) return;
    saving.value = true;
    try {
        if (isEditing.value) {
            const { trackingCard } = await $fetch<{ trackingCard: TrackingCard }>(
                `/api/tracking-cards/${props.card!.id}`,
                {
                    method: 'PATCH',
                    body: {
                        title: formTitle.value.trim(),
                        type: formType.value,
                        value: formValue.value,
                        characterId: formCharacterId.value,
                        password: getPassword(),
                    },
                },
            );
            emit('updated', trackingCard);
        } else {
            const { trackingCard } = await $fetch<{ trackingCard: TrackingCard }>(
                '/api/tracking-cards',
                {
                    method: 'POST',
                    body: {
                        adventureId: props.adventureId,
                        title: formTitle.value.trim(),
                        type: formType.value,
                        value: formValue.value,
                        characterId: formCharacterId.value,
                        password: getPassword(),
                    },
                },
            );
            emit('created', trackingCard);
        }
        emit('update:open', false);
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <UModal
        :open="open"
        :title="isEditing ? card!.title : 'New Tracking Card'"
        :ui="{ content: 'sm:max-w-sm' }"
        :content="{ onOpenAutoFocus: (e: Event) => e.preventDefault() }"
        @update:open="emit('update:open', $event)"
    >
        <template #body>
            <div class="flex flex-col gap-4">
                <!-- Title -->
                <UFormField label="Title">
                    <UInput
                        v-model="formTitle"
                        placeholder="TAG"
                        class="w-full"
                        @keydown.enter="save"
                    />
                </UFormField>

                <!-- Type -->
                <UFormField label="Type">
                    <div class="flex gap-1.5">
                        <button
                            v-for="opt in TYPE_OPTIONS"
                            :key="opt.value"
                            class="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase transition-colors"
                            :class="formType === opt.value
                                ? `${opt.bg} text-white`
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
                            @click="formType = opt.value"
                        >
                            {{ opt.label }}
                        </button>
                    </div>
                </UFormField>

                <!-- Character -->
                <UFormField
                    v-if="characters && characters.length"
                    label="Character"
                >
                    <USelect
                        v-model="formCharacterId"
                        :items="characterOptions"
                        class="w-full"
                    />
                </UFormField>

                <!-- Progression (not shown for Tag type) -->
                <UFormField
                    v-if="formType !== 'tag'"
                    label="Progression"
                >
                    <div class="flex items-center gap-1">
                        <button
                            class="shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:text-gray-200 disabled:opacity-30"
                            :disabled="formValue === null || formValue === 0"
                            @click="stepBack"
                        >
                            <UIcon
                                name="i-heroicons-chevron-left"
                                class="size-4"
                            />
                        </button>

                        <div class="flex flex-1 gap-px">
                            <button
                                v-for="seg in BAR_SEGMENTS"
                                :key="seg.stepValue"
                                class="flex items-center justify-center rounded-sm transition-colors"
                                :class="[
                                    Number.isInteger(seg.stepValue) ? 'h-6 flex-[2]' : 'h-6 flex-1',
                                    segmentFilled(seg.stepValue)
                                        ? TYPE_BG[formType]
                                        : 'bg-gray-800 hover:bg-gray-700',
                                ]"
                                @click="clickSegment(seg.stepValue)"
                            >
                                <span
                                    v-if="seg.label"
                                    class="text-[10px] font-bold leading-none"
                                    :class="segmentFilled(seg.stepValue) ? 'text-white' : 'text-gray-500'"
                                >
                                    {{ seg.label }}
                                </span>
                            </button>
                        </div>

                        <button
                            class="shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:text-gray-200 disabled:opacity-30"
                            :disabled="formValue === 6"
                            @click="stepForward"
                        >
                            <UIcon
                                name="i-heroicons-chevron-right"
                                class="size-4"
                            />
                        </button>
                    </div>
                </UFormField>
            </div>
        </template>

        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton
                    color="neutral"
                    variant="ghost"
                    @click="emit('update:open', false)"
                >
                    Cancel
                </UButton>
                <UButton
                    color="primary"
                    :loading="saving"
                    :disabled="!formTitle.trim()"
                    @click="save"
                >
                    {{ isEditing ? 'Save' : 'Add' }}
                </UButton>
            </div>
        </template>
    </UModal>
</template>
