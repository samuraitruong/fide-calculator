import { buildPdfDocument } from '@fide-calculator/shared';
import type { BackupData } from '@/hooks/useBackup';

/** Build PDF and trigger browser download (web). */
export function generateNativePdf(backup: BackupData): void {
  const doc = buildPdfDocument(backup);
  doc.save(`FIDE-backup-${backup.month.replace(/\s/g, '-')}.pdf`);
}
