import jsPDF from 'jspdf';
import { BackupData } from '@/hooks/useBackup';
import { Result } from './types';

// Define column styles for the table
const tableColumns: { header: string; dataKey: keyof Result; width: number }[] = [
  { header: 'Date', dataKey: 'date', width: 20 },
  { header: 'Opponent Name', dataKey: 'opponentName', width: 30 },
  { header: 'Opponent Rating', dataKey: 'opponentRating', width: 10 },
  { header: 'Your Rating', dataKey: 'playerRating', width: 10 },
  { header: 'K', dataKey: 'kFactor', width: 10 },
  { header: 'Result', dataKey: 'result', width: 10 },
  { header: 'RC', dataKey: 'ratingChange', width: 10 },
];
function drawPieChart(
    doc: jsPDF,
    data: Array<{ color: string; value: number }>,
    x: number,
    y: number,
    r: number
  ) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = Math.random() * 360;
  
    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
  
      doc.setFillColor(item.color);
      doc.setDrawColor(0); // optional: set border color
  
      doc.moveTo(x, y);
  
      const steps = 20; // increase for smoother curves
      for (let i = 0; i <= steps; i++) {
        const angle = startAngle + (i / steps) * sliceAngle;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) {
          doc.lineTo(px, py);
        } else {
          doc.lineTo(px, py);
        }
      }
  
      doc.lineTo(x, y); // close the slice
      doc.fill();
  
      startAngle = endAngle;
    });
  }

