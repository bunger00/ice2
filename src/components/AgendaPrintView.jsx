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

      // Legg til Lean-logoen
      pdf.addImage('/Logolean.png', 'PNG', 450, 20, 100, 40);

      // Tittel
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Møteagenda', 40, 40);

      // Møteinformasjon overskrift (flyttet opp siden vi fjerner linjen)
      pdf.setFontSize(16);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Møteinformasjon', 40, 70);  // Justert y-posisjon fra 80 til 70

      // Reset farger før møteinfo-grid
      pdf.setFillColor(247, 247, 247);  // Lys grå bakgrunn
      pdf.setDrawColor(230, 230, 230);  // Lys grå border
      pdf.setTextColor(0, 0, 0);        // Svart tekst
      pdf.setFontSize(10);

      // Funksjon for å skrive fet overskrift
      const skrivFetOverskrift = (tekst, x, y) => {
        pdf.setFont(undefined, 'bold');
        pdf.text(tekst, x, y);
        pdf.setFont(undefined, 'normal');
      };

      // Dato og tid
      pdf.setFillColor(247, 247, 247);  // Gjenta farge for hver boks
      pdf.rect(40, 100, 200, 60, 'F');
      pdf.rect(40, 100, 200, 60, 'S');
      skrivFetOverskrift('Dato og tid', 50, 120);
      pdf.text(`${moteInfo.dato} kl. ${moteInfo.startTid}`, 50, 140);

      // Møteeier
      pdf.setFillColor(247, 247, 247);
      pdf.rect(250, 100, 200, 60, 'F');
      pdf.rect(250, 100, 200, 60, 'S');
      skrivFetOverskrift('Møteeier', 260, 120);
      pdf.text(moteInfo.eier || '', 260, 140);

      // Fasilitator
      pdf.setFillColor(247, 247, 247);
      pdf.rect(460, 100, 100, 60, 'F');
      pdf.rect(460, 100, 100, 60, 'S');
      skrivFetOverskrift('Fasilitator', 470, 120);
      pdf.text(moteInfo.fasilitator || '', 470, 140);

      // Referent
      pdf.setFillColor(247, 247, 247);
      pdf.rect(40, 170, 200, 60, 'F');
      pdf.rect(40, 170, 200, 60, 'S');
      skrivFetOverskrift('Referent', 50, 190);
      pdf.text(moteInfo.referent || '', 50, 210);

      // Hensikt med møtet
      if (moteInfo.hensikt) {
        pdf.setFillColor(247, 247, 247);
        pdf.rect(250, 170, 310, 60, 'F');
        pdf.rect(250, 170, 310, 60, 'S');
        skrivFetOverskrift('Hensikt med møtet', 260, 190);
        const hensiktLinjer = pdf.splitTextToSize(moteInfo.hensikt, 290);
        hensiktLinjer.forEach((linje, index) => {
          pdf.text(linje, 260, 210 + (index * 15));
        });
      }

      // Målsetting for møtet
      if (moteInfo.mal) {
        pdf.setFillColor(247, 247, 247);
        pdf.rect(40, 240, 520, 60, 'F');
        pdf.rect(40, 240, 520, 60, 'S');
        skrivFetOverskrift('Målsetting for møtet', 50, 260);
        const malLinjer = pdf.splitTextToSize(moteInfo.mal, 500);
        malLinjer.forEach((linje, index) => {
          pdf.text(linje, 50, 280 + (index * 15));
        });
      }

      // Deltakere overskrift
      pdf.setFontSize(16);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Deltakere', 40, 340);

      // Hjelpefunksjon for å bryte tekst
      const splitText = (text, maxWidth) => {
        if (!text) return [''];
        return pdf.splitTextToSize(text, maxWidth);
      };

      // Deltakertabell
      const deltakerStartY = 360;
      const colWidths = [150, 120, 200];  // Justerte bredder
      
      // Tegn tabellramme
      pdf.setDrawColor(230, 230, 230);
      pdf.rect(40, deltakerStartY, sum(colWidths), 25 + (deltakere.length * 25), 'S');

      // Header
      pdf.setFillColor(247, 247, 247);
      pdf.rect(40, deltakerStartY, sum(colWidths), 25, 'F');
      
      // Vertikale linjer
      let xPos = 40;
      colWidths.forEach(width => {
        pdf.line(xPos, deltakerStartY, xPos, deltakerStartY + 25 + (deltakere.length * 25));
        xPos += width;
      });

      // Header tekst for deltakertabell
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      skrivFetOverskrift('Navn', 45, deltakerStartY + 17);
      skrivFetOverskrift('Funksjon', 200, deltakerStartY + 17);
      skrivFetOverskrift('Forberedelser', 330, deltakerStartY + 17);

      // Deltakerrader med tekstbryting
      let y = deltakerStartY + 25;
      deltakere.forEach((deltaker, index) => {
        // Horisontale linjer
        pdf.line(40, y, 40 + sum(colWidths), y);
        
        // Del opp tekst som er for lang
        const navn = splitText(deltaker.navn || '', 140);
        const funksjon = splitText(deltaker.fagFunksjon || '', 110);
        const forberedelser = splitText(deltaker.forberedelser || '', 190);

        // Beregn høyeste antall linjer for å justere cellehøyde
        const maxLines = Math.max(navn.length, funksjon.length, forberedelser.length);
        const lineHeight = 12;
        
        // Tegn tekst
        pdf.text(navn, 45, y + 12);
        pdf.text(funksjon, 200, y + 12);
        pdf.text(forberedelser, 330, y + 12);

        y += Math.max(25, (maxLines * lineHeight));  // Minimum 25pt høyde
      });

      // Agenda overskrift
      pdf.setFontSize(14);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Agenda', 40, y + 40);

      // Agendatabell
      const agendaStartY = y + 60;
      const agendaColWidths = [70, 70, 240, 90];  // Justerte bredder
      
      // Tegn tabellramme
      pdf.rect(40, agendaStartY, sum(agendaColWidths), 25 + (agendaPunkter.length * 25), 'S');

      // Header
      pdf.setFillColor(247, 247, 247);
      pdf.rect(40, agendaStartY, sum(agendaColWidths), 25, 'F');

      // Vertikale linjer
      xPos = 40;
      agendaColWidths.forEach(width => {
        pdf.line(xPos, agendaStartY, xPos, agendaStartY + 25 + (agendaPunkter.length * 25));
        xPos += width;
      });

      // Header tekst for agendatabell
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      skrivFetOverskrift('Tid', 45, agendaStartY + 17);
      skrivFetOverskrift('Varighet', 120, agendaStartY + 17);
      skrivFetOverskrift('Agendapunkt', 200, agendaStartY + 17);
      skrivFetOverskrift('Ansvarlig', 430, agendaStartY + 17);

      // Agendarader med tekstbryting
      y = agendaStartY + 25;
      agendaPunkter.forEach((punkt, index) => {
        pdf.line(40, y, 40 + sum(agendaColWidths), y);
        
        const agendapunkt = splitText(punkt.punkt || '', 230);
        const ansvarlig = splitText(punkt.ansvarlig || '', 80);

        const maxLines = Math.max(agendapunkt.length, ansvarlig.length);
        const lineHeight = 12;

        pdf.text(beregnTidspunkt(index), 45, y + 12);
        pdf.text(`${punkt.varighet} min`, 120, y + 12);
        pdf.text(agendapunkt, 200, y + 12);
        pdf.text(ansvarlig, 430, y + 12);

        y += Math.max(25, (maxLines * lineHeight));
      });

      // Møteslutt
      y += 10;
      pdf.text(beregnSluttTid(), 45, y);
      pdf.text('Møteslutt', 120, y);

        pdf.save(`${moteInfo.tema || 'moteagenda'}.pdf`);
      } catch (error) {
        console.error('Eksport feilet:', error);
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