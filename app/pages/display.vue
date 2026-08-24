<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { DisplayCharacter, DisplayState } from '~/types/display';

const state = ref<DisplayState>({
    activeAdventureId: null,
    activeCharacters: [],
    activeItems: [],
    selectedBackground: null,
    galleryFitMode: 'cover',
    displayMode: 'scene',
    tableShape: 'round' as 'round' | 'square' | 'rectangle',
    tableSeats: 4,
    tableSideSeats: 0,
    seatAssignments: [],
    showCharacters: true,
    showItems: false,
    useAltBackground: false,
});

const container = ref<HTMLElement | null>(null);
const containerWidth = ref(import.meta.client ? window.innerWidth : 1920);
const containerHeight = ref(import.meta.client ? window.innerHeight : 1080);

onMounted(() => {
    if (!container.value) return;
    const ro = new ResizeObserver(([entry]) => {
        containerWidth.value = entry?.contentRect.width || 0;
        containerHeight.value = entry?.contentRect.height || 0;
    });
    ro.observe(container.value);
    onUnmounted(() => ro.disconnect());
});

async function fetchState() {
    const data = await $fetch<DisplayState>('/api/display-state');
    state.value = data;
    store.setAltBackground(data.useAltBackground);
}

onMounted(fetchState);

const store = useAppStore();
watch(
    () => store.displayStateVersion,
    () => {
        triggerSceneTransition();
    }
);
watch(
    () => store.altBackground,
    (val) => {
        state.value.useAltBackground = val;
    }
);

// ── Layout computation ──────────────────────────────────────────────────────
const count = computed(() => state.value.activeCharacters.length);

const cols = computed(() => {
    if (count.value === 0) return 1;
    const maxCols = containerWidth.value > 1980 ? 4 : 3;
    return Math.min(count.value, maxCols);
});

// ── Display mode (derived from server state) ──────────────────────────────────
const displayMode = computed(() => state.value.displayMode);

// ── Table SVG layout ──────────────────────────────────────────────────────────
const TABLE_CX = 960;
const TABLE_CY = 540;
const ORBIT_R = 350;
const AVATAR_R = 52;

const seatPositions = computed(() => {
    const assignments = state.value.seatAssignments;
    const charById = Object.fromEntries(state.value.activeCharacters.map((c) => [c.id, c]));
    const seats = state.value.tableSeats;
    const shape = state.value.tableShape;

    const sideSeats = state.value.tableSideSeats ?? 0;

    let coords: { x: number; y: number }[];
    if (shape === 'rectangle') {
        const longCount = Math.max(0, seats - 2 * sideSeats);
        const top = Math.ceil(longCount / 2);
        const bot = longCount - top;
        const gap = (k: number) => (k > 1 ? Math.min(155, 420 / (k - 1)) : 0);
        const sideGap = (k: number) => (k > 1 ? Math.min(130, 220 / (k - 1)) : 0);
        coords = [
            ...Array.from({ length: top }, (_, i) => ({
                x: TABLE_CX + (i - (top - 1) / 2) * gap(top),
                y: 330,
            })),
            ...Array.from({ length: bot }, (_, i) => ({
                x: TABLE_CX + (i - (bot - 1) / 2) * gap(bot),
                y: 750,
            })),
            ...Array.from({ length: sideSeats }, (_, i) => ({
                x: 630,
                y: TABLE_CY + (i - (sideSeats - 1) / 2) * sideGap(sideSeats),
            })),
            ...Array.from({ length: sideSeats }, (_, i) => ({
                x: 1290,
                y: TABLE_CY + (i - (sideSeats - 1) / 2) * sideGap(sideSeats),
            })),
        ];
    } else {
        coords = Array.from({ length: seats }, (_, i) => {
            const angle = -Math.PI / 2 + (2 * Math.PI * i) / seats;
            return {
                x: TABLE_CX + ORBIT_R * Math.cos(angle),
                y: TABLE_CY + ORBIT_R * Math.sin(angle),
            };
        });
    }

    return coords.map(({ x, y }, i) => {
        const charId = assignments[i] ?? null;
        return { x, y, character: charId ? (charById[charId] ?? null) : null };
    });
});

