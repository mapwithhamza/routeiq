/**
 * ExportPDF.tsx — Export route optimization results as PDF report.
 * Uses jsPDF + jspdf-autotable. No backend needed.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';
import type { OptimizeResponse } from '../types';

interface ExportPDFProps {
  optResponse: OptimizeResponse;
  riderName?: string;
}

export default function ExportPDF({ optResponse, riderName }: ExportPDFProps) {
  const handleExport = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Header
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(6, 182, 212);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('RouteIQ', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(139, 148, 158);
    doc.setFont('helvetica', 'normal');
    doc.text('Delivery Route Optimization Report', 14, 23);
    doc.text(`Generated: ${dateStr} at ${timeStr}`, 14, 30);

    // Route Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Route Summary', 14, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Route Name: ${optResponse.name}`, 14, 57);
    if (riderName) doc.text(`Rider: ${riderName}`, 14, 64);
    doc.text(`Total Waypoints: ${optResponse.waypoints.length}`, 14, riderName ? 71 : 64);
    doc.text(`Algorithms Run: ${optResponse.results.length}`, 14, riderName ? 78 : 71);

    // Best algorithm
    const best = [...optResponse.results]
      .filter(r => r.distance > 0)
      .sort((a, b) => a.distance - b.distance)[0];
    if (best) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`Best Algorithm: ${best.algorithm} (${best.distance.toFixed(2)} km)`, 14, riderName ? 85 : 78);
    }

    // Algorithm Comparison Table
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Algorithm Comparison', 14, riderName ? 100 : 93);

    autoTable(doc, {
      startY: riderName ? 105 : 98,
      head: [['Algorithm', 'Distance (km)', 'Runtime (ms)', 'Nodes Explored', 'Route Stops']],
      body: optResponse.results.map(r => [
        r.algorithm,
        r.distance > 0 ? r.distance.toFixed(4) : 'N/A',
        r.runtime_ms.toFixed(4),
        r.nodes_explored.toString(),
        r.route.length.toString(),
      ]),
      headStyles: {
        fillColor: [13, 17, 23],
        textColor: [6, 182, 212],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    // Waypoints Table
    const afterTable = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Waypoint List', 14, afterTable);

    autoTable(doc, {
      startY: afterTable + 5,
      head: [['Stop', 'Label', 'Latitude', 'Longitude']],
      body: optResponse.waypoints.map((wp, i) => [
        i === 0 ? 'START' : `Stop ${i}`,
        wp.label || `Waypoint ${i}`,
        wp.lat.toFixed(5),
        wp.lon.toFixed(5),
      ]),
      headStyles: {
        fillColor: [13, 17, 23],
        textColor: [6, 182, 212],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 20 },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `RouteIQ — Muhammad Hamza Khan · NUST IGIS-2024 · Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 8
      );
    }

    // Save
    const filename = `routeiq_${optResponse.name.replace(/\s+/g, '_').toLowerCase()}_${now.getTime()}.pdf`;
    doc.save(filename);
  };

  return (
    <button
      onClick={handleExport}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition"
    >
      <FileDown size={14} />
      Export PDF Report
    </button>
  );
}
