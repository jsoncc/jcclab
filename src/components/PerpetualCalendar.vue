<template>
  <div class="pc-mask" @click.self="$emit('close')">
    <section class="pc-panel" role="dialog" aria-label="万年历信息">
      <header class="pc-toolbar">
        <div class="pc-toolbar-left">
          <button type="button" class="pc-btn" @click="goPrevMonth">‹</button>
          <div class="pc-ym-picker">
            <input
              v-model="yearInput"
              class="pc-ym-input year"
              type="number"
              min="1900"
              max="2100"
              step="1"
              aria-label="年份"
              @change="applyYearMonthInput"
              @keydown.enter.prevent="applyYearMonthInput"
            />
            <span class="pc-ym-unit">年</span>
            <input
              v-model="monthInput"
              class="pc-ym-input month"
              type="number"
              min="1"
              max="12"
              step="1"
              aria-label="月份"
              @change="applyYearMonthInput"
              @keydown.enter.prevent="applyYearMonthInput"
            />
            <span class="pc-ym-unit">月</span>
          </div>
          <button type="button" class="pc-btn" @click="goNextMonth">›</button>
        </div>
        <div class="pc-toolbar-right">
          <button type="button" class="pc-btn today" @click="goToday">今天</button>
          <button type="button" class="pc-btn close" @click="$emit('close')">关闭</button>
        </div>
      </header>

      <div class="pc-weekdays">
        <span v-for="w in weekdays" :key="w">{{ w }}</span>
      </div>

      <div class="pc-grid">
        <button
          v-for="(item, idx) in monthCells"
          :key="`${item.solar.toYmd()}-${idx}`"
          type="button"
          class="pc-day"
          :class="{
            muted: item.offset !== 0,
            weekend: item.isRestDay || (item.isWeekend && !item.isWorkDay),
            today: item.isToday,
            selected: item.isSelected
          }"
          @click="selectDay(item)"
        >
          <span v-if="item.isRestDay" class="pc-day-rest">休</span>
          <span v-else-if="item.isWorkDay" class="pc-day-rest work">班</span>
          <span class="pc-day-solar">{{ item.day }}</span>
          <span class="pc-day-lunar">{{ item.lunarText }}</span>
          <span v-if="item.festival" class="pc-day-festival">{{ item.festival }}</span>
        </button>
      </div>

      <footer class="pc-detail" v-if="selectedDetail">
        <div class="pc-detail-main">
          <div class="pc-detail-left">
            <p class="pc-detail-title">{{ selectedDetail.lunarTitle }}</p>
            <p class="pc-detail-sub">{{ selectedDetail.ganZhiText }}</p>
          </div>
          <div class="pc-detail-right">
            <p class="pc-detail-tags">
              <span class="pc-tag yi">宜</span>
              <span class="pc-tag-text">{{ selectedDetail.yiText }}</span>
            </p>
            <p class="pc-detail-tags">
              <span class="pc-tag ji">忌</span>
              <span class="pc-tag-text">{{ selectedDetail.jiText }}</span>
            </p>
          </div>
        </div>

        <div class="pc-detail-extra" v-if="selectedDetail.festivalText || selectedDetail.jieQiText">
          <span v-if="selectedDetail.festivalText" class="pc-pill festival">{{ selectedDetail.festivalText }}</span>
          <span v-if="selectedDetail.jieQiText" class="pc-pill jieqi">{{ selectedDetail.jieQiText }}</span>
        </div>

        <p class="pc-detail-countdown" v-if="selectedDetail.countdownText">
          <Icon class="pc-detail-countdown-icon" :icon="calendarClockOutlineIcon" aria-hidden="true" />
          {{ selectedDetail.countdownText }}
        </p>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import calendarClockOutlineIcon from '@iconify-icons/mdi/calendar-clock-outline'
import { HolidayUtil, Solar } from 'lunar-typescript'

type CalendarCell = {
  solar: InstanceType<typeof Solar>
  year: number
  month: number
  day: number
  week: number
  offset: -1 | 0 | 1
  isToday: boolean
  isSelected: boolean
  isWeekend: boolean
  isRestDay: boolean
  isWorkDay: boolean
  lunarText: string
  festival: string
}

const emit = defineEmits<{ close: [] }>()
void emit

const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const now = new Date()
const selectedDate = ref({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  day: now.getDate()
})
const viewYear = ref(selectedDate.value.year)
const viewMonth = ref(selectedDate.value.month)
const yearInput = ref(String(viewYear.value))
const monthInput = ref(String(viewMonth.value))

const pad2 = (n: number) => String(n).padStart(2, '0')
const isSameDate = (a: { year: number; month: number; day: number }, b: { year: number; month: number; day: number }) =>
  a.year === b.year && a.month === b.month && a.day === b.day

const buildDate = (year: number, month: number, day: number) => ({ year, month, day })

const toLunarDayText = (solar: InstanceType<typeof Solar>) => {
  const lunar = solar.getLunar()
  return lunar.getDay() === 1 ? `${lunar.getMonthInChinese()}月` : lunar.getDayInChinese()
}

