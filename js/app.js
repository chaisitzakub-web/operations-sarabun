/**
 * e-Sarabun Main Controller
 * Handles UI views, modals, full-text search, filters, e-signature, workflow transitions & exports.
 */

let currentDoc = null;
let currentFilter = 'ALL';
let currentCategory = 'ALL';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize signature engine canvas
  signatureEngine.initCanvas('sig-canvas');
  
  // Render Main Views
  await refreshDocumentList();

  // Setup Event Listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      const view = el.dataset.view;
      switchView(view);
    });
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterAndRenderDocs(e.target.value));
  }

  // Template Selector
  const templateSelect = document.getElementById('template-select');
  if (templateSelect) {
    templateSelect.addEventListener('change', (e) => loadTemplateData(e.target.value));
  }
}

function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(p => p.style.display = 'none');
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.style.display = 'block';
}

async function refreshDocumentList() {
  const docs = await cfDB.getAllDocuments();
  updateStatsCounters(docs);
  filterAndRenderDocs('', docs);
}

function updateStatsCounters(docs) {
  const total = docs.length;
  const pending = docs.filter(d => d.status === 'REVIEW' || d.status === 'APPROVE').length;
  const completed = docs.filter(d => d.status === 'COMPLETED').length;
  const rejected = docs.filter(d => d.status === 'REJECTED').length;

  document.getElementById('stat-total').innerText = total;
  document.getElementById('stat-pending').innerText = pending;
  document.getElementById('stat-completed').innerText = completed;
  document.getElementById('stat-rejected').innerText = rejected;
}

function filterAndRenderDocs(searchTerm = '', docsList = null) {
  cfDB.getAllDocuments().then(allDocs => {
    let filtered = docsList || allDocs;

    if (currentFilter !== 'ALL') {
      filtered = filtered.filter(d => d.status === currentFilter);
    }

    if (currentCategory !== 'ALL') {
      filtered = filtered.filter(d => d.category === currentCategory || d.folder === currentCategory);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        (d.subject && d.subject.toLowerCase().includes(term)) ||
        (d.docNo && d.docNo.toLowerCase().includes(term)) ||
        (d.signerName && d.signerName.toLowerCase().includes(term)) ||
        (d.deptName && d.deptName.toLowerCase().includes(term))
      );
    }

    renderDocTable(filtered);
  });
}

function renderDocTable(docs) {
  const tbody = document.getElementById('doc-table-body');
  if (!tbody) return;

  if (docs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">ไม่พบข้อมูลเอกสารในระบบ</td></tr>`;
    return;
  }

  tbody.innerHTML = docs.map(doc => {
    const statusMap = {
      'DRAFT': { text: 'ร่างเอกสาร', class: 'badge-draft' },
      'REVIEW': { text: 'รอหัวหน้าตรวจ', class: 'badge-review' },
      'APPROVE': { text: 'รอ ผอ. ลงนาม', class: 'badge-approve' },
      'COMPLETED': { text: 'อนุมัติเรียบร้อย', class: 'badge-completed' },
      'REJECTED': { text: 'ถูกตีกลับแก้ไข', class: 'badge-rejected' }
    };

    const st = statusMap[doc.status] || { text: doc.status, class: 'badge-draft' };

    return `
      <tr>
        <td><strong>${doc.docNo || '-'}</strong></td>
        <td>
          <div style="font-weight:600;">${doc.subject || 'ไม่มีชื่อเรื่อง'}</div>
          <small class="text-muted">${doc.deptName || ''}</small>
        </td>
        <td>${doc.category || 'บันทึกข้อความ'}</td>
        <td><span class="badge ${doc.urgency === 'ด่วนที่สุด' ? 'badge-urgent' : 'badge-normal'}">${doc.urgency || 'ปกติ'}</span></td>
        <td><span class="badge ${st.class}">${st.text}</span></td>
        <td>${doc.date || '-'}</td>
        <td>
          <button class="btn btn-primary" onclick="openDocDetail('${doc.id}')">👁️ ตรวจทาน/จัดการ</button>
        </td>
      </tr>
    `;
  }).join('');
}

function setDocFilter(filterType) {
  currentFilter = filterType;
  refreshDocumentList();
}

function loadTemplateData(templateKey) {
  const tmpl = DOCUMENT_TEMPLATES[templateKey];
  if (!tmpl) return;

  const d = tmpl.defaultData;
  document.getElementById('form-doc-no').value = d.docNo || '';
  document.getElementById('form-dept-name').value = d.deptName || '';
  document.getElementById('form-subject').value = d.subject || '';
  document.getElementById('form-to').value = d.to || '';
  document.getElementById('form-signer-name').value = d.signerName || '';
  document.getElementById('form-signer-pos').value = d.signerPosition || '';
  document.getElementById('form-body').value = d.body || '';
}

