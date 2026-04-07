# @dextercnx/analythis

[🇬🇧 English](README_EN.md)

`analythis` คือเครื่องมือวิเคราะห์โครงสร้าง repository ที่ไม่ผูกติดกับ framework ใด

ทำงานโดยตรวจสอบ repository ในเครื่องหรือ Git URL จากนั้นตรวจจับ profile ของ repo โดยอัตโนมัติ วิเคราะห์โครงสร้างและสถาปัตยกรรม รัน rule engine และส่งออก blueprint ที่อ่านได้ด้วยเครื่อง พร้อม markdown report สำหรับมนุษย์

## ฟีเจอร์

- วิเคราะห์โฟลเดอร์ในเครื่องหรือ clone Git repository ชั่วคราว
- **ตรวจจับ profile อัตโนมัติ** พร้อม confidence score และเหตุผล
- **Rule engine แบบ structured** — 10 กฎสถาปัตยกรรมใน 4 กลุ่ม
- **Import graph visualization** — parse imports และส่งออกเป็น JSON, Mermaid และ Graphviz DOT
- **Semantic code summarization** — ดึง exported symbols และอนุมาน domain responsibilities ต่อ module
- **Multi-repo comparison** — วิเคราะห์หลาย repository และเปรียบเทียบ blueprint แบบ side-by-side
- **LLM deep-synthesis** — ส่ง blueprint ให้ Anthropic, OpenAI หรือ Ollama สรุป, วิเคราะห์ risk, วางแผน refactor และสร้าง onboarding guide
- สร้างไฟล์ `.analythis/inventory.json` และ `.analythis/blueprint.json`
- ส่งออก markdown blueprint pack พร้อม findings จัดเรียงตาม severity
- ส่งออก YAML จาก blueprint JSON
- สร้าง prompt-pack สำหรับ refactoring, regeneration, core extraction และ onboarding

## ติดตั้ง

```bash
npm install -g @dextercnx/analythis
```

เมื่อติดตั้งแล้ว สามารถใช้คำสั่ง `analythis` ได้ทันทีจากทุกที่

## เริ่มต้นใช้งาน

วิเคราะห์ repo ปัจจุบัน:

```bash
analythis analyze .
```

วิเคราะห์พร้อมระบุ profile hint และโฟลเดอร์ output:

```bash
analythis analyze . --profile backend --output ./out --format both
```

ตรวจสอบโครงสร้างเท่านั้น (ไม่วิเคราะห์เต็มรูปแบบ):

```bash
analythis inspect .
```

ส่งออก blueprint เป็น markdown:

```bash
analythis export ./.analythis/blueprint.json --to md
```

ส่งออก blueprint เป็น YAML:

```bash
analythis export ./.analythis/blueprint.json --to yaml
```

วิเคราะห์จาก Git URL:

```bash
analythis analyze https://github.com/user/repo.git
```

สร้าง import graph พร้อมกับการวิเคราะห์:

```bash
analythis analyze . --graph
```

สร้าง import graph แบบ standalone:

```bash
analythis graph .
```

เปรียบเทียบสอง repo หรือมากกว่า:

```bash
analythis compare ./repo-a ./repo-b
analythis compare ./repo-a ./repo-b ./repo-c --format md --output ./out
```

รัน LLM synthesis หลังการวิเคราะห์:

```bash
analythis analyze . --llm-summarize --llm-risks
analythis analyze . --llm-refactor --llm-provider openai
analythis analyze . --llm-onboard --llm-provider ollama --llm-model llama3
```

## การตรวจจับ Profile

`analythis` ตรวจจับ profile ของ repository โดยอัตโนมัติจากการให้คะแนน structural signals โดยไม่จำเป็นต้องระบุ flag `--profile` เอง โดย flag นี้ทำหน้าที่เป็น **hint** ที่ช่วยเสริมคะแนนให้ profile ที่ระบุเมื่อคะแนนใกล้เคียงกัน

### Profiles ที่รองรับ

