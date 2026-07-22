/**
 * Cloudflare D1 Database Integration & Hybrid Store
 * Connects directly to Cloudflare Pages / Workers Functions API (/api/documents)
 * with automatic fallback to LocalStorage for offline local preview.
 */

class CloudflareDB {
  constructor() {
    this.apiBase = '/api/documents';
    this.useCloudflare = true; // Will auto-detect if API endpoint is alive
  }

  async isOnlineCloudflare() {
    try {
      const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async getAllDocuments() {
    try {
      if (location.protocol !== 'file:') {
        const res = await fetch(this.apiBase);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      }
    } catch (e) {
      console.warn('Cloudflare D1 API offline, falling back to LocalStorage', e);
    }
    return this.getLocalDocuments();
  }

  async saveDocument(doc) {
    // Standardize ID & Timestamps
    if (!doc.id) doc.id = 'DOC-' + Date.now();
    doc.updatedAt = new Date().toISOString();

    // 1. Save to LocalStorage (Instant UI update)
    const localDocs = this.getLocalDocuments();
    const existingIdx = localDocs.findIndex(d => d.id === doc.id);
    if (existingIdx >= 0) {
      localDocs[existingIdx] = doc;
    } else {
      localDocs.unshift(doc);
    }
    localStorage.setItem('esarabun_docs', JSON.stringify(localDocs));

    // 2. Sync to Cloudflare D1 Database if deployed
    try {
      if (location.protocol !== 'file:') {
        await fetch(this.apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc)
        });
      }
    } catch (e) {
      console.warn('Syncing to Cloudflare D1 postponed (Offline mode)');
    }

    return doc;
  }

  async updateWorkflowState(docId, nextStepId, actionName, note = '', signerName = 'ผู้ลงนาม') {
    const docs = this.getLocalDocuments();
    const doc = docs.find(d => d.id === docId);
    if (!doc) return null;

    doc.status = nextStepId;
    if (!doc.history) doc.history = [];
    doc.history.push({
      action: nextStepId === 'REJECTED' ? 'REJECT' : 'ADVANCE',
      actionName: actionName,
      stepId: nextStepId,
      actorName: signerName,
      note: note,
      timestamp: new Date().toISOString()
    });

    return await this.saveDocument(doc);
  }

  getLocalDocuments() {
    const raw = localStorage.getItem('esarabun_docs');
    if (!raw) {
      // Load initial mock Thai Sarabun documents
      const initialMock = [
        {
          id: 'DOC-1001',
          docNo: 'อว 0605/๑๒๓',
          deptName: 'สำนักบริหารกลาง ฝ่ายสารบรรณดิจิทัล',
          subject: 'ขออนุมัติจัดโครงการพัฒนาระบบสารบรรณดิจิทัล (e-Sarabun) Cloud D1',
          date: new Date().toISOString().split('T')[0],
          to: 'ผู้อำนวยการสำนักบริหารกลาง',
          status: 'REVIEW',
          urgency: 'ด่วนที่สุด',
          category: 'บันทึกข้อความ',
          folder: 'แฟ้มอนุมัติประจำปี',
          body: '<p>เสนอเพื่อโปรดพิจารณาอนุมัติเปิดใช้งานระบบสารบรรณดิจิทัลบน Cloudflare D1 Database และจัดฝึกอบรมบุคลากร</p>',
          signerName: '(นายสมชาย ใจดี)',
          signerPosition: 'หัวหน้าฝ่ายสารบรรณดิจิทัล',
          history: [
            { action: 'ADVANCE', actionName: 'ร่างและเสนอเรื่อง', stepId: 'DRAFT', actorName: 'นายสมชาย ใจดี', note: 'ส่งเสนอพิจารณา', timestamp: new Date().toISOString() }
          ]
        },
        {
          id: 'DOC-1002',
          docNo: 'คำสั่งที่ ๔๕/๒๕๖๙',
          deptName: 'กรมสารบรรณดิจิทัล',
          subject: 'คำสั่งแต่งตั้งคณะทำงานตรวจรับระบบ e-Sarabun Cloud',
          date: new Date().toISOString().split('T')[0],
          to: 'ข้าราชการและเจ้าหน้าที่ในสังกัด',
          status: 'COMPLETED',
          urgency: 'ปกติ',
          category: 'คำสั่ง',
          folder: 'แฟ้มคำสั่ง',
          body: '<p>แต่งตั้งคณะทำงานตรวจรับระบบสารบรรณดิจิทัล เพื่อให้การดำเนินงานเป็นไปตามระเบียบสารบรรณ พ.ศ. ๒๕๒๖</p>',
          signerName: '(ดร.วิชัย รัตนประเสริฐ)',
          signerPosition: 'อธิบดีกรมสารบรรณดิจิทัล',
          history: [
            { action: 'ADVANCE', actionName: 'อนุมัติเรียบร้อย', stepId: 'COMPLETED', actorName: 'ดร.วิชัย รัตนประเสริฐ', note: 'อนุมัติตามเสนอ ออกเลขคำสั่งเรียบร้อย', timestamp: new Date().toISOString() }
          ]
        }
      ];
      localStorage.setItem('esarabun_docs', JSON.stringify(initialMock));
      return initialMock;
    }
    return JSON.parse(raw);
  }
}

window.cfDB = new CloudflareDB();
