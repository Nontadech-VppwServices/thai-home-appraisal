# เรือนราคา | Thai Home Appraisal

Prototype เว็บแอปสำหรับบันทึกงานประเมินราคาบ้านของผู้ประเมิน ครอบคลุมการสร้างงาน ข้อมูลทรัพย์สิน รูปถ่ายหลักฐาน วิธีประเมินราคา และรายงานสำหรับพิมพ์หรือบันทึกเป็น PDF ผ่าน browser print dialog

โปรเจกต์นี้พัฒนาด้วย Next.js, TypeScript และเก็บข้อมูล MVP ไว้ใน `localStorage` ของเบราว์เซอร์เครื่องที่ใช้งาน ยังไม่มี backend, database กลาง, login หรือการส่งข้อมูลจริงไปธนาคาร

## ความสามารถหลัก

- สร้างงานประเมินด้วยเลขที่งาน วันที่ลงพื้นที่ ผู้ว่าจ้าง และธนาคารปลายทาง
- บันทึกอัตโนมัติในเบราว์เซอร์ และมีปุ่มบันทึกด้วยตนเอง
- กรอกข้อมูลทรัพย์สิน เช่น ที่อยู่ พิกัด ประเภท สภาพ พื้นที่ จำนวนชั้น ปีที่สร้าง ห้องนอน ห้องน้ำ และรายละเอียดเพิ่มเติม
- เพิ่มรูปถ่ายหลายรูปจากอุปกรณ์ แสดง preview และลบรูปก่อนบันทึกหรือพิมพ์ได้
- รองรับการประเมินราคา 3 วิธี: กรอกเอง, พื้นที่ใช้สอยคูณราคาต่อตารางเมตร, และราคาจากทรัพย์เปรียบเทียบ
- ค้นและเก็บ snapshot ข้อมูลอ้างอิงจากภาครัฐ ราคาประกาศตลาด และงานประเมินเดิมใน browser
- แสดงราคาประเมินพร้อมคำอธิบายที่มาของราคา
- แสดงรายงานพร้อมข้อมูลทรัพย์และรูปภาพสำหรับพิมพ์หรือบันทึกเป็น PDF
- มี interactive workflow สำหรับรับงาน มอบหมาย ส่งตรวจ ตีกลับ ส่งออก CSV บันทึกการส่ง และจำลอง bank integration
- มีหน้า security posture และ activity log ที่บอกข้อจำกัดของ prototype ตามจริง

## Stack

- Next.js App Router
- React
- TypeScript strict mode
- pnpm
- ESLint
- Vitest
- lucide-react สำหรับไอคอน

## การติดตั้ง

ต้องมี Node.js รุ่นที่รองรับ Next.js ปัจจุบัน และเปิดใช้ Corepack เพื่อจัดการ pnpm ตาม `packageManager` ใน `package.json`

```bash
corepack enable
pnpm install
```

โปรเจกต์นี้ใช้ `pnpm@11.24.0` และมี `pnpm-lock.yaml` เป็น lockfile หลัก ไม่ใช้ `package-lock.json`

## การใช้งานระหว่างพัฒนา

```bash
pnpm dev
```

จากนั้นเปิด:

```text
http://localhost:3000
```

หน้าหลักจะแสดงรายการงานประเมินที่บันทึกไว้ในเบราว์เซอร์เครื่องนี้ หากยังไม่มีงาน ให้เริ่มจากหน้า `/jobs/new`

## Routes สำคัญ

