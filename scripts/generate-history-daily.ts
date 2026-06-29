import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Solar } from 'lunar-javascript'
import * as OpenCC from 'opencc-js'
import {
  buildHotSearchSection,
  fetchHotTopics,
  fetchTopicSummaryWithSearch,
  generateFallbackSummary,
  type HotTopic
} from './_shared/hotnews-helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const historyDir = path.join(rootDir, 'src', 'assets', 'history')

/** 全文收尾句；若被 parseSections 吃进「程序员视角」区块，会与 buildMarkdown 末尾再追加的一次重复，需在抽取章节时剥掉。 */
const HISTORY_CLOSING_LINE = '✨ 历史不会重复，但总会惊人地相似 ✨'
const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' })

const SECTION_ORDER = [
  '🏛️ 古代印记',
  '🌍 近现代·国际',
  '💻 科技与互联网',
  '🇨🇳 中国近现代',
  '🌐 国际要闻',
  '🌟 今日出生',
  '⚰️ 今日逝世',
  '🔥 今日热榜'
] as const

const FESTIVAL_MAP: Record<string, { name: string; intro: string }> = {
  '01-01': { name: '元旦', intro: '公历新年的第一天，象征新的时间周期开启，常见跨年庆祝、假期出行与年度规划活动。' },
  '02-14': { name: '情人节', intro: '源于西方圣瓦伦丁节，定于每年 2 月 14 日，现已在全球广泛流行，常以鲜花、巧克力与卡片表达情感。' },
  '03-08': { name: '国际妇女节', intro: '联合国设立的全球性纪念日，始于 20 世纪初的女权运动，旨在关注女性权益、劳动贡献与社会平等。' },
  '03-12': { name: '中国植树节', intro: '为纪念孙中山先生逝世，1979 年由全国人大常委会确立，旨在唤起公众生态保护意识，推动国土绿化。' },
  '03-15': { name: '国际消费者权益日', intro: '由国际消费者联盟组织于 1983 年设立，旨在扩大消费者权益保护宣传，推动各国消费者组织合作共赢。' },
  '04-01': { name: '愚人节', intro: '源自西方的民间节日，以善意玩笑和轻松互动为主，已在多国流行，但需注意避免恶作剧造成的伤害。' },
  '04-22': { name: '世界地球日', intro: '1970 年起源于美国的全球性环保活动，现已成为全世界环境保护与可持续发展理念的重要宣传节点。' },
  '04-23': { name: '世界读书日', intro: '联合国教科文组织于 1995 年设立的全球性纪念日，旨在推动阅读、出版与保护知识产权，全称"世界图书与版权日"。' },
  '04-24': { name: '中国航天日', intro: '为纪念 1970 年东方红一号卫星发射成功，2016 年由国务院批复设立，旨在弘扬航天精神、普及航天知识。' },
  '04-25': { name: '全国儿童预防接种宣传日', intro: '1986 年设立的全国性健康宣传日，旨在普及免疫规划知识，提升公众对疫苗接种与儿童传染病预防的科学认知。' },
  '04-26': { name: '世界知识产权日', intro: '由世界知识产权组织于 2000 年设立，旨在提升公众对专利、版权、商标等知识产权保护与创新激励作用的认知。' },
  '04-27': { name: '世界平面设计日', intro: '以国际平面设计协会成立纪念日为背景，倡导以视觉设计提升公共沟通、信息可读性与文化传播质量。' },
  '04-28': { name: '世界安全生产与健康日', intro: '由国际劳工组织推动设立，旨在提升公众对职业安全与健康管理的重视，倡导通过制度与技术手段减少工伤和职业病风险。' },
  '05-01': { name: '国际劳动节', intro: '源于 1886 年美国芝加哥工人大罢工，1889 年由第二国际确定为国际劳动节，纪念劳动价值，关注劳动者权益。' },
  '05-04': { name: '中国青年节', intro: '为纪念 1919 年五四运动，1949 年由中央人民政府政务院正式设立，鼓励青年继承爱国、进步、民主、科学传统。' },
  '05-08': { name: '世界红十字日', intro: '为纪念国际红十字会创始人亨利·杜南诞辰，1948 年由红十字会与红新月会国际联合会设立，弘扬人道主义精神。' },
  '05-12': { name: '国际护士节', intro: '为纪念现代护理事业创始人南丁格尔诞辰，1912 年由国际护士理事会设立，弘扬救死扶伤的人道主义精神。' },
  '05-20': { name: '中国学生营养日', intro: '2001 年由中国学生营养与健康促进会发起，旨在普及营养知识，促进青少年儿童健康成长。' },
  '05-31': { name: '世界无烟日', intro: '由世界卫生组织于 1987 年设立，定于每年 5 月 31 日翌日，旨在宣传吸烟危害，倡导健康生活方式。' },
  '06-01': { name: '国际儿童节', intro: '1949 年由国际民主妇女联合会为纪念 1942 年利迪策惨案而设立，聚焦儿童成长、教育与健康发展。' },
  '06-05': { name: '世界环境日', intro: '1972 年由联合国设立，反映了世界各国人民对环境问题的认识和态度，倡导绿色发展与生态文明。' },
  '06-08': { name: '世界海洋日', intro: '2008 年由联合国大会确立，旨在提醒人类关注海洋、珍惜海洋资源、保护海洋生态多样性。' },
  '06-14': { name: '世界献血者日', intro: '由世界卫生组织、红十字会与红新月会国际联合会等共同设立，旨在感谢自愿无偿献血者，普及安全血液供应。' },
  '06-23': { name: '国际奥林匹克日', intro: '1948 年由国际奥委会设立，旨在纪念 1894 年现代奥林匹克运动会的诞生，弘扬奥林匹克精神。' },
  '07-01': { name: '中国共产党建党纪念日', intro: '中国共产党成立纪念日，源于 1921 年中共一大召开，常见主题教育活动。' },
  '08-01': { name: '中国人民解放军建军节', intro: '1927 年 8 月 1 日南昌起义标志着人民军队的诞生，1933 年定为八一建军节。' },
  '08-19': { name: '中国医师节', intro: '2017 年由国务院批复设立，激励广大卫生与健康工作者弘扬"敬佑生命、救死扶伤、甘于奉献、大爱无疆"精神。' },
  '09-10': { name: '中国教师节', intro: '1985 年由全国人大常委会确立，定于每年 9 月 10 日，向教育工作者致敬，强调教育与人才培养的价值。' },
  '10-01': { name: '中华人民共和国国庆节', intro: '1949 年 10 月 1 日，毛泽东在天安门城楼宣告中华人民共和国成立，每年 10 月 1 日为国庆节。' },
  '10-04': { name: '世界动物日', intro: '1931 年由国际自然保护联盟确立，旨在唤起人类对濒危动物的关注，纪念意大利传教士圣方济各的动物保护理念。' },
  '10-16': { name: '世界粮食日', intro: '1979 年由联合国粮食及农业组织设立，旨在提高公众对粮食安全和营养问题的认识，推动全球反饥饿行动。' },
  '11-09': { name: '全国消防日', intro: '1992 年由公安部设立，定于每年 11 月 9 日（与火警电话 119 谐音），旨在普及消防知识、提高防火意识。' },
  '12-01': { name: '世界艾滋病日', intro: '1988 年由世界卫生组织设立，每年 12 月 1 日旨在提高公众对艾滋病传播途径、预防与关怀的认识。' },
  '12-03': { name: '国际残疾人日', intro: '1992 年由联合国大会设立，旨在促进对残疾问题的理解，维护残疾人的尊严、权利和福祉。' },
  '12-04': { name: '国家宪法日', intro: '2014 年由全国人大常委会确立，2014 年 12 月 4 日为首个国家宪法日，旨在增强全社会的宪法意识。' },
  '12-13': { name: '南京大屠杀死难者国家公祭日', intro: '2014 年由全国人大常委会设立，纪念 1937 年南京大屠杀死难者，缅怀所有遭日本侵略者杀戮的死难同胞。' },
  '12-24': { name: '平安夜', intro: '圣诞节前夕，源于基督教传统，现代已演变为全球性的家庭团聚、互赠礼物的温馨节日。' },
  '12-25': { name: '圣诞节', intro: '基督教纪念耶稣降生的节日，公元 336 年由罗马教会确立，12 月 25 日为西方传统节日，全球具有广泛文化影响。' }
}