const toFestivalText = (solar: InstanceType<typeof Solar>) => {
  const lunar = solar.getLunar()
  const jieQi = lunar.getJieQi()
  if (jieQi) return jieQi
  const sF = solar.getFestivals()
  if (sF.length) return sF[0]
  const lF = lunar.getFestivals()
  if (lF.length) return lF[0]
  const other = lunar.getOtherFestivals()
  return other.length ? other[0] : ''
}

const toFestivalTextNoJieQi = (solar: InstanceType<typeof Solar>) => {
  const lunar = solar.getLunar()
  const sF = solar.getFestivals()
  if (sF.length) return sF[0]
  const lF = lunar.getFestivals()
  if (lF.length) return lF[0]
  const other = lunar.getOtherFestivals()
  return other.length ? other[0] : ''
}

const getHolidayInfo = (solar: InstanceType<typeof Solar>) => {
  const holiday = HolidayUtil.getHoliday(solar.toYmd())
  if (!holiday) return { isRestDay: false, isWorkDay: false, holidayName: '' }
  return {
    isRestDay: !holiday.isWork(),
    isWorkDay: holiday.isWork(),
    holidayName: String(holiday.getName() || '').trim()
  }
}

const formatDateLabel = (solar: InstanceType<typeof Solar>) =>
  `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`

const diffDaysFromToday = (solar: InstanceType<typeof Solar>) => {
  const nowDate = new Date()
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime()
  const target = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay()).getTime()
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((target - today) / msPerDay)
}

const buildDiffText = (label: string, diffDays: number) => {
  if (diffDays > 0) return `距离 ${label} 还有${diffDays}天`
  if (diffDays < 0) return `距离 ${label} 已经过去${Math.abs(diffDays)}天`
  return `今天是 ${label}`
}

const findNextFestival = (fromSolar: InstanceType<typeof Solar>) => {
  for (let i = 1; i <= 370; i += 1) {
    const target = fromSolar.next(i)
    const festival = toFestivalTextNoJieQi(target)
    if (festival) return { solar: target, festival }
  }
  return null
}

const monthCells = computed<CalendarCell[]>(() => {
  const firstSolar = Solar.fromYmd(viewYear.value, viewMonth.value, 1)
  const firstWeek = (firstSolar.getWeek() + 6) % 7 // 周一为 0
  const daysInMonth = new Date(viewYear.value, viewMonth.value, 0).getDate()
  const prevDays = firstWeek
  const cells: CalendarCell[] = []
  const today = buildDate(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const pushCell = (year: number, month: number, day: number, offset: -1 | 0 | 1) => {
    const solar = Solar.fromYmd(year, month, day)
    const week = (solar.getWeek() + 6) % 7
    const isWeekend = week === 5 || week === 6
    const holidayInfo = getHolidayInfo(solar)
    const isRestDay = holidayInfo.isRestDay
    const isWorkDay = holidayInfo.isWorkDay
    const date = buildDate(year, month, day)
    cells.push({
      solar,
      year,
      month,
      day,
      week,
      offset,
      isToday: isSameDate(today, date),
      isSelected: isSameDate(selectedDate.value, date),
      isWeekend,
      isRestDay,
      isWorkDay,
      lunarText: toLunarDayText(solar),
      festival: toFestivalText(solar)
    })
  }

  for (let i = prevDays; i > 0; i -= 1) {
    const d = new Date(viewYear.value, viewMonth.value - 1, 1 - i)
    pushCell(d.getFullYear(), d.getMonth() + 1, d.getDate(), -1)
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    pushCell(viewYear.value, viewMonth.value, d, 0)
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const base = cells[cells.length - 1]
    const d = new Date(base.year, base.month - 1, base.day + 1)
    pushCell(d.getFullYear(), d.getMonth() + 1, d.getDate(), 1)
  }
  return cells
})

const selectDay = (item: CalendarCell) => {
  selectedDate.value = buildDate(item.year, item.month, item.day)
  if (item.offset !== 0) {
    viewYear.value = item.year
    viewMonth.value = item.month
  }
}

const normalizeYearMonth = (year: number, month: number) => {
  const d = new Date(year, month - 1, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth() + 1
  yearInput.value = String(viewYear.value)
  monthInput.value = String(viewMonth.value)
}

const goPrevMonth = () => normalizeYearMonth(viewYear.value, viewMonth.value - 1)
const goNextMonth = () => normalizeYearMonth(viewYear.value, viewMonth.value + 1)
const goToday = () => {
  selectedDate.value = buildDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  viewYear.value = selectedDate.value.year
  viewMonth.value = selectedDate.value.month
  yearInput.value = String(viewYear.value)
  monthInput.value = String(viewMonth.value)
}

const applyYearMonthInput = () => {
  const yRaw = Number(yearInput.value)
  const mRaw = Number(monthInput.value)
  const y = Number.isFinite(yRaw) ? Math.min(2100, Math.max(1900, Math.trunc(yRaw))) : viewYear.value
  const m = Number.isFinite(mRaw) ? Math.min(12, Math.max(1, Math.trunc(mRaw))) : viewMonth.value
  normalizeYearMonth(y, m)
}

const selectedDetail = computed(() => {
  const solar = Solar.fromYmd(selectedDate.value.year, selectedDate.value.month, selectedDate.value.day)
  const lunar = solar.getLunar()
  const jieQi = lunar.getJieQi()
  const festival = toFestivalTextNoJieQi(solar)
  const yi = lunar.getDayYi().slice(0, 6)
  const ji = lunar.getDayJi().slice(0, 6)
  const nowDate = new Date()
  const todaySolar = Solar.fromYmd(nowDate.getFullYear(), nowDate.getMonth() + 1, nowDate.getDate())
  const isSelectedToday = isSameDate(
    { year: todaySolar.getYear(), month: todaySolar.getMonth(), day: todaySolar.getDay() },
    selectedDate.value
  )

  let countdownText = ''
  if (isSelectedToday) {
    const nextFestival = findNextFestival(todaySolar)
    if (nextFestival) {
      const label = `${nextFestival.solar.getYear()}年${nextFestival.festival}`
      countdownText = buildDiffText(label, diffDaysFromToday(nextFestival.solar))
    }
  } else {
    const label = festival ? `${solar.getYear()}年${festival}` : formatDateLabel(solar)
    countdownText = buildDiffText(label, diffDaysFromToday(solar))
  }

  return {
    solarText: `${selectedDate.value.year}-${pad2(selectedDate.value.month)}-${pad2(selectedDate.value.day)} 星期${solar.getWeekInChinese()}`,
    lunarTitle: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganZhiText: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
    festivalText: festival,
    jieQiText: jieQi || '',
    countdownText,
    yiText: yi.length ? yi.join('·') : '无',
    jiText: ji.length ? ji.join('·') : '无'
  }
})
</script>

<style scoped>
.pc-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.24);
  z-index: 120;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 80px 20px 20px;
  box-sizing: border-box;
}

