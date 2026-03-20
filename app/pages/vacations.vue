<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
    <div class="max-w-screen-2xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-left" to="/dashboard" />
          <div>
            <h1 class="text-2xl font-bold">Ferienplanung</h1>
            <p class="text-sm text-gray-500 mt-0.5">Alle Ferien auf einen Blick</p>
          </div>
        </div>
      </div>

      <!-- Ferientage-Übersicht alle Benutzer -->
      <UCard>
        <template #header>
          <h2 class="font-semibold">Ferientage {{ currentCalYear }}</h2>
        </template>
        <div class="flex gap-5 items-start">

          <!-- Eingeloggter Benutzer – gross links -->
          <div v-if="myUser" class="w-56 shrink-0 flex flex-col gap-3 p-4 rounded-xl border-2 border-primary-300 dark:border-primary-700 bg-primary-50/40 dark:bg-primary-950/20">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-full shrink-0" :style="{ backgroundColor: userColor(myUser.userId) }" />
              <span class="font-semibold text-base">{{ myUser.userName }}</span>
              <span class="text-xs text-gray-400">Du</span>
            </div>
            <div>
              <div class="flex items-end gap-2 mb-1.5">
                <span class="text-4xl font-bold tabular-nums leading-none">{{ userNetUsedDays(myUser.userId) }}</span>
                <span v-if="(userVacationDays[myUser.userId] ?? 0) > 0" class="text-base text-gray-400 leading-8">/ {{ userVacationDays[myUser.userId] }}</span>
                <span v-else class="text-sm text-gray-400 leading-8">Tage</span>
              </div>
              <div v-if="(userVacationDays[myUser.userId] ?? 0) > 0" class="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="userNetUsedDays(myUser.userId) >= (userVacationDays[myUser.userId] ?? 0) ? 'bg-red-500' : ''"
                  :style="userNetUsedDays(myUser.userId) < (userVacationDays[myUser.userId] ?? 0) ? { width: `${Math.min(100, (userNetUsedDays(myUser.userId) / (userVacationDays[myUser.userId] ?? 1)) * 100)}%`, backgroundColor: userColor(myUser.userId) } : { width: '100%' }"
                />
              </div>
              <p v-if="(userVacationDays[myUser.userId] ?? 0) > 0" class="text-xs text-gray-400 mt-1">
                {{ Math.max(0, (userVacationDays[myUser.userId] ?? 0) - userNetUsedDays(myUser.userId)) }} verbleibend
              </p>
            </div>
            <div v-if="userHolidayDays(myUser.userId) > 0" class="flex items-center gap-1.5">
              <UIcon name="i-lucide-minus-circle" class="w-3.5 h-3.5 text-amber-500" />
              <span class="text-sm text-amber-600 dark:text-amber-400 font-medium">{{ userHolidayDays(myUser.userId) }} FT abgezogen</span>
            </div>
            <div v-if="userCompDays(myUser.userId) > 0" class="flex items-center gap-1.5">
              <UIcon name="i-lucide-minus-circle" class="w-3.5 h-3.5 text-violet-500" />
              <span class="text-sm text-violet-600 dark:text-violet-400 font-medium">{{ userCompDays(myUser.userId) }} Komp. abgezogen</span>
            </div>
          </div>

          <!-- Andere Benutzer – klein rechts -->
          <div class="flex-1 flex flex-wrap gap-3">
            <div
              v-for="u in otherUsers"
              :key="u.userId"
              class="flex flex-col gap-1.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 min-w-32"
            >
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: userColor(u.userId) }" />
                <span class="font-medium text-xs">{{ u.userName }}</span>
              </div>
              <div class="flex items-end gap-1 mb-0.5">
                <span class="text-xl font-bold tabular-nums leading-none">{{ userNetUsedDays(u.userId) }}</span>
                <span v-if="(userVacationDays[u.userId] ?? 0) > 0" class="text-xs text-gray-400 leading-5">/ {{ userVacationDays[u.userId] }}</span>
                <span v-else class="text-xs text-gray-400 leading-5">T</span>
              </div>
              <div v-if="(userVacationDays[u.userId] ?? 0) > 0" class="h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  class="h-1 rounded-full transition-all"
                  :class="userNetUsedDays(u.userId) >= (userVacationDays[u.userId] ?? 0) ? 'bg-red-500' : ''"
                  :style="userNetUsedDays(u.userId) < (userVacationDays[u.userId] ?? 0) ? { width: `${Math.min(100, (userNetUsedDays(u.userId) / (userVacationDays[u.userId] ?? 1)) * 100)}%`, backgroundColor: userColor(u.userId) } : { width: '100%' }"
                />
              </div>
              <div v-if="userHolidayDays(u.userId) > 0" class="flex items-center gap-1">
                <UIcon name="i-lucide-minus-circle" class="w-2.5 h-2.5 text-amber-500" />
                <span class="text-[10px] text-amber-600 dark:text-amber-400">-{{ userHolidayDays(u.userId) }} FT</span>
              </div>
              <div v-if="userCompDays(u.userId) > 0" class="flex items-center gap-1">
                <UIcon name="i-lucide-minus-circle" class="w-2.5 h-2.5 text-violet-500" />
                <span class="text-[10px] text-violet-600 dark:text-violet-400">-{{ userCompDays(u.userId) }} Komp.</span>
              </div>
            </div>
          </div>

        </div>
      </UCard>

      <!-- Legende -->
      <UCard>
        <div class="flex flex-wrap gap-4 items-center justify-between">
          <div class="flex flex-wrap gap-3 items-center">
            <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Nutzer:</span>
            <div v-for="u in allUsers" :key="u.userId" class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: userColor(u.userId) }" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ u.userName }}</span>
              <span v-if="u.userId === myId" class="text-xs text-gray-400">(Du)</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-4 text-xs text-gray-400">
              <div class="flex items-center gap-1.5">
                <span class="w-8 h-3 rounded-sm bg-blue-400/40 border-l-2 border-blue-500" />
                <span>Ausstehend</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-8 h-3 rounded-sm bg-blue-400" />
                <span>Genehmigt</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-orange-400" />
                <span>Projekte</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-semibold text-amber-600 dark:text-amber-400">FT</span>
                <span>Feiertag</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-8 h-3 rounded-sm border-2 border-dashed border-violet-500 bg-violet-500/15" />
                <span>Kompensation</span>
              </div>
            </div>
            <!-- Kanton-Filter -->
            <USelectMenu
              v-model="selectedCanton"
              :items="cantonItems"
              value-key="value"
              class="w-48"
              searchable
              placeholder="Kanton wählen"
            />
          </div>
        </div>
      </UCard>

      <!-- Monatsnavigation -->
      <div class="flex items-center gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-chevron-left" @click="prevMonth" />
        <h2 class="text-lg font-semibold flex-1 text-center">{{ monthLabel }}</h2>
        <UButton variant="ghost" color="neutral" icon="i-lucide-chevron-right" @click="nextMonth" />
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ml-2"
          @click="currentYear = today.getFullYear(); currentMonth = today.getMonth()"
        >Heute</button>
        <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs ml-2">
          <button
            class="px-3 py-1.5 font-medium transition-colors"
            :class="calendarView === '1' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="calendarView = '1'"
          >1M</button>
          <div class="w-px bg-gray-200 dark:bg-gray-700" />
          <button
            class="px-3 py-1.5 font-medium transition-colors"
            :class="calendarView === '2' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="calendarView = '2'"
          >2M</button>
          <div class="w-px bg-gray-200 dark:bg-gray-700" />
          <button
            class="px-3 py-1.5 font-medium transition-colors"
            :class="calendarView === 'year' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="calendarView = 'year'"
          >Jahr</button>
        </div>
      </div>

      <!-- Kalender (swipeable) -->
      <div
        ref="swipeContainerRef"
        class="touch-pan-y select-none overflow-hidden"
        @pointerdown="onSwipeStart"
        @pointermove="onSwipeMove"
        @pointerup="onSwipeEnd"
        @pointercancel="onSwipeCancel"
      >
        <div
          class="flex"
          :style="{
            width: '300%',
            transform: `translateX(calc(-33.3333% + ${swipeTrackX}px))`,
            transition: swipeAnimating ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }"
        >
          <div v-for="panel in swipePanels" :key="panel.panelIdx" style="width: 33.3333%">

            <!-- Jahresansicht: 12 Mini-Kalender -->
            <template v-if="calendarView === 'year'">
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <UCard v-for="m in panel.yearData.months" :key="m.month" :ui="{ body: 'p-3 sm:p-3' }">
                <h3 class="text-sm font-semibold text-center mb-2">{{ m.label }}</h3>
                <div class="grid grid-cols-7 mb-1">
                  <div v-for="day in weekDays" :key="day" class="text-center text-[9px] font-semibold uppercase text-gray-400 pb-0.5">{{ day[0] }}</div>
                </div>
                <div class="grid grid-cols-7">
                  <div v-for="(cell, i) in m.cells" :key="i" class="relative pt-0.5 pb-1" :class="!cell.currentMonth ? 'opacity-20' : ''">
                    <div class="flex justify-center mb-0.5">
                      <span
                        class="text-[10px] leading-none w-[18px] h-[18px] flex items-center justify-center rounded-full shrink-0"
                        :class="cell.isToday ? 'bg-primary-500 text-white font-bold' : holidaysOnDay(cell.date).length ? 'text-amber-500 dark:text-amber-400 font-semibold' : 'text-gray-700 dark:text-gray-300'"
                      >{{ cell.day }}</span>
                    </div>
                    <template v-if="cell.currentMonth">
                      <UTooltip v-for="v in regularVacationsOnDay(cell.date)" :key="v.id" :text="v.userName" :delay-duration="0" :ui="{ content: 'shadow-lg text-xs px-2 py-1.5' }">
                        <div class="relative h-1 -mx-px mb-px cursor-pointer" @click="openViewModal(v)">
                          <div
                            class="absolute inset-y-0 hover:brightness-90 transition-all"
                            :class="[halfDayClass(v, cell.date), cell.date === v.startDate ? 'rounded-l-sm' : '', cell.date === v.endDate ? 'rounded-r-sm' : '', !v.approved ? 'opacity-50' : '']"
                            :style="{ backgroundColor: v.approved ? userColor(v.userId) + 'bb' : userColor(v.userId) + '55' }"
                          />
                        </div>
                      </UTooltip>
                      <UTooltip v-if="deadlinesOnDay(cell.date).length" :delay-duration="0" :ui="{ content: 'shadow-lg text-xs px-2 py-1.5 max-w-48' }">
                        <div class="flex justify-center mt-0.5">
                          <span class="rounded-full bg-orange-400 block" :style="{ width: `${Math.min(4 + deadlinesOnDay(cell.date).length * 2, 10)}px`, height: `${Math.min(4 + deadlinesOnDay(cell.date).length * 2, 10)}px` }" />
                        </div>
                        <template #content>
                          <p v-for="p in deadlinesOnDay(cell.date)" :key="p.id" class="font-medium">{{ p.name }}</p>
                        </template>
                      </UTooltip>
                    </template>
                  </div>
                </div>
              </UCard>
            </div>
            </template>

            <!-- 1-Monats / 2-Monats Kalender -->
            <template v-else>
            <div :class="calendarView === '2' ? 'grid grid-cols-2 gap-4' : ''">
              <UCard v-for="(card, cardIdx) in panel.cards" :key="cardIdx" :ui="{ body: 'p-0 sm:p-0' }">
                <div v-if="calendarView === '2'" class="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
                  <h3 class="font-semibold text-sm">{{ card.label }}</h3>
                </div>
                <div class="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                  <div v-for="day in weekDays" :key="day" class="py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">{{ day }}</div>
                </div>
                <div class="grid grid-cols-7">
                  <div
                    v-for="(cell, i) in card.cells"
                    :key="i"
                    class="group relative border-b border-r border-gray-100 dark:border-gray-800 min-h-24 p-1"
                    :class="[(i + 1) % 7 === 0 ? 'border-r-0' : '', !cell.currentMonth ? 'bg-gray-50/50 dark:bg-gray-900/30' : '', cell.isToday ? 'bg-primary-50/40 dark:bg-primary-950/20' : '']"
                  >
                    <div class="flex items-start justify-between mb-1 px-0.5 pt-0.5">
                      <div class="flex-1 min-w-0 pr-1 pt-0.5">
                        <UTooltip v-if="holidaysOnDay(cell.date).length" :text="holidaysOnDay(cell.date).join(', ')" :delay-duration="0" :ui="{ content: 'shadow-lg text-xs px-2 py-1.5' }">
                          <p class="text-[10px] font-semibold text-amber-600 dark:text-amber-400 truncate leading-tight cursor-default">
                            {{ holidaysOnDay(cell.date)[0] }}{{ holidaysOnDay(cell.date).length > 1 ? ` +${holidaysOnDay(cell.date).length - 1}` : '' }}
                          </p>
                        </UTooltip>
                      </div>
                      <span
                        class="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0"
                        :class="cell.isToday ? 'bg-primary-500 text-white' : cell.currentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'"
                      >{{ cell.day }}</span>
                    </div>
                    <div v-if="deadlinesOnDay(cell.date).length" class="absolute top-1 left-1 flex flex-wrap gap-0.5">
                      <UTooltip v-for="p in deadlinesOnDay(cell.date)" :key="p.id" :delay-duration="0" :ui="{ content: 'shadow-lg text-xs px-2 py-1.5' }">
                        <span class="w-3 h-3 rounded-full bg-orange-400 dark:bg-orange-500 block hover:scale-125 transition-transform" />
                        <template #content>
                          <p class="font-medium">{{ p.name }}</p>
                          <p v-if="p.customer" class="text-gray-400 dark:text-gray-500 text-xs">{{ p.customer.name }}</p>
                        </template>
                      </UTooltip>
                    </div>
                    <button
                      type="button"
                      class="absolute bottom-1 left-1 right-1 hidden group-hover:flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded py-0.5 transition-colors"
                      @click.stop="openAddModal(cell.date)"
                    >
                      <UIcon name="i-lucide-plus" class="w-3 h-3" />
                      Ferien
                    </button>
                    <div class="space-y-0.5">
                      <div
                        v-for="v in regularVacationsOnDay(cell.date)"
                        :key="v.id"
                        class="relative h-4.5 -mx-1 cursor-pointer hover:brightness-95 transition-all overflow-hidden"
                        :class="[halfDayClass(v, cell.date), cell.date === v.startDate ? 'rounded-l-md' : '', cell.date === v.endDate ? 'rounded-r-md' : '', !v.approved ? 'opacity-60' : '']"
                        :style="{ backgroundColor: v.approved ? userColor(v.userId) + '55' : userColor(v.userId) + '25', color: userColor(v.userId), borderLeft: cell.date === v.startDate ? `3px solid ${userColor(v.userId)}` : undefined }"
                        :title="v.userName"
                        @click="openViewModal(v)"
                      >
                        <span v-if="cell.date === v.startDate" class="absolute inset-y-0 left-0 flex items-center text-xs font-medium whitespace-nowrap pl-2" :class="!v.approved ? 'line-through decoration-1' : ''">{{ v.userName }}</span>
                        <div
                          v-if="compForUserOnDay(v.userId, cell.date)"
                          class="absolute inset-0 border-y-2 border-dashed overflow-hidden"
                          :class="[cell.date === compForUserOnDay(v.userId, cell.date)!.startDate ? 'border-l-2 rounded-l-md' : '', cell.date === compForUserOnDay(v.userId, cell.date)!.endDate ? 'border-r-2 rounded-r-md' : '']"
                          :style="{ backgroundColor: userColor(v.userId) + '30', borderColor: userColor(v.userId) }"
                          @click.stop="openViewModal(compForUserOnDay(v.userId, cell.date)!)"
                        />
                      </div>
                      <div
                        v-for="v in standaloneCompOnDay(cell.date)"
                        :key="v.id"
                        class="relative h-4.5 -mx-1 cursor-pointer hover:brightness-95 transition-all border-y-2 border-dashed"
                        :class="[halfDayClass(v, cell.date), cell.date === v.startDate ? 'rounded-l-md border-l-2' : '', cell.date === v.endDate ? 'rounded-r-md border-r-2' : '']"
                        :style="{ backgroundColor: userColor(v.userId) + '15', color: userColor(v.userId), borderColor: userColor(v.userId) }"
                        :title="v.userName"
                        @click="openViewModal(v)"
                      >
                        <span v-if="cell.date === v.startDate" class="absolute inset-y-0 left-0 flex items-center text-xs font-medium whitespace-nowrap pl-2">{{ v.userName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>
            </div>
            </template>

          </div>
        </div>
      </div>

      <!-- Liste der aktuellen Monatsferien -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-lg">{{ calendarView === 'year' ? `Ferien ${monthLabel}` : `Ferien im ${monthLabel}` }}</h2>
        </template>

        <div v-if="vacationsInMonth.length === 0" class="text-sm text-gray-400 text-center py-6">
          Keine Ferien im gewählten Zeitraum
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="v in vacationsInMonth"
            :key="v.id"
            class="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            @click="openViewModal(v)"
          >
            <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: userColor(v.userId) }" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-medium text-sm" :class="!v.approved && !v.isCompensation ? 'line-through text-gray-400' : ''">{{ v.title }}</span>
                <span class="text-xs text-gray-400">{{ v.userName }}</span>
                <UBadge v-if="v.isCompensation" color="secondary" variant="subtle" size="sm" icon="i-lucide-refresh-ccw">Kompensation</UBadge>
                <UBadge v-else-if="v.approved" color="success" variant="subtle" size="sm" icon="i-lucide-check">Genehmigt</UBadge>
                <UBadge v-else color="warning" variant="subtle" size="sm">Ausstehend</UBadge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ formatDate(v.startDate) }} – {{ formatDate(v.endDate) }}
                <span class="ml-1">({{ effectiveDayCount(v) }} {{ effectiveDayCount(v) === 1 ? 'Tag' : 'Tage' }})</span>
                <span v-if="v.halfDay" class="ml-1 text-amber-600 dark:text-amber-400">½</span>
              </p>
              <p v-if="v.description" class="text-xs text-gray-400 mt-0.5">{{ v.description }}</p>
            </div>
          </div>
        </div>
      </UCard>

    </div>
  </div>

  <!-- Add / Edit Modal -->
  <UModal v-model:open="formOpen" :title="editingVacation ? 'Ferien bearbeiten' : (form.isCompensation ? 'Kompensationstage eintragen' : 'Ferien eintragen')">
    <template #body>
      <form class="space-y-4" @submit.prevent="saveVacation">

        <!-- Type selector (approvers, new entries only) -->
        <div v-if="canApprove && !editingVacation" class="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            type="button"
            class="flex-1 py-2.5 text-sm font-medium transition-colors"
            :class="!form.isCompensation ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="form.isCompensation = false"
          >
            Ferientage
          </button>
          <div class="w-px bg-gray-200 dark:bg-gray-700" />
          <button
            type="button"
            class="flex-1 py-2.5 text-sm font-medium transition-colors"
            :class="form.isCompensation ? 'bg-violet-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
            @click="form.isCompensation = true"
          >
            Kompensation
          </button>
        </div>
        <UBadge v-if="editingVacation?.isCompensation" color="secondary" variant="subtle" icon="i-lucide-refresh-ccw">Kompensationstag</UBadge>

        <!-- Für Benutzer (Kompensation, new only) -->
        <UFormField v-if="form.isCompensation && !editingVacation" label="Für Benutzer">
          <USelectMenu
            v-model="form.forUserId"
            :items="userItems"
            value-key="value"
            class="w-full"
            placeholder="Benutzer auswählen"
          />
        </UFormField>

        <!-- Titel -->
        <UFormField :label="form.isCompensation ? 'Titel (optional)' : 'Titel'">
          <UInput
            v-model="form.title"
            :placeholder="form.isCompensation ? 'z.B. Überstunden KW12' : 'z.B. Sommerurlaub'"
            class="w-full"
            :required="!form.isCompensation"
          />
        </UFormField>

        <!-- Date range picker -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-3">
          <DateRangePicker v-model:start-date="form.startDate" v-model:end-date="form.endDate" />
        </div>

        <!-- Halber Tag -->
        <div class="space-y-2">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" v-model="form.halfDay" class="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Halber Tag (−0.5 Tage)</span>
            </label>
            <div v-if="form.halfDay" class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
              <button
                type="button"
                class="px-3 py-1.5 font-medium transition-colors"
                :class="form.halfDayPart === 'first' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
                @click="form.halfDayPart = 'first'"
              >Vormittag</button>
              <div class="w-px bg-gray-200 dark:bg-gray-700" />
              <button
                type="button"
                class="px-3 py-1.5 font-medium transition-colors"
                :class="form.halfDayPart === 'last' ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
                @click="form.halfDayPart = 'last'"
              >Nachmittag</button>
            </div>
          </div>
          <div v-if="form.halfDay && form.startDate !== form.endDate" class="flex items-center gap-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">Am welchem Tag?</span>
            <div class="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
              <button
                type="button"
                class="px-3 py-1.5 font-medium transition-colors"
                :class="(form.halfDayDate || form.startDate) === form.startDate ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
                @click="form.halfDayDate = form.startDate"
              >{{ formatDate(form.startDate) }}</button>
              <div class="w-px bg-gray-200 dark:bg-gray-700" />
              <button
                type="button"
                class="px-3 py-1.5 font-medium transition-colors"
                :class="form.halfDayDate === form.endDate ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
                @click="form.halfDayDate = form.endDate"
              >{{ formatDate(form.endDate) }}</button>
            </div>
          </div>
        </div>

        <!-- Beschreibung (Ferien only) -->
        <UFormField v-if="!form.isCompensation" label="Beschreibung (optional)">
          <UTextarea v-model="form.description" placeholder="Ziel, Notizen..." class="w-full" rows="2" />
        </UFormField>

        <UAlert v-if="formError" color="error" variant="subtle" :description="formError" />
      </form>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="formOpen = false">Abbrechen</UButton>
        <UButton :loading="saving" @click="saveVacation">
          {{ editingVacation ? 'Speichern' : 'Eintragen' }}
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- View Modal -->
  <UModal v-if="viewVacation" v-model:open="viewOpen" :title="viewVacation.title">
    <template #body>
      <div class="space-y-4">
        <!-- Status -->
        <div class="flex items-center gap-2 flex-wrap">
          <UBadge v-if="viewVacation.isCompensation" color="secondary" variant="subtle" icon="i-lucide-refresh-ccw">Kompensationstag</UBadge>
          <UBadge v-if="viewVacation.approved" color="success" variant="subtle" icon="i-lucide-check-circle">
            Genehmigt{{ viewVacation.approvedByName ? ` von ${viewVacation.approvedByName}` : '' }}
          </UBadge>
          <UBadge v-else-if="!viewVacation.isCompensation" color="warning" variant="subtle" icon="i-lucide-clock">Ausstehend</UBadge>
        </div>

        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: userColor(viewVacation.userId) }" />
          <span class="font-medium">{{ viewVacation.userName }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <UIcon name="i-lucide-calendar" class="w-4 h-4" />
          {{ formatDate(viewVacation.startDate) }} – {{ formatDate(viewVacation.endDate) }}
          <span class="text-gray-400">
            ({{ effectiveDayCount(viewVacation) }} {{ effectiveDayCount(viewVacation) === 1 ? 'Tag' : 'Tage' }})
          </span>
          <UBadge v-if="viewVacation.halfDay" color="warning" variant="subtle" size="sm">
            ½ Tag {{ viewVacation.halfDayPart === 'first' ? '(Vormittag)' : '(Nachmittag)' }}
          </UBadge>
        </div>
        <p v-if="viewVacation.description" class="text-sm text-gray-600 dark:text-gray-400">
          {{ viewVacation.description }}
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <!-- Approve/Unapprove + Kompensation (nur für Approver) -->
        <div class="flex gap-2 flex-wrap">
          <UButton
            v-if="canApprove && !viewVacation.approved && !viewVacation.isCompensation"
            color="success"
            icon="i-lucide-check-circle"
            size="sm"
            :loading="approving"
            @click="approveVacation(viewVacation, true)"
          >
            Genehmigen
          </UButton>
          <UButton
            v-if="canApprove && viewVacation.approved && !viewVacation.isCompensation"
            variant="outline"
            color="warning"
            icon="i-lucide-x-circle"
            size="sm"
            :loading="approving"
            @click="approveVacation(viewVacation, false)"
          >
            Widerrufen
          </UButton>
          <UButton
            v-if="canApprove"
            variant="outline"
            color="secondary"
            icon="i-lucide-refresh-ccw"
            size="sm"
            @click="openCompensationFor(viewVacation.userId)"
          >
            Kompensationstage
          </UButton>
        </div>

        <!-- Edit / Delete -->
        <div class="flex gap-2">
          <UButton
            v-if="canEditOrDelete(viewVacation)"
            variant="outline"
            color="error"
            size="sm"
            :loading="deleting === viewVacation.id"
            @click="deleteFromView"
          >
            Löschen
          </UButton>

          <UButton
            v-if="canEditOrDelete(viewVacation)"
            size="sm"
            @click="switchToEdit"
          >
            Bearbeiten
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'page-access'], requiredPage: 'calendar' })

