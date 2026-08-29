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
| REQ-REVIEW-001 | `/jobs/[jobId]/review` | ตรวจ readiness/checklist/timeline แล้วตีกลับพร้อมเหตุผล หรือไปขั้นส่งมอบ | ทำแล้วใน demo |
| REQ-EXPORT-001 | `/jobs/[jobId]/export` | preview และดาวน์โหลด generic CSV UTF-8; ระบุว่าไม่ใช่ schema ธนาคาร | ทำแล้วใน demo |
| REQ-INTEGRATION-001 | `/jobs/[jobId]/integration` | preview JSON, จำลอง correlation ID และยืนยันว่าไม่มี network request | ทำแล้วใน demo |
| REQ-SECURITY-001 | `/security` | แสดง security posture, role summary และ local activity log พร้อมข้อจำกัด | บางส่วน · ไม่มี production security |
| REQ-PIPELINE-001 | `/jobs/new` และ `/jobs/[jobId]/intake` | บันทึกธนาคาร เลขอ้างอิง วันที่รับ/กำหนดส่ง ผู้ว่าจ้าง ทรัพย์และผู้ติดต่อ | ทำแล้วใน demo |
| REQ-PIPELINE-002 | `/jobs/[jobId]/intake` | ระบุผู้ประเมิน/วันลงพื้นที่ ตรวจข้อมูลบังคับและเลขอ้างอิงซ้ำก่อนมอบหมาย | ทำแล้วใน demo |
| REQ-PIPELINE-003 | `/jobs/[jobId]/{property,photos,references,valuation}` | แก้ได้เฉพาะ assigned/changesRequested และส่งตรวจเมื่อทรัพย์ รูป และราคาครบ | ทำแล้วใน demo |
| REQ-PIPELINE-004 | `/jobs/[jobId]/handoff` | บันทึกช่องทาง เวลา ผู้ส่ง เลขตอบกลับ แล้วล็อกงานเป็น submitted | ทำแล้วใน demo |
| REQ-PIPELINE-005 | `src/domain/appraisal.ts`, `appraisalStore.ts` และ `/jobs/[jobId]/review` | unit test transition, ห้ามข้ามขั้น และแสดงประวัติเรียงเวลา | ทำแล้วใน demo |
| REQ-PIPELINE-006 | `/jobs/[jobId]/review` | บังคับเหตุผลก่อนเปลี่ยนเป็น changesRequested และแสดงเหตุผลใน timeline | ทำแล้วใน demo |
| REQ-ROLE-001 | `/login`, `src/domain/access.ts` และ `src/components/Shell.tsx` | กดเข้าแต่ละทีมแล้วตรวจว่าเมนูและสิทธิ์ตรงตารางใน `pipeline.md` โดย `src/domain/access.test.ts` ตรึงค่าตั้งต้นไว้ | Demo เท่านั้น ยังไม่บังคับฝั่งเซิร์ฟเวอร์ |
| REQ-ROLE-002 | `/permissions` และ `src/infrastructure/storage/accessStore.ts` | ปรับค่าในตารางแล้วเมนูเปลี่ยนทันที reload แล้วค่ายังอยู่ และกดคืนค่ามาตรฐานได้ | ทำแล้ว |
| REQ-INSIGHT-001 | `/insights` และ `src/domain/access.ts` | login เป็นผู้ดูแลระบบแล้วเปิดเมนู `รายงานภาพรวม`; login เป็นทีม A/B/C แล้วพิมพ์ URL ต้องเห็นคำอธิบายสิทธิ์ | Demo เท่านั้น ยังไม่บังคับฝั่งเซิร์ฟเวอร์ |
| REQ-INSIGHT-002 | ตัวกรองใน `/insights` และ `resolveRange` ใน `src/domain/reporting.ts` | สลับครบทั้ง 5 ตัวเลือก และกรอกช่วงกำหนดเองแบบไม่ครบ/กลับด้าน ต้องขึ้นคำเตือน | ทำแล้ว |
| REQ-INSIGHT-003 | การ์ดสรุปและกราฟแนวโน้มใน `/insights` | เทียบผลรวมของกราฟแนวโน้มกับตัวเลขงานเข้า/งานปิด และตรวจว่ามูลค่าคิดจากงานที่ปิด | ทำแล้ว |
| REQ-INSIGHT-004 | ตารางงานค้างและรายการงานใน `/insights` | โหลดข้อมูลตัวอย่างแล้วตรวจว่าจำนวนงานค้างรายขั้นตอนรวมกันเท่ากับงานที่ยังไม่ปิด | ทำแล้ว |
| REQ-INSIGHT-005 | ตารางเวลาต่อขั้นตอน คอขวด และการกระจายเวลาต่อใบงานใน `/insights` | ตรวจว่างานที่ถูกตีกลับถูกนับสองช่วง และคำเตือนเรื่องค่าสมมติปรากฏบนหน้า | ทำแล้วใน prototype ค่าเป้าหมายยังเป็นค่าสมมติ |
| REQ-INSIGHT-006 | ปุ่มโหลด/ล้างข้อมูลตัวอย่างใน `/insights` และ `src/domain/demoJobs.ts` | กดโหลดแล้วรายงานมีข้อมูล กดล้างแล้วเหลือเฉพาะงานจริง โดย `demoJobs.test.ts` ตรึงผลของ seed เดิมไว้ | Demo เท่านั้น |
| REQ-INSIGHT-007 | ตารางสรุปรายผู้ประเมินใน `/insights` และ `assigneeStats` ใน `src/domain/reporting.ts` | ตรวจว่าผลรวมช่วงงานรายคนเท่ากับของทีม B และงานที่ส่งต่อทีม C แล้วไม่อยู่ในงานในมือ | ทำแล้ว |