.pc-panel {
  width: min(760px, 95vw);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: 0 20px 45px rgba(2, 8, 23, 0.2);
  padding: 14px;
}

.pc-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.pc-toolbar-left,
.pc-toolbar-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pc-ym-picker {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pc-ym-input {
  border: 1px solid var(--border-color-light);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 8px;
  height: 32px;
  box-sizing: border-box;
  text-align: center;
  font-size: 14px;
  padding: 0 6px;
}

.pc-ym-input.year {
  width: 84px;
}

.pc-ym-input.month {
  width: 56px;
}

.pc-ym-input:focus {
  outline: none;
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.pc-ym-unit {
  color: var(--text-secondary);
  font-size: 14px;
}

.pc-btn {
  border: 1px solid var(--border-color-light);
  background: var(--bg-card);
  color: var(--text-secondary);
  border-radius: 8px;
  min-width: 34px;
  height: 32px;
  padding: 0 10px;
  cursor: pointer;
}

.pc-btn.today {
  min-width: 56px;
}

.pc-btn.close {
  min-width: 52px;
}

.pc-weekdays {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.pc-grid {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.pc-day {
  border: none;
  background: var(--bg-card);
  border-radius: 10px;
  min-height: 68px;
  text-align: left;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;
}

.pc-day:hover {
  box-shadow: 0 0 0 1px var(--accent-blue) inset;
}

.pc-day.muted {
  opacity: 0.5;
}

.pc-day.weekend .pc-day-solar {
  color: var(--accent-error);
}

.pc-day-rest {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 6px;
  background: var(--accent-error);
  color: var(--on-accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.pc-day-rest.work {
  background: var(--link-hover);
}

.pc-day.today {
  box-shadow: 0 0 0 1px var(--accent-blue) inset;
}

.pc-day.selected {
  box-shadow: 0 0 0 2px var(--accent-blue) inset;
  background: var(--accent-active);
}

.pc-day-solar {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.pc-day-lunar {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-secondary);
}

.pc-day-festival {
  margin-top: auto;
  font-size: 11px;
  color: var(--accent-error);
}

.pc-detail {
  margin-top: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 12px 8px;
}

.pc-detail-main {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 10px;
}

.pc-detail-title {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
}

.pc-detail-sub {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.pc-detail-right {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pc-detail-tags {
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.pc-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  color: var(--on-accent);
  font-size: 11px;
  flex: 0 0 auto;
}

.pc-tag.yi {
  background: var(--accent-error);
}

.pc-tag.ji {
  background: var(--bg-card);
  color: var(--text-primary);
}

.pc-tag-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.45;
}

.pc-detail-extra {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pc-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.pc-pill.festival {
  background: var(--accent-error);
  color: var(--accent-error);
}

.pc-pill.jieqi {
  background: var(--accent-active);
  color: var(--link-hover);
}

.pc-detail-countdown {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.pc-detail-countdown-icon {
  color: var(--text-secondary);
  font-size: 13px;
  width: 14px;
  height: 14px;
}
</style>
