<template>
  <div class="mbsf">
    <div class="mbsf-guide" role="note" aria-label="使用说明">
      <p class="mbsf-guide-title">使用提示</p>
      <p class="mbsf-guide-text">把 MyBatis 日志里的 <code>Preparing</code> 和 <code>Parameters</code> 两行粘贴到输入框。</p>
      <p class="mbsf-guide-text">点击“原样”可还原单行 SQL，点击“格式化”可输出更易读的多行 SQL。</p>
      <p class="mbsf-guide-sample">
        示例：<code>Preparing: select * from user where id = ?</code> + <code>Parameters: 1(Long)</code>
      </p>
    </div>

    <textarea
      v-model="inputLog"
      class="mbsf-input"
      spellcheck="false"
      placeholder="粘贴 MyBatis 日志（需包含 Preparing 与 Parameters 行）"
      rows="8"
    />

    <div class="mbsf-actions">
      <button type="button" class="mbsf-btn primary" :disabled="!canRun" @click="run('raw')">原样</button>
      <button type="button" class="mbsf-btn primary" :disabled="!canRun" @click="run('pretty')">格式化</button>
      <button type="button" class="mbsf-btn" :disabled="!outputSql" @click="copyOutput">复制结果</button>
      <button type="button" class="mbsf-btn" :disabled="!inputLog && !outputSql" @click="clearAll">清空</button>
      <span class="mbsf-status" :class="{ ok: statusKind === 'ok', error: statusKind === 'error' }">
        {{ statusText }}
      </span>
    </div>

    <textarea
      :value="outputSql"
      class="mbsf-output"
      readonly
      spellcheck="false"
      placeholder="转换结果会显示在这里"
      rows="10"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type Mode = 'raw' | 'pretty'
type StatusKind = 'idle' | 'ok' | 'error'

const defaultLogTemplate = `[2020-01-10 15:00:00] [DEBUG] getUserList.debug(159) - ==> Preparing: 
[2020-01-10 15:00:00] [DEBUG] getUserList.debug(159) - ==> Parameters: `

const inputLog = ref(defaultLogTemplate)
const outputSql = ref('')
const statusKind = ref<StatusKind>('idle')
const statusText = ref('请先粘贴 MyBatis 日志')

const canRun = computed(() => Boolean(inputLog.value.trim()))

const splitParams = (paramsText: string): string[] => {
  const list: string[] = []
  let buf = ''
  let depth = 0

  for (const ch of paramsText) {
    if (ch === '(') depth += 1
    if (ch === ')' && depth > 0) depth -= 1
    if (ch === ',' && depth === 0) {
      if (buf.trim()) list.push(buf.trim())
      buf = ''
      continue
    }
    buf += ch
  }
  if (buf.trim()) list.push(buf.trim())
  return list
}

const quoteSqlString = (value: string) => `'${value.replaceAll("'", "''")}'`

const formatParamValue = (item: string): string => {
  const m = item.match(/^(.*?)(?:\(([^()]*)\))?$/)
  const rawValue = (m?.[1] ?? item).trim()
  const rawType = (m?.[2] ?? '').trim().toLowerCase()
  const value = rawValue.toLowerCase() === 'null' ? 'null' : rawValue

  if (value === 'null') return 'null'

  if (/^(true|false)$/i.test(value) || /(bool|boolean|bit)/.test(rawType)) {
    return /^(true|1)$/i.test(value) ? '1' : '0'
  }

  if (/(int|long|double|float|decimal|number|numeric|bigint|smallint|tinyint)/.test(rawType)) {
    return /^-?\d+(\.\d+)?$/.test(value) ? value : quoteSqlString(value)
  }

  if (
    /(string|char|text|date|time|timestamp|datetime|localdate|localdatetime|instant)/.test(rawType)
  ) {
    return quoteSqlString(value)
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) return value
  return quoteSqlString(value)
}