const HOLIDAY_INTRO_MAP: Record<string, string> = {
  元旦: '公历新年的第一天，象征新的时间周期开启，常见跨年庆祝、假期出行与年度规划活动。',
  春节: '农历正月初一，中华民族最重要的传统节日，象征辞旧迎新、阖家团圆，常见贴春联、放鞭炮、吃年夜饭、发红包等习俗。',
  元宵节: '农历正月十五，又称上元节，赏花灯、吃汤圆、猜灯谜是主要习俗，标志春节庆祝活动圆满收官。',
  龙抬头: '农历二月初二，又称"春龙节"，象征万物复苏，民间有理发、吃龙食、祭祀龙神等习俗，寓意辞旧迎新、鸿运当头。',
  情人节: '源于西方圣瓦伦丁节，定于每年 2 月 14 日，现已在全球广泛流行，常以鲜花、巧克力与卡片表达情感。',
  国际妇女节: '联合国设立的全球性纪念日，始于 20 世纪初的女权运动，旨在关注女性权益、劳动贡献与社会平等。',
  愚人节: '源自西方的民间节日，以善意玩笑和轻松互动为主，已在多国流行，但需注意避免恶作剧造成的伤害。',
  复活节: '基督教纪念耶稣复活的节日，日期每年春分月圆后的第一个星期日，象征重生与希望。',
  端午节: '农历五月初五，又称端阳节、龙舟节，纪念战国时期楚国诗人屈原，赛龙舟、吃粽子、挂艾草是主要习俗。',
  母亲节: '每年 5 月第二个星期日，起源于美国，现已在全球广泛流行，用以表达对母亲的敬意与感恩。',
  父亲节: '每年 6 月第三个星期日，起源于 20 世纪初的美国，用以表达对父亲的敬意与感恩。',
  七夕节: '农历七月初七，又称乞巧节、中国情人节，源自牛郎织女传说，象征忠贞不渝的爱情。',
  中秋节: '农历八月十五，又称团圆节，象征家人团聚、思乡之情，赏月、吃月饼是主要习俗。',
  教师节: '1985 年由全国人大常委会确立，定于每年 9 月 10 日，向教育工作者致敬，强调教育与人才培养的价值。',
  重阳节: '农历九月初九，又称敬老节、登高节，源自古代对"九"为阳数的崇拜，登高望远、赏菊、敬老为主要习俗。',
  国庆节: '1949 年 10 月 1 日毛泽东在天安门城楼宣告中华人民共和国成立，每年 10 月 1 日为国庆节，法定节假日。',
  万圣节: '每年 10 月 31 日晚，西方传统节日，源自古代凯尔特人的萨温节，"Trick or Treat"、化装舞会、南瓜灯是主要元素。',
  感恩节: '美国传统节日，定于每年 11 月第四个星期四，源自 1621 年清教徒与印第安人的丰收庆祝，火鸡和家庭团聚是核心元素。',
  平安夜: '圣诞节前夕，源于基督教传统，现代已演变为全球性的家庭团聚、互赠礼物的温馨节日。',
  圣诞节: '基督教纪念耶稣降生的节日，公元 336 年由罗马教会确立，12 月 25 日为西方传统节日，全球具有广泛文化影响。',
  除夕: '农历年最后一天，又称大年三十，象征辞旧迎新，常见贴春联、吃年夜饭、守岁、放鞭炮等习俗。',
  腊八节: '农历十二月初八，源自佛教纪念释迦牟尼成道之日，民间有喝腊八粥、腌制腊八蒜等习俗，标志春节序幕拉开。',
  国际劳动节: '源于 1886 年美国芝加哥工人大罢工，1889 年由第二国际确定为国际劳动节，纪念劳动价值。',
  国际儿童节: '1949 年由国际民主妇女联合会为纪念 1942 年利迪策惨案而设立，聚焦儿童成长、教育与健康发展。',
  国际护士节: '为纪念现代护理事业创始人南丁格尔诞辰，1912 年由国际护士理事会设立，弘扬救死扶伤的人道主义精神。',
  中国青年节: '为纪念 1919 年五四运动，1949 年由中央人民政府政务院正式设立，鼓励青年继承爱国、进步、民主、科学传统。',
  中国人民解放军建军节: '1927 年 8 月 1 日南昌起义标志着人民军队的诞生，1933 年定为八一建军节。',
  中国共产党建党纪念日: '中国共产党成立纪念日，源于 1921 年中共一大召开，常见主题教育活动。',
  世界地球日: '1970 年起源于美国的全球性环保活动，现已成为全世界环境保护与可持续发展理念的重要宣传节点。',
  世界环境日: '1972 年由联合国设立，反映了世界各国人民对环境问题的认识和态度，倡导绿色发展与生态文明。',
  世界读书日: '联合国教科文组织于 1995 年设立的全球性纪念日，旨在推动阅读、出版与保护知识产权，全称"世界图书与版权日"。',
  世界知识产权日: '由世界知识产权组织于 2000 年设立，旨在提升公众对专利、版权、商标等知识产权保护与创新激励作用的认知。',
  世界海洋日: '2008 年由联合国大会确立，旨在提醒人类关注海洋、珍惜海洋资源、保护海洋生态多样性。',
  世界献血者日: '由世界卫生组织、红十字会与红新月会国际联合会等共同设立，旨在感谢自愿无偿献血者，普及安全血液供应。',
  世界动物日: '1931 年由国际自然保护联盟确立，旨在唤起人类对濒危动物的关注，纪念意大利传教士圣方济各的动物保护理念。',
  世界粮食日: '1979 年由联合国粮食及农业组织设立，旨在提高公众对粮食安全和营养问题的认识，推动全球反饥饿行动。',
  世界艾滋病日: '1988 年由世界卫生组织设立，每年 12 月 1 日旨在提高公众对艾滋病传播途径、预防与关怀的认识。',
  世界无烟日: '由世界卫生组织于 1987 年设立，定于每年 5 月 31 日翌日，旨在宣传吸烟危害，倡导健康生活方式。',
  世界红十字日: '为纪念国际红十字会创始人亨利·杜南诞辰，1948 年由红十字会与红新月会国际联合会设立，弘扬人道主义精神。',
  世界消费者权益日: '由国际消费者联盟组织于 1983 年设立，旨在扩大消费者权益保护宣传，推动各国消费者组织合作共赢。',
  全国消防日: '1992 年由公安部设立，定于每年 11 月 9 日（与火警电话 119 谐音），旨在普及消防知识、提高防火意识。',
  全国儿童预防接种宣传日: '1986 年设立的全国性健康宣传日，旨在普及免疫规划知识，提升公众对疫苗接种与儿童传染病预防的科学认知。',
  世界实验动物日: '每年 4 月 24 日的国际纪念日，倡导科学、人道地开展动物实验，尊重实验动物为医学与人类健康事业做出的贡献。',
  世界平面设计日: '以国际平面设计组织成立纪念日为背景，强调平面设计在公共传播、信息可视化与品牌沟通中的长期价值。',
  世界安全生产与健康日: '由国际劳工组织推动设立，旨在提升公众对职业安全与健康管理的重视，倡导通过制度与技术手段减少工伤和职业病风险。',
  中国航天日: '为纪念 1970 年东方红一号卫星发射成功，2016 年由国务院批复设立，旨在弘扬航天精神、普及航天知识。',
  中国医师节: '2017 年由国务院批复设立，激励广大卫生与健康工作者弘扬"敬佑生命、救死扶伤、甘于奉献、大爱无疆"精神。',
  中国植树节: '为纪念孙中山先生逝世，1979 年由全国人大常委会确立，旨在唤起公众生态保护意识，推动国土绿化。',
  中国学生营养日: '2001 年由中国学生营养与健康促进会发起，旨在普及营养知识，促进青少年儿童健康成长。',
  国家宪法日: '2014 年由全国人大常委会确立，2014 年 12 月 4 日为首个国家宪法日，旨在增强全社会的宪法意识。',
  南京大屠杀死难者国家公祭日: '2014 年由全国人大常委会设立，纪念 1937 年南京大屠杀死难者，缅怀所有遭日本侵略者杀戮的死难同胞。',
  国际残疾人日: '1992 年由联合国大会设立，旨在促进对残疾问题的理解，维护残疾人的尊严、权利和福祉。',
  国际奥林匹克日: '1948 年由国际奥委会设立，旨在纪念 1894 年现代奥林匹克运动会的诞生，弘扬奥林匹克精神。',
  国际切尔诺贝利灾难纪念日: '联合国设立的国际纪念日，用于缅怀核事故受害者并强调核安全、环境修复与长期公共健康治理的重要性。',
  国王日: '荷兰全国性节日，用于庆祝国王生日，常见全民市集、音乐活动与橙色主题庆典。',
  世界滑板日: '由国际滑板运动联盟于 2004 年发起，定于每年 6 月 21 日夏至当天，全球滑板爱好者以集体滑行、技巧挑战和街头文化活动共同庆祝，已成为连接世界各地滑板社群的标志性节日。'
}