| Profile | สัญญาณสำคัญ |
| --- | --- |
| `generic` | Fallback — ใช้เมื่อไม่มี profile ใดผ่านเกณฑ์ |
| `web` | next.config, vite.config, tailwind.config, components/, pages/ |
| `backend` | server.ts entry, routes/, controllers/, Dockerfile, DB manifests |
| `mobile` | pubspec.yaml, Dart, android/, ios/, lib/ |
| `monorepo` | packages/, apps/, melos.yaml, lerna.json, turbo.json, pnpm-workspace.yaml |
| `library` | lib/, examples/, Cargo.toml, index entry, types/ |

### ผลลัพธ์การตรวจจับใน blueprint

```json
"detected_profiles": {
  "primary": "backend",
  "primaryConfidence": 0.68,
  "primaryReasons": [
    "Has server entry point (server.ts, server.js, app.ts)",
    "Framework hint: Node backend detected",
    "Has routes/ or controllers/ directory"
  ],
  "secondary": ["library"]
}
```

## Rule Engine

หลังจากตรวจจับ profile แล้ว `analythis` จะรัน 10 กฎโครงสร้างและรวม findings ไว้ใน blueprint

| กฎ | กลุ่ม | ความรุนแรง |
| --- | --- | --- |
| Cyclic module dependencies | dependency | high |
| High module coupling | dependency | medium |
| Missing layer boundary rules | dependency + architecture | medium |
| Missing service/use-case layer | architecture | high |
| Domain entities exposed via API (DTO leak) | architecture | medium |
| Mixed UI and data concerns | architecture | medium |
| Deeply nested module paths | structure | low |
| Oversized shared/utils module | structure | medium |
| Configuration scatter | cross-cutting | low |
| Auth logic scatter | cross-cutting | high |

กฎที่จำกัดเฉพาะ profile บางประเภท (เช่น `missing-service-layer` ใช้เฉพาะกับ `backend`) จะถูกข้ามโดยอัตโนมัติ

Findings จะแสดงใน `blueprint.rule_findings` (แบบ structured) และรวมเข้าไปใน `risks` กับ `refactor_opportunities` (string list) เพื่อ backward compatibility

## Import Graph (v1.1)

`analythis graph .` parse import statements จากไฟล์ TypeScript, JavaScript, Python และ Dart และส่งออก 3 รูปแบบ:

| ไฟล์ | รูปแบบ | ใช้งาน |
| --- | --- | --- |
| `graph.json` | Structured JSON | ใช้โดยโปรแกรม หรือ CI pipeline |
| `graph.mmd` | Mermaid flowchart | Render ได้ใน GitHub README หรือ Notion |
| `graph.dot` | Graphviz DOT | สร้างรูปภาพ PNG/SVG ด้วย `dot -Tpng graph.dot -o graph.png` |

Graph แยกประเภท edge ระหว่าง **internal** (import แบบ relative หรือ package-relative) และ **external** (npm package, stdlib เป็นต้น)

```bash
analythis graph .
analythis graph . --output ./reports --shallow
analythis analyze . --graph        # สร้าง graph พร้อมกับการวิเคราะห์เต็มรูปแบบ
```

## Semantic Code Summarization (v1.2)

ระหว่างการวิเคราะห์ แต่ละ module จะถูกเสริมข้อมูล semantic โดยไม่ต้องใช้ LLM:

- **`exports`** — สัญลักษณ์ที่ export ออกมา ดึงจาก regex (`export function`, `export class`, `export interface` ฯลฯ)
- **`responsibilities`** — label ด้าน domain อนุมานจากการจับคู่ชื่อ identifier กับ keyword dictionary 16 หมวด (Authentication, Billing, Notifications, RBAC, Data access, API layer ฯลฯ)
- **`summary`** — คำอธิบายบรรทัดเดียวที่รวม responsibilities และ exports สำคัญ

ข้อมูลเหล่านี้ปรากฏใน `blueprint.json` ภายในแต่ละ module และใน `reports/module-report.md`

