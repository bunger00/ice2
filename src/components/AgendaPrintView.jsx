import React, { useRef } from 'react';
import { FileDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format, addMinutes, parse } from 'date-fns';

// Ny komponent for agenda-eksport
function AgendaPrintView({ moteInfo, deltakere, agendaPunkter, children }) {
  const contentRef = useRef();

  // Funksjon for å beregne tidspunkt for hvert agendapunkt
  const beregnTidspunkt = (index) => {
    if (index === 0) return moteInfo.startTid;
    const startDato = new Date(`2000-01-01T${moteInfo.startTid}`);
    const totalMinutter = agendaPunkter
      .slice(0, index)
      .reduce((sum, punkt) => sum + punkt.varighet, 0);
    startDato.setMinutes(startDato.getMinutes() + totalMinutter);
    return startDato.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
  };

  // Funksjon for å beregne sluttid
  const beregnSluttTid = () => {
    const startDato = new Date(`2000-01-01T${moteInfo.startTid}`);
    const totalMinutter = agendaPunkter.reduce((sum, punkt) => sum + punkt.varighet, 0);
    startDato.setMinutes(startDato.getMinutes() + totalMinutter);
    return startDato.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
  };

  const handleExport = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      let currentY = 40;
      const pageHeight = pdf.internal.pageSize.height;
      const marginBottom = 40;

      // Funksjon for å sjekke om vi trenger ny side
      const checkNewPage = (neededSpace) => {
        if (currentY + neededSpace > pageHeight - marginBottom) {
          pdf.addPage();
          currentY = 40;
          return true;
        }
        return false;
      };

      // Legg til Lean-logoen
      pdf.addImage('/Logolean.png', 'PNG', 450, 20, 100, 40);

      // Tittel
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Møteagenda', 40, 40);

      // Møteinformasjon overskrift
      pdf.setFontSize(16);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Møteinformasjon', 40, 70);

      // Møteinformasjon grid
      const infoBoxes = [
        { title: 'Dato og tid', content: `${moteInfo.dato} kl. ${moteInfo.startTid}`, width: 160 },
        { title: 'Møteeier', content: moteInfo.eier || '', width: 160 },
        { title: 'Fasilitator', content: moteInfo.fasilitator || '', width: 160 }
      ];

      let xPos = 40;
      infoBoxes.forEach(box => {
        pdf.setFillColor(247, 247, 247);
        pdf.rect(xPos, 90, box.width, 60, 'F');
        pdf.setDrawColor(230, 230, 230);
        pdf.rect(xPos, 90, box.width, 60, 'S');
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(box.title, xPos + 10, 110);
        pdf.setFont(undefined, 'normal');
        pdf.text(box.content, xPos + 10, 130);
        
        xPos += box.width + 10;
      });

      currentY = 170;

      // Deltakere header
      checkNewPage(200);
      pdf.setFontSize(10);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Deltakere', 40, currentY);
      currentY += 30;

      // Deltakertabell
      const tableHeaders = ['Navn', 'Funksjon', 'Forberedelser'];
      const colWidths = [150, 120, 200];
      const tableWidth = sum(colWidths);
      
      // Tegn tabellramme
      pdf.setDrawColor(230, 230, 230);
      pdf.rect(40, currentY, tableWidth, 30 + (deltakere.length * 40), 'S');

      // Header med grå bakgrunn
      pdf.setFillColor(247, 247, 247);
      pdf.rect(40, currentY, tableWidth, 30, 'F');
      
      // Vertikale linjer
      xPos = 40;
      colWidths.forEach(width => {
        pdf.line(xPos, currentY, xPos, currentY + 30 + (deltakere.length * 40));
        xPos += width;
      });

      // Header tekst
      xPos = 40;
      tableHeaders.forEach((header, i) => {
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(header, xPos + 10, currentY + 20);
        xPos += colWidths[i];
      });
      
      currentY += 30;

      // Deltakerrader med horisontale linjer
      deltakere.forEach((deltaker, index) => {
        checkNewPage(40);
        
        // Horisontal linje
        pdf.line(40, currentY, 40 + tableWidth, currentY);
        
        pdf.setFont(undefined, 'normal');
        pdf.text(deltaker.navn || '', 50, currentY + 20);
        pdf.text(deltaker.fagFunksjon || '', 200, currentY + 20);
        pdf.text(deltaker.forberedelser || '', 330, currentY + 20);
        
        currentY += 40;
      });

      // Agenda header
      checkNewPage(200);
      currentY += 20;
      pdf.setFontSize(10);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Agenda', 40, currentY);
      currentY += 30;

      // Agendatabell
      const agendaHeaders = ['Tid', 'Varighet', 'Agendapunkt', 'Ansvarlig'];
      const agendaColWidths = [70, 70, 240, 90];
      const agendaTableWidth = sum(agendaColWidths);
      
      // Tegn tabellramme
      pdf.setDrawColor(230, 230, 230);
      pdf.rect(40, currentY, agendaTableWidth, 30 + (agendaPunkter.length * 40), 'S');

      // Header med grå bakgrunn
      pdf.setFillColor(247, 247, 247);
      pdf.rect(40, currentY, agendaTableWidth, 30, 'F');
      
      // Vertikale linjer
      xPos = 40;
      agendaColWidths.forEach(width => {
        pdf.line(xPos, currentY, xPos, currentY + 30 + (agendaPunkter.length * 40));
        xPos += width;
      });

      // Header tekst
      xPos = 40;
      agendaHeaders.forEach((header, i) => {
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(header, xPos + 10, currentY + 20);
        xPos += agendaColWidths[i];
      });
      
      currentY += 30;

      // Agendapunkter med horisontale linjer
      agendaPunkter.forEach((punkt, index) => {
        checkNewPage(40);
        
        // Horisontal linje
        pdf.line(40, currentY, 40 + agendaTableWidth, currentY);
        
        pdf.setFont(undefined, 'normal');
        pdf.text(beregnTidspunkt(index), 50, currentY + 20);
        pdf.text(`${punkt.varighet} min`, 120, currentY + 20);
        
        const agendapunktLinjer = pdf.splitTextToSize(punkt.punkt || '', 230);
        agendapunktLinjer.forEach((linje, i) => {
          pdf.text(linje, 200, currentY + 20 + (i * 12));
        });
        
        pdf.text(punkt.ansvarlig || '', 450, currentY + 20);
        
        currentY += Math.max(40, agendapunktLinjer.length * 12 + 20);
      });

      // Møteslutt
      checkNewPage(40);
      pdf.text(beregnSluttTid(), 50, currentY + 20);
      pdf.text('Møteslutt', 120, currentY + 20);

      pdf.save(`${moteInfo.tema || 'moteagenda'}.pdf`);
    } catch (error) {
      console.error('Eksport feilet:', error);
      alert('Kunne ikke generere PDF: ' + error.message);
    }
  };

  // Hjelpefunksjoner
  const sum = arr => arr.reduce((a, b) => a + b, 0);

  return (
    <div className="inline-block agenda-print-view">
      {children}
      <button
        className="hidden export-trigger" 
        onClick={handleExport}
      />
      </div>
  );
}

export default AgendaPrintView; 