type WikiPage = {
  titles?: { normalized?: string }
}

type WikiItem = {
  year?: number
  text?: string
  pages?: WikiPage[]
}

function getShanghaiTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function resolveTargetDateIso(): string {
  const overrideDate = process.env.TARGET_DATE
  if (overrideDate && /^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) return overrideDate
  return addDays(getShanghaiTodayIso(), 1)
}

function formatChineseDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    weekday: 'long'
  }).format(new Date(Date.UTC(year, month - 1, day)))
  return `${year}年${month}月${day}日 ${weekday}`
}

function formatLunarLine(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  return lunar.toString()
}

function buildFixedFestivalBody(targetDate: string): string | null {
  const mmdd = targetDate.slice(5)
  const festival = FESTIVAL_MAP[mmdd]
  if (!festival) return null
  return [`**${festival.name}**`, '', festival.intro].join('\n')
}

/** 完整节气知识库：每个节气的简介、物候、民俗 */
const JIEQI_KB: Record<string, { intro: string; wu: string; min: string; solar: string }> = {
  立春: { intro: '二十四节气之首，标志春季开始，太阳到达黄经 315°。', wu: '东风解冻、蛰虫始振、鱼陟负冰。', min: '民间有贴春字、吃春饼、咬春等习俗，象征万物复苏。', solar: '公历 2 月 3-5 日交节。' },
  雨水: { intro: '立春之后，气温回升、降水增多，万物萌动。', wu: '獭祭鱼、鸿雁来、草木萌动。', min: '民间有"拉保保"、回娘屋、占稻色等习俗，寓意祈雨祈福。', solar: '公历 2 月 18-20 日交节。' },
  惊蛰: { intro: '春雷乍动、蛰虫惊醒，标志仲春开始。', wu: '桃始华、仓庚鸣、鹰化为鸠。', min: '民间有祭白虎、打小人、吃梨等习俗，象征驱邪避害。', solar: '公历 3 月 5-7 日交节。' },
  春分: { intro: '太阳直射赤道，昼夜平分，春季过半。', wu: '玄鸟至、雷乃发声、始电。', min: '民间有竖蛋、送春牛、吃春菜等习俗，象征平衡与新生。', solar: '公历 3 月 20-22 日交节。' },
  清明: { intro: '二十四节气中唯一既是节气又是节日的日期，春季第五个节气。', wu: '桐始华、田鼠化为鴽、虹始见。', min: '主要习俗为祭祖扫墓、踏青郊游、放风筝、荡秋千。', solar: '公历 4 月 4-6 日交节。' },
  谷雨: { intro: '春季最后一个节气，源自"雨生百谷"之意。', wu: '萍始生、鸣鸠拂其羽、戴胜降于桑。', min: '民间有喝谷雨茶、走谷雨、贴谷雨贴等习俗，寓意祈福消灾。', solar: '公历 4 月 19-21 日交节。' },
  立夏: { intro: '夏季第一个节气，标志万物进入旺盛生长期。', wu: '蝼蝈鸣、蚯蚓出、王瓜生。', min: '民间有称人、斗蛋、尝新等习俗，寓意健康度夏。', solar: '公历 5 月 5-7 日交节。' },
  小满: { intro: '夏熟作物籽粒开始饱满，但未成熟。', wu: '苦菜秀、靡草死、麦秋至。', min: '民间有祭车神、祭蚕、吃苦菜等习俗，象征丰收在望。', solar: '公历 5 月 20-22 日交节。' },
  芒种: { intro: '农事最忙时节，有芒之谷类作物可种。', wu: '螳螂生、䴗始鸣、反舌无声。', min: '民间有送花神、安苗、煮梅等习俗，标志农忙开始。', solar: '公历 6 月 5-7 日交节。' },
  夏至: { intro: '二十四节气中白昼最长的一天，太阳直射北回归线。', wu: '鹿角解、蝉始鸣、半夏生。', min: '古有祭神祀祖、吃面、消夏避暑等习俗，江淮一带"梅雨"季由此开始。', solar: '公历 6 月 21-22 日交节。' },
  小暑: { intro: '天气开始炎热，但未达极点。', wu: '温风至、蟋蟀居壁、鹰始挚。', min: '民间有晒伏、吃藕、食新等习俗，寓意防暑祛湿。', solar: '公历 7 月 6-8 日交节。' },
  大暑: { intro: '一年中最炎热的时节，雷雨频繁。', wu: '腐草为萤、土润溽暑、大雨时行。', min: '民间有饮伏茶、晒伏姜、烧仙草等习俗，消暑保健。', solar: '公历 7 月 22-24 日交节。' },
  立秋: { intro: '秋季第一个节气，标志暑去凉来。', wu: '凉风至、白露降、寒蝉鸣。', min: '民间有贴秋膘、咬秋、晒秋等习俗，寓意补益身体。', solar: '公历 8 月 7-9 日交节。' },
  处暑: { intro: '"处"为止，暑气至此而止。', wu: '鹰乃祭鸟、天地始肃、禾乃登。', min: '民间有出游迎秋、放河灯、吃鸭子等习俗。', solar: '公历 8 月 22-24 日交节。' },
  白露: { intro: '天气转凉，昼夜温差加大，地面水汽凝结成露。', wu: '鸿雁来、玄鸟归、群鸟养羞。', min: '民间有饮白露茶、吃龙眼、收露等习俗。', solar: '公历 9 月 7-9 日交节。' },
  秋分: { intro: '太阳直射赤道，昼夜再次平分。', wu: '雷始收声、蛰虫坯户、水始涸。', min: '民间有祭月、竖蛋、送秋牛等习俗。', solar: '公历 9 月 22-24 日交节。' },
  寒露: { intro: '露水更冷，将欲凝结。', wu: '鸿雁来宾、雀入大水为蛤、菊有黄华。', min: '民间有登高、赏菊、吃花糕等习俗。', solar: '公历 10 月 8-9 日交节。' },
  霜降: { intro: '秋季最后一个节气，初霜出现，天气渐冷。', wu: '豺乃祭兽、草木黄落、蛰虫咸俯。', min: '民间有赏菊、吃柿子、登高远眺等习俗。', solar: '公历 10 月 23-24 日交节。' },
  立冬: { intro: '冬季第一个节气，万物收藏，规避寒冷。', wu: '水始冰、地始冻、雉入大水为蜃。', min: '民间有迎冬、补冬、贺冬等习俗，饺子、羊肉是应节食品。', solar: '公历 11 月 7-8 日交节。' },
  小雪: { intro: '气温下降，北方地区开始降雪，但雪量不大。', wu: '虹藏不见、天气上升、闭塞成冬。', min: '民间有腌腊肉、晒鱼干、吃糍粑等习俗。', solar: '公历 11 月 22-23 日交节。' },
  大雪: { intro: '降雪可能性增大，地面可能积雪。', wu: '鹖旦不鸣、虎始交、荔挺出。', min: '北方民间有腌肉、封河、进补等习俗。', solar: '公历 12 月 6-8 日交节。' },
  冬至: { intro: '二十四节气中白昼最短的一天，民间有"冬至大如年"之说。', wu: '蚯蚓结、麋角解、水泉动。', min: '北方吃饺子、馄饨，南方吃汤圆、米团，祭祀祖先。', solar: '公历 12 月 21-23 日交节。' },
  小寒: { intro: '天气进一步寒冷，但未到极点。', wu: '雁北乡、鹊始巢、雉始雊。', min: '民间有吃腊八粥、菜饭、糯米饭等习俗，滋补养生。', solar: '公历 1 月 5-7 日交节。' },
  大寒: { intro: '二十四节气中最后一个节气，一年中最寒冷的时节。', wu: '鸡始乳、征鸟厉疾、水泽腹坚。', min: '民间有尾牙祭、扫尘、除旧布新等年节准备活动。', solar: '公历 1 月 20-21 日交节。' }
}

