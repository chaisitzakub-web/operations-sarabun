/**
 * Cloudflare Pages Functions Serverless API Handler
 * Connects directly to Cloudflare D1 Database (env.DB)
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle Health check
  if (path === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok', database: 'Cloudflare D1' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle /api/documents
  if (path.startsWith('/api/documents')) {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Cloudflare D1 Binding (DB) missing in wrangler.toml' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'GET') {
      try {
        const { results: docs } = await env.DB.prepare("SELECT * FROM documents ORDER BY updatedAt DESC").all();
        
        // Attach history logs to each doc
        for (let d of docs) {
          const { results: hist } = await env.DB.prepare("SELECT * FROM document_history WHERE documentId = ? ORDER BY id ASC").bind(d.id).all();
          d.history = hist;
        }

        return new Response(JSON.stringify(docs), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (request.method === 'POST') {
      try {
        const doc = await request.json();
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO documents (id, docNo, deptName, subject, date, toRecipient, urgency, category, folder, body, signerName, signerPosition, signatureDataUrl, eNoteText, status, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            docNo=excluded.docNo,
            deptName=excluded.deptName,
            subject=excluded.subject,
            body=excluded.body,
            signerName=excluded.signerName,
            signerPosition=excluded.signerPosition,
            signatureDataUrl=excluded.signatureDataUrl,
            eNoteText=excluded.eNoteText,
            status=excluded.status,
            updatedAt=excluded.updatedAt
        `).bind(
          doc.id, doc.docNo, doc.deptName, doc.subject, doc.date, doc.to || doc.toRecipient, doc.urgency, doc.category, doc.folder, doc.body, doc.signerName, doc.signerPosition, doc.signatureDataUrl || null, doc.eNoteText || null, doc.status || 'DRAFT', now
        ).run();

        // Insert history entry if provided
        if (doc.history && doc.history.length > 0) {
          const lastHist = doc.history[doc.history.length - 1];
          await env.DB.prepare(`
            INSERT INTO document_history (documentId, action, actionName, stepId, actorName, note)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(doc.id, lastHist.action || 'ADVANCE', lastHist.actionName || '', lastHist.stepId || doc.status, lastHist.actorName || 'User', lastHist.note || '').run();
        }

        return new Response(JSON.stringify({ success: true, doc }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }
  }

  return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), { status: 404 });
}
