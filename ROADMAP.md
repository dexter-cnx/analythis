# Roadmap

## v1.1 — Import Graph Visualization

**เป้าหมาย:** วิเคราะห์ว่า module ไหน import ใคร และแสดงเป็น graph

### แนวทาง

1. **Parse imports** จากไฟล์ต้นทาง
   - TypeScript/JavaScript: regex หรือ `@typescript-eslint/parser`
   - Python: AST module ใน stdlib
   - Dart: regex บน `import '...'`

2. **สร้าง graph data structure**
   ```ts
   interface ImportGraph {
     nodes: { id: string; file: string; language: string }[];
     edges: { from: string; to: string; type: 'internal' | 'external' }[];
   }
   ```

3. **ส่งออก 3 รูปแบบ**
   - `graph.json` — สำหรับ programmatic use
   - `graph.mmd` — Mermaid diagram (render ได้ใน GitHub README ทันที)
   - `graph.dot` — Graphviz DOT สำหรับ render ภาพ PNG/SVG

4. **CLI flag ใหม่**
   ```bash
   analythis analyze . --graph
   analythis graph .           # standalone command
   ```

### ไฟล์ที่ต้องสร้าง
- `src/inspectors/import-graph-inspector.ts`
- `src/exporters/graph.ts`
- `src/cli/commands/graph.ts`

---

## v1.2 — Semantic Code Summarization

**เป้าหมาย:** สรุปความหมายของ file/module แต่ละอัน แทนที่จะดูแค่ชื่อไฟล์

### แนวทาง

1. **AST-based (ไม่ต้องใช้ LLM)** สำหรับ TypeScript
   - ดึง exported functions, classes, interfaces จาก AST
   - ใช้ `typescript` compiler API หรือ `ts-morph`
   - สร้าง structured summary ต่อไฟล์

2. **Heuristic keyword extraction**
   - ดึง identifier names ที่ซ้ำๆ ในไฟล์
   - Map กับ domain dictionary (auth, payment, notification ฯลฯ)

3. **Output เพิ่มเติมใน blueprint**
   ```ts
   interface BlueprintModule {
     name: string;
     path: string;
     summary: string;        // เพิ่มใหม่
     exports: string[];      // เพิ่มใหม่
     responsibilities: string[]; // เพิ่มใหม่
   }
   ```

### Dependencies
- `ts-morph` สำหรับ TypeScript AST

---

## v1.3 — Multi-Repo Comparison

**เป้าหมาย:** รัน analyze หลาย repo พร้อมกัน แล้วเปรียบเทียบ blueprint

### แนวทาง

1. **CLI command ใหม่**
   ```bash
   analythis compare ./repo-a ./repo-b
   analythis compare https://github.com/a/x.git https://github.com/b/y.git
   ```

2. **Comparison engine**
   - รัน `analyzeRepository` บน N repos แบบ parallel
   - diff blueprint fields: architecture style, languages, risks, dependencies
   - หา shared patterns และ divergence points

3. **Output**
   - `comparison.json` — structured diff
   - `comparison.md` — human-readable report พร้อม table เปรียบเทียบ

4. **Data structure**
   ```ts
   interface ComparisonReport {
     repos: { name: string; blueprint: Blueprint }[];
     shared: { languages: string[]; patterns: string[]; risks: string[] };
     unique: Record<string, { languages: string[]; patterns: string[] }>;
     recommendation: string;
   }
   ```

### ไฟล์ที่ต้องสร้าง
- `src/core/engine/comparator.ts`
- `src/exporters/comparison.ts`
- `src/cli/commands/compare.ts`

---

## v2.0 — LLM Deep-Synthesis Plugin Mode

**เป้าหมาย:** ให้ LLM อ่าน blueprint แล้วสร้าง insight ที่ลึกกว่า heuristic ทำได้

### แนวทาง

1. **Plugin interface**
   ```ts
   interface LLMPlugin {
     name: string;
     synthesize(blueprint: Blueprint, prompt: string): Promise<string>;
   }
   ```

2. **Built-in plugins**
   - `OpenAIPlugin` — ใช้ `openai` SDK
   - `AnthropicPlugin` — ใช้ `@anthropic-ai/sdk`
   - `OllamaPlugin` — local model ผ่าน Ollama HTTP API

3. **Synthesis tasks**
   - `--llm-summarize` — สรุป codebase ภาษามนุษย์
   - `--llm-risks` — วิเคราะห์ risk เชิงลึก
   - `--llm-refactor` — แนะนำ refactor plan พร้อม rationale
   - `--llm-onboard` — สร้าง onboarding guide อัตโนมัติ

4. **Config file** `.analythisrc.json`
   ```json
   {
     "llm": {
       "provider": "anthropic",
       "model": "claude-opus-4-6",
       "apiKey": "${ANTHROPIC_API_KEY}"
     }
   }
   ```

5. **CLI**
   ```bash
   analythis analyze . --llm-summarize
   analythis analyze . --llm-risks --llm-provider openai
   ```

### Dependencies
- `openai` (optional peer dependency)
- `@anthropic-ai/sdk` (optional peer dependency)

---

## v2.1 — Web Dashboard

**เป้าหมาย:** UI สำหรับดู blueprint, import graph และเปรียบเทียบ repo ใน browser

### แนวทาง

1. **Stack**
   - Framework: Next.js (App Router)
   - Graph: `@xyflow/react` (React Flow) สำหรับ import graph
   - Chart: `recharts` สำหรับ stats
   - Deploy: static export หรือ `vercel`

2. **โหมด serve**
   ```bash
   analythis serve .analythis/   # เปิด localhost:3000
   analythis serve --port 8080
   ```
   CLI spawn HTTP server ที่ serve static dashboard พร้อม blueprint data

3. **Features**
   - Overview page — summary, stats, risks
   - Module graph — interactive import graph (zoom, filter, highlight)
   - Entity map — domain entities และ relationships
   - Compare view — side-by-side blueprint comparison
   - Export — download blueprint เป็น JSON/YAML/PDF จาก UI

4. **Architecture**
   ```
   packages/
     cli/        (ปัจจุบัน — @dextercnx/analythis)
     dashboard/  (Next.js app ใหม่)
     core/       (shared types + engine — extract จาก cli)
   ```
   เปลี่ยนเป็น monorepo ด้วย npm workspaces

---

## สรุป Timeline

| Version | Feature | ความยาก |
|---------|---------|---------|
| v1.1 | Import graph visualization | ปานกลาง |
| v1.2 | Semantic summarization | ปานกลาง |
| v1.3 | Multi-repo comparison | ง่าย |
| v2.0 | LLM plugin mode | ปานกลาง |
| v2.1 | Web dashboard | ยาก |

**แนะนำให้เริ่มที่ v1.3 (Multi-repo comparison)** เพราะใช้ infrastructure ที่มีอยู่แล้วทั้งหมด ใช้เวลาน้อย และให้คุณค่าสูงทันที