/** 节气独立成区（不再混入"今日节日"） */
function buildJieQiSection(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  const jieQi = lunar.getJieQi()
  if (!jieQi) return ''

  const kb = JIEQI_KB[jieQi]
  if (!kb) return ''

  const content = [
    `**${jieQi}**`,
    '',
    `📖 ${kb.intro}`,
    '',
    `🌱 **物候**：${kb.wu}`,
    '',
    `🎎 **民俗**：${kb.min}`,
    '',
    `📅 ${kb.solar}`
  ].join('\n')

  return ['## 🌱 二十四节气', '', content, ''].join('\n')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function shortText(text: string, max = 90): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

function pickTitle(item: WikiItem): string {
  const pageTitle = item.pages?.[0]?.titles?.normalized?.trim()
  if (pageTitle) return pageTitle
  const text = item.text?.trim() ?? ''
  if (!text) return '历史事件'
  return shortText(text, 24)
}

function normalizePunctuation(text: string): string {
  return text.replace(/：/g, ':').replace(/\s+/g, ' ').trim()
}

/** 清理标题/介绍里的括号、英语后缀、空格等噪音 */
function cleanHolidayField(value: string): string {
  return value
    .replace(/^[-—:：)\]】}\s]+/, '')
    .replace(/\s*（英语）\s*$/gi, '')
    .replace(/\s*\(英语\)\s*$/gi, '')
    .replace(/\s*（English）\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 根据节日名关键词推断分类，返回对应的介绍引导句 */
function inferFestivalCategory(title: string): { category: string; prefix: string } {
  const t = title.trim()
  if (/^(国际|世界|全球)/.test(t)) return { category: '国际纪念日', prefix: '国际性纪念日' }
  if (/^全国|^中国(?!共产党)/.test(t)) return { category: '全国纪念日', prefix: '全国性纪念日' }
  if (/^中国(共产党|人民解放军|人民|青年|教师|医师|航天|植树|学生|宪法)/.test(t)) return { category: '中国纪念日', prefix: '中国纪念日' }
  if (/圣诞|情人|感恩|万圣|复活|平安|母亲|父亲|七夕|元宵|端午|中秋|重阳|腊八|春节|除夕|龙抬头|教师/.test(t)) {
    return { category: '传统节日', prefix: '传统节日' }
  }
  return { category: '纪念日', prefix: '纪念日' }
}

function parseHolidayEntry(item: WikiItem): { title: string; intro: string } {
  const rawText = shortText(item.text ?? '', 140)
  const titleCandidate = cleanHolidayField(pickTitle(item))
  const normalized = normalizePunctuation(rawText)

  // 常见结构：国家/地区: 节日名
  const colonIdx = normalized.indexOf(':')
  if (colonIdx > 0) {
    const left = cleanHolidayField(normalized.slice(0, colonIdx))
    const right = cleanHolidayField(normalized.slice(colonIdx + 1))
    if (right) {
      const { prefix } = inferFestivalCategory(right)
      return {
        title: right.length <= 30 ? `${right}（${left}）` : right,
        intro: `${left}每年都纪念这一${prefix}。`
      }
    }
  }

  // ★ 修复：仅当 titleCandidate 是真实国家名（白名单）才进入此分支
  const isRealCountry = REAL_COUNTRY_NAMES.has(titleCandidate)
  if (isRealCountry && normalized.startsWith(`${titleCandidate}:`)) {
    const right = cleanHolidayField(normalized.slice(titleCandidate.length + 1))
    if (right) {
      const { prefix } = inferFestivalCategory(right)
      return {
        title: `${right}（${titleCandidate}）`,
        intro: `${titleCandidate}每年都纪念这一${prefix}。`
      }
    }
  }

  const cleanedTitle = titleCandidate || '今日纪念日'
  const cleanedIntro = cleanHolidayField(rawText || `${cleanedTitle}是当日纪念节点。`)

  return {
    title: cleanedTitle || '今日纪念日',
    intro: cleanedIntro || `${cleanedTitle || '该节日'}是值得公众关注的纪念节点，旨在唤起社会对该主题的思考。`
  }
}

function toBullet(item: WikiItem, fallbackYear = '佚年'): string {
  const year = Number.isFinite(item.year) ? String(item.year) : fallbackYear
  const text = item.text?.trim() || pickTitle(item)
  return `- ${year}年 — ${text}`
}

async function fetchWikiList(kind: 'events' | 'births' | 'deaths' | 'holidays', month: number, day: number): Promise<WikiItem[]> {
  const url = `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/${kind}/${month}/${day}`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'jcclab-history-generator/1.0'
    }
  })
  if (!response.ok) {
    throw new Error(`拉取 ${kind} 失败: HTTP ${response.status}`)
  }
  const data = (await response.json()) as { [key: string]: unknown }
  const raw = data[kind]
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is WikiItem => typeof item === 'object' && item !== null)
}