async function handleCreateDoc(e) {
  e.preventDefault();
  const doc = {
    id: 'DOC-' + Date.now(),
    docNo: document.getElementById('form-doc-no').value,
    deptName: document.getElementById('form-dept-name').value,
    subject: document.getElementById('form-subject').value,
    to: document.getElementById('form-to').value,
    urgency: document.getElementById('form-urgency').value,
    category: document.getElementById('form-category').value,
    folder: document.getElementById('form-folder').value,
    date: document.getElementById('form-date').value || new Date().toISOString().split('T')[0],
    body: document.getElementById('form-body').value,
    signerName: document.getElementById('form-signer-name').value,
    signerPosition: document.getElementById('form-signer-pos').value,
    status: 'REVIEW',
    history: [
      { action: 'ADVANCE', actionName: 'สร้างและเสนอเรื่อง', stepId: 'DRAFT', actorName: 'ผู้ร่างเอกสาร', note: 'เสนอพิจารณาตามลำดับชั้น', timestamp: new Date().toISOString() }
    ]
  };

  await cfDB.saveDocument(doc);
  alert('บันทึกและส่งเสนอเรื่องเรียบร้อยแล้ว!');
  switchView('dashboard');
  refreshDocumentList();
}

async function openDocDetail(docId) {
  const docs = await cfDB.getAllDocuments();
  currentDoc = docs.find(d => d.id === docId);
  if (!currentDoc) return;

  // Render Printable Preview Memo Area
  const previewDiv = document.getElementById('printable-memo-area');
  const historyDiv = document.getElementById('history-log-container');
  const workflowBar = document.getElementById('workflow-timeline-bar');

  workflowBar.innerHTML = WorkflowEngine.getStepTimeline(currentDoc.status);
  historyDiv.innerHTML = WorkflowEngine.renderHistoryLog(currentDoc.history || []);

 previewDiv.innerHTML = `
    <div class="sarabun-doc" style="font-family: 'THSarabunPSK', sans-serif; font-size: 16pt; color: #000; line-height: 1.15;">
        
        <!-- ส่วนหัว: ครุฑ และ บันทึกข้อความ -->
        <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
            <!-- ขนาดตราครุฑสำหรับบันทึกข้อความ กว้าง 1.38 ซม. สูง 1.5 ซม. -->
            <img src="images/krut.png" alt="ตราครุฑ" style="width: 1.38cm; height: 1.5cm; object-fit: contain;">
            
            <!-- คำว่า บันทึกข้อความ จัดให้อยู่กึ่งกลางหน้า -->
            <div style="flex-grow: 1; text-align: center; font-size: 29pt; font-weight: bold; line-height: 1; margin-top: 10px; margin-left: -1.38cm;">
                บันทึกข้อความ
            </div>
        </div>
        
        <!-- ส่วนข้อมูล: ส่วนราชการ, ที่, วันที่, เรื่อง -->
        <div style="display: flex; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 20pt; font-weight: bold; margin-right: 15px;">ส่วนราชการ</span>
            <span style="flex-grow: 1;">${currentDoc.deptName || ''}</span>
        </div>
        
        <div style="display: flex; align-items: baseline; margin-bottom: 8px;">
            <span style="font-size: 20pt; font-weight: bold; margin-right: 15px;">ที่</span>
            <span style="width: 45%;">${currentDoc.docNo || '-'}</span>
            <!-- กึ่งกลางหน้ากระดาษพอดี -->
            <span style="font-size: 20pt; font-weight: bold; margin-right: 15px;">วันที่</span>
            <span style="flex-grow: 1;">${currentDoc.date || '-'}</span>
        </div>
        
        <div style="display: flex; align-items: baseline; margin-bottom: 16px;">
            <span style="font-size: 20pt; font-weight: bold; margin-right: 15px;">เรื่อง</span>
            <span style="flex-grow: 1;">${currentDoc.subject || ''}</span>
        </div>
        
        <!-- คำขึ้นต้น: เรียน (ระยะห่าง Before 6 pt) -->
        <div style="margin-bottom: 16px; padding-top: 6pt;">
            <span style="font-size: 16pt;"><b>เรียน</b></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${currentDoc.to || ''}
        </div>
        
        <!-- เนื้อหา: ย่อหน้า 2.5 ซม. (ระยะห่าง Before 6 pt) -->
        <!-- หมายเหตุ: หากมีการขึ้นบรรทัดใหม่ในช่องกรอกข้อมูล จะต้องใส่คลาสจัดย่อหน้านี้ในทุก <p> -->
        <div class="doc-body" style="text-indent: 2.5cm; text-align: justify; margin-bottom: 16px; padding-top: 6pt;">
            ${currentDoc.body || ''}
        </div>

        ${currentDoc.eNoteText ? SignatureEngine.createStampBadge(currentDoc.eNoteText) : ''}

        <!-- ลายเซ็น: จัดชิดขวา เริ่มที่กึ่งกลางหน้ากระดาษ (เว้น 3 Enter ตามระเบียบ) -->
        <div class="signature-box" style="margin-top: 3cm; margin-left: 50%; text-align: center;">
            ${currentDoc.signatureDataUrl ? `<img src="${currentDoc.signatureDataUrl}" style="max-height:60px;" /><br>` : '<br><br>'}
            <p style="margin: 0;">${currentDoc.signerName || ''}</p>
            <p style="margin: 0;">${currentDoc.signerPosition || ''}</p>
        </div>
    </div>
  `;

  // Update Modal controls
  document.getElementById('modal-doc-title').innerText = currentDoc.subject;
  document.getElementById('doc-detail-modal').classList.add('open');
}

