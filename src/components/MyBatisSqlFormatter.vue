<template>
  <div class="mbsf">
    <div class="mbsf-guide" role="note" aria-label="使用说明">
      <div class="mbsf-guide-header">
        <p class="mbsf-guide-title">使用提示</p>
        <button type="button" class="mbsf-btn ghost" @click="fillExample">填充示例</button>
      </div>
      <p class="mbsf-guide-text">从 MyBatis 日志中找到 <code>Preparing</code> 和 <code>Parameters</code> 两行，分别粘贴到下方对应输入框。</p>
    </div>

    <label class="mbsf-label">Preparing</label>
    <div class="mbsf-input-row">
      <span class="mbsf-prefix">[2020-01-10 15:00:00] [DEBUG] getUserList.debug(159) - ==&gt; Preparing:</span>
      <textarea
        v-model="preparingLine"
        class="mbsf-input"
        spellcheck="false"
        placeholder="输入或粘贴 SQL 模板"
        rows="3"
      />
    </div>

    <label class="mbsf-label">Parameters</label>
    <div class="mbsf-input-row">
      <span class="mbsf-prefix">[2020-01-10 15:00:00] [DEBUG] getUserList.debug(159) - ==&gt; Parameters:</span>
      <textarea
        v-model="parametersLine"
        class="mbsf-input"
        spellcheck="false"
        placeholder="输入或粘贴参数列表"
        rows="2"
      />
    </div>

    <div class="mbsf-actions">
      <button type="button" class="mbsf-btn primary" :disabled="!canRun" @click="run('raw')">提取 SQL</button>
      <button type="button" class="mbsf-btn primary" :disabled="!canRun" @click="run('pretty')">美化 SQL</button>
      <button type="button" class="mbsf-btn" :disabled="!outputSql" @click="copyOutput">复制结果</button>
      <button type="button" class="mbsf-btn" :disabled="!preparingLine && !parametersLine && !outputSql" @click="clearAll">清空</button>
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

const examplePreparing = 'SELECT * FROM user WHERE id = ? AND name = ? AND status = ?'
const exampleParameters = '1(Long), 张三(String), 1(Integer)'

const preparingLine = ref('')
const parametersLine = ref('')
const outputSql = ref('')
const statusKind = ref<StatusKind>('idle')
const statusText = ref('请粘贴 MyBatis 日志')

const canRun = computed(() => Boolean(preparingLine.value.trim()))

const fillExample = () => {
  preparingLine.value = examplePreparing
  parametersLine.value = exampleParameters
  outputSql.value = ''
  statusKind.value = 'idle'
  statusText.value = '示例已填充，点击「提取 SQL」或「美化 SQL」'
}

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

// 从单行文本中提取 Preparing:/Parameters: 后的内容
const extractAfterLabel = (line: string, label: string): string => {
  const m = line.match(new RegExp(`==>\\s*${label}:\\s*([\\s\\S]*?)$`, 'i'))
  return m ? m[1].trim() : line.trim()
}

const parseSqlFromMyBatisLog = (mode: Mode): string => {
  const sqlTpl = extractAfterLabel(preparingLine.value, 'Preparing')
  if (!sqlTpl) throw new Error('请粘贴 Preparing 行')

  const paramText = extractAfterLabel(parametersLine.value, 'Parameters')
  const paramList = paramText ? splitParams(paramText) : []
  const injected = injectParams(sqlTpl, paramList)
  if (mode === 'pretty') return prettySql(injected)
  return injected.endsWith(';') ? injected : `${injected};`
}

const run = (mode: Mode) => {
  if (!canRun.value) return
  try {
    outputSql.value = parseSqlFromMyBatisLog(mode)
    statusKind.value = 'ok'
    statusText.value = mode === 'pretty' ? '已美化 SQL' : '已提取 SQL'
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
  preparingLine.value = ''
  parametersLine.value = ''
  outputSql.value = ''
  statusKind.value = 'idle'
  statusText.value = '请粘贴 MyBatis 日志'
}
</script>

<style scoped>
.mbsf {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mbsf-guide {
  border: 1px solid var(--accent-active);
  background: var(--accent-active);
  border-radius: 8px;
  padding: 10px 12px;
}
.mbsf-guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.mbsf-guide-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--link-hover);
}

.mbsf-guide-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-primary);
}

.mbsf-guide-text + .mbsf-guide-text {
  margin-top: 2px;
}

.mbsf-guide code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--accent-active);
  border-radius: 4px;
  padding: 1px 4px;
}
.mbsf-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 2px;
}
.mbsf-input-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.mbsf-prefix {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 6px 12px;
  border-radius: 8px 8px 0 0;
  border: 1px solid var(--border-color);
  border-bottom: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
  overflow-x: auto;
}

.mbsf-input,
.mbsf-output {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 0 0 8px 8px;
  padding: 10px 12px;
  box-sizing: border-box;
  resize: vertical;
  font-size: 13px;
  line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: var(--bg-card);
}
.mbsf-input { min-height: 80px; }
.mbsf-output { min-height: 120px; }

.mbsf-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.mbsf-btn {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  padding: 7px 14px;
  cursor: pointer;
}

.mbsf-btn.primary {
  background: var(--accent-blue);
  border-color: var(--accent-blue);
  color: var(--on-accent);
  font-weight: 600;
}

.mbsf-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mbsf-btn.ghost {
  background: transparent;
  border-color: var(--link-hover);
  color: var(--link-hover);
  font-size: 12px;
  padding: 4px 10px;
}
.mbsf-btn.ghost:hover {
  background: rgba(255, 255, 255, 0.3);
}

.mbsf-status {
  margin-left: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.mbsf-status.ok {
  color: var(--accent-success);
}

.mbsf-status.error {
  color: var(--accent-error);
}
</style>