async function fetchMuffinLabs(targetDate: string): Promise<OnlineSource> {
  const [year, month, day] = targetDate.split('-').map(Number)
  if (!year || !month || !day) throw new Error(`非法日期: ${targetDate}`)
  const url = `https://history.muffinlabs.com/date/${month}/${day}`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'jcclab-history-generator/1.0'
    }
  })
  if (!response.ok) {
    throw new Error(`备用源拉取失败: HTTP ${response.status}`)
  }
  const data = (await response.json()) as {
    data?: {
      Events?: Array<{ year?: string; text?: string }>
      Births?: Array<{ year?: string; text?: string }>
      Deaths?: Array<{ year?: string; text?: string }>
    }
  }
  const eventsRaw = data.data?.Events ?? []
  const birthsRaw = data.data?.Births ?? []
  const deathsRaw = data.data?.Deaths ?? []
  const toWiki = (arr: Array<{ year?: string; text?: string }>): WikiItem[] =>
    arr
      .filter((item) => typeof item?.text === 'string' && item.text.trim().length > 0)
      .map((item) => ({
        year: Number(item.year),
        text: item.text
      }))
  return {
    events: toWiki(eventsRaw),
    births: toWiki(birthsRaw),
    deaths: toWiki(deathsRaw),
    holidays: [],
    techHints: []
  }
}

