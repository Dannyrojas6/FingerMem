# Basic-850 场景数据（唯一编辑来源）

本目录是**所有练习句子的唯一权威数据源**（Source of Truth）。

## 编辑规则

1. 只能在本目录下修改 `.json` 文件。
2. 修改完成后，**必须**执行同步脚本，将数据同步到应用内部：
   ```bash
   # 在项目根目录执行
   node scripts/sync-dicts.js
   ```
   或在 `app/` 目录下执行：
   ```bash
   npm run sync-dicts
   ```

3. **严禁**直接修改 `app/src/data/dicts/basic-850/` 下的文件（它们是自动生成的副本）。

## 数据结构

每个场景文件格式如下：

```json
{
  "name": "场景中文名称",
  "sentences": [
    { "en": "English sentence.", "zh": "对应中文翻译。" }
  ]
}
```

- 所有句子必须严格控制在 C.K. Ogden 基础英语 850 词范围内。
- 每个场景建议保持 10 条句子。

## 当前场景列表

- daily-life.json（日常对话）
- family.json（家庭生活）
- health.json（健康医疗）
- place.json（地点与方向）
- restaurant.json（餐厅点餐）
- shopping.json（购物）
- time.json（时间与日期）
- travel.json（旅行）
- weather.json（天气）
- work.json（工作场合）

## 注意事项

- 修改数据后需要重新运行同步脚本 + 刷新开发服务器。
- 未来如需增加新场景，直接在此目录新增 JSON 文件，然后重新同步即可。
