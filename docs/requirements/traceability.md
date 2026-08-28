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
| REQ-REFERENCE-001 | `/jobs/[jobId]/references` และ `src/domain/priceReferences.ts` | ตรวจค่าเริ่มต้น 5 กม./24 เดือน ประเภทเดียวกัน และผลแยก 3 แหล่ง | ทำแล้วใน prototype |
| REQ-REFERENCE-002 | ฟอร์มนำเข้าที่ `/jobs/[jobId]/references` และคลังใน `appraisalStore.ts` | นำเข้าข้อมูลซ้ำ ตรวจ dedupe และยืนยันว่า snapshot เดิมแก้ทับไม่ได้ | ทำแล้วใน prototype |
| REQ-REFERENCE-003 | รายการเลือกและหมายเหตุใน `/jobs/[jobId]/references` | เลือก/ยกเลิก/reload แล้วค้น snapshot ในงานอื่นบน browser เดิม | ทำแล้วใน prototype |
| REQ-REFERENCE-004 | สรุปในหน้า references และ valuation | ตรวจ min/median/max แยก source และหน่วย | ทำแล้ว |
| REQ-REFERENCE-005 | checklist, valuation และ `/jobs/[jobId]/report` | ไม่มีข้อมูลแล้วเห็นคำเตือนแต่ยังทำงานต่อได้; มีข้อมูลแล้วแสดง snapshot ในรายงาน | ทำแล้ว |
| REQ-REFERENCE-006 | `src/domain/access.ts` และ link-out ภายนอก | ทีม B แก้ได้ A/C อ่านได้; ยังไม่มี server auth/API/provider จริง | บางส่วน |
| REQ-REPORT-001 | `/jobs/[jobId]/report` และ print CSS ใน `src/app/globals.css` | เปิด report แล้วกดพิมพ์/บันทึก PDF จาก browser print dialog | ทำแล้ว |
| REQ-REPORT-002 | notice ใน checklist และ `/jobs/[jobId]/report` | ตรวจข้อความว่า prototype ยังไม่ส่งข้อมูลจริงไปธนาคาร | ทำแล้ว |
| REQ-REVIEW-001 | `/jobs/[jobId]/review` | แสดงหน้า scaffold โดยลำดับสถานะและประวัติอ้างตาม `REQ-PIPELINE-005` | Scaffold ระยะถัดไป |
| REQ-EXPORT-001 | `/jobs/[jobId]/export` | แสดงหน้า scaffold พร้อมข้อจำกัดว่าต้องกำหนด schema ธนาคาร | Scaffold ระยะถัดไป |
| REQ-INTEGRATION-001 | `/jobs/[jobId]/integration` | แสดงหน้า scaffold พร้อมข้อจำกัดเรื่อง sandbox/API/auth/tracking | Scaffold ระยะถัดไป |
| REQ-SECURITY-001 | `/security` | แสดงหน้า scaffold พร้อมข้อจำกัดเรื่อง threat/privacy review และ PDPA | Scaffold ระยะถัดไป |
| REQ-PIPELINE-001 | `/jobs/[jobId]/intake` | แสดงหน้า scaffold พร้อมข้อจำกัดว่าต้องมี login และ role ทีม A ก่อน | Scaffold ระยะถัดไป |
| REQ-PIPELINE-002 | `/jobs/[jobId]/intake` | แสดงหน้า scaffold พร้อมข้อจำกัดว่ายังไม่มีบัญชีผู้ประเมินให้มอบหมาย | Scaffold ระยะถัดไป |
| REQ-PIPELINE-003 | `/jobs/[jobId]/{property,photos,valuation}` | login เป็นทีม B แล้วแก้ได้ ส่วนทีม A/C เห็นเป็น read-only พร้อมแถบเตือน (บังคับฝั่ง client เท่านั้น) | บางส่วน |
| REQ-PIPELINE-004 | `/jobs/[jobId]/handoff` | แสดงหน้า scaffold พร้อมข้อจำกัดว่าต้องยืนยันช่องทางส่งงานของธนาคารก่อน | Scaffold ระยะถัดไป |
| REQ-PIPELINE-005 | `src/domain/appraisal.ts` และ `/jobs/[jobId]/review` | `JobStatus` ปัจจุบันสร้างจริงแค่ `draft`/`saved` ยังไม่มี state machine และประวัติ | Scaffold ระยะถัดไป |
| REQ-PIPELINE-006 | `/jobs/[jobId]/handoff` และ `/jobs/[jobId]/review` | แสดงหน้า scaffold พร้อมข้อจำกัดเรื่องสถานะและสิทธิ์ | Scaffold ระยะถัดไป |
| REQ-ROLE-001 | `/login`, `src/domain/access.ts` และ `src/components/Shell.tsx` | กดเข้าแต่ละทีมแล้วตรวจว่าเมนูและสิทธิ์ตรงตารางใน `pipeline.md` โดย `src/domain/access.test.ts` ตรึงค่าตั้งต้นไว้ | Demo เท่านั้น ยังไม่บังคับฝั่งเซิร์ฟเวอร์ |
| REQ-ROLE-002 | `/permissions` และ `src/infrastructure/storage/accessStore.ts` | ปรับค่าในตารางแล้วเมนูเปลี่ยนทันที reload แล้วค่ายังอยู่ และกดคืนค่ามาตรฐานได้ | ทำแล้ว |