type OnlineSource = {
  events: WikiItem[]
  births: WikiItem[]
  deaths: WikiItem[]
  holidays: WikiItem[]
  techHints: WikiItem[]
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function normalizeDateLabel(targetDate: string): { month: number; day: number; label: string } {
  const [year, month, day] = targetDate.split('-').map(Number)
  if (!year || !month || !day) throw new Error(`非法日期: ${targetDate}`)
  return { month, day, label: `${month}月${day}日` }
}

function toYear(value: string): number | undefined {
  const cleaned = value.trim()
  if (!cleaned) return undefined
  if (cleaned.startsWith('前')) {
    const n = Number(cleaned.slice(1))
    return Number.isFinite(n) ? -n : undefined
  }
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function isMeaningfulText(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^[-—–_\s·.]+$/.test(t)) return false
  const nonSymbol = t.replace(/[-—–_\s·.，,。；;:：()（）【】[\]{}]/g, '')
  return nonSymbol.length >= 2
}

function extractBaiduItems(raw: string): OnlineSource {
  const cleaned = decodeHtmlEntities(
    raw
      .replace(/<script[\s\S]*?<\/script>/gi, '\n')
      .replace(/<style[\s\S]*?<\/style>/gi, '\n')
      .replace(/<[^>]+>/g, '\n')
  )
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '\n')

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length >= 6 && line.length <= 140)

  const events: WikiItem[] = []
  const births: WikiItem[] = []
  const deaths: WikiItem[] = []
  const holidays: WikiItem[] = []

  const eventReg = /^(前?\d{1,4})年[—\-–:：]?\s*(.+)$/
  const holidayReg = /^(世界|国际|全国|中国|地球|海军|航天).*(日|节|纪念日)$/

  for (const line of lines) {
    const m = line.match(eventReg)
    if (m) {
      const year = toYear(m[1])
      const text = m[2].trim()
      if (!isMeaningfulText(text)) continue
      const item: WikiItem = { year, text }
      if (/出生/.test(text)) births.push(item)
      else if (/逝世|去世|病逝|离世|辞世|身亡|遇难/.test(text)) deaths.push(item)
      else events.push(item)
      continue
    }
    if (holidayReg.test(line) && !/星期|农历|公历/.test(line) && isMeaningfulText(line)) {
      holidays.push({ text: line })
    }
  }

  return {
    events: selectUniqueByText(events, 40),
    births: selectUniqueByText(births, 20),
    deaths: selectUniqueByText(deaths, 20),
    holidays: selectUniqueByText(holidays, 6),
    techHints: pickEvents(events, (item) => containsKeyword(item.text ?? '', TECH_KEYWORDS), 8)
  }
}

function filterMeaningful(items: WikiItem[]): WikiItem[] {
  return items.filter((item) => isMeaningfulText(item.text ?? ''))
}

function filterChinesePreferred(items: WikiItem[]): WikiItem[] {
  const meaningful = filterMeaningful(items)
  const chinese = meaningful.filter((item) => hasChinese(item.text ?? ''))
  return chinese.length > 0 ? chinese : meaningful
}

async function fetchBaiduBaike(targetDate: string): Promise<OnlineSource> {
  const { label } = normalizeDateLabel(targetDate)
  const url = `https://baike.baidu.com/item/${encodeURIComponent(label)}`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    }
  })
  if (!response.ok) {
    throw new Error(`百度百科拉取失败: HTTP ${response.status}`)
  }
  const html = await response.text()
  const parsed = extractBaiduItems(html)
  return parsed
}

/** 从 lunar-javascript 内置节日数据库中抓取节日（不依赖网络） */
function getLunarBuiltInFestivals(targetDate: string): WikiItem[] {
  const [year, month, day] = targetDate.split('-').map(Number)
  if (!year || !month || !day) return []
  try {
    const solar = Solar.fromYmd(year, month, day)
    const solarFestivals = solar.getFestivals() || []
    const lunar = solar.getLunar()
    const lunarFestivals = lunar.getFestivals() || []
    const all = [...solarFestivals, ...lunarFestivals]
      .map((name) => (name || '').trim())
      .filter(Boolean)
    return all.map((name) => ({ text: name }))
  } catch {
    return []
  }
}

async function fetchOnlineSource(targetDate: string): Promise<OnlineSource> {
  const { month, day } = normalizeDateLabel(targetDate)

  // 优先百度百科：当前仅对“节日”使用百度数据，事件类条目仍走更稳定的数据源，避免半截文本污染正文
  let baiduHolidays: WikiItem[] = []
  let baiduTechHints: WikiItem[] = []
  try {
    const baidu = await fetchBaiduBaike(targetDate)
    baiduHolidays = filterChinesePreferred(baidu.holidays)
    baiduTechHints = filterMeaningful(baidu.techHints)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`百度百科不可用，回退其他源: ${message}`)
  }

  // lunar-javascript 内置节日（不依赖网络，作为稳定兜底）
  const builtInFestivals = getLunarBuiltInFestivals(targetDate)

  try {
    const [events, births, deaths, holidays] = await Promise.all([
      fetchWikiList('events', month, day),
      fetchWikiList('births', month, day),
      fetchWikiList('deaths', month, day),
      fetchWikiList('holidays', month, day)
    ])
    return {
      events,
      births,
      deaths,
      // 内置节日优先级最高 → 百度 → Wikipedia
      holidays: ensureMin(ensureMin(builtInFestivals, baiduHolidays, 4), holidays, 4),
      techHints: baiduTechHints
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`主数据源不可用，切换备用源: ${message}`)
    const fallback = await fetchMuffinLabs(targetDate)
    return {
      events: fallback.events,
      births: fallback.births,
      deaths: fallback.deaths,
      holidays: ensureMin(builtInFestivals, baiduHolidays, 4),
      techHints: baiduTechHints
    }
  }
}

