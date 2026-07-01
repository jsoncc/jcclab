/**
 * 热榜抓取与节日/节气生成相关公共函数
 * 提取自 generate-history-daily.ts，供 generate-hotnews-daily.ts 复用
 */

import { Solar } from 'lunar-javascript'

export type HotTopic = {
  rank: number
  title: string
  url: string
  summary?: string
}

// ==================== 节日相关常量与函数 ====================

/** 公历固定节日表：key 为 "MM-DD"，value 为 { name, intro } */
export const FESTIVAL_MAP: Record<string, { name: string; intro: string }> = {
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

/** 节日详情映射表（标准介绍，优先于 FESTIVAL_MAP.intro） */
export const HOLIDAY_INTRO_MAP: Record<string, string> = {
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

/** 24 节气知识库 */
export const JIEQI_KB: Record<string, { intro: string; wu: string; min: string; solar: string }> = {
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

/** 真实国家/地区名白名单 */
const REAL_COUNTRY_NAMES = new Set([
  '中国', '美国', '英国', '法国', '德国', '日本', '韩国', '朝鲜', '俄罗斯', '加拿大',
  '澳大利亚', '新西兰', '意大利', '西班牙', '葡萄牙', '荷兰', '比利时', '瑞士', '瑞典',
  '挪威', '丹麦', '芬兰', '波兰', '奥地利', '希腊', '以色列', '印度', '巴基斯坦',
  '泰国', '越南', '新加坡', '马来西亚', '印尼', '菲律宾', '蒙古', '巴西', '阿根廷',
  '墨西哥', '古巴', '智利', '秘鲁', '埃及', '南非', '尼日利亚', '肯尼亚', '伊朗',
  '伊拉克', '土耳其', '乌克兰', '罗马尼亚', '捷克', '匈牙利', '孟加拉', '尼泊尔',
  '缅甸', '老挝', '柬埔寨'
])

/** 节日标题清理（去除括号、英语后缀、空格等噪音） */
export function cleanHolidayField(value: string): string {
  return value
    .replace(/^[-—:：)\]】}\s]+/, '')
    .replace(/\s*（英语）\s*$/gi, '')
    .replace(/\s*\(英语\)\s*$/gi, '')
    .replace(/\s*（English）\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 格式化农历日期 */
export function formatLunarLine(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  return lunar.toString()
}

/** 从 lunar-javascript 内置数据库抓取节日（不联网） */
export function getLunarBuiltInFestivals(targetDate: string): string[] {
  const [year, month, day] = targetDate.split('-').map(Number)
  if (!year || !month || !day) return []
  try {
    const solar = Solar.fromYmd(year, month, day)
    const solarFestivals = solar.getFestivals() || []
    const lunar = solar.getLunar()
    const lunarFestivals = lunar.getFestivals() || []
    return [...solarFestivals, ...lunarFestivals]
      .map((name) => (name || '').trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/** 节日标题归一化（用于去重） */
function normalizeFestivalTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()
}

/** 节日智能介绍（优先用 HOLIDAY_INTRO_MAP） */
function pickHolidayIntro(title: string, intro: string): string {
  const key = normalizeFestivalTitle(title)
  return HOLIDAY_INTRO_MAP[key] || intro
}

/** 公历固定节日区块（按 mmdd 命中） */
function buildFixedFestivalBody(targetDate: string): string | null {
  const mmdd = targetDate.slice(5)
  const festival = FESTIVAL_MAP[mmdd]
  if (!festival) return null
  return [`**${festival.name}**`, '', festival.intro].join('\n')
}

/** 节日区块（合并 FESTIVAL_MAP + lunar-javascript 内置） */
export function buildFestivalSection(targetDate: string): string {
  const blocks: string[] = []

  // 1) FESTIVAL_MAP 命中
  const fixed = buildFixedFestivalBody(targetDate)
  if (fixed) blocks.push(fixed)

  // 2) lunar-javascript 内置节日
  const seen = new Set<string>()
  if (fixed) seen.add(normalizeFestivalTitle(fixed.split('\n')[0] ?? ''))

  const builtins = getLunarBuiltInFestivals(targetDate)
  for (const name of builtins) {
    const cleanName = cleanHolidayField(name)
    const key = normalizeFestivalTitle(cleanName)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const intro = HOLIDAY_INTRO_MAP[key] || `${cleanName}是值得公众关注的纪念日，旨在唤起社会对该主题的关注与思考。`
    blocks.push([`**${cleanName}**`, '', intro].join('\n'))
    if (blocks.length >= 3) break
  }

  if (blocks.length === 0) return ''
  return ['## 🎈 今日节日', '', blocks.join('\n\n'), ''].join('\n')
}

/** 节气独立区块 */
export function buildJieQiSection(isoDate: string): string {
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

// ==================== 原有热榜相关代码 ====================

/** 解码 HTML 实体（&amp; &lt; 等） */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** 从 HTML 中去掉 script/style/标签，只保留文本 */
export function extractTextFromHtml(html: string): string {
  return decodeHtmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
}

/** 截断摘要 */
export function shortSummary(text: string, max = 240): string {
  const cleaned = decodeHtmlEntities(text).replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

/**
 * 抓取 tophub.today 热搜 Top N
 * @param limit 取前 N 条，默认 10
 */
export async function fetchHotTopics(limit = 10): Promise<HotTopic[]> {
  const url = 'https://tophub.today/hot'
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    }
  })
  if (!response.ok) {
    throw new Error(`抓取 tophub 失败: HTTP ${response.status}`)
  }
  const html = await response.text()

  // 真实榜单容器：<ul class="rank-all-item daily-rank-list">
  // 每条：<li class="child-item">，内部有 <a href="..." itemid="..."> 包裹标题
  const listStart = html.indexOf('rank-all-item daily-rank-list')
  if (listStart < 0) {
    throw new Error('未找到热搜榜单容器（rank-all-item daily-rank-list）')
  }
  // 截取到 "我是有底线的"（榜单结束）
  const bottomIdx = html.indexOf('我是有底线的', listStart)
  const sectionHtml = bottomIdx > 0 ? html.slice(listStart, bottomIdx) : html.slice(listStart)

  // 匹配每条 <li class="child-item">...</li>
  const itemRegex = /<li class="child-item">([\s\S]{0,3000}?)<\/li>/g
  const topics: HotTopic[] = []
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(sectionHtml)) !== null) {
    if (topics.length >= limit) break
    const item = m[1]

    // 提取链接和 itemid
    const linkMatch = item.match(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*itemid="(\d+)"/)
    if (!linkMatch) continue
    const linkUrl = linkMatch[1]
    const itemid = linkMatch[2]

    // 提取标题：取 itemid 所在 <a> 标签的文本
    const titleMatch = item.match(new RegExp(`itemid="${itemid}">([\\s\\S]{0,500}?)</a>`))
    if (!titleMatch) continue
    const title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (!title) continue

    // 序号 = 当前已抓到的数量 + 1
    topics.push({ rank: topics.length + 1, title, url: linkUrl })
  }

  if (topics.length === 0) {
    throw new Error('解析热搜列表失败：未匹配到任何条目')
  }
  return topics
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 简单的随机延迟（毫秒） */
export function randomDelay(min = 800, max = 2500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min
  return sleep(ms)
}

export async function fetchTopicSummaryWithSearch(topic: HotTopic): Promise<string | null> {
  // 尝试多个搜索 query，按完整标题搜索
  const queries = [
    topic.title,
    topic.title.replace(/[？?！!，,。.\s]+/g, ' ').trim()
  ]

  for (const query of queries) {
    // 每次搜索前加随机延迟，避免触发反爬频率限制
    await randomDelay(600, 1500)
    const result = (await searchWithBaidu(query)) || (await searchWithBing(query))
    if (result) return result
  }
  return null
}

/** 抽象：过滤各种导航/验证页/界面文字 */
export const SKIP_TEXT_PATTERNS = [
  // Cloudflare 验证页
  'One last step',
  'Please solve the challenge',
  'Verify you are human',
  'cf-chl',
  'challenge-running',
  'Just a moment',
  'Verifying you are human',
  // 通用导航
  'Search Skip to content',
  'Accessibility Feedback',
  'Skip to content',
  // 百度界面
  '百度',
  '为您找到',
  '相关搜索',
  '网页',
  '图片',
  '资讯',
  '百度快照',
  '按时间排序',
  '按相关性排序',
  '百度热榜',
  '百度热搜',
  // Bing 界面
  'Bing',
  '必应',
  'Microsoft',
  'Privacy Policy',
  'Legal',
  // 微博界面
  '微博热搜',
  '微博搜索',
  '微博客户端',
  // 虎扑界面
  '虎扑社区',
  '虎扑',
  '步行街',
  '登录虎扑',
  // 通用干扰
  'JavaScript',
  'Cookies',
  'Enable JavaScript',
  '加载中',
  '正在加载',
  // tophub 侧边栏推荐内容
  '看见时间里的中国',
  'iDailyToday',
  '榜眼数据',
  '聚合全网',
  '热文库',
  // 热搜榜单特征词（密集出现说明抓的是榜单列表）
  '热搜榜',
  '今日热榜',
  '实时榜中榜',
  '日榜',
  '周榜',
  '月榜',
  '聚合热点',
  '热门话题',
  '热门微博',
  '热门知乎'
]

/** 提取查询中的核心中文词（>=2 字） */
export function extractQueryKeywords(query: string): string[] {
  return Array.from(new Set(query.match(/[\u4e00-\u9fa5]{2,}/g) || []))
}

/** 检测文本是否像"榜单列表"（带编号+短标题的密集列表） */
export function looksLikeRankList(text: string): boolean {
  // 检测模式："数字 + 空格 + 短文本" 出现 >= 3 次
  // 例如："1 世界杯 2 小男孩 3 地下管网 4 新华字典"
  const numberedItems = text.match(/\d+\s*[\u4e00-\u9fa5][^0-9]{2,15}/g) || []
  if (numberedItems.length >= 3) return true
  // 检测模式："数字 + 句号 + 文本" 出现 >= 3 次
  const dotItems = text.match(/\d+\.\s*[\u4e00-\u9fa5]/g) || []
  if (dotItems.length >= 5) return true
  return false
}

/** 检测是否包含大量"新/热"等榜单标记词（说明是榜单列表） */
export function hasRankMarkerDensity(text: string): boolean {
  // 短文本（<100字）里"新"或"热"超过 3 次
  if (text.length < 100) return false
  const markerCount = (text.match(/[\s\u4e00-\u9fa5][新热](\s|$|，|。|,)/g) || []).length
  return markerCount >= 4
}

/** 综合判断摘要是否有效 */
export function isValidAbstract(text: string, queryKeywords: string[] = []): boolean {
  // 长度检查
  if (text.length < 40 || text.length > 400) return false

  // 关键词黑名单
  for (const pattern of SKIP_TEXT_PATTERNS) {
    if (text.includes(pattern)) return false
  }

  // 必须包含足够的中文（>= 30%）
  const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  if (chineseCount / text.length < 0.3) return false

  // 不能全是标点
  const meaningful = text.replace(/[\s\p{P}]/gu, '')
  if (meaningful.length < 30) return false

  // 拒绝"榜单列表"特征
  if (looksLikeRankList(text)) return false

  // 拒绝高密度榜单标记词
  if (hasRankMarkerDensity(text)) return false

  // 关键词相关性检查（关键）
  if (queryKeywords.length > 0) {
    const matched = queryKeywords.filter((kw) => text.includes(kw))
    // 必须至少匹配 1/3 的查询关键词，且至少 1 个
    const requiredMatches = Math.max(1, Math.ceil(queryKeywords.length / 3))
    if (matched.length < requiredMatches) return false
  }

  return true
}

/** 智能提取搜索摘要（百度/Bing 通用） */
export function extractSearchAbstracts(html: string, query: string): string[] {
  const decoded = extractTextFromHtml(html)
  const queryKeywords = extractQueryKeywords(query)
  const abstracts: string[] = []
  const seen = new Set<string>()

  // 1. 优先尝试结构化选择器（百度 <div class="c-abstract"> / Bing <p class="b_paractl">）
  const structPatterns = [
    /<div[^>]*class="[^"]*\b(?:c-abstract|content-right_8Zs40|result-op\b)[^"]*"[^>]*>([\s\S]{30,500}?)<\/div>/g,
    /<p[^>]*class="[^"]*\bb_(?:paractl|algoSlug|caption|attribution)[^"]*"[^>]*>([\s\S]{30,500}?)<\/p>/g
  ]
  for (const re of structPatterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(decoded)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (isValidAbstract(text, queryKeywords) && !seen.has(text)) {
        seen.add(text)
        abstracts.push(text)
        if (abstracts.length >= 3) break
      }
    }
    if (abstracts.length >= 3) break
  }
  if (abstracts.length >= 3) return abstracts

  // 2. 兜底用通用正则（提取所有"中文+标点+空格"的连续片段）
  const abstractRegex = /[\u4e00-\u9fa5][\u4e00-\u9fa5A-Za-z0-9，。；：、！\?"'《》（）()\s,.!?;:'"-]{50,400}/g
  let match: RegExpExecArray | null
  while ((match = abstractRegex.exec(decoded)) !== null) {
    const text = match[0].trim()
    if (text.length < 60) continue
    if (isValidAbstract(text, queryKeywords) && !seen.has(text)) {
      seen.add(text)
      abstracts.push(text)
      if (abstracts.length >= 3) break
    }
  }
  return abstracts
}

export async function searchWithBaidu(query: string): Promise<string | null> {
  try {
    const url = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    })
    if (!response.ok) return null
    const html = await response.text()
    const abstracts = extractSearchAbstracts(html, query)
    if (abstracts.length > 0) {
      return shortSummary(abstracts.join(' '), 280)
    }
    return null
  } catch {
    return null
  }
}