```json
{
  "name": "src",
  "purpose": "Primary source code.",
  "summary": "Handles Authentication, Data access. Exports UserService, AuthGuard, TokenRepository and 12 more.",
  "exports": ["UserService", "AuthGuard", "TokenRepository", "..."],
  "responsibilities": ["Authentication", "Data access", "Authorization & RBAC"]
}
```

## Multi-Repo Comparison (v1.3)

`analythis compare` รัน full analysis บนแต่ละ repository และสร้าง structured diff

```bash
analythis compare ./repo-a ./repo-b
analythis compare https://github.com/a/x.git https://github.com/b/y.git --format both
```

ผลลัพธ์:

| ไฟล์ | เนื้อหา |
| --- | --- |
| `comparison.json` | Structured diff — profiles, architecture styles, module names, จำนวน risk |
| `comparison.md` | Report ที่อ่านได้ พร้อม summary table, divergence flags, findings ต่อ repo และ recommendation |

Comparison report แสดง:

- **Profile mismatch** — repo ใช้ detected profile ต่างกันหรือไม่
- **Architecture mismatch** — architecture style แตกต่างกัน (service-oriented vs feature-first ฯลฯ)
- **Shared characteristics** — pattern สถาปัตยกรรมและ risk ที่มีร่วมกันทุก repo
- **Unique characteristics** — สิ่งที่แต่ละ repo มีแต่ repo อื่นไม่มี
- **Recommendation** — สรุปแนะนำสำหรับการ integrate หรือ align

## LLM Deep-Synthesis (v2.0)

หลังจากการวิเคราะห์แบบ heuristic `analythis` สามารถส่ง blueprint ให้ LLM เพื่อสร้าง insight ที่ลึกกว่า

### Synthesis tasks

| Flag | ไฟล์ output | คำอธิบาย |
| --- | --- | --- |
| `--llm-summarize` | `llm/llm-summary.md` | Executive summary — จุดประสงค์, สถาปัตยกรรม, risk, ขั้นตอนถัดไป |
| `--llm-risks` | `llm/llm-risks.md` | วิเคราะห์ risk เชิงลึก พร้อม root cause, business impact และ remediation backlog |
| `--llm-refactor` | `llm/llm-refactor.md` | แผน refactor จัดลำดับความสำคัญ พร้อม rationale และ effort estimate |
| `--llm-onboard` | `llm/llm-onboard.md` | Onboarding guide สำหรับนักพัฒนาใหม่ |

### Providers ที่รองรับ

| Provider | Flag | ต้องการ |
| --- | --- | --- |
| Anthropic (default) | `--llm-provider anthropic` | `npm install @anthropic-ai/sdk` + `ANTHROPIC_API_KEY` |
| OpenAI | `--llm-provider openai` | `npm install openai` + `OPENAI_API_KEY` |
| Ollama | `--llm-provider ollama` | Ollama รันในเครื่อง (`ollama serve`) |

ทั้ง `@anthropic-ai/sdk` และ `openai` เป็น **optional peer dependencies** — ติดตั้งเฉพาะที่ต้องการใช้ Ollama ไม่ต้องติดตั้ง package เพิ่ม (ใช้ native `fetch`)

### การใช้งาน

```bash
# ใช้ ANTHROPIC_API_KEY จาก environment (provider เริ่มต้น)
analythis analyze . --llm-summarize

# รันหลาย task พร้อมกัน
analythis analyze . --llm-summarize --llm-risks --llm-refactor --llm-onboard

# เปลี่ยน provider หรือ model
analythis analyze . --llm-risks --llm-provider openai --llm-model gpt-4o
analythis analyze . --llm-onboard --llm-provider ollama --llm-model llama3
```

### Config file `.analythisrc.json`

วางไฟล์นี้ที่ root ของ project หรือ home directory เพื่อตั้งค่าเริ่มต้น:

```json
{
  "llm": {
    "provider": "anthropic",
    "model": "claude-opus-4-6",
    "apiKey": "${ANTHROPIC_API_KEY}"
  }
}
```

