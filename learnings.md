# learnings.md - Agent Memory Log (bl1nk-markdown-editor)

## 🤖 Communication Gaps (ความเข้าใจผิดจากการสื่อสาร)
| วันที่ | ปัญหาที่พบ | การแก้ไข/แนวทางในอนาคต |
|---|---|---|
| 2026-08-13 | การเขียนทับ `AGENTS.md` ล้มเหลวเนื่องจากมีไฟล์อยู่แล้วและมีเนื้อหาสำคัญ | อ่านเนื้อหาเดิมและใช้ `edit` เพื่อรวมเนื้อหา (Merge) แทนการ `write` ทับ |

## 💻 Technical Fixes (การแก้ไขทางเทคนิค)
| วันที่ | Bug/Issue | Root Cause & Solution |
|---|---|---|
| 2026-08-13 | โครงสร้าง Repo ซับซ้อน มี C++ Library | สำรวจความจำเป็นของ C++ Library (CTranslate2) ว่าเกี่ยวข้องกับ Editor Core หรือไม่ |

## 💡 Proactive Suggestions (ข้อเสนอแนะเพื่อการพัฒนา)
- **Delivery Strategy**: การส่งมอบงานที่มีการเปลี่ยนแปลงโครงสร้างใหญ่ (Monorepo) ควรใช้ Pull Request (PR) เพื่อให้ Director เห็น Diff ของการย้ายไฟล์ได้ชัดเจน
- **Monorepo Migration**: การย้าย Next.js เข้าไปใน `apps/web` ต้องจัดการเรื่อง Workspace dependencies ให้ถูกต้อง (ใช้ `pnpm-workspace.yaml`)
- **Modularization**: การแยก Editor ออกเป็น `packages/editor` ช่วยให้การพัฒนา AI Plugin ทำได้เป็นสัดส่วนและนำไปใช้ซ้ำได้ง่ายขึ้น
