/**
 * Workflow & Approval Engine
 * Manages routing, sequential approval, and rejection with feedback notes.
 */

const WORKFLOW_STEPS = {
  DRAFT: { id: 'DRAFT', label: 'ร่างเอกสาร', role: 'ผู้ร่างหนังสือ', next: 'REVIEW' },
  REVIEW: { id: 'REVIEW', label: 'รอหัวหน้างานตรวจ', role: 'หัวหน้างาน', next: 'APPROVE', prev: 'DRAFT' },
  APPROVE: { id: 'APPROVE', label: 'รอผู้อำนวยการลงนาม', role: 'ผู้อำนวยการ', next: 'COMPLETED', prev: 'REVIEW' },
  COMPLETED: { id: 'COMPLETED', label: 'อนุมัติ/ลงนามเรียบร้อย', role: 'งานสารบรรณ/จัดเก็บ' },
  REJECTED: { id: 'REJECTED', label: 'ถูกตีกลับแก้ไข', role: 'ผู้ร่างหนังสือ' }
};

class WorkflowEngine {
  static getStepTimeline(currentStepId, history = []) {
    const steps = [
      { id: 'DRAFT', name: '๑. ร่างเรื่องเสนอ' },
      { id: 'REVIEW', name: '๒. หัวหน้างานตรวจ' },
      { id: 'APPROVE', name: '๓. ผอ. พิจารณาลงนาม' },
      { id: 'COMPLETED', name: '๔. สำเร็จ/ออกเลขเสร็จ' }
    ];

    return `
      <div class="workflow-timeline">
        ${steps.map((step, idx) => {
          let statusClass = '';
          if (currentStepId === 'REJECTED') {
            statusClass = idx === 0 ? 'active rejected' : 'pending';
          } else {
            const stepOrder = ['DRAFT', 'REVIEW', 'APPROVE', 'COMPLETED'];
            const currentIdx = stepOrder.indexOf(currentStepId);
            if (idx < currentIdx) statusClass = 'completed';
            else if (idx === currentIdx) statusClass = 'active';
            else statusClass = 'pending';
          }

          return `
            <div class="timeline-item ${statusClass}">
              <div class="timeline-icon">${statusClass === 'completed' ? '✓' : (idx + 1)}</div>
              <div class="timeline-label">${step.name}</div>
            </div>
            ${idx < steps.length - 1 ? `<div class="timeline-line ${statusClass === 'completed' ? 'completed' : ''}"></div>` : ''}
          `;
        }).join('')}
      </div>
    `;
  }

  static renderHistoryLog(history = []) {
    if (!history.length) return `<div class="text-muted p-2">ยังไม่มีประวัติการส่งต่อ</div>`;
    return history.map(h => `
      <div class="history-card ${h.action === 'REJECT' ? 'history-reject' : 'history-pass'}">
        <div class="history-header">
          <strong>${h.actorName || 'ผู้ใช้งาน'}</strong> (${h.role || 'เจ้าหน้าที่'})
          <span class="history-time">${new Date(h.timestamp).toLocaleString('th-TH')}</span>
        </div>
        <div class="history-action">
          <span class="badge ${h.action === 'REJECT' ? 'badge-danger' : 'badge-success'}">
            ${h.actionName}
          </span>
          ${h.note ? `<div class="history-note">💬 หมายเหตุ/ข้อสั่งการ: "${h.note}"</div>` : ''}
        </div>
      </div>
    `).join('');
  }
}

window.WorkflowEngine = WorkflowEngine;
window.WORKFLOW_STEPS = WORKFLOW_STEPS;