export async function searchWithBing(query: string): Promise<string | null> {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    })
    if (!response.ok) return null
    const html = await response.text()
    const abstracts = extractSearchAbstracts(html, query)
    if (abstracts.length > 0) {
      return shortSummary(abstracts.join(' '), 280)
    }
    return null
  } catch {
    return null
  }
}

/** 简单清理话题标题，去掉末尾的"?"/"？"、问号，统一标点 */
export function normalizeTopicTitle(title: string): string {
  return title
    .replace(/\?+\s*$/g, '')
    .replace(/？+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 检测问题类型（用于兜底摘要生成） */
export function detectTopicType(title: string): string {
  if (/^\/+/.test(title)) return '讨论'
  if (/什么|为何|为什么|怎么|哪些|哪里|如何|怎样|是不是/.test(title)) return '提问'
  if (/评价|怎么看|如何看待|怎么看/.test(title)) return '讨论'
  if (/热搜|排行|榜单|第一|夺冠|破|刷新/.test(title)) return '热点'
  if (/宣布|发布|推出|上市|官宣|声明|回应|通报/.test(title)) return '事件'
  if (/去世|逝世|离世|遇难|身亡/.test(title)) return '事件'
  if (/道歉|回应|澄清|辟谣|否认/.test(title)) return '事件'
  if (/价格|涨价|跌|暴跌|上涨|跌至|降|售/.test(title)) return '事件'
  return '话题'
}

/** 当搜索引擎抓不到时，基于标题生成简短的兜底描述 */
export function generateFallbackSummary(title: string, url: string = ''): string {
  const normalized = normalizeTopicTitle(title)
  const type = detectTopicType(normalized)

  // 根据 URL 判断来源平台
  let platform = '网络'
  if (url.includes('zhihu.com')) platform = '知乎'
  else if (url.includes('s.weibo.com')) platform = '微博'
  else if (url.includes('bbs.hupu.com')) platform = '虎扑社区'
  else if (url.includes('mp.weixin.qq.com')) platform = '微信'
  else if (url.includes('douyin.com')) platform = '抖音'
  else if (url.includes('36kr.com')) platform = '36氪'

  return `${platform}热门${type}，详情点击原文查看`
}

/** 生成热榜区块 markdown（提取自 generate-history-daily.ts 的 buildHotSearchSection） */
export async function buildHotSearchSection(): Promise<string> {
  try {
    const topics = await fetchHotTopics(10)
    if (topics.length === 0) {
      return '- 今日热榜数据源暂不可用，后续补充。'
    }

    const items: string[] = []
    for (const topic of topics) {
      // 优先用搜索引擎抓摘要
      let summary = await fetchTopicSummaryWithSearch(topic)

      // 标题带上链接（无链接则保持纯文本）
      const heading = topic.url
        ? `### ${topic.rank}. [${topic.title}](${topic.url})`
        : `### ${topic.rank}. ${topic.title}`

      if (summary) {
        items.push(heading, `- **摘要**：${summary}`, '')
      } else {
        // 搜索引擎抓不到时，基于标题生成简短描述（兜底也要有内容）
        const fallback = generateFallbackSummary(topic.title, topic.url)
        items.push(heading, `- **摘要**：${fallback}`, '')
      }
    }

    if (items.length === 0) {
      return '- 今日热榜数据源抓取失败，后续补充。'
    }

    return `${items.join('\n').trim()}\n\n---\n\n✨ 关注实时热点，把握今日脉搏 ✨`
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `- 今日热榜抓取失败: ${message}`
  }
}