// ── Lightbox ────────────────────────────────────────────────────────────────
const focusedCharacter = ref<DisplayCharacter | null>(null);

// ── Standing area ───────────────────────────────────────────────────────────
const STANDING_R = 38;

const standingCharacters = computed(() => {
    const seatedIds = new Set(state.value.seatAssignments.filter(Boolean) as string[]);
    return state.value.activeCharacters.filter((c) => !seatedIds.has(c.id));
});

const standingLayout = computed(() => {
    const chars = standingCharacters.value;
    const twoCols = chars.length > 4;
    return chars.map((character, i) => ({
        character,
        x: twoCols ? (i % 2 === 0 ? 1630 : 1790) : 1710,
        y: 220 + (twoCols ? Math.floor(i / 2) : i) * 155,
    }));
});

// ── Seat interaction ──────────────────────────────────────────────────────────
const selectedSeatIndex = ref<number | null>(null);
const selectedStandingId = ref<string | null>(null);
const isAnythingSelected = computed(
    () => selectedSeatIndex.value !== null || selectedStandingId.value !== null
);
const swapping = ref(false);

// ── Scene transition animations ───────────────────────────────────────────────
const TRANSITIONS = [
    'fade', 'wipe-right', 'wipe-left', 'wipe-down', 'wipe-up',
    'split-h', 'split-v', 'blinds-h', 'blinds-v', 'zoom', 'checkerboard',
];
const COVER_DURATION = 900;
const REVEAL_DURATION = 900;
const PRELOAD_BUFFER = 400; // extra hold after fetchState so images can load
const transitionPhase = ref<'idle' | 'covering' | 'revealing'>('idle');
const activeTransition = ref('');
// Precomputed shuffle of indices 0-11 so checkerboard cells pop in pseudo-random order
const checkerboardDelays = Array.from({ length: 12 }, (_, i) => ((i * 7 + 3) % 12) * 25);

async function triggerSceneTransition() {
    if (transitionPhase.value !== 'idle' || swapping.value) return;
    activeTransition.value = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
    transitionPhase.value = 'covering';
    await new Promise<void>((r) => setTimeout(r, COVER_DURATION));
    await fetchState();
    await new Promise<void>((r) => setTimeout(r, PRELOAD_BUFFER));
    transitionPhase.value = 'revealing';
    await new Promise<void>((r) => setTimeout(r, REVEAL_DURATION));
    transitionPhase.value = 'idle';
}

watch(displayMode, () => {
    focusedCharacter.value = null;
    selectedSeatIndex.value = null;
    selectedStandingId.value = null;
});

function clickSeat(index: number) {
    if (swapping.value) return;
    if (selectedSeatIndex.value === index) {
        selectedSeatIndex.value = null;
        return;
    }
    if (selectedStandingId.value !== null) {
        const charId = selectedStandingId.value;
        selectedStandingId.value = null;
        placeInSeat(charId, index);
        return;
    }
    if (selectedSeatIndex.value !== null) {
        const from = selectedSeatIndex.value;
        selectedSeatIndex.value = null;
        if (seatPositions.value[from]?.character) swapSeats(from, index);
        return;
    }
    if (seatPositions.value[index]?.character) selectedSeatIndex.value = index;
}

function clickStanding(charId: string) {
    if (swapping.value) return;
    if (selectedStandingId.value === charId) {
        selectedStandingId.value = null;
        return;
    }
    if (selectedSeatIndex.value !== null) {
        const seatIdx = selectedSeatIndex.value;
        selectedSeatIndex.value = null;
        placeInSeat(charId, seatIdx);
        return;
    }
    selectedStandingId.value = charId;
}

function clickStandingZone() {
    if (swapping.value || selectedSeatIndex.value === null) return;
    const from = selectedSeatIndex.value;
    selectedSeatIndex.value = null;
    ejectFromSeat(from);
}

async function swapSeats(from: number, to: number) {
    swapping.value = true;
    const assignments = [...state.value.seatAssignments];
    [assignments[from], assignments[to]] = [assignments[to] ?? null, assignments[from] ?? null];
    state.value = { ...state.value, seatAssignments: assignments };
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: {
                seatAssignments: assignments,
                password: localStorage.getItem('app_password') ?? '',
            },
        });
    } catch {
        await fetchState();
    } finally {
        swapping.value = false;
    }
}

