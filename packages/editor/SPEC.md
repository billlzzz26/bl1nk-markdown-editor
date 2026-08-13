# Specification: bl1nk-editor (CodeMirror 6)

## 🎯 Goal
สร้าง Markdown Editor Package ที่พึ่งพาตนเองได้ (Self-contained), น้ำหนักเบา, และรองรับการขยายพลังผ่าน Plugin/AI ได้ง่าย

## 🏗️ Core Architecture
- **Engine**: CodeMirror 6
- **Language**: TypeScript
- **Framework Support**: React (via `@uiw/react-codemirror` or custom wrapper)
- **Language Engine**: Markdown (via `@codemirror/lang-markdown` extension inside the core)

## 🛠️ Feature Requirements (Wave 2)
1. **Markdown Support**: CommonMark + GFM extensions.
2. **AI Autocomplete**: 
   - ระบบแนะนำคำศัพท์ตามบริบท (Context-aware suggestions)
   - Custom Rules: สามารถกำหนดกฎการแนะนำคำได้ (เช่น ห้ามใช้คำไม่สุภาพ, แนะนำ Technical Terms เฉพาะโปรเจกต์)
3. **Custom Formatting**: ระบบจัดฟอร์แมตอัตโนมัติเมื่อพิมพ์ (Auto-format on type)
4. **Plugin Architecture**: 
   - รองรับการฉีด (Inject) CodeMirror Extensions เพิ่มเติมได้จากภายนอก
   - ระบบ Hook สำหรับดักจับเหตุการณ์ (Events) ใน Editor

## 📋 Integration Options for Director (Decision 3)
| รูปแบบ | ความง่ายในการใช้ | ความง่ายในการเพิ่ม Plugin | เหมาะสำหรับ |
|---|---|---|---|
| **Controlled Component** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | แอปทั่วไปที่ต้องการแค่ตัวรับข้อมูล |
| **Headless / Uncontrolled** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | แอปที่ต้องการควบคุม Logic หรือเพิ่ม Plugin ซับซ้อน (เช่น AI Agent ที่ต้องอ่าน Cursor ตลอดเวลา) |

## 🚀 Implementation Plan (Wave 2)
1. Initialize `packages/editor` with `package.json` and basic build setup.
2. Implement core CodeMirror 6 wrapper.
3. Add Markdown syntax highlighting and basic keymaps.
4. Implement AI Autocomplete interface (Mocked for Wave 2).