| Route | หน้าที่ |
|---|---|
| `/` | Dashboard รายการงานประเมินในเครื่องนี้ |
| `/jobs/new` | สร้างงานประเมินใหม่ |
| `/jobs/[jobId]/intake` | รับงานจากธนาคารและมอบหมายทีม B |
| `/jobs/[jobId]/workflow` | แก้ไขข้อมูลงาน |
| `/jobs/[jobId]/property` | กรอกข้อมูลบ้านและที่ตั้ง |
| `/jobs/[jobId]/photos` | เพิ่ม ดูตัวอย่าง และลบรูปหลักฐาน |
| `/jobs/[jobId]/references` | ค้น นำเข้า เลือก และสรุปข้อมูลอ้างอิงราคา |
| `/jobs/[jobId]/valuation` | เลือกวิธีประเมินและคำนวณราคา |
| `/jobs/[jobId]/report` | ตรวจรายงานและพิมพ์หรือบันทึก PDF |
| `/jobs/[jobId]/review` | ตรวจความครบถ้วน ดู timeline และตีกลับงาน |
| `/jobs/[jobId]/export` | Preview และดาวน์โหลด generic CSV |
| `/jobs/[jobId]/handoff` | บันทึกการส่งผลกลับธนาคารในโหมด demo |
| `/jobs/[jobId]/integration` | Preview payload และจำลอง bank API โดยไม่เรียก network |
| `/security` | Security posture, role summary และ local activity log |

## คำสั่งตรวจสอบคุณภาพ

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

คำสั่งเหล่านี้ใช้สำหรับตรวจ ESLint, TypeScript, unit tests และ production build ตามลำดับ

## โครงสร้างโปรเจกต์

```text
src/
  app/                         # Next.js routes และ global styles
  components/                  # UI และ page-level client components
  domain/                      # Types และ business rules ที่ไม่ผูกกับ React/Next.js
  infrastructure/storage/      # localStorage adapter สำหรับ MVP

docs/
  architecture-stack.md        # แนวทาง architecture และ stack เป้าหมาย
  design-and-ci.md             # Design system, responsive, accessibility และ CI guideline
  requirements/                # Requirement source of truth และ traceability
```

## Requirement Traceability

Requirement หลักของ MVP ถูก map ไว้ใน [docs/requirements/traceability.md](docs/requirements/traceability.md)

เอกสาร requirement หลักอยู่ที่:

- [docs/requirements/mvp.md](docs/requirements/mvp.md)
- [docs/requirements/README.md](docs/requirements/README.md)
- [docs/requirements/CHANGELOG.md](docs/requirements/CHANGELOG.md)

เมื่อเปลี่ยน business logic ให้ update requirement docs และ traceability ให้ตรงกันเสมอ

## ข้อจำกัดของ Prototype

- ข้อมูลถูกเก็บใน `localStorage` ของ browser เครื่องเดียว ยังไม่ sync ข้ามอุปกรณ์
- รูปภาพถูกเก็บเป็น Data URL ใน browser storage หากรูปใหญ่หรือจำนวนมากอาจชน quota ของเบราว์เซอร์
- ยังไม่มี authentication, authorization, audit log, encryption หรือ retention policy สำหรับ production
- ยังไม่มี Prisma/database implementation แม้เอกสาร architecture จะกำหนดเป็นเป้าหมายระยะถัดไป
- ยังไม่มีการ export ไฟล์ตาม schema ธนาคารหรือส่งข้อมูลผ่าน API จริง
- review, export, integration, handoff และ security เป็น interactive demo ในเครื่อง ไม่ใช่ production workflow หรือ audit evidence

## การพิมพ์รายงาน

เปิดหน้า `/jobs/[jobId]/report` แล้วกดปุ่มพิมพ์หรือใช้คำสั่งพิมพ์ของเบราว์เซอร์ จากนั้นเลือกปลายทางเป็น PDF ได้จาก browser print dialog

Print stylesheet จะซ่อน navigation และ action controls เพื่อให้รายงานเหมาะกับการบันทึกเป็น PDF มากขึ้น

## Legacy Prototype

ไฟล์ [index.html](index.html) ยังถูกเก็บไว้เป็น legacy single-file prototype สำหรับอ้างอิง flow เดิม ไม่ใช่ entrypoint หลักของ Next.js app