async function placeInSeat(characterId: string, seatIndex: number) {
    swapping.value = true;
    const assignments = [...state.value.seatAssignments];
    const existing = assignments.indexOf(characterId);
    if (existing !== -1) assignments[existing] = null;
    assignments[seatIndex] = characterId;
    state.value = { ...state.value, seatAssignments: assignments };
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: {
                seatAssignments: assignments,
                password: localStorage.getItem('app_password') ?? '',
            },
        });
    } catch {
        await fetchState();
    } finally {
        swapping.value = false;
    }
}

async function ejectFromSeat(seatIndex: number) {
    swapping.value = true;
    const assignments = [...state.value.seatAssignments];
    assignments[seatIndex] = null;
    state.value = { ...state.value, seatAssignments: assignments };
    try {
        await $fetch('/api/display-state', {
            method: 'PATCH',
            body: {
                seatAssignments: assignments,
                password: localStorage.getItem('app_password') ?? '',
            },
        });
    } catch {
        await fetchState();
    } finally {
        swapping.value = false;
    }
}

function openLightbox(character: DisplayCharacter) {
    focusedCharacter.value = character;
}

function closeLightbox() {
    focusedCharacter.value = null;
}

const focusedSrc = computed(
    () => focusedCharacter.value?.profileImageUrl ?? focusedCharacter.value?.avatarUrl ?? undefined
);

// ── Items overlay sizing ──────────────────────────────────────────────────────
const itemCardWidth = computed(() => {
    const n = state.value.activeItems.length;
    if (n === 0) return '0px';
    // p-12 overlay padding = 96px total h, gap-6 = 24px between cards
    const gaps = 24 * (n - 1);
    const padding = 96;
    return `calc((100vw - ${padding + gaps}px) / ${n})`;
});

// max image height = viewport - overlay padding (96px) - name block (~72px)
const itemImageMaxHeight = computed(() => `calc(100vh - ${96 + 72}px)`);

// ── Image style ──────────────────────────────────────────────────────────────
const imageStyle = computed<CSSProperties>(() => {
    if (!containerHeight.value) return {};
    const rows = Math.ceil(count.value / cols.value);
    const gap = 4;
    const maxH = Math.floor((containerHeight.value - gap * (rows - 1)) / rows);
    return {
        maxHeight: `${maxH}px`,
        breakInside: 'avoid',
        objectFit: state.value.galleryFitMode,
        objectPosition: state.value.galleryFitMode === 'cover' ? 'top' : 'center',
    };
});
</script>

