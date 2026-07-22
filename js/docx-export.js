/**
 * Docx Export Engine for e-Sarabun
 * Generates Microsoft Word (.docx) documents matching standard Thai government memo rules
 */

class DocxExportEngine {
  static exportDocument(doc) {
    // Generate valid Microsoft Word HTML/XML Blob with TH Sarabun PSK fonts & standard margins
    const fontStyle = `font-family: 'TH Sarabun PSK', 'Angsana New', 'Cordia New', sans-serif;`;
    
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${doc.subject || 'เอกสารสารบรรณ'}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21.0cm 29.7cm; /* A4 */
            margin: 2.5cm 2.0cm 2.0cm 3.0cm; /* Top, Right, Bottom, Left */
          }
          body {
            ${fontStyle}
            font-size: 16pt;
            line-height: 1.2;
            color: #000000;
          }
          .garuda-header {
            text-align: center;
            margin-bottom: 10px;
          }
          .garuda-header img {
            width: 3cm;
            height: 3cm;
          }
          .title-bold {
            font-size: 29pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 16pt;
          }
          .meta-table td {
            padding: 3px 0;
            vertical-align: top;
          }
          .content-body {
            font-size: 16pt;
            text-align: justify;
            text-justify: inter-cluster;
            line-height: 1.3;
            margin-top: 15px;
          }
          .signature-section {
            margin-top: 40px;
            float: right;
            width: 50%;
            text-align: center;
            font-size: 16pt;
          }
          .stamp-box {
            border: 2px dashed #002B66;
            background-color: #F0F4F9;
            padding: 10px;
            margin-top: 20px;
            font-size: 14pt;
            color: #002B66;
          }
        </style>
      </head>
      <body>
        <div class="garuda-header">
          <!-- Standard Garuda Emblem Symbol -->
          <h1 style="font-size:36pt; margin:0; font-weight:bold; color:#A61C1C;">ครุฑ</h1>
        </div>

        <div class="title-bold">บันทึกข้อความ</div>

        <table class="meta-table">
          <tr>
            <td style="width:15%; font-weight:bold;">ส่วนราชการ</td>
            <td>${doc.deptName || 'สำนักบริหารกลาง'} 전화 ${doc.telNo || ''}</td>
          </tr>
          <tr>
            <td style="font-weight:bold;">ที่</td>
            <td style="width:45%;">${doc.docNo || '-'}</td>
            <td style="font-weight:bold; text-align:right;">วันที่</td>
            <td>${doc.date ? new Date(doc.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
          </tr>
          <tr>
            <td style="font-weight:bold;">เรื่อง</td>
            <td colspan="3" style="font-weight:bold;">${doc.subject || ''}</td>
          </tr>
          <tr>
            <td style="font-weight:bold;">เรียน</td>
            <td colspan="3">${doc.to || ''}</td>
          </tr>
        </table>

        <hr style="border:none; border-top: 1.5pt solid #000000; margin-bottom: 15px;"/>

        <div class="content-body">
          ${doc.body || ''}
        </div>

        ${doc.eNoteText ? `
          <div class="stamp-box">
            <strong>คำสั่ง / ข้อคิดเห็นการเกษียนหนังสือ:</strong><br>
            "${doc.eNoteText}"<br>
            <small>โดย: ผู้อำนวยการสำนัก | ลงนามเมื่อ: ${new Date().toLocaleString('th-TH')}</small>
          </div>
        ` : ''}

        <div class="signature-section">
          <br><br>
          <div>${doc.signerName || '(นายสมชาย ใจดี)'}</div>
          <div>${doc.signerPosition || 'หัวหน้าฝ่ายสารบรรณดิจิทัล'}</div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.docNo ? doc.docNo.replace(/[/\\?%*:|"<>]/g, '_') : 'เอกสารสารบรรณ'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.DocxExportEngine = DocxExportEngine;
