---
layout: home
---

# 历史上的今天
这里记录每天发生的历史大事件

{% for post in site.posts %}
## [{{ post.title }}]({{ post.url }})
<small>{{ post.date | date: "%Y年%m月%d日" }}</small>
<p>{{ post.excerpt | strip_html | truncate: 100 }}</p>
{% endfor %}