<template>
    <div
        ref="container"
        class="relative h-full w-full"
        :style="
            state.selectedBackground
                ? {
                      backgroundImage: `url(${state.useAltBackground && state.selectedBackground.altUrl ? state.selectedBackground.altUrl : state.selectedBackground.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                  }
                : {}
        "
    >
        <!-- Empty state (scene only) -->
        <Transition name="fade">
            <div
                v-if="count === 0 && displayMode === 'scene' && state.showCharacters"
                class="flex h-full flex-col items-center justify-center gap-3"
            >
                <UIcon
                    name="i-heroicons-squares-2x2"
                    class="size-12 text-gray-700"
                />
                <p class="text-sm text-gray-500">No characters in scene</p>
            </div>
        </Transition>

        <!-- Character images (scene only) -->
        <Transition name="fade">
            <div
                v-if="count > 0 && displayMode === 'scene' && state.showCharacters"
                class="h-full w-full overflow-hidden"
                :style="{ columnCount: cols, columnGap: '4px' }"
            >
                <img
                    v-for="character in state.activeCharacters"
                    :key="character.id"
                    :src="character.profileImageUrl ?? character.avatarUrl ?? undefined"
                    :alt="character.name"
                    class="block w-full cursor-pointer"
                    :style="imageStyle"
                    @click="openLightbox(character)"
                />
            </div>
        </Transition>

        <!-- Lightbox (scene only) -->
        <Transition name="fade">
            <div
                v-if="focusedCharacter && displayMode === 'scene' && state.showCharacters"
                class="absolute inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80"
                @click="closeLightbox"
            >
                <img
                    :src="focusedSrc"
                    :alt="focusedCharacter.name"
                    class="max-h-full max-w-full object-contain"
                    @click.stop
                />
            </div>
        </Transition>

        <!-- Items overlay -->
        <Transition name="fade">
            <div
                v-if="state.showItems && state.activeItems.length"
                class="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-12"
            >
                <div class="flex items-start justify-center gap-6">
                    <div
                        v-for="item in state.activeItems"
                        :key="item.id"
                        class="flex shrink-0 flex-col overflow-hidden rounded-2xl bg-gray-900/95 shadow-2xl ring-1 ring-white/10"
                        :style="{ width: itemCardWidth }"
                    >
                        <div class="w-full bg-gray-800">
                            <img
                                v-if="item.url"
                                :src="item.url"
                                :alt="item.name"
                                class="block w-full"
                                :style="{ maxHeight: itemImageMaxHeight, objectFit: 'contain' }"
                            />
                            <div
                                v-else
                                class="flex h-48 items-center justify-center"
                            >
                                <UIcon
                                    name="i-heroicons-archive-box"
                                    class="size-16 text-gray-600"
                                />
                            </div>
                        </div>
                        <div class="p-3">
                            <p class="text-center font-semibold text-gray-100">
                                {{ item.name }}
                            </p>
                            <p
                                v-if="item.description"
                                class="mt-1 line-clamp-3 text-center text-sm text-gray-400"
                            >
                                {{ item.description }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Scene transition overlay -->
        <div
            v-if="transitionPhase !== 'idle'"
            class="pointer-events-none absolute inset-0 z-[200] overflow-hidden"
        >
            <!-- Single-panel: fade + wipe transitions -->
            <div
                v-if="activeTransition === 'fade' || activeTransition.startsWith('wipe')"
                class="absolute inset-0 bg-black"
                :class="`tp-${activeTransition}-${transitionPhase}`"
            />

            <!-- Zoom: black circle expands/contracts from center -->
            <div
                v-else-if="activeTransition === 'zoom'"
                class="absolute rounded-full bg-black"
                :class="`tp-zoom-circle-${transitionPhase}`"
                :style="{ width: '250vmax', height: '250vmax', top: 'calc(50% - 125vmax)', left: 'calc(50% - 125vmax)' }"
            />

            <!-- Split horizontal: top + bottom halves slide in/out -->
            <template v-else-if="activeTransition === 'split-h'">
                <div
                    class="absolute left-0 right-0 top-0 h-1/2 bg-black"
                    :class="`tp-split-h-top-${transitionPhase}`"
                />
                <div
                    class="absolute bottom-0 left-0 right-0 h-1/2 bg-black"
                    :class="`tp-split-h-bot-${transitionPhase}`"
                />
            </template>

            <!-- Split vertical: left + right halves slide in/out -->
            <template v-else-if="activeTransition === 'split-v'">
                <div
                    class="absolute bottom-0 left-0 top-0 w-1/2 bg-black"
                    :class="`tp-split-v-left-${transitionPhase}`"
                />
                <div
                    class="absolute bottom-0 right-0 top-0 w-1/2 bg-black"
                    :class="`tp-split-v-right-${transitionPhase}`"
                />
            </template>

            <!-- Blinds horizontal: 8 horizontal strips -->
            <template v-else-if="activeTransition === 'blinds-h'">
                <div
                    v-for="n in 8"
                    :key="n"
                    class="absolute left-0 w-full bg-black"
                    :style="{ top: `${(n - 1) * 12.5}%`, height: '12.5%', animationDelay: `${(n - 1) * 42}ms` }"
                    :class="`tp-blinds-h-strip-${transitionPhase}`"
                />
            </template>

            <!-- Blinds vertical: 8 vertical strips -->
            <template v-else-if="activeTransition === 'blinds-v'">
                <div
                    v-for="n in 8"
                    :key="n"
                    class="absolute top-0 h-full bg-black"
                    :style="{ left: `${(n - 1) * 12.5}%`, width: '12.5%', animationDelay: `${(n - 1) * 42}ms` }"
                    :class="`tp-blinds-v-strip-${transitionPhase}`"
                />
            </template>

            <!-- Checkerboard: 4×3 grid of cells that pop in/out -->
            <template v-else-if="activeTransition === 'checkerboard'">
                <div
                    v-for="(delay, i) in checkerboardDelays"
                    :key="i"
                    class="absolute bg-black"
                    :style="{
                        left: `${(i % 4) * 25}%`,
                        top: `${Math.floor(i / 4) * 33.34}%`,
                        width: '25%',
                        height: '33.34%',
                        animationDelay: `${delay}ms`,
                    }"
                    :class="`tp-checker-${transitionPhase}`"
                />
            </template>
        </div>

        <!-- Table view -->
        <Transition name="fade">
            <div
                v-if="displayMode === 'table' && state.showCharacters"
                class="absolute inset-0"
            >
                <svg
                    viewBox="0 0 1920 1080"
                    class="h-full w-full"
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <radialGradient
                            id="woodGradRound"
                            cx="35%"
                            cy="30%"
                            r="70%"
                        >
                            <stop
                                offset="0%"
                                stop-color="#c8915a"
                            />
                            <stop
                                offset="100%"
                                stop-color="#4a2510"
                            />
                        </radialGradient>
                        <linearGradient
                            id="woodGradSquare"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop
                                offset="0%"
                                stop-color="#b87840"
                            />
                            <stop
                                offset="100%"
                                stop-color="#4a2510"
                            />
                        </linearGradient>
                        <filter
                            id="tableShadow"
                            x="-40%"
                            y="-40%"
                            width="180%"
                            height="180%"
                        >
                            <feDropShadow
                                dx="0"
                                dy="15"
                                stdDeviation="25"
                                flood-color="#000000"
                                flood-opacity="0.65"
                            />
                        </filter>
                        <template
                            v-for="(seat, i) in seatPositions"
                            :key="`cp-${i}`"
                        >
                            <clipPath :id="`seat-clip-${i}`">
                                <circle
                                    :cx="seat.x"
                                    :cy="seat.y"
                                    :r="AVATAR_R"
                                />
                            </clipPath>
                        </template>
                        <template
                            v-for="(s, si) in standingLayout"
                            :key="`scp-${si}`"
                        >
                            <clipPath :id="`standing-clip-${si}`">
                                <circle
                                    :cx="s.x"
                                    :cy="s.y"
                                    :r="STANDING_R"
                                />
                            </clipPath>
                        </template>
                    </defs>

                    <!-- Rectangle table surface -->
                    <g v-if="state.tableShape === 'rectangle'">
                        <rect
                            x="700"
                            y="425"
                            width="520"
                            height="230"
                            rx="14"
                            fill="url(#woodGradSquare)"
                            filter="url(#tableShadow)"
                        />
                        <rect
                            x="700"
                            y="425"
                            width="520"
                            height="230"
                            rx="14"
                            fill="none"
                            stroke="rgba(184,120,64,0.5)"
                            stroke-width="3"
                        />
                        <rect
                            x="710"
                            y="435"
                            width="500"
                            height="210"
                            rx="10"
                            fill="none"
                            stroke="rgba(0,0,0,0.2)"
                            stroke-width="6"
                        />
                    </g>

                    <!-- Round table surface -->
                    <circle
                        v-if="state.tableShape === 'round'"
                        :cx="TABLE_CX"
                        :cy="TABLE_CY"
                        r="185"
                        fill="url(#woodGradRound)"
                        filter="url(#tableShadow)"
                    />
                    <circle
                        v-if="state.tableShape === 'round'"
                        :cx="TABLE_CX"
                        :cy="TABLE_CY"
                        r="185"
                        fill="none"
                        stroke="rgba(200,145,90,0.5)"
                        stroke-width="4"
                    />
                    <circle
                        v-if="state.tableShape === 'round'"
                        :cx="TABLE_CX"
                        :cy="TABLE_CY"
                        r="170"
                        fill="none"
                        stroke="rgba(0,0,0,0.2)"
                        stroke-width="6"
                    />

                    <!-- Square table surface -->
                    <rect
                        v-if="state.tableShape === 'square'"
                        :x="TABLE_CX - 185"
                        :y="TABLE_CY - 185"
                        width="370"
                        height="370"
                        rx="14"
                        fill="url(#woodGradSquare)"
                        filter="url(#tableShadow)"
                    />
                    <rect
                        v-if="state.tableShape === 'square'"
                        :x="TABLE_CX - 185"
                        :y="TABLE_CY - 185"
                        width="370"
                        height="370"
                        rx="14"
                        fill="none"
                        stroke="rgba(200,145,90,0.5)"
                        stroke-width="4"
                    />
                    <rect
                        v-if="state.tableShape === 'square'"
                        :x="TABLE_CX - 170"
                        :y="TABLE_CY - 170"
                        width="340"
                        height="340"
                        rx="10"
                        fill="none"
                        stroke="rgba(0,0,0,0.2)"
                        stroke-width="6"
                    />

                    <!-- Seat slots -->
                    <g
                        v-for="(seat, i) in seatPositions"
                        :key="`seat-${i}`"
                        :style="{
                            cursor: seat.character || isAnythingSelected ? 'pointer' : 'default',
                        }"
                        @click="clickSeat(i)"
                    >
                        <!-- Selection ring -->
                        <circle
                            v-if="selectedSeatIndex === i"
                            :cx="seat.x"
                            :cy="seat.y"
                            :r="AVATAR_R + 10"
                            fill="none"
                            stroke="#f59e0b"
                            stroke-width="3"
                            class="seat-selection-ring"
                        />

                        <!-- Empty seat ring -->
                        <circle
                            v-if="!seat.character"
                            :cx="seat.x"
                            :cy="seat.y"
                            :r="AVATAR_R"
                            :fill="
                                isAnythingSelected ? 'rgba(245,158,11,0.12)' : 'rgba(30,30,40,0.55)'
                            "
                            :stroke="isAnythingSelected ? '#f59e0b' : '#4b5563'"
                            stroke-width="2"
                            stroke-dasharray="10 5"
                        />

                        <!-- Avatar background -->
                        <circle
                            v-if="seat.character"
                            :cx="seat.x"
                            :cy="seat.y"
                            :r="AVATAR_R + 4"
                            fill="#1f2937"
                        />

                        <!-- Avatar image -->
                        <image
                            v-if="seat.character?.avatarUrl"
                            :href="seat.character.avatarUrl"
                            :x="seat.x - AVATAR_R"
                            :y="seat.y - AVATAR_R"
                            :width="AVATAR_R * 2"
                            :height="AVATAR_R * 2"
                            :clip-path="`url(#seat-clip-${i})`"
                            preserveAspectRatio="xMidYMid slice"
                        />

                        <!-- Placeholder when character has no avatar -->
                        <circle
                            v-else-if="seat.character"
                            :cx="seat.x"
                            :cy="seat.y"
                            :r="AVATAR_R"
                            fill="#374151"
                        />

                        <!-- Avatar border ring -->
                        <circle
                            v-if="seat.character"
                            :cx="seat.x"
                            :cy="seat.y"
                            :r="AVATAR_R + 4"
                            fill="none"
                            stroke="rgba(255,255,255,0.25)"
                            stroke-width="2"
                        />

                        <!-- Character name -->
                        <text
                            v-if="seat.character"
                            :x="seat.x"
                            :y="seat.y + AVATAR_R + 26"
                            text-anchor="middle"
                            font-size="22"
                            font-weight="600"
                            font-family="ui-sans-serif, system-ui, sans-serif"
                            fill="white"
                            paint-order="stroke"
                            stroke="#000000"
                            stroke-width="5"
                            stroke-linejoin="round"
                        >
                            {{ seat.character.name }}
                        </text>

                        <!-- Transparent hitbox — last element so it sits on top of avatar image and captures all clicks -->
                        <circle
                            :cx="seat.x"
                            :cy="seat.y"
                            :r="AVATAR_R + 12"
                            fill="transparent"
                            pointer-events="all"
                        />
                    </g>
                    <!-- Standing area panel -->
                    <rect
                        x="1545"
                        y="80"
                        width="330"
                        height="920"
                        rx="14"
                        fill="rgba(10,15,25,0.6)"
                    />
                    <text
                        x="1710"
                        y="120"
                        text-anchor="middle"
                        font-size="15"
                        font-weight="600"
                        fill="rgba(156,163,175,0.6)"
                        letter-spacing="4"
                        font-family="ui-sans-serif, system-ui, sans-serif"
                    >
                        STANDING
                    </text>

                    <!-- Eject zone (shown when a seat is selected) -->
                    <rect
                        v-if="selectedSeatIndex !== null"
                        x="1545"
                        y="80"
                        width="330"
                        height="920"
                        rx="14"
                        fill="rgba(245,158,11,0.06)"
                        stroke="#f59e0b"
                        stroke-width="1.5"
                        stroke-dasharray="8 4"
                        style="cursor: pointer"
                        @click="clickStandingZone()"
                    />

                    <!-- Standing characters -->
                    <g
                        v-for="(s, si) in standingLayout"
                        :key="`standing-${s.character.id}`"
                        style="cursor: pointer"
                        @click="clickStanding(s.character.id)"
                    >
                        <!-- Selection ring -->
                        <circle
                            v-if="selectedStandingId === s.character.id"
                            :cx="s.x"
                            :cy="s.y"
                            :r="STANDING_R + 10"
                            fill="none"
                            stroke="#f59e0b"
                            stroke-width="3"
                            class="seat-selection-ring"
                        />

                        <!-- Avatar background -->
                        <circle
                            :cx="s.x"
                            :cy="s.y"
                            :r="STANDING_R + 3"
                            fill="#1f2937"
                        />

                        <!-- Avatar image -->
                        <image
                            v-if="s.character.avatarUrl"
                            :href="s.character.avatarUrl"
                            :x="s.x - STANDING_R"
                            :y="s.y - STANDING_R"
                            :width="STANDING_R * 2"
                            :height="STANDING_R * 2"
                            :clip-path="`url(#standing-clip-${si})`"
                            preserveAspectRatio="xMidYMid slice"
                        />
                        <circle
                            v-else
                            :cx="s.x"
                            :cy="s.y"
                            :r="STANDING_R"
                            fill="#374151"
                        />

                        <!-- Border ring -->
                        <circle
                            :cx="s.x"
                            :cy="s.y"
                            :r="STANDING_R + 3"
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            stroke-width="2"
                        />

                        <!-- Name -->
                        <text
                            :x="s.x"
                            :y="s.y + STANDING_R + 20"
                            text-anchor="middle"
                            font-size="17"
                            font-weight="600"
                            fill="white"
                            paint-order="stroke"
                            stroke="#000"
                            stroke-width="4"
                            stroke-linejoin="round"
                            font-family="ui-sans-serif, system-ui, sans-serif"
                        >
                            {{ s.character.name }}
                        </text>

                        <!-- Hitbox -->
                        <circle
                            :cx="s.x"
                            :cy="s.y"
                            :r="STANDING_R + 14"
                            fill="transparent"
                            pointer-events="all"
                        />
                    </g>
                </svg>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* ── Scene transition animations ──────────────────────────────────────────── */

/* Fade */
.tp-fade-covering { animation: tp-fade-in 900ms ease-in-out forwards; }
.tp-fade-revealing { animation: tp-fade-out 900ms ease-in-out forwards; }
@keyframes tp-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes tp-fade-out { from { opacity: 1 } to { opacity: 0 } }

/* Wipe right (panel slides in from left, exits to right) */
.tp-wipe-right-covering { animation: tp-wipe-right-in 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.tp-wipe-right-revealing { animation: tp-wipe-right-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes tp-wipe-right-in { from { transform: translateX(-100%) } to { transform: translateX(0) } }
@keyframes tp-wipe-right-out { from { transform: translateX(0) } to { transform: translateX(100%) } }

/* Wipe left (panel slides in from right, exits to left) */
.tp-wipe-left-covering { animation: tp-wipe-left-in 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.tp-wipe-left-revealing { animation: tp-wipe-left-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes tp-wipe-left-in { from { transform: translateX(100%) } to { transform: translateX(0) } }
@keyframes tp-wipe-left-out { from { transform: translateX(0) } to { transform: translateX(-100%) } }

/* Wipe down (panel slides in from top, exits to bottom) */
.tp-wipe-down-covering { animation: tp-wipe-down-in 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.tp-wipe-down-revealing { animation: tp-wipe-down-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes tp-wipe-down-in { from { transform: translateY(-100%) } to { transform: translateY(0) } }
@keyframes tp-wipe-down-out { from { transform: translateY(0) } to { transform: translateY(100%) } }

/* Wipe up (panel slides in from bottom, exits to top) */
.tp-wipe-up-covering { animation: tp-wipe-up-in 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.tp-wipe-up-revealing { animation: tp-wipe-up-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes tp-wipe-up-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes tp-wipe-up-out { from { transform: translateY(0) } to { transform: translateY(-100%) } }

/* Split horizontal (top + bottom halves close/open) */
.tp-split-h-top-covering { animation: tp-split-h-top-in 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.tp-split-h-top-revealing { animation: tp-split-h-top-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes tp-split-h-top-in { from { transform: translateY(-100%) } to { transform: translateY(0) } }
@keyframes tp-split-h-top-out { from { transform: translateY(0) } to { transform: translateY(-100%) } }

.tp-split-h-bot-covering { animation: tp-split-h-bot-in 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.tp-split-h-bot-revealing { animation: tp-split-h-bot-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes tp-split-h-bot-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes tp-split-h-bot-out { from { transform: translateY(0) } to { transform: translateY(100%) } }

/* Split vertical (left + right halves close/open) */
.tp-split-v-left-covering { animation: tp-split-v-left-in 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.tp-split-v-left-revealing { animation: tp-split-v-left-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes tp-split-v-left-in { from { transform: translateX(-100%) } to { transform: translateX(0) } }
@keyframes tp-split-v-left-out { from { transform: translateX(0) } to { transform: translateX(-100%) } }

.tp-split-v-right-covering { animation: tp-split-v-right-in 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.tp-split-v-right-revealing { animation: tp-split-v-right-out 900ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes tp-split-v-right-in { from { transform: translateX(100%) } to { transform: translateX(0) } }
@keyframes tp-split-v-right-out { from { transform: translateX(0) } to { transform: translateX(100%) } }

/* Blinds horizontal (strips scale in from left, out to right) */
.tp-blinds-h-strip-covering {
    transform-origin: left center;
    animation: tp-blinds-cover 420ms ease-in-out forwards;
}
.tp-blinds-h-strip-revealing {
    transform-origin: right center;
    animation: tp-blinds-reveal 420ms ease-in-out forwards;
}
@keyframes tp-blinds-cover { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes tp-blinds-reveal { from { transform: scaleX(1) } to { transform: scaleX(0) } }

/* Blinds vertical (strips scale in from top, out to bottom) */
.tp-blinds-v-strip-covering {
    transform-origin: center top;
    animation: tp-blindsv-cover 420ms ease-in-out forwards;
}
.tp-blinds-v-strip-revealing {
    transform-origin: center bottom;
    animation: tp-blindsv-reveal 420ms ease-in-out forwards;
}
@keyframes tp-blindsv-cover { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@keyframes tp-blindsv-reveal { from { transform: scaleY(1) } to { transform: scaleY(0) } }

/* Zoom (black circle expands from center / contracts to center) */
.tp-zoom-circle-covering { animation: tp-zoom-in 900ms ease-out forwards; }
.tp-zoom-circle-revealing { animation: tp-zoom-out 900ms ease-in forwards; }
@keyframes tp-zoom-in { from { transform: scale(0) } to { transform: scale(1) } }
@keyframes tp-zoom-out { from { transform: scale(1) } to { transform: scale(0) } }

/* Checkerboard (grid cells pop in/out with staggered delay) */
.tp-checker-covering { animation: tp-checker-in 390ms ease-in-out forwards; }
.tp-checker-revealing { animation: tp-checker-out 390ms ease-in-out forwards; }
@keyframes tp-checker-in { from { opacity: 0; transform: scale(0.6) } to { opacity: 1; transform: scale(1) } }
@keyframes tp-checker-out { from { opacity: 1; transform: scale(1) } to { opacity: 0; transform: scale(0.6) } }

.seat-selection-ring {
    animation: seat-pulse 1.2s ease-in-out infinite;
}

@keyframes seat-pulse {
    0%,
    100% {
        opacity: 1;
        stroke-width: 3;
    }
    50% {
        opacity: 0.4;
        stroke-width: 5;
    }
}
</style>