const CHINA_KEYWORDS = ['中国', '中华', '北京', '上海', '南京', '广州', '香港', '台湾', '清朝', '民国', '中华人民共和国', '中国共产党']
const TECH_KEYWORDS = [
  '计算机',
  '互联网',
  '网络',
  '软件',
  '硬件',
  '卫星',
  '航天',
  'AI',
  '人工智能',
  '机器学习',
  '芯片',
  '电信',
  '通信',
  '平台',
  'Java',
  'Python',
  'Golang',
  'Go',
  'Vue',
  'React',
  '前端',
  '后端',
  '数据库',
  '云计算',
  '微服务',
  '手机',
  '智能手机',
  'Galaxy',
  'A380',
  '试飞',
  '卫星发射',
  '开源',
  '开发者'
]



function containsKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => new RegExp(escapeRegExp(keyword), 'i').test(text))
}

function selectUniqueByText(items: WikiItem[], limit: number): WikiItem[] {
  const seen = new Set<string>()
  const out: WikiItem[] = []
  for (const item of items) {
    const normalizedText = toSimplified((item.text ?? '').trim())
    const key = `${item.year ?? ''}|${normalizedText}`.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}

function pickEvents(source: WikiItem[], predicate: (item: WikiItem) => boolean, limit: number): WikiItem[] {
  return selectUniqueByText(source.filter(predicate), limit)
}

function ensureMin(items: WikiItem[], fallback: WikiItem[], limit: number): WikiItem[] {
  if (items.length >= limit) return items.slice(0, limit)
  const merged = [...items]
  for (const item of fallback) {
    if (merged.length >= limit) break
    merged.push(item)
  }
  return selectUniqueByText(merged, limit)
}

function buildSectionText(items: WikiItem[], fallbackText: string, limit = 4): string {
  const selected = selectUniqueByText(items, limit)
  if (selected.length === 0) return `- ${fallbackText}`
  return selected.map((item) => toBullet(item)).join('\n\n')
}

function normalizeFestivalTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()
}

function pickHolidayIntro(title: string, intro: string): string {
  const key = normalizeFestivalTitle(title)
  const mapped = HOLIDAY_INTRO_MAP[key]
  if (mapped) return mapped
  return intro
}

/** 真实国家/地区名白名单（用于判定是否误把节日名当成国家名） */
const REAL_COUNTRY_NAMES = new Set([
  '中国', '美国', '英国', '法国', '德国', '日本', '韩国', '朝鲜', '俄罗斯', '加拿大',
  '澳大利亚', '新西兰', '意大利', '西班牙', '葡萄牙', '荷兰', '比利时', '瑞士', '瑞典',
  '挪威', '丹麦', '芬兰', '波兰', '奥地利', '希腊', '以色列', '印度', '巴基斯坦',
  '泰国', '越南', '新加坡', '马来西亚', '印尼', '菲律宾', '蒙古', '巴西', '阿根廷',
  '墨西哥', '古巴', '智利', '秘鲁', '埃及', '南非', '尼日利亚', '肯尼亚', '伊朗',
  '伊拉克', '土耳其', '乌克兰', '罗马尼亚', '捷克', '匈牙利', '孟加拉', '尼泊尔',
  '缅甸', '老挝', '柬埔寨'
])

function isGarbageHolidayTitle(title: string): boolean {
  const t = title.trim()
  if (!t) return true
  if (t.length <= 1) return true
  // ★ 修复：仅当匹配国家白名单或 2-4 字纯中英文才视为"国家名"误判
  if (REAL_COUNTRY_NAMES.has(t)) return true
  // 排除节日常见后缀字（节/日/周/月/年/祭/诞/夕/夜）
  if (/^[\u4e00-\u9fa5A-Za-z]{2,4}$/.test(t) && !/[节祭诞夕夜]$/.test(t)) return true
  if (/[}{[\]<>]/.test(t)) return true
  if (/[)]{2,}|[（)]{3,}/.test(t)) return true
  // ★ 新增：前 3 字符是括号/标点残片
  if (/^[)）\]】}\s,，.。:：-]{1,3}/.test(t)) return true
  // ★ 新增：中英文括号数量不平衡
  const leftCount = (t.match(/[（(]/g) || []).length
  const rightCount = (t.match(/[)）]/g) || []).length
  if (leftCount !== rightCount) return true
  // ★ 新增：仅括号包裹的脏词（如「（xxx）」孤立成标题）
  if (/^[（(][^）)]*[）)]$/.test(t) && t.length < 8) return true
  return false
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

function buildHolidayBlocksFromOnline(holidays: WikiItem[], knownTitles: Set<string>): string[] {
  const parsed = holidays
    .map(parseHolidayEntry)
    .map(({ title, intro }) => ({
      title: cleanHolidayField(title),
      intro: cleanHolidayField(intro)
    }))
    .filter(({ title, intro }) => !isGarbageHolidayTitle(title) && (hasChinese(title) || hasChinese(intro)))
    .map(({ title, intro }) => {
      const t = toSimplified(title)
      const i = toSimplified(intro)
      const titleOnly = normalizeFestivalTitle(t)
      const introOnly = normalizeFestivalTitle(i)
      const introIsUseless = !i || introOnly === titleOnly || i.length < 8
      // ★ 智能兜底：使用 inferFestivalCategory 推断分类
      const resolvedIntro = introIsUseless
        ? `${t}是值得公众关注的纪念节点，旨在唤起社会对该主题的关注与思考。`
        : i
      return {
        title: t,
        intro: pickHolidayIntro(t, resolvedIntro)
      }
    })

  const blocks: string[] = []
  const seen = new Set<string>()
  for (const item of parsed) {
    const key = normalizeFestivalTitle(item.title)
    if (!key) continue
    if (knownTitles.has(key)) continue
    if (seen.has(key)) continue
    seen.add(key)
    // ★ 加粗标题
    blocks.push([`**${item.title}**`, '', item.intro].join('\n'))
    if (blocks.length >= 2) break
  }
  return blocks
}

function buildFestivalSectionMerged(targetDate: string, holidays: WikiItem[]): string {
  const fixedBody = buildFixedFestivalBody(targetDate)

  const known = new Set<string>()
  if (fixedBody) known.add(normalizeFestivalTitle(fixedBody.split('\n')[0] ?? ''))

  const onlineBlocks = buildHolidayBlocksFromOnline(holidays, known)
  const blocks = [fixedBody, ...onlineBlocks].filter(Boolean).join('\n\n')
  if (!blocks) return ''
  return ['## 🎈 今日节日', '', blocks, ''].join('\n')
}

