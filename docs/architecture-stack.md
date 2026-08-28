# Architecture and Stack

เอกสารนี้กำหนดแนวทางทางเทคนิคสำหรับการพัฒนาระบบประเมินราคาบ้านจาก prototype ใน `index.html` ไปสู่เว็บแอปที่ดูแลรักษาง่าย โดยยังคงยึดขอบเขต MVP ใน [docs/requirements/mvp.md](requirements/mvp.md)

## เป้าหมาย

- ใช้ stack ที่ทีมเรียนรู้และดูแลได้ง่าย
- แยก business rules ออกจาก framework และฐานข้อมูล
- ทำให้โค้ดทดสอบได้โดยไม่ต้องพึ่งพา database ทุกกรณี
- เพิ่มความสามารถทีละส่วนโดยไม่สร้าง abstraction ที่เกินความจำเป็น
- รักษา flow เดิมของงานประเมิน: ข้อมูลงาน, ข้อมูลทรัพย์, รูปถ่าย, การประเมินราคา และรายงาน

## Stack ที่เลือก

| ส่วน | เทคโนโลยี | แนวทาง |
|---|---|---|
| Web framework | Next.js | ใช้ App Router และ Server/Client Components ตามความเหมาะสม |
| ภาษา | TypeScript | เปิด strict mode และกำหนด type ของข้อมูลที่ข้าม boundary |
| ORM | Prisma ORM | ใช้เป็น data access implementation ใน infrastructure เท่านั้น |
| Database | กำหนดภายหลัง | เลือกตามข้อกำหนด deployment และการใช้งานจริงก่อนสร้าง schema production |
| Validation | schema validation ที่ boundary | ตรวจข้อมูลจาก form, API และ environment ก่อนเข้าสู่ use case |
| Testing | unit test และ integration test | ทดสอบ domain/use case แยกจากการทดสอบ Prisma |

การเพิ่ม library ใหม่ต้องมีเหตุผลที่ชัดเจน ใช้แก้ปัญหาปัจจุบัน และไม่ซ้ำความสามารถของ Next.js หรือ TypeScript ที่มีอยู่แล้ว

## Clean Architecture

โค้ดแบ่งเป็น 4 ชั้น โดย dependency ต้องชี้เข้าด้านในเสมอ:

```text
Presentation -> Application -> Domain
      |             |
      +------> Infrastructure
```

### Domain

เก็บกฎธุรกิจและ model ที่ไม่ควรผูกกับ Next.js หรือ Prisma เช่น:

- กฎการคำนวณราคาประเมิน
- สถานะของงานประเมิน
- value object ที่จำเป็น เช่น จำนวนเงิน พื้นที่ หรือพิกัด
- interface ของ repository ที่ use case ต้องการ

Domain ไม่ import package ของ Prisma, React หรือ Next.js

### Application

เก็บ use case ที่จัดลำดับการทำงานของระบบ เช่น:

- สร้างและแก้ไขงานประเมิน
- บันทึกข้อมูลทรัพย์สิน
- เพิ่มหรือลบรูปหลักฐาน
- คำนวณและสรุปราคา
- เตรียมข้อมูลสำหรับรายงาน

Use case รับ input ที่เป็น type ชัดเจน เรียก domain rules และใช้ repository interface ไม่เรียก Prisma โดยตรง

### Infrastructure

เก็บ implementation ที่เชื่อมต่อระบบภายนอก เช่น:

- Prisma client และ repository implementation
- database mapping ระหว่าง record กับ domain model
- file storage ในอนาคต
- external API ในอนาคต

Prisma schema, query และ transaction ต้องอยู่ในชั้นนี้ เพื่อไม่ให้รายละเอียด database กระจายไปทั่วระบบ

### Presentation

เก็บสิ่งที่รับผิดชอบการแสดงผลและการเชื่อมต่อผู้ใช้ เช่น:

- Next.js routes และ page
- Server Actions หรือ route handlers
- React components
- form adapter และการแสดง loading/error/success

Presentation แปลงข้อมูลจากผู้ใช้เป็น input ของ use case และแปลงผลลัพธ์เป็น view model เท่านั้น ไม่ใส่ business rule สำคัญไว้ใน component

