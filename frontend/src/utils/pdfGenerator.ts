/**
 * PDF Report Generator for Company Intelligence Reports
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompanySummary {
  total_teams: number;
  total_members: number;
  total_projects: number;
  total_active_tickets: number;
  total_done_tickets: number;
  total_blocked: number;
  avg_progress: number;
  completion_rate: number;
  overloaded_members: number;
  idle_members: number;
}

export const generateCompanyReportPDF = (
  reportText: string,
  summary: CompanySummary,
  timestamp: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ====== HEADER ======
  doc.setFillColor(99, 102, 241); // Primary color
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Enterprise Intelligence Report', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date(timestamp).toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
  
  yPosition = 45;

  // ====== EXECUTIVE SUMMARY ======
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 15, yPosition);
  yPosition += 8;

  // Summary metrics table
  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value', 'Status']],
    body: [
      ['Total Teams', summary.total_teams.toString(), '📊'],
      ['Total Members', summary.total_members.toString(), '👥'],
      ['Total Projects', summary.total_projects.toString(), '📁'],
      ['Active Tickets', summary.total_active_tickets.toString(), '🎯'],
      ['Completed Tickets', summary.total_done_tickets.toString(), '✅'],
      ['Blocked Items', summary.total_blocked.toString(), summary.total_blocked > 0 ? '⚠️' : '✓'],
      ['Avg Progress', `${Math.round(summary.avg_progress)}%`, summary.avg_progress >= 70 ? '✓' : '⚠️'],
      ['Completion Rate', `${Math.round(summary.completion_rate)}%`, summary.completion_rate >= 80 ? '✓' : '⚠️'],
      ['Overloaded Members', summary.overloaded_members.toString(), summary.overloaded_members > 0 ? '⚠️' : '✓'],
      ['Idle Members', summary.idle_members.toString(), summary.idle_members > 0 ? '⚠️' : '✓'],
    ],
    theme: 'grid',
    headStyles: { 
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 70, halign: 'center' },
      2: { cellWidth: 30, halign: 'center', fontSize: 12 }
    },
    margin: { left: 15, right: 15 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // ====== AI ANALYSIS REPORT ======
  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI-Generated Analysis', 15, yPosition);
  yPosition += 8;

  // Split the report text into paragraphs
  const paragraphs = reportText.split('\n\n');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  for (const paragraph of paragraphs) {
    // Check if section header (starts with #)
    if (paragraph.trim().startsWith('#')) {
      const headerText = paragraph.replace(/#+\s*/g, '').trim();
      
      // Add space before header
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      yPosition += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text(headerText, 15, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      continue;
    }

    // Regular paragraph
    const lines = doc.splitTextToSize(paragraph.trim(), pageWidth - 30);
    
    for (const line of lines) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(line, 15, yPosition);
      yPosition += 5;
    }
    
    yPosition += 3; // Space between paragraphs
  }

  // ====== FOOTER ======
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount} | Enterprise Decision Intelligence Platform`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `enterprise-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

/**
 * Generate a quick financial summary PDF
 */
export const generateFinancialSummaryPDF = (
  teams: any[],
  costAnalysis: any[],
  totalCTC: number,
  totalRevenue: number,
  totalProfit: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(245, 158, 11); // Amber
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary Report', pageWidth / 2, 18, { align: 'center' });
  
  let yPosition = 45;

  // Overall metrics
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Company Financials', 15, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Amount']],
    body: [
      ['Total Cost to Company', `$${totalCTC.toLocaleString()}`],
      ['Total Revenue', `$${totalRevenue.toLocaleString()}`],
      ['Net Profit', `$${totalProfit.toLocaleString()}`],
      ['ROI', `${totalCTC > 0 ? ((totalProfit / totalCTC) * 100).toFixed(1) : '0'}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11] },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { cellWidth: 80, halign: 'right' }
    }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Team breakdown
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Financial Breakdown', 15, yPosition);
  yPosition += 8;

  autoTable(doc, {
    startY: yPosition,
    head: [['Team', 'Members', 'CTC', 'Revenue', 'Profit', 'ROI']],
    body: teams.map(team => [
      team.name || 'Unknown',
      team.member_count || 0,
      `$${((team.cost_to_company || 0) / 1000).toFixed(0)}K`,
      `$${((team.revenue || 0) / 1000).toFixed(0)}K`,
      `$${((team.profit || 0) / 1000).toFixed(0)}K`,
      `${team.roi || 0}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11] },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    }
  });

  const fileName = `financial-summary-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