`${VAR_NAME}` จะถูก resolve จาก environment variables ตอน runtime CLI flags มีความสำคัญสูงกว่า config file เสมอ

### Custom providers

Register LLM plugin เพิ่มเติมที่ runtime:

```typescript
import { registerLLMPlugin } from '@dextercnx/analythis/llm/registry';

registerLLMPlugin({
  name: 'my-provider' as any,
  async synthesize(prompt, config) {
    return myClient.complete(prompt);
  }
});
```

## โครงสร้าง Output

`analythis analyze .` จะสร้างไฟล์ดังนี้:

```text
.analythis/
  inventory.json
  blueprint.json          ← มี detected_profiles + rule_findings + module semantics
  prompt-pack.json
  graph.json              ← import graph (เมื่อใช้ --graph)
  graph.mmd               ← Mermaid diagram
  graph.dot               ← Graphviz DOT
  llm/                    ← LLM synthesis (เมื่อใช้ --llm-* flags)
    index.md
    llm-summary.md
    llm-risks.md
    llm-refactor.md
    llm-onboard.md
  reports/
    inventory.md
    module-report.md      ← มี exports + responsibilities ต่อ module
    dependency-report.md
  blueprint/
    system-overview.md    ← profile confidence + เหตุผลการตรวจจับ
    domain-map.md
    architecture-rules.md ← violations พร้อม suggestions
    api-surfaces.md
    risks-and-gaps.md     ← rule findings จัดกลุ่มตาม severity
    next-prompts.md
  prompts/
    refactor.md
    regenerate.md
    extract_core.md
    onboard_team.md
```

`analythis compare` จะสร้าง:

```text
.analythis-compare/
  comparison.json
  comparison.md
```

## คำสั่งที่รองรับ

### `analythis analyze <path-or-url>`

ตัวเลือก:

- `--profile <name>`: hint สำหรับเสริม profile — `generic | web | backend | mobile | monorepo | library`
- `--focus <items>`: โฟกัสเฉพาะส่วน เช่น `auth,billing,queue`
- `--output <dir>`: โฟลเดอร์ output ค่าเริ่มต้น `.analythis`
- `--format <type>`: `json | md | both` ค่าเริ่มต้น `both`
- `--branch <name>`: Git branch สำหรับ remote repo
- `--shallow`: วิเคราะห์เร็วขึ้น เบาขึ้น
- `--verbose`: แสดง log รายละเอียด
- `--graph`: สร้าง import graph ด้วย (`graph.json`, `graph.mmd`, `graph.dot`)
- `--llm-summarize`: LLM — สร้าง executive summary
- `--llm-risks`: LLM — วิเคราะห์ risk เชิงลึก
- `--llm-refactor`: LLM — สร้างแผน refactor
- `--llm-onboard`: LLM — สร้าง onboarding guide
- `--llm-provider <name>`: เลือก provider — `anthropic | openai | ollama`
- `--llm-model <name>`: ระบุชื่อ model

### `analythis graph <path-or-url>`

สร้าง import graph แบบ standalone โดยไม่รัน full analysis

ตัวเลือก:

- `--output <dir>`: โฟลเดอร์ output ค่าเริ่มต้น `.analythis`
- `--branch <name>`: Git branch สำหรับ remote repo
- `--shallow`: วิเคราะห์เร็วขึ้น เบาขึ้น

### `analythis inspect <path-or-url>`

สร้างเฉพาะ `inventory.json` และ `reports/inventory.md` โดยไม่รันการวิเคราะห์หรือ rule engine

### `analythis compare <path-or-url...>`

วิเคราะห์สอง repository หรือมากกว่า แล้วสร้าง comparison report

ตัวเลือก:

- `--output <dir>`: โฟลเดอร์ output ค่าเริ่มต้น `.analythis-compare`
- `--format <type>`: `json | md | both` ค่าเริ่มต้น `both`
- `--branch <name>`: Git branch สำหรับ remote repo
- `--shallow`: วิเคราะห์เร็วขึ้น เบาขึ้น

