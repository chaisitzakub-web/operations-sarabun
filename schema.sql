-- Cloudflare D1 Database Schema for e-Sarabun Digital Document Management System

DROP TABLE IF EXISTS documents;
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    docNo TEXT NOT NULL,
    deptName TEXT,
    subject TEXT NOT NULL,
    date TEXT,
    toRecipient TEXT,
    urgency TEXT DEFAULT 'ปกติ',
    category TEXT DEFAULT 'บันทึกข้อความ',
    folder TEXT DEFAULT 'แฟ้มอนุมัติประจำปี',
    body TEXT,
    signerName TEXT,
    signerPosition TEXT,
    signatureDataUrl TEXT,
    eNoteText TEXT,
    status TEXT DEFAULT 'DRAFT',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS document_history;
CREATE TABLE document_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentId TEXT NOT NULL,
    action TEXT NOT NULL,
    actionName TEXT,
    stepId TEXT,
    actorName TEXT,
    note TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(documentId) REFERENCES documents(id)
);

-- Seed Initial Mock Data for Cloudflare D1
INSERT INTO documents (id, docNo, deptName, subject, date, toRecipient, urgency, category, folder, body, signerName, signerPosition, status)
VALUES 
('DOC-1001', 'อว 0605/๑๒๓', 'สำนักบริหารกลาง ฝ่ายสารบรรณดิจิทัล', 'ขออนุมัติจัดโครงการพัฒนาระบบสารบรรณดิจิทัล (e-Sarabun) Cloud D1', '2026-07-22', 'ผู้อำนวยการสำนักบริหารกลาง', 'ด่วนที่สุด', 'บันทึกข้อความ', 'แฟ้มอนุมัติประจำปี', '<p>เสนอเพื่อโปรดพิจารณาอนุมัติเปิดใช้งานระบบสารบรรณดิจิทัลบน Cloudflare D1 Database และจัดฝึกอบรมบุคลากร</p>', '(นายสมชาย ใจดี)', 'หัวหน้าฝ่ายสารบรรณดิจิทัล', 'REVIEW'),
('DOC-1002', 'คำสั่งที่ ๔๕/๒๕๖๙', 'กรมสารบรรณดิจิทัล', 'คำสั่งแต่งตั้งคณะทำงานตรวจรับระบบ e-Sarabun Cloud', '2026-07-22', 'ข้าราชการและเจ้าหน้าที่ในสังกัด', 'ปกติ', 'คำสั่ง', 'แฟ้มคำสั่ง', '<p>แต่งตั้งคณะทำงานตรวจรับระบบสารบรรณดิจิทัล เพื่อให้การดำเนินงานเป็นไปตามระเบียบสารบรรณ พ.ศ. ๒๕๒๖</p>', '(ดร.วิชัย รัตนประเสริฐ)', 'อธิบดีกรมสารบรรณดิจิทัล', 'COMPLETED');

INSERT INTO document_history (documentId, action, actionName, stepId, actorName, note)
VALUES 
('DOC-1001', 'ADVANCE', 'ร่างและเสนอเรื่อง', 'DRAFT', 'นายสมชาย ใจดี', 'เสนอพิจารณาต่อผู้อำนวยการ'),
('DOC-1002', 'ADVANCE', 'อนุมัติเรียบร้อย', 'COMPLETED', 'ดร.วิชัย รัตนประเสริฐ', 'อนุมัติตามเสนอ ออกเลขคำสั่งเรียบร้อย');
