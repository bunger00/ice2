import React, { useRef, useState } from 'react';
import { FileDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format, addMinutes, parse } from 'date-fns';

// Ny komponent for agenda-eksport
function AgendaPrintView({ moteInfo, deltakere, agendaPunkter, children }) {
  const contentRef = useRef();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    moteInfo: true,
    deltakere: true,
    agenda: true
  });

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

  const handleExport = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      let currentY = 20;
      let xPos = 40;
      let startY = 0;
      const pageHeight = pdf.internal.pageSize.height;
      const marginBottom = 40;
      const sectionSpacing = 40;

      // Last inn logoen først og vent på at den er lastet
      const loadImage = () => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          // Bruk full URL til logoen
          img.src = window.location.origin + '/Logolean.png';
        });
      };

      // Vent på at logoen er lastet før vi fortsetter
      const logo = await loadImage();
      pdf.addImage(logo, 'PNG', 450, currentY, 100, 40);
      
      // Flytt ned for overskriften
      currentY += 80;  // Gi plass til logoen og litt spacing

      // Midtstilt møtetema som overskrift
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      const temaWidth = pdf.getTextWidth(moteInfo.tema);
      const pageWidth = pdf.internal.pageSize.width;
      pdf.text(moteInfo.tema, (pageWidth - temaWidth) / 2, currentY);

      // Legg til spacing etter overskrift
      currentY += sectionSpacing;

      if (exportOptions.moteInfo) {
        // Møteinformasjon overskrift
        pdf.setFontSize(16);
        pdf.setTextColor(51, 102, 255);
        pdf.text('Møteinformasjon', 40, currentY);
        currentY += 30;

        // Møteinformasjon tabell - første rad
        const infoHeaders1 = ['Dato og tid', 'Møteeier', 'Fasilitator', 'Referent'];
        const infoColWidths1 = [120, 120, 120, 120];
        const infoTableWidth = sum(infoColWidths1);
        const baseRowHeight = 25;

        // Header med grå bakgrunn - første rad
        pdf.setFillColor(247, 247, 247);
        pdf.rect(40, currentY, infoTableWidth, 30, 'F');

        // Header tekst - første rad
        xPos = 40;
        pdf.setFontSize(10);
        infoHeaders1.forEach((header, i) => {
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(header, xPos + 10, currentY + 20);
          xPos += infoColWidths1[i];
        });

        currentY += 30;

        // Innhold - første rad
        pdf.setFont(undefined, 'normal');
        pdf.text(`${moteInfo.dato} kl. ${moteInfo.startTid}`, 50, currentY + 15);
        pdf.text(moteInfo.eier || '', 170, currentY + 15);
        pdf.text(moteInfo.fasilitator || '', 290, currentY + 15);
        pdf.text(moteInfo.referent || '', 410, currentY + 15);

        // Tegn tabellramme og linjer - første rad
        pdf.setDrawColor(230, 230, 230);
        pdf.rect(40, currentY - 30, infoTableWidth, 60, 'S');

        // Vertikale linjer - første rad
        xPos = 40;
        infoColWidths1.forEach(width => {
          pdf.line(xPos, currentY - 30, xPos, currentY + 30);
          xPos += width;
        });
        pdf.line(xPos, currentY - 30, xPos, currentY + 30);

        // Horisontal linje under header
        pdf.line(40, currentY, 40 + infoTableWidth, currentY);

        currentY += 45;

        // Andre rad - Hensikt og Målsetting
        const infoHeaders2 = ['Hensikt med møtet', 'Målsetting for møtet'];
        const infoColWidths2 = [240, 240];
        
        // Header med grå bakgrunn - andre rad
        pdf.setFillColor(247, 247, 247);
        pdf.rect(40, currentY, infoTableWidth, 30, 'F');

        // Header tekst - andre rad
        xPos = 40;
        infoHeaders2.forEach((header, i) => {
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(header, xPos + 10, currentY + 20);
          xPos += infoColWidths2[i];
        });

        currentY += 30;

        // Innhold - andre rad
        const hensiktLinjer = pdf.splitTextToSize(moteInfo.hensikt || '', 230);
        const malLinjer = pdf.splitTextToSize(moteInfo.mal || '', 230);
        const maxLinjer = Math.max(hensiktLinjer.length, malLinjer.length);
        const tekstHoyde = Math.max(baseRowHeight, maxLinjer * 12 + 10);

        pdf.setFont(undefined, 'normal');
        hensiktLinjer.forEach((linje, i) => {
          pdf.text(linje, 50, currentY + 15 + (i * 12));
        });
        malLinjer.forEach((linje, i) => {
          pdf.text(linje, 290, currentY + 15 + (i * 12));
        });

        // Tegn tabellramme og linjer - andre rad
        pdf.setDrawColor(230, 230, 230);
        pdf.rect(40, currentY - 30, infoTableWidth, tekstHoyde + 30, 'S');

        // Vertikale linjer - andre rad
        xPos = 40;
        infoColWidths2.forEach(width => {
          pdf.line(xPos, currentY - 30, xPos, currentY + tekstHoyde);
          xPos += width;
        });
        pdf.line(xPos, currentY - 30, xPos, currentY + tekstHoyde);

        currentY += tekstHoyde + sectionSpacing;
      }

      if (exportOptions.deltakere) {
        // Deltakere header
        pdf.setFontSize(16);
        pdf.setTextColor(51, 102, 255);
        pdf.text('Deltakere', 40, currentY);
        currentY += 30;

        // Deltakertabell
        const tableHeaders = ['Navn', 'Funksjon', 'Forberedelser'];
        const colWidths = [150, 120, 200];
        const tableWidth = sum(colWidths);
        const baseRowHeight = 25;

        // Header med grå bakgrunn
        pdf.setFillColor(247, 247, 247);
        pdf.rect(40, currentY, tableWidth, 30, 'F');

        // Header tekst
        xPos = 40;
        pdf.setFontSize(10);
        tableHeaders.forEach((header, i) => {
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(header, xPos + 10, currentY + 20);
          xPos += colWidths[i];
        });

        currentY += 30;

        // Deltakerrader
        let startY = currentY;
        deltakere.forEach((deltaker, index) => {
          checkNewPage(baseRowHeight, tableHeaders, colWidths, 'deltakere');
          
          // Horisontal linje
          pdf.setDrawColor(230, 230, 230);
          pdf.line(40, currentY, 40 + tableWidth, currentY);
          
          pdf.setFont(undefined, 'normal');
          pdf.text(deltaker.navn || '', 50, currentY + 15);
          pdf.text(deltaker.fagFunksjon || '', 200, currentY + 15);
          pdf.text(deltaker.forberedelser || '', 330, currentY + 15);
          
          currentY += baseRowHeight;
        });

        // Tegn siste horisontale linje
        pdf.line(40, currentY, 40 + tableWidth, currentY);

        // Vertikale linjer
        xPos = 40;
        colWidths.forEach(width => {
          pdf.line(xPos, startY - 30, xPos, currentY);
          xPos += width;
        });

        // Tegn siste vertikale linje
        pdf.line(xPos, startY - 30, xPos, currentY);

        currentY += sectionSpacing;
      }

      if (exportOptions.agenda) {
        // Agenda header
        pdf.setFontSize(16); // Behold større skriftstørrelse for overskrift
        pdf.setTextColor(51, 102, 255);
        pdf.text('Agenda', 40, currentY);
        currentY += 30;

        // Agendatabell
        const agendaHeaders = ['Tid', 'Varighet', 'Agendapunkt', 'Ansvarlig'];
        const agendaColWidths = [70, 70, 280, 100];
        const agendaTableWidth = sum(agendaColWidths);
        const baseRowHeight = 25;
        
        // Tegn tabellramme
        pdf.setDrawColor(230, 230, 230);
        pdf.rect(40, currentY, agendaTableWidth, 30 + (agendaPunkter.length * baseRowHeight), 'S');

        // Header med grå bakgrunn
        pdf.setFillColor(247, 247, 247);
        pdf.rect(40, currentY, agendaTableWidth, 30, 'F');
        
        // Header tekst
        xPos = 40;
        pdf.setFontSize(10); // Mindre skriftstørrelse for tabellinnhold
        agendaHeaders.forEach((header, i) => {
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(header, xPos + 10, currentY + 20);
          xPos += agendaColWidths[i];
        });
        
        currentY += 30;

        // Agendapunkter
        startY = currentY;  // Sett startY før agendapunkter

        agendaPunkter.forEach((punkt, index) => {
          const isNewPage = checkNewPage(baseRowHeight, agendaHeaders, agendaColWidths, 'agenda');
          
          // Horisontal linje for hver rad
          pdf.setDrawColor(230, 230, 230);
          pdf.line(40, currentY, 40 + agendaTableWidth, currentY);
          
          const agendapunktLinjer = pdf.splitTextToSize(punkt.punkt || '', 270);
          const textHeight = agendapunktLinjer.length * 12;
          const rowHeight = Math.max(baseRowHeight, textHeight + 10);

          // Tegn celleinnhold
          pdf.setFont(undefined, 'normal');
          pdf.text(beregnTidspunkt(index), 50, currentY + 15);
          pdf.text(`${punkt.varighet} min`, 120, currentY + 15);
          
          agendapunktLinjer.forEach((linje, i) => {
            if (currentY + 15 + (i * 12) > pageHeight - marginBottom) {
              checkNewPage(baseRowHeight, agendaHeaders, agendaColWidths, 'agenda');
            }
            pdf.text(linje, 200, currentY + 15 + (i * 12));
          });
          
          pdf.text(punkt.ansvarlig || '', 470, currentY + 15);
          
          currentY += rowHeight;

          // Tegn vertikale linjer for denne seksjonen
          xPos = 40;
          agendaColWidths.forEach(width => {
            pdf.line(xPos, startY, xPos, currentY);
            xPos += width;
          });
        });

        // Tegn siste horisontale linje
        pdf.line(40, currentY, 40 + agendaTableWidth, currentY);

        // Tegn vertikale linjer
        xPos = 40;
        agendaColWidths.forEach(width => {
          pdf.line(xPos, startY - 30, xPos, currentY);
          xPos += width;
        });
        // Tegn siste vertikale linje
        pdf.line(xPos, startY - 30, xPos, currentY);

        // Møteslutt (flytt litt ned)
        currentY += 5;
        pdf.text(beregnSluttTid(), 50, currentY + 15);
        pdf.text('Møteslutt', 120, currentY + 15);
      }

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
      <button
        onClick={() => setShowExportDialog(true)}
        className="text-gray-700 hover:text-gray-900 transition-colors duration-200 relative group pb-1"
        title="Eksporter agenda"
      >
        {children || <FileDown size={18} />}
      </button>

      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Velg innhold for eksport
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.moteInfo}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    moteInfo: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-gray-700">Møteinformasjon</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.deltakere}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    deltakere: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-gray-700">Deltakere</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.agenda}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    agenda: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-gray-700">Agenda</span>
              </label>
              </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  handleExport();
                  setShowExportDialog(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Eksporter PDF
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

export default AgendaPrintView; 