export const generateNativePdf = (backup: BackupData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageMargins = { top: 40, bottom: 40, left: 40, right: 40 };
  const contentWidth = pageWidth - pageMargins.left - pageMargins.right;
  let y = pageMargins.top;

  // 1. Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(`Your performance of ${backup.month}`, pageWidth / 2, y, { align: 'center' });
  y += 30;

  // 2. Pie Chart Box (left) and Rating Change Circle (right)
  const boxHeight = 120;
  const boxGap = 20;
  const boxWidth = (contentWidth - boxGap) / 2;
  const leftBoxX = pageMargins.left;
  const rightBoxX = pageMargins.left + boxWidth + boxGap;
  const boxY = y;

  // Pie chart box
  doc.setDrawColor('#e5e7eb');
  doc.setFillColor('#f3f4f6');
  doc.roundedRect(leftBoxX, boxY, boxWidth, boxHeight, 10, 10, 'F');

  // Pie chart: bigger and moved left
  const chartRadius = 50;
  const chartX = leftBoxX + 30 + chartRadius; // 30pt margin from left
  const chartY = boxY + boxHeight / 2;
  const wins = backup.data.filter(r => r.result === 'win').length;
  const draws = backup.data.filter(r => r.result === 'draw').length;
  const losses = backup.data.filter(r => r.result === 'loss').length;
  const totalGames = wins + draws + losses;
  if (totalGames > 0) {
    const data = [
      { value: wins, color: '#22c55e' },
      { value: draws, color: '#6b7280' },
      { value: losses, color: '#ef4444' },
    ];
    drawPieChart(doc, data, chartX, chartY, chartRadius);
  }
  // Pie chart legend (vertical, right side of chart, inside box, smaller text)
  const legendItems = [
    { label: `Win: ${wins}`, color: '#22c55e', count: wins },
    { label: `Draw: ${draws}`, color: '#6b7280', count: draws },
    { label: `Loss: ${losses}`, color: '#ef4444', count: losses },
  ].filter(item => item.count > 0);
  const legendBoxWidth = 70;
  const legendItemHeight = 20;
  const legendTotalHeight = legendItems.length * legendItemHeight;
  const legendStartY = chartY - legendTotalHeight / 2 + 5;
  const legendStartX = leftBoxX + boxWidth - legendBoxWidth - 10;
  doc.setFontSize(8);
  legendItems.forEach((item, idx) => {
    const yPos = legendStartY + idx * legendItemHeight;
    doc.setFillColor(item.color);
    doc.circle(legendStartX, yPos, 4, 'F');
    doc.setTextColor('#1f2937');
    doc.text(item.label, legendStartX + 10, yPos + 2);
  });

  // Rating change box (right)
  let boxColor = '#6b7280'; // gray for 0
  if (backup.totalChange > 0) boxColor = '#22c55e'; // green
  else if (backup.totalChange < 0) boxColor = '#ef4444'; // red
  doc.setDrawColor('#e5e7eb');
  doc.setFillColor(boxColor);
  doc.roundedRect(rightBoxX, boxY, boxWidth, boxHeight, 10, 10, 'F');
  // Large ELO change number, centered
  const textX = rightBoxX + boxWidth / 2;
  const textY = boxY + boxHeight / 2 + 22;
  doc.setTextColor('#fff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(75);
  const eloChangeStr = `${backup.totalChange >= 0 ? '+' : ''}${backup.totalChange.toFixed(1)}`;
  doc.text(eloChangeStr, textX, textY, { align: 'center' });
  doc.setFontSize(16);

  y += boxHeight + 40;

  // 5. Games Table
  // Draw table header
  doc.setFillColor('#f3f4f6');
  doc.roundedRect(pageMargins.left, y, contentWidth, 40, 4, 4, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#1f2937');
  
  let currentX = pageMargins.left;
  tableColumns.forEach(col => {
    const colWidth = col.width / 100 * contentWidth;
    const headerText = doc.splitTextToSize(col.header, colWidth - 8);
    doc.text(headerText, currentX + 4, y + 12, { align: 'left', baseline: 'top' });
    currentX += colWidth;
  });
  y += 36;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Draw table rows
  backup.data.forEach((game, rowIndex) => {
    let rowHeight = 22;
    const textLinesByCol: { [key: string]: string[] } = {};

    // First, calculate max row height based on wrapped text
    currentX = pageMargins.left;
    tableColumns.forEach(col => {
      const colWidth = col.width / 100 * contentWidth;
      const cellData = game[col.dataKey];
      const text = String(cellData === 'win' || cellData === 'loss' || cellData === 'draw' ? cellData.toUpperCase() : cellData);
      const lines = doc.splitTextToSize(text, colWidth - 8);
      textLinesByCol[col.dataKey] = lines;
      rowHeight = Math.max(rowHeight, lines.length * 10 + 12);
    });

    // Draw row background
    if (rowIndex % 2 !== 0) {
      doc.setFillColor('#f9fafb');
      doc.rect(pageMargins.left, y, contentWidth, rowHeight, 'F');
    }

    // Draw cell content
    currentX = pageMargins.left;
    tableColumns.forEach(col => {
      const colWidth = col.width / 100 * contentWidth;
      let cellText = textLinesByCol[col.dataKey];

      if (col.dataKey === 'ratingChange') {
        const value = Number(game[col.dataKey]);
        doc.setTextColor(value >= 0 ? '#166534' : '#991b1b');
        cellText = [`${value >= 0 ? '+' : ''}${value}`];
      } else {
        doc.setTextColor('#1f2937');
      }

      doc.text(cellText, currentX + 4, y + 8, { align: 'left', baseline: 'top' });
      currentX += colWidth;
    });

    y += rowHeight;
  });
  
  // Footer with clickable link (centered, dim color, perfectly aligned)
  const footerText = 'This report was generated by';
  const footerUrl = 'https://samuraitruong.github.io/fide-calculator/';
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#9ca3af'); // gray-400
  const spaceWidth = doc.getTextWidth(' ');
  const textWidth = doc.getTextWidth(footerText);
  const urlWidth = doc.getTextWidth(footerUrl);
  const footerWidth = textWidth + spaceWidth + urlWidth;
  const footerY = pageHeight - 18;
  const footerX = (pageWidth - footerWidth) / 2;
  doc.text(footerText, footerX, footerY);
  doc.textWithLink(footerUrl, footerX + textWidth + spaceWidth, footerY , { url: footerUrl });

  doc.save(`FIDE-backup-${backup.month.replace(/\s/g, '-')}.pdf`);
}; 