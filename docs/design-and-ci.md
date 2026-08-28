# Design System and CI

เอกสารนี้กำหนดแนวทางหน้าจอและการตรวจคุณภาพสำหรับระบบประเมินราคาบ้านที่พัฒนาต่อจาก [docs/requirements/mvp.md](requirements/mvp.md)

## Design direction

แนวทางหลักคือ **Modern SaaS for appraisal work**: สว่าง สะอาด ใช้งานซ้ำได้เร็วบน desktop และ mobile และยังคงความน่าเชื่อถือของข้อมูลประเมิน

- ใช้พื้นหลังขาวอมฟ้า surface ขาว และสี teal/blue สำหรับ navigation, focus และ action เพื่อให้ดูทันสมัยแต่ไม่รบกวนสายตา
- ใช้ typography scale ที่สม่ำเสมอสำหรับ heading, body, label, badge, table และตัวเลขราคา ไม่ปล่อยให้ font size กระจัดกระจายตามหน้า
- ใช้ spacing scale เดียวกันสำหรับ gap, padding และ section rhythm เพื่อให้ฟอร์มและข้อมูลสแกนง่าย
- ใช้เส้นแบ่งบาง shadow เบา และ panel เท่าที่จำเป็น แทนการซ้อน card หลายชั้น
- ให้ข้อมูลสำคัญ เช่น เลขที่งาน สถานะ และราคาประเมินเห็นได้ชัด โดยยังต้องไม่ทำให้ mobile layout แตกหรือปุ่มตกบรรทัดอ่านยาก
- ปุ่มหลักต้องมี label ชัดเจน ส่วน icon-only button ใช้เมื่อเป็นสัญลักษณ์ที่คุ้นเคยและมี tooltip
- ทุกสีต้องผ่าน contrast ที่เหมาะสม และห้ามใช้สีเพียงอย่างเดียวเพื่อสื่อสถานะ

## Design tokens

เก็บค่ากลางเป็น tokens ในชั้น UI เพื่อให้แก้ theme ได้จากจุดเดียว:

- `color`: paper, surface, raised surface, text, muted, border, primary, action, success, warning, danger และ soft background ของแต่ละสถานะ
- `font`: display, body, numeric, font-size scale และน้ำหนักที่จำเป็น
- `space`: ใช้ลำดับ 4px-based scale สำหรับ gap, padding และ section spacing
- `radius`: ใช้ขนาดเล็กถึงปานกลางกับ control และ panel ไม่ทำให้หน้าระบบดูเป็นแอปการ์ดลอยทั้งหมด
- `shadow`: ใช้เบาและจำกัดเฉพาะพื้นที่ที่ต้องการแยกจากพื้นหลัง
- `motion`: duration และ easing กลางสำหรับ transition ที่สั้น

ห้ามใส่ค่าสี spacing หรือ font size แบบสุ่มใน component หากมี token หรือ utility class ที่ตรงความหมายอยู่แล้ว หลีกเลี่ยง inline style สำหรับ layout ยกเว้นมีเหตุผลเฉพาะจุดที่ตรวจสอบได้

## Responsive layout

ออกแบบแบบ mobile-first และทดสอบอย่างน้อย 3 ช่วง:

| ขนาด | แนวทาง |
|---|---|
| Mobile | ฟอร์มหนึ่งคอลัมน์, navigation แตะง่าย, action สำคัญเข้าถึงง่าย, dashboard ใช้ card/list แทน table กว้าง |
| Tablet | ใช้ grid หนึ่งหรือสองคอลัมน์ตามพื้นที่จริง และคงลำดับการกรอกที่เป็นธรรมชาติ |
| Desktop | แบ่งพื้นที่ form กับ summary อย่างสมดุล ใช้พื้นที่ว่างช่วยสแกนข้อมูล ไม่ขยายข้อความจนอ่านยาก |

กฎร่วม:

- content ต้องไม่ล้นแนวนอนและ input ต้องมีขนาดกดได้สะดวก
- ข้อความภาษาไทย รหัสงาน ที่อยู่ รายละเอียด และชื่อไฟล์ยาวต้อง wrap ได้โดยไม่ดัน layout แตก
- ฟอร์มต้องเรียงลำดับเดียวกันในทุกขนาดหน้าจอ แม้ layout จะเปลี่ยน
- ตารางหรือข้อมูลเปรียบเทียบต้องมีวิธีดูบนจอแคบ เช่น เปลี่ยนเป็นรายการ card สำหรับ mobile หรือ scroll เฉพาะพื้นที่เมื่อจำเป็น
- รูปภาพหลักฐานต้องรักษา aspect ratio และมี preview ที่ไม่ทำให้ layout กระโดด
- print layout ต้องซ่อน navigation, action controls และ animation ที่ไม่เกี่ยวกับรายงาน พร้อมจัด report grid และรูปภาพให้เหมาะกับ A4

## Reusable components

