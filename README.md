# @dextercnx/analythis

[🇬🇧 English](README_EN.md)

`analythis` คือเครื่องมือวิเคราะห์โครงสร้าง repository ที่ไม่ผูกติดกับ framework ใด

ทำงานโดยการตรวจสอบ repository ในเครื่องหรือ Git URL แล้วอนุมานโครงสร้าง สถาปัตยกรรม โมดูล entities, APIs, ความเสี่ยง และส่วนที่นำกลับมาใช้ใหม่ได้ จากนั้นส่งออกเป็น blueprint ที่อ่านได้ด้วยเครื่องและรายงาน markdown สำหรับมนุษย์

## ฟีเจอร์

- วิเคราะห์โฟลเดอร์ในเครื่องหรือ clone Git repository ชั่วคราว
- สร้างไฟล์ `.analythis/inventory.json`
- สร้างไฟล์ `.analythis/blueprint.json`
- ส่งออก markdown blueprint pack
- ส่งออก YAML จาก blueprint JSON
- รองรับ profile แบบ heuristic สำหรับ web, backend, mobile, library และ monorepo
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

วิเคราะห์พร้อมระบุ profile และโฟลเดอร์ output:

```bash
analythis analyze . --profile backend --output ./out --format both
```

ตรวจสอบโครงสร้างเท่านั้น:

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

## โครงสร้าง output

`analythis analyze .` จะสร้างไฟล์ดังนี้:

```text
.analythis/
  inventory.json
  blueprint.json
  prompt-pack.json
  reports/
    inventory.md
    module-report.md
    dependency-report.md
  blueprint/
    system-overview.md
    domain-map.md
    architecture-rules.md
    api-surfaces.md
    risks-and-gaps.md
    next-prompts.md
```

## คำสั่งที่รองรับ

### `analythis analyze <path-or-url>`

ตัวเลือก:

- `--profile <name>`: `generic | web | backend | mobile | monorepo | library`
- `--focus <items>`: โฟกัสเฉพาะส่วน เช่น `auth,billing,queue`
- `--output <dir>`: โฟลเดอร์ output ค่าเริ่มต้น `.analythis`
- `--format <type>`: `json | md | both` ค่าเริ่มต้น `both`
- `--branch <name>`: Git branch สำหรับ remote repo
- `--shallow`: วิเคราะห์เร็วขึ้น เบาขึ้น
- `--verbose`: แสดง log รายละเอียด

### `analythis inspect <path-or-url>`

สร้างเฉพาะ `inventory.json` และ `reports/inventory.md`

### `analythis export <blueprint-json>`

ตัวเลือก:

- `--to <type>`: `md | yaml` ค่าเริ่มต้น `md`
- `--output <dir>`: โฟลเดอร์ output ค่าเริ่มต้น `.analythis-export`

## หมายเหตุการออกแบบ

`analythis` ใน v1.0 ใช้วิธี heuristic โดยเจตนา มุ่งให้ context ที่มีโครงสร้างและมีประโยชน์ได้อย่างรวดเร็ว มากกว่าความเข้าใจ semantic ที่สมบูรณ์แบบ blueprint ที่ได้สามารถนำไปป้อนให้ coding agent, refactor planner หรือ workflow สร้างเอกสาร onboarding ได้ทันที

## พัฒนาต่อ

```bash
npm install
npm run build
npm run dev -- analyze .
```

## แผนพัฒนาต่อ

- แสดง import graph แบบ visualization
- สรุป semantic code ที่ละเอียดยิ่งขึ้น
- วิเคราะห์เปรียบเทียบหลาย repo
- โหมด LLM deep-synthesis แบบ plugin ได้
- web dashboard