const { data: session } = await authClient.useSession(useFetch)
const { data: account } = await useFetch<{ id: string; name: string }>('/api/account')
const myId = computed(() => account.value?.id ?? '')

type Vacation = {
  id: string
  userId: string
  userName: string
  title: string
  startDate: string
  endDate: string
  description: string
  approved: boolean
  approvedBy: string | null
  approvedByName: string | null
  isCompensation: boolean
  compensationDays: number | null
  halfDay: boolean
  halfDayPart: string | null
  halfDayDate: string | null
  createdAt: string
}

const vacations = ref<Vacation[]>([])
const canApprove = ref(false)
const userVacationDays = ref<Record<string, number>>({})
const users = ref<{ id: string; name: string }[]>([])

const currentCalYear = new Date().getFullYear()

function effectiveDayCount(v: Vacation): number {
  const n = dayCount(v.startDate, v.endDate)
  return v.halfDay ? n - 0.5 : n
}

function userUsedDays(userId: string): number {
  const yearStart = `${currentCalYear}-01-01`
  const yearEnd = `${currentCalYear}-12-31`
  let total = 0
  for (const v of vacations.value) {
    if (v.userId !== userId || !v.approved || v.isCompensation) continue
    const start = v.startDate > yearStart ? v.startDate : yearStart
    const end = v.endDate < yearEnd ? v.endDate : yearEnd
    if (start <= end) {
      const n = dayCount(start, end)
      total += v.halfDay ? n - 0.5 : n
    }
  }
  return total
}