function closeDocModal() {
  document.getElementById('doc-detail-modal').classList.remove('open');
}

async function approveCurrentDoc() {
  if (!currentDoc) return;
  const nextStep = currentDoc.status === 'REVIEW' ? 'APPROVE' : 'COMPLETED';
  const roleName = currentDoc.status === 'REVIEW' ? 'หัวหน้างาน' : 'ผู้อำนวยการ';

  const note = prompt(`กรุณาระบุข้อคิดเห็น/คำสั่งการ (ถ้ามี):`, 'เห็นชอบตามเสนอ อนุมัติ');
  if (note === null) return;

  await cfDB.updateWorkflowState(currentDoc.id, nextStep, 'อนุมัติ/ลงนาม', note, roleName);
  alert('ดำเนินการอนุมัติและส่งต่อเรียบร้อยแล้ว!');
  closeDocModal();
  refreshDocumentList();
}

async function rejectCurrentDoc() {
  if (!currentDoc) return;
  const reason = prompt('กรุณาระบุเหตุผลในการตีกลับ (Reject) เพื่อให้ผู้ร่างแก้ไข:', 'ข้อมูลในข้อ ๒ ยังไม่ครบถ้วน กรุณาแก้ไขรายละเอียด');
  if (!reason) {
    alert('ต้องระบุเหตุผลในการตีกลับเอกสาร');
    return;
  }

  await cfDB.updateWorkflowState(currentDoc.id, 'REJECTED', 'ตีกลับแก้ไข', reason, 'ผู้ตรวจทาน');
  alert('ตีกลับเอกสารเรียบร้อยแล้ว');
  closeDocModal();
  refreshDocumentList();
}

function openSignatureModal() {
  signatureEngine.clearCanvas();
  document.getElementById('sig-modal').classList.add('open');
}

function closeSigModal() {
  document.getElementById('sig-modal').classList.remove('open');
}

async function saveSignatureAndNote() {
  if (!currentDoc) return;
  const sigData = signatureEngine.getSignatureDataUrl();
  const noteText = document.getElementById('enote-input').value;

  currentDoc.signatureDataUrl = sigData;
  currentDoc.eNoteText = noteText;

  await cfDB.saveDocument(currentDoc);
  alert('ลงนามและบันทึกข้อความเกษียนเรียบร้อยแล้ว!');
  closeSigModal();
  openDocDetail(currentDoc.id);
}

function exportDocxCurrent() {
  if (!currentDoc) return;
  DocxExportEngine.exportDocument(currentDoc);
}

function printMemoCurrent() {
  window.print();
}

window.handleCreateDoc = handleCreateDoc;
window.setDocFilter = setDocFilter;
window.openDocDetail = openDocDetail;
window.closeDocModal = closeDocModal;
window.approveCurrentDoc = approveCurrentDoc;
window.rejectCurrentDoc = rejectCurrentDoc;
window.openSignatureModal = openSignatureModal;
window.closeSigModal = closeSigModal;
window.saveSignatureAndNote = saveSignatureAndNote;
window.exportDocxCurrent = exportDocxCurrent;
window.printMemoCurrent = printMemoCurrent;
