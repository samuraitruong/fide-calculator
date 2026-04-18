import { buildPdfDocument, type BackupData } from '@fide-calculator/shared';

/** Generate PDF for a month's backup and return as base64 string (for saving/sharing on mobile). */
export function generatePdfBase64(backup: BackupData): string {
  const doc = buildPdfDocument(backup);
  const dataUrl = doc.output('dataurlstring');
  return dataUrl.split(',')[1] ?? '';
}

export type { BackupData };