function userHolidayDays(userId: string): number {
  const yearStart = `${currentCalYear}-01-01`
  const yearEnd = `${currentCalYear}-12-31`
  let count = 0
  for (const v of vacations.value) {
    if (v.userId !== userId || !v.approved || v.isCompensation) continue
    const start = v.startDate > yearStart ? v.startDate : yearStart
    const end = v.endDate < yearEnd ? v.endDate : yearEnd
    if (start > end) continue
    const cur = new Date(start + 'T00:00:00')
    const endDate = new Date(end + 'T00:00:00')
    while (cur <= endDate) {
      const ds = toDateStr(cur)
      if (holidayMap.value.has(ds)) count++
      cur.setDate(cur.getDate() + 1)
    }
  }
  return count
}

function userCompDays(userId: string): number {
  const yearStart = `${currentCalYear}-01-01`
  const yearEnd = `${currentCalYear}-12-31`
  let total = 0
  for (const v of vacations.value) {
    if (v.userId !== userId || !v.isCompensation) continue
    const start = v.startDate > yearStart ? v.startDate : yearStart
    const end = v.endDate < yearEnd ? v.endDate : yearEnd
    if (start <= end) {
      total += v.compensationDays ?? effectiveDayCount(v)
    }
  }
  return total
}

const userItems = computed(() =>
  users.value.map(u => ({ label: u.name, value: u.id }))
)

