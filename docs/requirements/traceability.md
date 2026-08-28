# Requirement Traceability

| Requirement | พื้นที่ใน Next.js UI | วิธีตรวจสอบ | สถานะ |
|---|---|---|---|
| REQ-WORKFLOW-001 | `/jobs/new` และ `/jobs/[jobId]/workflow` | กรอกเลขที่งาน วันที่ ผู้ว่าจ้าง และธนาคาร แล้วเปิดหน้าแก้ไขงาน | ทำแล้ว |
| REQ-WORKFLOW-002 | `src/infrastructure/storage/appraisalStore.ts` และปุ่มบันทึกใน `src/components/AppraisalWorkspace.tsx` | แก้ข้อมูล รอ autosave หรือกดบันทึก แล้ว reload เบราว์เซอร์เดิม | ทำแล้ว |
| REQ-PROPERTY-001 | `/jobs/[jobId]/property` | กรอกที่อยู่ พิกัด ประเภท สภาพ พื้นที่ ชั้น ปีสร้าง ห้อง และรายละเอียด | ทำแล้ว |
| REQ-PROPERTY-002 | ฟิลด์หน่วยใน `/jobs/[jobId]/property` และ summary/report | ตรวจ label `ตร.วา`, `ตร.ม.`, `บาท` และตรวจค่าตัวเลขใน state ไม่ใส่ comma | ทำแล้ว |
| REQ-PHOTO-001 | `/jobs/[jobId]/photos` และ `/jobs/[jobId]/report` | เพิ่มรูปหลายรูปแล้วเห็น preview และรูปในรายงาน | ทำแล้ว |
| REQ-PHOTO-002 | ปุ่มลบใน gallery ของ `/jobs/[jobId]/photos` | ลบรูปแล้วจำนวนรูปลดลงและไม่ปรากฏในรายงาน | ทำแล้ว |
| REQ-VALUATION-001 | `/jobs/[jobId]/valuation` และ `src/domain/appraisal.ts` | ทดสอบครบ 3 วิธี: กรอกเอง, พื้นที่ใช้สอยคูณราคาต่อตารางเมตร, ทรัพย์เปรียบเทียบ | ทำแล้ว |
| REQ-VALUATION-002 | `PriceSummary` area ใน `src/components/AppraisalWorkspace.tsx` และ `/jobs/[jobId]/report` | เปลี่ยนวิธีประเมินแล้วราคากับคำอธิบายที่มาเปลี่ยนตาม | ทำแล้ว |
| REQ-REPORT-001 | `/jobs/[jobId]/report` และ print CSS ใน `src/app/globals.css` | เปิด report แล้วกดพิมพ์/บันทึก PDF จาก browser print dialog | ทำแล้ว |
| REQ-REPORT-002 | notice ใน checklist และ `/jobs/[jobId]/report` | ตรวจข้อความว่า prototype ยังไม่ส่งข้อมูลจริงไปธนาคาร | ทำแล้ว |
| REQ-REVIEW-001 | `/jobs/[jobId]/review` | แสดงหน้า scaffold พร้อมข้อจำกัดว่าต้องยืนยัน role และ status history | Scaffold ระยะถัดไป |
| REQ-EXPORT-001 | `/jobs/[jobId]/export` | แสดงหน้า scaffold พร้อมข้อจำกัดว่าต้องกำหนด schema ธนาคาร | Scaffold ระยะถัดไป |
| REQ-INTEGRATION-001 | `/jobs/[jobId]/integration` | แสดงหน้า scaffold พร้อมข้อจำกัดเรื่อง sandbox/API/auth/tracking | Scaffold ระยะถัดไป |
| REQ-SECURITY-001 | `/security` | แสดงหน้า scaffold พร้อมข้อจำกัดเรื่อง threat/privacy review และ PDPA | Scaffold ระยะถัดไป |
