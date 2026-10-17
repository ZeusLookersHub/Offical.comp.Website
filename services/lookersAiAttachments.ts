import type { Lang } from '../data/lookersAi';
const LIMIT = 24000;
const message = (lang:Lang,en:string,ar:string) => lang === 'ar' ? ar : en;
/** Parsers are loaded only after an upload. File content is plain, untrusted text. */
export async function extractAttachment(file: File, lang: Lang): Promise<{text?:string;note:string}> {
  if (file.size > 20 * 1024 * 1024) return {note:message(lang,'File exceeds 20 MB. Upload a smaller file.','الملف أكبر من 20 ميجا. ارفع نسخة أصغر عشان نقدر نقراها.')};
  const ext = file.name.split('.').pop()?.toLowerCase();
  let source = '', summary = '';
  try {
    if (ext === 'xlsx') {
      const {default:ExcelJS} = await import('exceljs');
      const book = new ExcelJS.Workbook(); await book.xlsx.load(await file.arrayBuffer());
      const sheets:string[] = [];
      const sheetBudget=Math.floor(LIMIT/Math.max(1,book.worksheets.length));
      for (const sheet of book.worksheets) {
        const rows:string[] = []; let length=0;
        sheet.eachRow((row,n) => { if(length < sheetBudget){const text=`${n}: ` + Array.from({length:Math.min(sheet.actualColumnCount,50)},(_,i)=>row.getCell(i+1).text).join(' | ');rows.push(text);length+=text.length;} });
        sheets.push(`Sheet: ${sheet.name}; rows: ${sheet.actualRowCount}; columns: ${sheet.actualColumnCount}\n${rows.join('\n').slice(0,sheetBudget)}`);
      }
      source = sheets.join('\n\n'); summary = message(lang,`${book.worksheets.length} worksheets read`, `قرينا ${book.worksheets.length} شيت بالأعمدة والصفوف`);
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth');
      source = (await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value;
      summary = message(lang,'Word document text extracted','استخرجنا نص ملف Word');
    } else if (ext === 'pdf') {
      const pdfjs = await import('pdfjs-dist');
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      const loading = pdfjs.getDocument({data:await file.arrayBuffer()});
      const document = await loading.promise;
      const pages:string[]=[];
      try {
        for(let i=1;i<=document.numPages && pages.join('\n').length<LIMIT;i++) {
          const content = await (await document.getPage(i)).getTextContent();
          pages.push(`Page ${i}: `+content.items.map(item=>'str' in item ? item.str : '').join(' '));
        }
        summary = message(lang,`${pages.length}/${document.numPages} PDF pages extracted`, `استخرجنا نص ${pages.length} من ${document.numPages} صفحات PDF`);
      } finally {await loading.destroy();}
      source=pages.join('\n');
      if(!source.replace(/Page \d+:/g,'').trim()) return {note:message(lang,'This PDF has no readable text. Upload a text PDF or describe the scanned pages.','الـPDF ده صور من غير نص مقروء. ارفع نسخة نصية أو اكتب أهم اللي في الصفحات.')};
    } else if (['txt','md','csv','tsv','json'].includes(ext || '') || file.type.startsWith('text/')) {
      source=await file.text();summary=message(lang,'Text content read','قرينا محتوى الملف');
    } else return {note:message(lang,'Unsupported format. Use XLSX, DOCX, a text PDF, CSV or TXT.','الصيغة دي مش مدعومة للقراءة. استخدم XLSX أو DOCX أو PDF نصي أو CSV أو TXT.')};
    if(!source.trim()) return {note:message(lang,'No readable content found.','ملقيناش محتوى نصي نقدر نقراه في الملف.')};
    return {text:source.slice(0,LIMIT),note:summary+message(lang,'. A bounded excerpt is included in the prompt.','. مقتطف من المحتوى هيدخل في البرومبت، وتقدر تراجعه تحت.')};
  } catch {return {note:message(lang,'Could not read this file. It may be damaged or password protected; try an unprotected copy.','مقدرناش نقرا الملف. ممكن يكون تالف أو عليه باسورد؛ جرّب نسخة سليمة من غير حماية.')};}
}
