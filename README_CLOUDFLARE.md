# ☁️ คู่มือการเชื่อมต่อ Cloudflare Hosting & Cloudflare D1 Database

โครงการ **ระบบสารบรรณดิจิทัล (e-Sarabun Digital Document System)** รองรับการทำงานแบบ Full-stack บน **Cloudflare Pages** และฐานข้อมูล Serverless Edge SQL **Cloudflare D1 Database**

---

## 📌 ขั้นตอนการนำขึ้น Cloudflare (Deploy Instructions)

### วิธีที่ 1: Deploy ผ่านสคริปต์อัตโนมัติ (1-Click Deploy)
1. ดับเบิลคลิกไฟล์ `deploy-cloudflare.bat` 
2. สคริปต์จะทำการสร้าง D1 Database `esarabun-db` บนบัญชี Cloudflare ของท่าน
3. ทำการรัน SQL `schema.sql` เพื่อสร้างตารางข้อมูลและข้อมูลเริ่มต้น
4. ทำการ Upload ขึ้น **Cloudflare Pages** ให้โดยอัตโนมัติ

---

### วิธีที่ 2: Deploy ผ่าน Terminal (Manual Commands)

```bash
# 1. ล็อกอินเข้าสู่ Cloudflare
npx wrangler login

# 2. สร้าง D1 Database บน Cloudflare
npx wrangler d1 create esarabun-db

# 3. นำเสนอโครงสร้าง SQL Schema (schema.sql) เข้าสู่ D1 Database
npx wrangler d1 execute esarabun-db --file=./schema.sql

# 4. Deploy เว็บแอปขึ้น Cloudflare Pages
npx wrangler pages deploy . --project-name=e-sarabun-cloud
```

---

## 🔗 การเชื่อมต่อ D1 Binding บน Cloudflare Dashboard

เมื่อทำการสร้าง Cloudflare Pages Project แล้ว สามารถเข้าผูก D1 Database ได้ดังนี้:
1. เข้าไปที่ **Cloudflare Dashboard** -> **Workers & Pages** -> เลือกโปรเจกต์ `e-sarabun-cloud`
2. ไปที่เมนู **Settings** -> **Functions** -> **D1 Database bindings**
3. กด **Add binding**:
   - **Variable name**: `DB`
   - **D1 database**: เลือก `esarabun-db`
4. กด **Save and Deploy**

---

## 🌟 ฟีเจอร์เด่นในระบบ

1. **ระบบส่งออกไฟล์ Word (.docx)**: ปุ่มดาวน์โหลดไฟล์ Word นำไปเปิดแก้ไขต่อใน Microsoft Word ได้ทันทีโดยไม่เสียโครงสร้าง
2. **ระบบสั่งพิมพ์ไร้ข้อผิดพลาด (Precision Print)**: ออกแบบ CSS รองรับการสั่งพิมพ์กระดาษ A4 มาตรฐานราชการ (ระยะขอบ 2.5 ซม. ตราครุฑ 3 ซม.)
3. **e-Signature & เกษียนหนังสือ**: วาดลายเซ็นดิจิทัล ประทับตรายางคำสั่ง ("ทราบ", "อนุมัติตามเสนอ")
4. **Visual Workflow & Reject System**: ติดตามขั้นตอนการเสนอเรื่อง และการตีกลับเอกสารพร้อมระบุเหตุผล
5. **e-Archive & Full-text Search**: สืบค้นเอกสารย้อนหลังและจัดเก็บเข้าแฟ้มดิจิทัล