### `analythis export <blueprint-json>`

ตัวเลือก:

- `--to <type>`: `md | yaml` ค่าเริ่มต้น `md`
- `--output <dir>`: โฟลเดอร์ output ค่าเริ่มต้น `.analythis-export`

## สถาปัตยกรรม

```text
src/
  profiles/         ← นิยาม profile, registry, detector
  rules/            ← rule engine + 10 กฎ (dependency / architecture / structure / cross-cutting)
  llm/              ← ระบบ LLM plugin
    plugins/        ← anthropic, openai, ollama
    config.ts       ← อ่าน .analythisrc.json + resolve env var
    registry.ts     ← plugin registry
    synthesizer.ts  ← prompt builder + task runner
    types.ts        ← LLMPlugin, LLMConfig, SynthesisTask interfaces
  core/
    engine/         ← analyzer pipeline, comparator
    types/          ← Blueprint, Inventory, options
  inspectors/       ← inventory, architecture, domain, interface, manifest, risk,
                       import-graph, semantic
  exporters/        ← markdown, yaml, graph, comparison, llm
  intake/           ← local path + git clone resolution
  cli/              ← commander CLI
```

### เพิ่ม Profile ใหม่

สามารถ register profile เพิ่มได้ที่ runtime โดยไม่ต้อง fork:

```typescript
import { registerProfile } from '@dextercnx/analythis/profiles';

registerProfile({
  id: 'data-pipeline',
  title: 'Data Pipeline',
  description: 'Batch or streaming data processing repository.',
  signals: [
    { id: 'dp:airflow', description: 'Has Airflow DAGs', weight: 10, test: inv => inv.topLevelDirs.includes('dags') },
    { id: 'dp:spark',   description: 'Has Spark jobs',   weight: 8,  test: inv => inv.topLevelDirs.includes('jobs') }
  ],
  inspectors: ['inventory', 'manifest', 'risk'],
  ruleGroups: ['structure', 'cross-cutting'],
  heuristicStrategies: ['directory-pattern'],
  weights: {}
});
```

### เพิ่ม Rule ใหม่

Implement `AnalysisRule` และเพิ่มเข้า `allRules` ใน `src/rules/index.ts`:

```typescript
import type { AnalysisRule } from './types';

export const myRule: AnalysisRule = {
  id: 'cross/my-check',
  title: 'My Custom Check',
  description: 'Detects ...',
  severity: 'medium',
  ruleGroups: ['cross-cutting'],
  profiles: [],   // empty = ใช้กับทุก profile
  enabled: true,
  evaluate({ inventory, blueprint, profileResult }) {
    // return RuleResult[]
    return [];
  }
};
```

## หมายเหตุการออกแบบ

`analythis` ใช้วิธี heuristic โดยเจตนา การตรวจจับเป็น deterministic และ explainable — ทุก confidence score มาพร้อมรายการ signal ที่ตรวจพบ blueprint ที่ได้สามารถนำไปป้อนให้ coding agent, refactor planner หรือ workflow สร้างเอกสาร onboarding ได้ทันที

LLM layer เป็น optional และ additive — pipeline วิเคราะห์หลักให้ผลลัพธ์เดิมไม่ว่าจะใช้ `--llm-*` flags หรือไม่

## พัฒนาต่อ

```bash
npm install
npm run build
npm test
npm run dev -- analyze .
```

## แผนพัฒนา

| เวอร์ชัน | ฟีเจอร์ | สถานะ |
| --- | --- | --- |
| v1.1 | Import graph visualization | ✅ เสร็จแล้ว |
| v1.2 | Semantic code summarization | ✅ เสร็จแล้ว |
| v1.3 | Multi-repo comparison | ✅ เสร็จแล้ว |
| v2.0 | LLM plugin mode | ✅ เสร็จแล้ว |
| v2.1 | Web dashboard | วางแผน |
