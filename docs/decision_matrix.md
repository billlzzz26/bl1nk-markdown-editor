# Decision Matrix - bl1nk-markdown-editor

เพื่อให้โปรเจกต์เดินหน้าได้อย่างรวดเร็วและมีประสิทธิภาพ อาจารย์ (Director) จำเป็นต้องตัดสินใจในประเด็นสำคัญดังนี้:

## 1. กลยุทธ์การแยกส่วน (Modularization Strategy)
ปัจจุบัน Editor ฝังแน่นอยู่กับแอปหลัก เราควรแยกมันออกมาอย่างไร?
- **Option A: Internal Component Library** - แยกโค้ดไปไว้ใน `src/components/editor` และทำให้เป็นอิสระจาก Convex/Global State (แนะนำสำหรับความเร็ว)
- **Option B: Separate NPM Package** - แยกเป็น Repo ใหม่หรือใช้ Monorepo เพื่อให้โปรเจกต์อื่นติดตั้งได้ผ่าน `npm install` (แนะนำสำหรับระยะยาว)

## 2. การเลือกใช้ Core Editor
ปัจจุบันใช้ Monaco Editor (ตัวเดียวกับ VS Code) ซึ่งทรงพลังแต่มีขนาดใหญ่
- **Option A: Stick with Monaco** - ข้อดี: Feature ครบ, คนคุ้นเคย, รองรับ AI Coding ได้ดี. ข้อเสีย: หนัก, ปรับแต่ง UI ยากในบางส่วน
- **Option B: Lightweight Alternative (เช่น CodeMirror 6 หรือ TipTap)** - ข้อดี: เบากว่า, ปรับแต่ง UI ได้ยืดหยุ่นกว่ามากสำหรับ Web App. ข้อเสีย: ต้องเขียน Logic Markdown ใหม่บางส่วน

## 3. รูปแบบการเชื่อมต่อ (Integration Pattern)
เราจะทำให้โปรเจกต์อื่นนำไปใช้ได้ "ง่าย" แค่ไหน?
- **Option A: Controlled Component** - รับ `value` และ `onChange` ตามมาตรฐาน React (ใช้ง่ายที่สุด)
- **Option B: Headless UI** - ให้เฉพาะ Logic แล้วให้ผู้ใช้นำไปครอบ UI เอง (ยืดหยุ่นที่สุดสำหรับดีไซน์เนอร์)

## 4. บทบาทของ AI (Agentic Features)
เราจะเน้นความสามารถด้าน AI แค่ไหนในตัว Editor?
- **Option A: Smart Autocomplete Only** - ช่วยเติมคำหรือจัดฟอร์แมต
- **Option B: Full Agentic Editor** - สามารถสั่ง "สรุปเนื้อหา", "แปลภาษา", หรือ "เขียนโค้ดตามสั่ง" ได้ในตัว (ใช้ `eve` framework ที่มีอยู่แล้ว)

---

**คำแนะนำจาก Practitioner (Wave 1):**
ผมแนะนำให้เริ่มจาก **1A (Internal Library)** + **2B (CodeMirror 6)** + **3A (Controlled Component)** เพื่อสร้าง "เวอร์ชันที่ใช้งานได้จริง" (MVP) ให้เร็วที่สุด แล้วค่อยขยับขยายไปตามความต้องการของ Director ครับ
