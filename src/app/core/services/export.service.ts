import { Injectable } from '@angular/core';
import { ExportColumn } from '../models/cordant.models';

@Injectable({ providedIn: 'root' })
export class ExportService {

  // ── XLSX EXPORT ───────────────────────────────────────────────
  async exportXlsx(
    data:     Record<string, unknown>[],
    columns:  ExportColumn[],
    filename: string,
    sheetName = 'Data'
  ): Promise<void> {
    const XLSX = await import('xlsx');

    // Build worksheet data: header row + data rows
    const header = columns.map(c => c.label);
    const rows   = data.map(row =>
      columns.map(c => row[c.key] ?? '')
    );
    const wsData = [header, ...rows];

    const ws   = XLSX.utils.aoa_to_sheet(wsData);
    const wb   = XLSX.utils.book_new();

    // Set column widths
    ws['!cols'] = columns.map(c => ({ wch: c.width ?? 16 }));

    // Style header row bold (xlsx basic styling)
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'C47E10' } } };
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  // ── MULTI-SHEET XLSX ──────────────────────────────────────────
  async exportXlsxMultiSheet(
    sheets: Array<{
      name:    string;
      data:    Record<string, unknown>[];
      columns: ExportColumn[];
    }>,
    filename: string
  ): Promise<void> {
    const XLSX = await import('xlsx');
    const wb   = XLSX.utils.book_new();

    for (const sheet of sheets) {
      const header = sheet.columns.map(c => c.label);
      const rows   = sheet.data.map(row =>
        sheet.columns.map(c => row[c.key] ?? '')
      );
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      ws['!cols'] = sheet.columns.map(c => ({ wch: c.width ?? 16 }));
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  // ── PDF EXPORT ────────────────────────────────────────────────
  async exportPdf(
    data:      Record<string, unknown>[],
    columns:   ExportColumn[],
    filename:  string,
    title:     string,
    subtitle?: string
  ): Promise<void> {
    const pdfMake = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    (pdfMake as any).default.vfs = (pdfFonts as any).default;

    const pm = (pdfMake as any).default;

    // Header row
    const tableHeader = columns.map(c => ({
      text: c.label, bold: true, fontSize: 7, color: '#ffffff',
      fillColor: '#C47E10', margin: [2, 3, 2, 3]
    }));

    // Data rows
    const tableBody = data.map((row, i) =>
      columns.map(c => ({
        text: String(row[c.key] ?? ''),
        fontSize: 7,
        margin: [2, 2, 2, 2],
        fillColor: i % 2 === 0 ? '#1a2030' : '#131720',
        color: '#e8eaf0'
      }))
    );

    const colWidths = columns.map(c => {
      if (c.width && c.width > 0) return c.width * 4;
      return 'auto' as const;
    });

    const docDefinition = {
      pageSize:        'A4' as const,
      pageOrientation: columns.length > 6 ? ('landscape' as const) : ('portrait' as const),
      pageMargins:     [20, 40, 20, 30] as [number,number,number,number],
      background: [{
        canvas: [{
          type: 'rect' as const,
          x: 0, y: 0, w: 842, h: 595,
          color: '#0a0c0f'
        }]
      }],
      content: [
        // Cordant header
        {
          columns: [
            {
              stack: [
                { text: 'CORDANT ENERGY', style: 'brand' },
                { text: title, style: 'pageTitle' },
                ...(subtitle ? [{ text: subtitle, style: 'subtitle' }] : []),
                { text: `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'})}`, style: 'datestamp' }
              ]
            },
            {
              stack: [
                { text: 'MAINTENANCE & EMS PLATFORM', style: 'tagline' },
                { text: `${data.length} records`, style: 'recordCount' }
              ],
              alignment: 'right' as const
            }
          ],
          margin: [0, 0, 0, 16]
        },
        // Divider
        { canvas: [{ type: 'line' as const, x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#C47E10' }], margin: [0, 0, 0, 12] },
        // Table
        {
          table: {
            headerRows: 1,
            widths:     colWidths,
            body:       [tableHeader, ...tableBody]
          },
          layout: {
            hLineWidth:   (i: number) => i === 0 || i === 1 ? 1 : 0.5,
            vLineWidth:   () => 0.5,
            hLineColor:   () => '#1e2535',
            vLineColor:   () => '#1e2535',
          }
        }
      ],
      styles: {
        brand: {
          font: 'Roboto', fontSize: 14, bold: true,
          color: '#f5a623', letterSpacing: 3
        },
        pageTitle: {
          font: 'Roboto', fontSize: 18, bold: true,
          color: '#e8eaf0', margin: [0, 4, 0, 2]
        },
        subtitle: {
          font: 'Roboto', fontSize: 9,
          color: '#8a96b0', margin: [0, 0, 0, 2]
        },
        datestamp: {
          font: 'Roboto', fontSize: 7, color: '#4a5570'
        },
        tagline: {
          font: 'Roboto', fontSize: 8,
          color: '#4a5570', letterSpacing: 1
        },
        recordCount: {
          font: 'Roboto', fontSize: 20, bold: true,
          color: '#f5a623', margin: [0, 4, 0, 0]
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    pm.createPdf(docDefinition).download(`${filename}.pdf`);
  }

  // ── CONVENIENCE: EXPORT ANY PAGE ─────────────────────────────
  async export(
    format:   'xlsx' | 'pdf',
    data:     Record<string, unknown>[],
    columns:  ExportColumn[],
    filename: string,
    title:    string,
    subtitle?: string
  ): Promise<void> {
    if (format === 'xlsx') {
      await this.exportXlsx(data, columns, filename);
    } else {
      await this.exportPdf(data, columns, filename, title, subtitle);
    }
  }
}
