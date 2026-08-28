# Changelog

## 0.4.0 - 2026-08-28
- เพิ่ม `REQ-ROLE-002` เมนูกำหนดสิทธิ์รายเมนู (ซ่อน/อ่าน/แก้ไข) ต่อทีม พร้อมหน้า `/login` และ `/permissions` สำหรับ demo และบันทึกข้อจำกัดว่ายังบังคับสิทธิ์ฝั่ง client เท่านั้น จึงยังไม่ปิด `REQ-ROLE-001`

## 0.3.0 - 2026-08-28
- เพิ่ม [pipeline.md](pipeline.md) กำหนดสายงาน 3 ทีม: ทีม A รับงานจากธนาคาร ทีม B ประเมินหน้างาน ทีม C ส่งผลกลับธนาคาร
- เพิ่ม `REQ-PIPELINE-001` ถึง `REQ-PIPELINE-006` ครอบคลุมการรับงาน มอบหมาย ประเมิน ส่งธนาคาร ลำดับสถานะ และการตีกลับ
- เพิ่ม `REQ-ROLE-001` บทบาททีม A/B/C ผูกกับ login พร้อมตารางสิทธิ์ โดยขึ้นกับ `REQ-SECURITY-001`
- เพิ่มหน้า scaffold `/jobs/[jobId]/intake` และ `/jobs/[jobId]/handoff` สำหรับขั้นตอนทีม A และทีม C

## 0.2.0 - 2026-08-28
- เพิ่ม implementation ด้วย Next.js/TypeScript App Router สำหรับ UI ครบทุกหน้าใน MVP
- แตก flow เป็นหน้าแยกสำหรับรายการงาน สร้างงาน ข้อมูลงาน ทรัพย์สิน รูปถ่าย ประเมินราคา และรายงาน
- เพิ่มหน้า scaffold สำหรับ review, export, bank integration และ security โดยระบุข้อจำกัดที่ต้องยืนยันก่อน production
- อัปเดต traceability ให้ชี้ไปยัง routes/components ใหม่

## 0.1.0 - 2026-08-28
- เพิ่ม requirement รุ่นเริ่มต้นสำหรับ prototype ระบบประเมินราคาบ้าน
- เพิ่ม workflow บันทึกข้อมูลทรัพย์ รูปถ่าย และการคำนวณ 3 วิธี
- เพิ่ม traceability ระหว่าง requirement กับ `index.html`
- ระบุขอบเขตที่ยังไม่พร้อมสำหรับ production เช่น login, backend, review และ API ธนาคาร