type Project = { id: string; name: string; deadline: string | null; customer: { name: string } | null }
const projects = ref<Project[]>([])

async function fetchVacations() {
  const data = await $fetch<{ vacations: Vacation[]; canApprove: boolean; userVacationDays: Record<string, number>; users: { id: string; name: string }[] }>('/api/vacations')
  vacations.value = data.vacations
  canApprove.value = data.canApprove
  userVacationDays.value = data.userVacationDays ?? {}
  users.value = data.users ?? []
}

onMounted(async () => {
  await fetchVacations()
  const data = await $fetch<Project[]>('/api/projects')
  projects.value = data.filter(p => !!p.deadline)
})

function deadlinesOnDay(dateStr: string): Project[] {
  return projects.value.filter(p => p.deadline?.slice(0, 10) === dateStr)
}

// ── Schweizer Feiertage ───────────────────────────────────────────────────────

const CANTONS = [
  { code: 'AG', name: 'Aargau' }, { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' }, { code: 'BE', name: 'Bern' },
  { code: 'BL', name: 'Basel-Landschaft' }, { code: 'BS', name: 'Basel-Stadt' },
  { code: 'FR', name: 'Freiburg' }, { code: 'GE', name: 'Genf' },
  { code: 'GL', name: 'Glarus' }, { code: 'GR', name: 'Graubünden' },
  { code: 'JU', name: 'Jura' }, { code: 'LU', name: 'Luzern' },
  { code: 'NE', name: 'Neuenburg' }, { code: 'NW', name: 'Nidwalden' },
  { code: 'OW', name: 'Obwalden' }, { code: 'SG', name: 'St. Gallen' },
  { code: 'SH', name: 'Schaffhausen' }, { code: 'SO', name: 'Solothurn' },
  { code: 'SZ', name: 'Schwyz' }, { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Tessin' }, { code: 'UR', name: 'Uri' },
  { code: 'VD', name: 'Waadt' }, { code: 'VS', name: 'Wallis' },
  { code: 'ZG', name: 'Zug' }, { code: 'ZH', name: 'Zürich' },
]
const cantonItems = CANTONS.map(c => ({ label: `${c.code} – ${c.name}`, value: c.code }))
const selectedCanton = ref<string>('ZH')

onMounted(() => {
  const saved = localStorage.getItem('ferien-canton')
  if (saved) selectedCanton.value = saved
})
watch(selectedCanton, v => localStorage.setItem('ferien-canton', v))

function getEaster(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function dateShift(d: Date, n: number): string {
  const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10)
}

type HolidayDef = { date: string; name: string; cantons: string[] | 'all' }

function getHolidaysForYear(year: number): HolidayDef[] {
  const e = getEaster(year)
  return [
    { date: `${year}-01-01`, name: 'Neujahrstag', cantons: 'all' },
    { date: `${year}-01-02`, name: 'Berchtoldstag', cantons: ['AG', 'BE', 'BL', 'BS', 'FR', 'GL', 'GR', 'JU', 'LU', 'NE', 'SH', 'SO', 'TG', 'VD', 'ZG', 'ZH'] },
    { date: `${year}-01-06`, name: 'Heilige Drei Könige', cantons: ['GR', 'SZ', 'TI', 'UR'] },
    { date: `${year}-03-19`, name: 'Josefstag', cantons: ['NW', 'SZ', 'TI', 'UR', 'VS', 'ZG'] },
    { date: `${year}-05-01`, name: 'Tag der Arbeit', cantons: ['BS', 'JU', 'NE', 'SH', 'TG', 'TI', 'ZH'] },
    { date: `${year}-06-29`, name: 'Peter & Paul', cantons: ['GR', 'LU', 'TI'] },
    { date: `${year}-08-01`, name: 'Nationalfeiertag', cantons: 'all' },
    { date: `${year}-08-15`, name: 'Mariä Himmelfahrt', cantons: ['AI', 'FR', 'GR', 'JU', 'LU', 'NW', 'OW', 'SO', 'SZ', 'TI', 'UR', 'VS', 'ZG'] },
    { date: `${year}-11-01`, name: 'Allerheiligen', cantons: ['AI', 'FR', 'GR', 'JU', 'LU', 'NW', 'OW', 'SG', 'SO', 'SZ', 'TI', 'UR', 'VS', 'ZG'] },
    { date: `${year}-12-08`, name: 'Mariä Empfängnis', cantons: ['AI', 'GR', 'LU', 'NW', 'OW', 'SZ', 'TI', 'UR', 'VS', 'ZG'] },
    { date: `${year}-12-25`, name: 'Weihnachtstag', cantons: 'all' },
    { date: `${year}-12-26`, name: 'Stephanstag', cantons: ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'] },
    // Bewegliche Feiertage
    { date: dateShift(e, -2), name: 'Karfreitag', cantons: ['AG', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'UR', 'VD', 'ZG', 'ZH'] },
    { date: dateShift(e, 1),  name: 'Ostermontag', cantons: ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'] },
    { date: dateShift(e, 39), name: 'Auffahrt', cantons: 'all' },
    { date: dateShift(e, 50), name: 'Pfingstmontag', cantons: ['AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'] },
    { date: dateShift(e, 60), name: 'Fronleichnam', cantons: ['AG', 'AI', 'FR', 'GR', 'JU', 'LU', 'NW', 'OW', 'SO', 'SZ', 'TI', 'UR', 'VS', 'ZG'] },
  ]
}

const holidayMap = computed(() => {
  const canton = selectedCanton.value
  const map = new Map<string, string[]>()
  for (const year of [currentYear.value - 1, currentYear.value, currentYear.value + 1]) {
    for (const h of getHolidaysForYear(year)) {
      if (h.cantons === 'all' || h.cantons.includes(canton)) {
        if (!map.has(h.date)) map.set(h.date, [])
        map.get(h.date)!.push(h.name)
      }
    }
  }
  return map
})

function holidaysOnDay(dateStr: string): string[] {
  return holidayMap.value.get(dateStr) ?? []
}

async function refresh() {
  await fetchVacations()
}

function canEditOrDelete(v: Vacation): boolean {
  return v.userId === myId.value || canApprove.value
}

// Alle einzigartigen User
const allUsers = computed(() => {
  const map = new Map<string, { userId: string; userName: string }>()
  for (const v of vacations.value) {
    if (!map.has(v.userId)) map.set(v.userId, { userId: v.userId, userName: v.userName })
  }
  return [...map.values()]
})

const myUser = computed(() => {
  const found = allUsers.value.find(u => u.userId === myId.value)
  if (found) return found
  // Fallback: show current user even if they have no vacation entries
  const name = account.value?.name
  if (name && myId.value) return { userId: myId.value, userName: name }
  return undefined
})
const otherUsers = computed(() => allUsers.value.filter(u => u.userId !== myId.value))

const palette = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#a855f7',
]
function userColor(userId: string): string {
  const idx = [...allUsers.value].findIndex(u => u.userId === userId)
  return palette[idx % palette.length] ?? '#6b7280'
}

function halfDayClass(v: Vacation, cellDate: string): string {
  if (!v.halfDay) return 'left-0 right-0'
  const isSingleDay = v.startDate === v.endDate
  const effectiveDate = isSingleDay
    ? v.startDate
    : (v.halfDayDate === v.startDate || v.halfDayDate === v.endDate) ? v.halfDayDate : null
  if (!effectiveDate || cellDate !== effectiveDate) return 'left-0 right-0'
  return v.halfDayPart === 'last' ? 'right-0 w-1/2' : 'left-0 w-1/2'
}

// Kalender
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const calendarView = ref<'1' | '2' | 'year'>('1')

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

function periodOffset(year: number, month: number, steps: number): { year: number; month: number } {
  let y = year, m = month
  for (let i = 0; i < Math.abs(steps); i++) {
    if (steps > 0) {
      if (m === 11) { m = 0; y++ } else m++
    } else {
      if (m === 0) { m = 11; y-- } else m--
    }
  }
  return { year: y, month: m }
}

const monthLabel = computed(() => {
  if (calendarView.value === 'year') return String(currentYear.value)
  if (calendarView.value === '2') {
    const m1 = new Date(currentYear.value, currentMonth.value, 1).toLocaleDateString('de-DE', { month: 'long' })
    const p2 = periodOffset(currentYear.value, currentMonth.value, 1)
    const m2 = new Date(p2.year, p2.month, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    return `${m1} – ${m2}`
  }
  return new Date(currentYear.value, currentMonth.value, 1)
    .toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
})

function prevMonth() {
  if (calendarView.value === 'year') { currentYear.value--; return }
  const steps = calendarView.value === '2' ? 2 : 1
  for (let i = 0; i < steps; i++) {
    if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
    else currentMonth.value--
  }
}
function nextMonth() {
  if (calendarView.value === 'year') { currentYear.value++; return }
  const steps = calendarView.value === '2' ? 2 : 1
  for (let i = 0; i < steps; i++) {
    if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
    else currentMonth.value++
  }
}

interface CalCell { date: string; day: number; currentMonth: boolean; isToday: boolean }

function buildMonthCells(year: number, month: number): CalCell[] {
  const cells: CalCell[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const todayStr = toDateStr(today)
  const startOffset = (firstDay.getDay() + 6) % 7
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    cells.push({ date: toDateStr(d), day: d.getDate(), currentMonth: false, isToday: toDateStr(d) === todayStr })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt = new Date(year, month, d)
    cells.push({ date: toDateStr(dt), day: d, currentMonth: true, isToday: toDateStr(dt) === todayStr })
  }
  const remaining = (7 - (cells.length % 7)) % 7
  for (let d = 1; d <= remaining; d++) {
    const dt = new Date(year, month + 1, d)
    cells.push({ date: toDateStr(dt), day: d, currentMonth: false, isToday: toDateStr(dt) === todayStr })
  }
  return cells
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 3-Panel Swiper
const swipePanels = computed(() =>
  [-1, 0, 1].map(panelIdx => {
    if (calendarView.value === 'year') {
      const y = currentYear.value + panelIdx
      return {
        panelIdx,
        cards: [] as Array<{ label: string; cells: CalCell[] }>,
        yearData: {
          year: y,
          months: Array.from({ length: 12 }, (_, i) => ({
            month: i,
            label: new Date(y, i, 1).toLocaleDateString('de-DE', { month: 'long' }),
            cells: buildMonthCells(y, i),
          })),
        },
      }
    }
    const steps = calendarView.value === '2' ? 2 : 1
    const p1 = periodOffset(currentYear.value, currentMonth.value, panelIdx * steps)
    const cards: Array<{ label: string; cells: CalCell[] }> = [{
      label: new Date(p1.year, p1.month, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
      cells: buildMonthCells(p1.year, p1.month),
    }]
    if (calendarView.value === '2') {
      const p2 = periodOffset(p1.year, p1.month, 1)
      cards.push({
        label: new Date(p2.year, p2.month, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
        cells: buildMonthCells(p2.year, p2.month),
      })
    }
    return { panelIdx, cards, yearData: { year: 0, months: [] as Array<{ month: number; label: string; cells: CalCell[] }> } }
  })
)

const swipeContainerRef = ref<HTMLElement>()
const swipeTrackX = ref(0)
const swipeAnimating = ref(false)
let swipeStartX = 0
let swipeStartY = 0
let swipeActive = false
let swipeIsHoriz = false

function onSwipeStart(e: PointerEvent) {
  if (swipeAnimating.value) return
  swipeStartX = e.clientX
  swipeStartY = e.clientY
  swipeActive = true
  swipeIsHoriz = false
}
function onSwipeMove(e: PointerEvent) {
  if (!swipeActive || swipeAnimating.value) return
  const dx = e.clientX - swipeStartX
  const dy = e.clientY - swipeStartY
  if (!swipeIsHoriz) {
    if (Math.abs(dx) < 8) return
    if (Math.abs(dx) > Math.abs(dy) * 1.2) {
      swipeIsHoriz = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    else { swipeActive = false; return }
  }
  swipeTrackX.value = dx
}
function onSwipeEnd(e: PointerEvent) {
  if (!swipeActive) return
  swipeActive = false
  if (!swipeIsHoriz) return
  const dx = e.clientX - swipeStartX
  const w = swipeContainerRef.value?.offsetWidth ?? 300
  swipeAnimating.value = true
  if (Math.abs(dx) > w * 0.25) {
    swipeTrackX.value = dx > 0 ? w : -w
    setTimeout(() => {
      swipeAnimating.value = false
      swipeTrackX.value = 0
      if (dx > 0) prevMonth()
      else nextMonth()
    }, 300)
  } else {
    swipeTrackX.value = 0
    setTimeout(() => { swipeAnimating.value = false }, 300)
  }
}
function onSwipeCancel() {
  swipeActive = false
  swipeIsHoriz = false
  swipeAnimating.value = true
  swipeTrackX.value = 0
  setTimeout(() => { swipeAnimating.value = false }, 300)
}

function vacationsOnDay(dateStr: string) {
  return vacations.value.filter(v => v.startDate <= dateStr && v.endDate >= dateStr)
}

function regularVacationsOnDay(dateStr: string) {
  return vacations.value.filter(v => !v.isCompensation && v.startDate <= dateStr && v.endDate >= dateStr)
}

function compForUserOnDay(userId: string, dateStr: string) {
  return vacations.value.find(v => v.isCompensation && v.userId === userId && v.startDate <= dateStr && v.endDate >= dateStr) ?? null
}

function standaloneCompOnDay(dateStr: string) {
  const regularUserIds = new Set(regularVacationsOnDay(dateStr).map(v => v.userId))
  return vacations.value.filter(v => v.isCompensation && v.startDate <= dateStr && v.endDate >= dateStr && !regularUserIds.has(v.userId))
}

function userNetUsedDays(userId: string): number {
  return Math.max(0, userUsedDays(userId) - userCompDays(userId) - userHolidayDays(userId))
}

const vacationsInMonth = computed(() => {
  let startY = currentYear.value, startM = currentMonth.value
  let endY = currentYear.value, endM = currentMonth.value
  if (calendarView.value === '2') {
    const p2 = periodOffset(currentYear.value, currentMonth.value, 1)
    endY = p2.year; endM = p2.month
  } else if (calendarView.value === 'year') {
    startM = 0; endM = 11
  }
  const rangeStart = `${startY}-${String(startM + 1).padStart(2, '0')}-01`
  const rangeEnd = `${endY}-${String(endM + 1).padStart(2, '0')}-${new Date(endY, endM + 1, 0).getDate()}`
  return vacations.value.filter(v => v.startDate <= rangeEnd && v.endDate >= rangeStart)
})

function formatDate(str: string) {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(str + 'T00:00:00'))
}

function dayCount(start: string, end: string) {
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime()
  return Math.round(ms / 86400000) + 1
}

// Form
const formOpen = ref(false)
const editingVacation = ref<Vacation | null>(null)
const form = reactive({ title: '', startDate: '', endDate: '', description: '', isCompensation: false, forUserId: '', halfDay: false, halfDayPart: 'first', halfDayDate: '' })
const formError = ref('')
const saving = ref(false)
const deleting = ref<string | null>(null)


function openAddModal(date?: string) {
  editingVacation.value = null
  form.title = ''
  form.startDate = date ?? toDateStr(today)
  form.endDate = date ?? toDateStr(today)
  form.description = ''
  form.isCompensation = false
  form.forUserId = myId.value
  form.halfDay = false
  form.halfDayPart = 'first'
  form.halfDayDate = ''
  formError.value = ''
  formOpen.value = true
}

function openEditModal(v: Vacation) {
  editingVacation.value = v
  form.title = v.title
  form.startDate = v.startDate
  form.endDate = v.endDate
  form.description = v.description ?? ''
  form.isCompensation = v.isCompensation
  form.forUserId = v.userId
  form.halfDay = v.halfDay
  form.halfDayPart = v.halfDayPart ?? 'first'
  form.halfDayDate = v.halfDayDate ?? ''
  formError.value = ''
  viewOpen.value = false
  formOpen.value = true
}

async function saveVacation() {
  formError.value = ''

  if (!form.startDate || !form.endDate) { formError.value = 'Bitte Datum auswählen'; return }
  if (form.startDate > form.endDate) { formError.value = 'Startdatum muss vor Enddatum liegen'; return }

  // Edit existing entry (both regular and comp)
  if (editingVacation.value) {
    saving.value = true
    try {
      await $fetch(`/api/vacations/${editingVacation.value.id}`, { method: 'PATCH', body: {
        title: form.title,
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description,
        halfDay: form.halfDay,
        halfDayPart: form.halfDay ? form.halfDayPart : null,
        halfDayDate: form.halfDay && form.startDate !== form.endDate ? (form.halfDayDate || form.startDate) : null,
      } })
      formOpen.value = false
      await refresh()
    } catch (e: any) {
      formError.value = e?.data?.message ?? 'Fehler beim Speichern'
    } finally {
      saving.value = false
    }
    return
  }

  // Create new comp entry
  if (form.isCompensation) {
    if (!form.forUserId) { formError.value = 'Bitte Benutzer auswählen'; return }
    saving.value = true
    try {
      await $fetch('/api/vacations', { method: 'POST', body: {
        title: form.title || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        isCompensation: true,
        forUserId: form.forUserId,
        halfDay: form.halfDay,
        halfDayPart: form.halfDay ? form.halfDayPart : null,
        halfDayDate: form.halfDay && form.startDate !== form.endDate ? (form.halfDayDate || form.startDate) : null,
      } })
      formOpen.value = false
      await refresh()
    } catch (e: any) {
      formError.value = e?.data?.message ?? 'Fehler beim Speichern'
    } finally {
      saving.value = false
    }
    return
  }

  // Create new regular vacation
  saving.value = true
  try {
    await $fetch('/api/vacations', { method: 'POST', body: {
      title: form.title,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      halfDay: form.halfDay,
      halfDayPart: form.halfDay ? form.halfDayPart : null,
      halfDayDate: form.halfDay && form.startDate !== form.endDate ? (form.halfDayDate || form.startDate) : null,
    } })
    formOpen.value = false
    await refresh()
  } catch (e: any) {
    formError.value = e?.data?.message ?? 'Fehler beim Speichern'
  } finally {
    saving.value = false
  }
}

async function deleteVacation(id: string) {
  deleting.value = id
  await $fetch(`/api/vacations/${id}`, { method: 'DELETE' })
  deleting.value = null
  await refresh()
}

// Approve
const approving = ref(false)
async function approveVacation(v: Vacation, approve: boolean) {
  approving.value = true
  try {
    await $fetch(`/api/vacations/${v.id}`, { method: 'PATCH', body: { approved: approve } })
    viewOpen.value = false
    await refresh()
  } finally {
    approving.value = false
  }
}

// View modal
const viewOpen = ref(false)
const viewVacation = ref<Vacation | null>(null)

function openViewModal(v: Vacation) {
  viewVacation.value = v
  viewOpen.value = true
}

async function deleteFromView() {
  if (!viewVacation.value) return
  await deleteVacation(viewVacation.value.id)
  viewOpen.value = false
}

function switchToEdit() {
  if (!viewVacation.value) return
  openEditModal(viewVacation.value)
}

function openCompensationFor(userId: string) {
  viewOpen.value = false
  editingVacation.value = null
  form.title = ''
  form.startDate = toDateStr(today)
  form.endDate = toDateStr(today)
  form.description = ''
  form.isCompensation = true
  form.forUserId = userId
  form.halfDay = false
  form.halfDayPart = 'first'
  formError.value = ''
  formOpen.value = true
}
</script>
