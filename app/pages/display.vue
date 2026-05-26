<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { DisplayCharacter, DisplayState } from '~/types/display';

const state = ref<DisplayState>({
    activeAdventureId: null,
    activeCharacters: [],
    selectedBackground: null,
    galleryFitMode: 'cover',
    displayMode: 'scene',
    tableShape: 'round' as 'round' | 'square' | 'rectangle',
    tableSeats: 4,
    seatAssignments: [],
    showCharacters: true,
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
}

onMounted(fetchState);

const store = useAppStore();
watch(
    () => store.displayStateVersion,
    () => {
        if (!swapping.value) fetchState();
    }
);

// ── Layout computation ──────────────────────────────────────────────────────
const count = computed(() => state.value.activeCharacters.length);

const cols = computed(() => {
    if (count.value === 0) return 1;
    const maxCols = containerWidth.value > 1980 ? 5 : 3;
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

    let coords: { x: number; y: number }[];
    if (shape === 'rectangle') {
        const top = Math.ceil(seats / 2);
        const bot = seats - top;
        const gap = (k: number) => (k > 1 ? Math.min(155, 420 / (k - 1)) : 0);
        coords = [
            ...Array.from({ length: top }, (_, i) => ({
                x: TABLE_CX + (i - (top - 1) / 2) * gap(top),
                y: 330,
            })),
            ...Array.from({ length: bot }, (_, i) => ({
                x: TABLE_CX + (i - (bot - 1) / 2) * gap(bot),
                y: 750,
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
            state.selectedBackground?.url
                ? {
                      backgroundImage: `url(${state.selectedBackground.url})`,
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