แบ่ง component ตามหน้าที่และนำกลับมาใช้ซ้ำ:

- **UI primitives:** Button, Input, Select, Textarea, Field, Badge, Dialog, Toast
- **Form components:** FormSection, AddressFields, PropertyDetailsFields, PhotoUploader
- **Domain components:** AppraisalStatus, ValuationMethod, PriceSummary, EvidenceGallery
- **Layout components:** PageHeader, Section, TwoColumnLayout, MobileActionBar

Component ควรรับ props ที่ชัดเจน ควบคุม state เท่าที่จำเป็น และไม่เรียก Prisma หรือรู้รายละเอียด database

หน้าแต่ละหน้าควรประกอบจาก component เหล่านี้ โดย business rule และการบันทึกข้อมูลอยู่ใน use case ตาม [architecture-stack.md](architecture-stack.md)

## สถานะและ accessibility

ทุก workflow สำคัญต้องออกแบบ state ให้ครบ:

- loading: แสดง feedback ใกล้ action และป้องกันการ submit ซ้ำ
- empty: บอกสิ่งที่ทำต่อได้ เช่น ยังไม่มีรูปหลักฐาน
- error: ระบุปัญหาใกล้ field หรือ action และให้แก้ไขได้
- success: ยืนยันผลแบบสั้น ไม่บังข้อมูลที่กำลังทำงาน
- disabled: ใช้เมื่อ action ทำไม่ได้จริง พร้อมเหตุผลที่เข้าใจได้

รองรับ keyboard navigation, visible focus, label ที่เชื่อมกับ input, semantic HTML และ screen reader announcement สำหรับ feedback ที่สำคัญ

## Animation

ใช้ animation เพียงเล็กน้อยเพื่อเพิ่มความรู้สึกทันสมัยและช่วยบอกการเปลี่ยนแปลง:

- ใช้ fade/slide สั้น ๆ ตอน section หรือ summary ปรากฏ
- ใช้ transition กับ hover, focus และการเปลี่ยนสถานะของ control
- ใช้ feedback เล็กน้อยเมื่อบันทึกสำเร็จหรือเพิ่มรูปภาพ
- จำกัด motion ให้อยู่ในช่วงสั้นและไม่เลื่อนเนื้อหาหลักจนผู้ใช้เสียตำแหน่ง
- ไม่ animate ตัวเลขราคาอย่างต่อเนื่องจนอ่านค่าจริงยาก
- ไม่ใช้ animation กับ print layout และไม่ทำให้การกรอกฟอร์มช้าลง
- ต้องมี `prefers-reduced-motion` เพื่อปิดหรือย่อ transition และ reveal effects

Animation ต้องช่วยเรื่อง feedback หรือ hierarchy ไม่ใช่ตกแต่งทุกองค์ประกอบ

## CI ด้วย GitHub Actions

CI ทำงานเมื่อมี `pull_request` และเมื่อ push ไปยัง branch หลัก โดยใช้ package manager ตาม lockfile ที่ commit อยู่ใน repository

ลำดับตรวจสอบที่แนะนำ:

1. ติดตั้ง Node.js version ที่ project กำหนด และ restore dependency cache
2. ติดตั้ง dependency แบบ immutable/clean install จาก lockfile
3. ตรวจ format โดยไม่แก้ไฟล์
4. รัน lint
5. รัน TypeScript typecheck
6. รัน unit และ integration tests
7. รัน production build รวม Prisma validation/generate ตาม scripts ของ project

ตัวอย่าง scripts ที่ควรมีเมื่อเริ่มใช้ Next.js:

```json
{
  "format:check": "prettier --check .",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "build": "next build"
}
```

ชื่อ script ปรับตามเครื่องมือจริงได้ แต่ทุก check ต้องเรียกซ้ำได้ทั้ง local และ CI

## CI quality rules

- ทุก check ต้องผ่านก่อน merge โดยตั้งเป็น required status check
- CI ต้องใช้ lockfile และไม่ติดตั้ง package แบบเปลี่ยน version โดยอัตโนมัติ
- แยก test ที่ไม่ต้องใช้ secret ออกจาก integration ที่ต้องใช้ service ภายนอก
- ใช้ environment variables จาก GitHub Secrets เฉพาะเมื่อมีความจำเป็น และห้ามใส่ค่า secret ใน log
- เริ่มจาก job เดียวที่อ่านง่ายก่อนแยก parallel jobs เมื่อเวลารันมีปัญหาจริง
- Deployment, migration production และ security scanning เป็น pipeline แยกเมื่อมีข้อกำหนดและ environment พร้อม
- การเปลี่ยน Prisma schema ต้องผ่าน review และตรวจ migration ใน CI ก่อน merge

CI เอกสารนี้เป็น target guideline ยังไม่สร้าง workflow YAML จนกว่าจะมี Next.js project, package manager, scripts และ environment ที่ยืนยันแล้ว