const injectParams = (sql: string, params: string[]): string => {
  let idx = 0
  let out = ''
  for (const ch of sql) {
    if (ch === '?' && idx < params.length) {
      out += formatParamValue(params[idx])
      idx += 1
    } else {
      out += ch
    }
  }
  return out
}

const prettySql = (sql: string): string => {
  let text = sql.replace(/\s+/g, ' ').trim()
  text = text.replace(/\s+(from|where|group by|order by|having|limit)\s+/gi, '\n$1 ')
  text = text.replace(/\s+(left join|right join|inner join|outer join|join)\s+/gi, '\n$1 ')
  text = text.replace(/\s+on\s+/gi, '\non ')
  text = text.replace(/\s+(and|or)\s+/gi, '\n    $1 ')
  text = text.replace(/\bselect\s+/i, 'select\n    ')
  text = text.replace(/,\s*/g, ',\n    ')
  return text.endsWith(';') ? text : `${text};`
}

const parseSqlFromMyBatisLog = (logText: string, mode: Mode): string => {
  const preparingMatch = logText.match(/==>\s*Preparing:\s*([\s\S]*?)(?:\r?\n|$)/i)
  const paramsMatch = logText.match(/==>\s*Parameters:\s*([\s\S]*?)(?:\r?\n|$)/i)
  if (!preparingMatch) throw new Error('未找到 Preparing 行，请确认日志格式')

  const sqlTpl = preparingMatch[1].trim()
  const paramList = paramsMatch ? splitParams(paramsMatch[1]) : []
  const injected = injectParams(sqlTpl, paramList)
  return mode === 'pretty' ? prettySql(injected) : injected
}

const run = (mode: Mode) => {
  if (!canRun.value) return
  try {
    outputSql.value = parseSqlFromMyBatisLog(inputLog.value, mode)
    statusKind.value = 'ok'
    statusText.value = mode === 'pretty' ? '已格式化输出 SQL' : '已提取原样 SQL'
  } catch (e) {
    outputSql.value = ''
    statusKind.value = 'error'
    statusText.value = e instanceof Error ? e.message : '转换失败'
  }
}

const copyTextToClipboard = async (text: string) => {
  if (!text) return false
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  ta.setSelectionRange(0, ta.value.length)
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  return ok
}

const copyOutput = async () => {
  if (!outputSql.value) return
  try {
    const ok = await copyTextToClipboard(outputSql.value)
    if (!ok) throw new Error('copy_failed')
    statusKind.value = 'ok'
    statusText.value = '已复制结果'
  } catch {
    statusKind.value = 'error'
    statusText.value = '复制失败，请手动复制'
  }
}

const clearAll = () => {
  inputLog.value = defaultLogTemplate
  outputSql.value = ''
  statusKind.value = 'idle'
  statusText.value = '请先粘贴 MyBatis 日志'
}
</script>

<style scoped>
.mbsf {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mbsf-guide {
  border: 1px solid #dbeafe;
  background: #eff6ff;
  border-radius: 8px;
  padding: 10px 12px;
}

.mbsf-guide-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #1d4ed8;
}

.mbsf-guide-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #374151;
}

.mbsf-guide-text + .mbsf-guide-text {
  margin-top: 2px;
}

.mbsf-guide-sample {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: #4b5563;
}

.mbsf-guide code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid #dbeafe;
  border-radius: 4px;
  padding: 1px 4px;
}

.mbsf-input,
.mbsf-output {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  box-sizing: border-box;
  resize: vertical;
  min-height: 180px;
  font-size: 13px;
  line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: #fff;
}

.mbsf-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.mbsf-btn {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 13px;
  padding: 7px 14px;
  cursor: pointer;
}

.mbsf-btn.primary {
  background: #1e9fff;
  border-color: #1e9fff;
  color: #fff;
  font-weight: 600;
}

.mbsf-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mbsf-status {
  margin-left: 6px;
  font-size: 12px;
  color: #6b7280;
}

.mbsf-status.ok {
  color: #16a34a;
}

.mbsf-status.error {
  color: #dc2626;
}
</style>