## โครงสร้างโฟลเดอร์ที่แนะนำ

```text
src/
  app/                 # routes, layouts และ page composition
  components/          # shared UI components
  features/            # composition เฉพาะฟีเจอร์ เช่น appraisal
  application/         # use cases และ application ports
  domain/              # business rules และ domain models
  infrastructure/     # Prisma และ external integrations
  lib/                 # utilities ขนาดเล็กที่ใช้ร่วมกัน

prisma/
  schema.prisma
  migrations/
```

ไม่จำเป็นต้องสร้างทุกโฟลเดอร์ตั้งแต่เริ่มต้น ให้เพิ่มเมื่อมี code ที่เป็นของชั้นนั้นจริง

## กฎเขียนโค้ดให้ไม่ซับซ้อน

1. เริ่มจาก function หรือ component ที่ตรงไปตรงมา ก่อนสร้าง class, factory หรือ generic abstraction
2. หนึ่ง use case ควรทำงานหนึ่งเรื่องและมีชื่อที่อธิบายพฤติกรรมได้
3. ใช้ interface เฉพาะจุดที่เป็น boundary หรือจำเป็นต่อการทดสอบ ไม่สร้าง interface ให้ทุกไฟล์
4. เก็บ business rule ไว้ที่ domain/application ไม่ซ้ำใน form, API และ report
5. แปลงข้อมูลเมื่อข้าม boundary อย่างชัดเจน ไม่ส่ง Prisma type เข้า UI
6. ตรวจ input ที่ขอบเขตระบบ และคืน error รูปแบบเดียวกัน
7. ใช้ transaction เฉพาะเมื่อข้อมูลหลายรายการต้องสำเร็จหรือล้มเหลวพร้อมกัน
8. ไม่ดึงข้อมูลใน component ซ้ำหลายทางโดยไม่มีเหตุผล ให้ page หรือ use case เป็นจุดประสานงาน
9. ตั้งชื่อให้สื่อความหมายและหลีกเลี่ยง function ที่รับ parameter จำนวนมากเกินไป
10. ลบ abstraction ที่ไม่มี consumer จริง และไม่ทำ optimization ก่อนมีหลักฐานจากการวัดผล

## แนวทาง Prisma

- สร้าง Prisma client ผ่านจุดกลางของ infrastructure เพื่อป้องกันการสร้าง connection ซ้ำใน development
- Repository คืน domain model หรือ DTO ที่กำหนดเอง ไม่คืน Prisma generated type ออกไปนอก infrastructure
- กำหนด migration ผ่าน version control และ review ทุกการเปลี่ยน schema
- ไม่ใช้ `any` เพื่อหลบ type error ของ database
- แยกข้อมูลที่ใช้แสดงผลออกจากข้อมูล internal และไม่ log ข้อมูลส่วนบุคคลหรือรูปภาพโดยไม่จำเป็น
- การเลือก database, backup, retention และ security ต้องยืนยันก่อน production เพราะ prototype ปัจจุบันยังใช้ `localStorage`

## การเปลี่ยนจาก prototype

1. คง flow และชื่อข้อมูลที่ผู้ใช้คุ้นเคยจาก `index.html`
2. ย้ายกฎคำนวณราคาไปเป็น domain/application ก่อนเชื่อม database
3. สร้าง Prisma schema ตามข้อมูลที่ยืนยันแล้ว ไม่เดา schema ธนาคารหรือ production policy
4. ให้ presentation เรียก use case เดียวกันทั้งการบันทึกอัตโนมัติและการบันทึกด้วยตนเอง
5. เพิ่ม authentication, authorization, audit log และการจัดเก็บรูปภาพเมื่อมี requirement และ security decision ที่ชัดเจน

## สิ่งที่ยังอยู่นอกขอบเขต

- ยังไม่ถือว่า database กลาง, login, offline sync หรือ API ธนาคารมีอยู่แล้ว
- ยังไม่กำหนด provider ของ database หรือ storage จนกว่าจะยืนยัน deployment และ retention policy
- ไม่เพิ่ม service layer หรือ event bus หาก use case และ repository เพียงพอ
- ไม่เปลี่ยน business requirement เดิมโดยอาศัยเอกสารนี้เพียงอย่างเดียว
