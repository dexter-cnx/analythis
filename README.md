# @dextercnx/analythis

[🇬🇧 English](README_EN.md)

`analythis` คือเครื่องมือวิเคราะห์โครงสร้าง repository ที่ไม่ผูกติดกับ framework ใด

ทำงานโดยตรวจสอบ repository ในเครื่องหรือ Git URL จากนั้นตรวจจับ profile ของ repo โดยอัตโนมัติ วิเคราะห์โครงสร้างและสถาปัตยกรรม รัน rule engine และส่งออก blueprint ที่อ่านได้ด้วยเครื่อง พร้อม markdown report สำหรับมนุษย์

## ฟีเจอร์

- วิเคราะห์โฟลเดอร์ในเครื่องหรือ clone Git repository ชั่วคราว
- **ตรวจจับ profile อัตโนมัติ** พร้อม confidence score และเหตุผล
- **Rule engine แบบ structured** — 10 กฎสถาปัตยกรรมใน 4 กลุ่ม
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

## การตรวจจับ Profile

`analythis` ตรวจจับ profile ของ repository โดยอัตโนมัติจากการให้คะแนน structural signals โดยไม่จำเป็นต้องระบุ flag `--profile` เอง โดย flag นี้ทำหน้าที่เป็น **hint** ที่ช่วยเสริมคะแนนให้ profile ที่ระบุเมื่อคะแนนใกล้เคียงกัน

### Profiles ที่รองรับ

| Profile | สัญญาณสำคัญ |
| ------- | ----------- |
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
| -- | ----- | ---------- |
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

## โครงสร้าง Output

`analythis analyze .` จะสร้างไฟล์ดังนี้:

```text
.analythis/
  inventory.json
  blueprint.json          ← มี detected_profiles + rule_findings
  prompt-pack.json
  reports/
    inventory.md
    module-report.md
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

### `analythis inspect <path-or-url>`

สร้างเฉพาะ `inventory.json` และ `reports/inventory.md` โดยไม่รันการวิเคราะห์หรือ rule engine

### `analythis export <blueprint-json>`

ตัวเลือก:

- `--to <type>`: `md | yaml` ค่าเริ่มต้น `md`
- `--output <dir>`: โฟลเดอร์ output ค่าเริ่มต้น `.analythis-export`

## สถาปัตยกรรม

```text
src/
  profiles/         ← นิยาม profile, registry, detector
  rules/            ← rule engine + 10 กฎ (dependency / architecture / structure / cross-cutting)
  core/
    engine/         ← analyzer pipeline
    types/          ← Blueprint, Inventory, options
  inspectors/       ← inventory, architecture, domain, interface, manifest, risk
  exporters/        ← markdown, yaml
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

## พัฒนาต่อ

```bash
npm install
npm run build
npm test
npm run dev -- analyze .
```

## แผนพัฒนาต่อ

- แสดง import graph แบบ visualization
- สรุป semantic code ที่ละเอียดยิ่งขึ้น
- วิเคราะห์เปรียบเทียบหลาย repo
- โหมด LLM deep-synthesis แบบ plugin ได้
- web dashboard