async function buildMarkdown(targetDate: string, source: OnlineSource): Promise<string> {
  const headingDate = formatChineseDate(targetDate)
  const lunarText = formatLunarLine(targetDate)
  const festivalSection = buildFestivalSectionMerged(targetDate, source.holidays)
  const jieQiSection = buildJieQiSection(targetDate)
  const festivalBlock = festivalSection ? [festivalSection, ''].join('\n') : ''
  const jieQiBlock = jieQiSection ? [jieQiSection, '---', ''].join('\n') : ''

  const allEvents = selectUniqueByText(filterMeaningful(source.events), 50)
  const births = filterChinesePreferred(source.births)
  const deaths = filterChinesePreferred(source.deaths)
  const ancient = pickEvents(allEvents, (item) => (item.year ?? 99999) <= 1700, 3)
  const chinaModern = pickEvents(allEvents, (item) => (item.year ?? 0) >= 1800 && containsKeyword(item.text ?? '', CHINA_KEYWORDS), 4)
  const internationalModern = pickEvents(allEvents, (item) => (item.year ?? 0) >= 1701 && !containsKeyword(item.text ?? '', CHINA_KEYWORDS), 5)
  const tech = pickEvents(allEvents, (item) => containsKeyword(item.text ?? '', TECH_KEYWORDS), 4)
  const internationalNews = pickEvents(allEvents, (item) => (item.year ?? 0) >= 1990 && !containsKeyword(item.text ?? '', CHINA_KEYWORDS), 4)

  const sectionMap: Record<(typeof SECTION_ORDER)[number], string> = {
    '🏛️ 古代印记': buildSectionText(ensureMin(ancient, allEvents, 3), '暂无古代事件条目，后续补充。', 3),
    '🌍 近现代·国际': buildSectionText(ensureMin(internationalModern, allEvents, 5), '暂无近现代国际条目，后续补充。', 5),
    '💻 科技与互联网': buildSectionText(ensureMin(tech, internationalModern, 4), '暂无科技与互联网条目，后续补充。', 4),
    '🇨🇳 中国近现代': buildSectionText(ensureMin(chinaModern, allEvents.filter((item) => (item.year ?? 0) >= 1800), 4), '暂无中国近现代条目，后续补充。', 4),
    '🌐 国际要闻': buildSectionText(ensureMin(internationalNews, internationalModern, 4), '暂无国际要闻条目，后续补充。', 4),
    '🌟 今日出生': buildSectionText(births, '暂无今日出生条目，后续补充。', 4),
    '⚰️ 今日逝世': buildSectionText(deaths, '暂无今日逝世条目，后续补充。', 4),
    '🔥 今日热榜': await buildHotSearchSection()
  }

  const sections = SECTION_ORDER.map((name) => [`## ${name}`, '', sectionMap[name]].join('\n')).join('\n\n---\n\n')

  return [
    `【历史上的今天】${targetDate}`,
    '',
    `📅 公历：${headingDate}`,
    '',
    `📆 农历：${lunarText}`,
    '',
    '✨ 每日一则历史回望，读懂时光里的故事',
    '',
    festivalBlock,
    jieQiBlock,
    sections,
    '',
    '---',
    '',
    HISTORY_CLOSING_LINE
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function qualityGate(markdown: string): string {
  let text = markdown

  // 1) 清理明显脏行（仅符号或异常括号残片）
  text = text
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      if (!t) return true
      if (/^[-—–_.,:：;；()\[\]{}<>]+$/.test(t)) return false
      if (/^[)）\]】}\s,，.。:：-]+/.test(t) && t.length < 12) return false
      // ★ 新增：中英文括号数量不平衡的行（如「）（xxx」)
      const leftCount = (t.match(/[（(]/g) || []).length
      const rightCount = (t.match(/[)）]/g) || []).length
      if (leftCount !== rightCount && t.length < 20) return false
      return true
    })
    .join('\n')

  // 2) 节日介绍空洞句兜底替换
  text = text.replace(/^(.*)是当日的重要纪念节点。$/gm, (_m, p1: string) => {
    const title = p1.trim()
    const mapped = HOLIDAY_INTRO_MAP[normalizeFestivalTitle(title)]
    if (mapped) return mapped
    return `${title}是值得公众关注的纪念节点，旨在唤起社会对该主题的关注与思考。`
  })

  // 3) 替换另一个旧版兜底
  text = text.replace(/^(.*)是当日纪念节点。$/gm, (_m, p1: string) => {
    const title = p1.trim()
    const mapped = HOLIDAY_INTRO_MAP[normalizeFestivalTitle(title)]
    if (mapped) return mapped
    return `${title}是值得公众关注的纪念节点，旨在唤起社会对该主题的关注与思考。`
  })

  // 4) 程序员视角已移除（被今日热榜替代）

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

async function main(): Promise<void> {
  if (!fs.existsSync(historyDir)) {
    throw new Error(`未找到目录: ${historyDir}`)
  }

  const targetDate = resolveTargetDateIso()
  const targetFileName = `history-${targetDate}.md`
  const targetFilePath = path.join(historyDir, targetFileName)

  // 默认同定时任务行为：每次按固定结构重新生成；已存在则覆盖，不存在则新建。
  // 仅在本地需要保留手改稿时设置 SKIP_EXISTING_HISTORY_FILE=true 跳过已存在文件。
  const skipIfExists = process.env.SKIP_EXISTING_HISTORY_FILE === 'true'
  if (fs.existsSync(targetFilePath) && skipIfExists) {
    console.log(`目标文件已存在，跳过生成（SKIP_EXISTING_HISTORY_FILE=true）: ${targetFileName}`)
    return
  }

  try {
    const source = await fetchOnlineSource(targetDate)
    const markdown = qualityGate(toSimplified(await buildMarkdown(targetDate, source)))
    fs.writeFileSync(targetFilePath, `${markdown}\n`, 'utf8')
    console.log(`已生成历史文件: ${path.relative(rootDir, targetFilePath)}`)
    console.log(`已联网拉取条目：events=${source.events.length}, births=${source.births.length}, deaths=${source.deaths.length}, holidays=${source.holidays.length}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`联网生成失败: ${message}`)
  }
}

try {
  await main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`generate-history-daily 失败: ${message}`)
  process.exit(1)
}
