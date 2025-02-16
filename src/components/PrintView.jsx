import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDFDocument from './PDFDocument';
import { FileDown } from 'lucide-react';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format, addMinutes, parse } from 'date-fns';
import { nb } from 'date-fns/locale';
import 'jspdf-autotable';

function PrintView({ 
  moteInfo, 
  deltakere, 
  agendaPunkter, 
  status, 
  statusOppnadd, 
  nyDato,
  buttonClassName,
  title,
  children 
}) {
  const contentRef = useRef();

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Tittel og tema
    doc.setFontSize(24);
    doc.text('Møtereferat', 20, 20);
    doc.setFontSize(16);
    doc.text(moteInfo.tema || '', 20, 30);

    // Møteinformasjon
    doc.setFontSize(14);
    doc.text('Møteinformasjon', 20, 45);
    
    const moteInfoData = [
      ['Dato og tid:', `${format(new Date(moteInfo.dato), 'dd.MM.yyyy', { locale: nb })} kl. ${moteInfo.startTid}`],
      ['Møteeier:', moteInfo.eier],
      ['Fasilitator:', moteInfo.fasilitator],
      ['Referent:', moteInfo.referent]
    ];

    doc.autoTable({
      startY: 50,
      body: moteInfoData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } }
    });

    // Deltakere
    doc.setFontSize(14);
    doc.text('Deltakere', 20, doc.lastAutoTable.finalY + 15);

    const deltakerRows = deltakere.map(d => [
      d.fagFunksjon || '',
      d.navn || '',
      d.forberedelser || '',
      {
        content: '',
        styles: { cellPadding: 1 },
        drawCell: function(cell) {
          if (d.utfortStatus !== 'none') {
            // Tegn et lite farget rektangel
            if (d.utfortStatus === 'green') {
              doc.setFillColor(40, 167, 69);
            } else if (d.utfortStatus === 'red') {
              doc.setFillColor(220, 53, 69);
            }
            
            // Beregn posisjon for et sentrert rektangel
            const size = 6;
            const x = cell.x + (cell.width - size) / 2;
            const y = cell.y + (cell.height - size) / 2;
            
            doc.rect(x, y, size, size, 'F');
          }
        }
      },
      {
        content: '',
        styles: { cellPadding: 1 },
        drawCell: function(cell) {
          if (d.oppmoteStatus !== 'none') {
            // Tegn et lite farget rektangel
            if (d.oppmoteStatus === 'green') {
              doc.setFillColor(40, 167, 69);
            } else if (d.oppmoteStatus === 'red') {
              doc.setFillColor(220, 53, 69);
            }
            
            // Beregn posisjon for et sentrert rektangel
            const size = 6;
            const x = cell.x + (cell.width - size) / 2;
            const y = cell.y + (cell.height - size) / 2;
            
            doc.rect(x, y, size, size, 'F');
          }
        }
      }
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Funksjon', 'Navn', 'Forberedelser', 'Utført', 'Oppmøte']],
      body: deltakerRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [60, 60, 60],
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 }
      }
    });

    // Agenda
    doc.setFontSize(14);
    doc.text('Agenda', 20, doc.lastAutoTable.finalY + 15);

    const agendaRows = agendaPunkter.map(a => [
      a.startTid ? format(new Date(a.startTid), 'HH:mm', { locale: nb }) : '',
      a.punkt || '',
      a.ansvarlig || '',
      a.tidBrukt ? `${a.tidBrukt} min` : '',
      a.kommentar || ''
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Tid', 'Punkt', 'Ansvarlig', 'Tidsbruk', 'Kommentar']],
      body: agendaRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [60, 60, 60],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: { 
        fontSize: 10,
        cellPadding: 6,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 50 }
      }
    });

    // Status
    doc.setFontSize(14);
    doc.text('Status', 20, doc.lastAutoTable.finalY + 15);

    const statusText = statusOppnadd === 'oppnadd' ? 'Oppnådd' :
                      statusOppnadd === 'ikke_oppnadd' ? `Ikke oppnådd - Ny dato: ${nyDato}` :
                      'Ikke vurdert';

    const statusData = [
      ['Målsetting:', moteInfo.mal || ''],
      ['Måloppnåelse:', statusText]
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      body: statusData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } }
    });

    // Vedlegg
    const vedlegg = agendaPunkter.flatMap(a => a.vedlegg || []);
    if (vedlegg.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Vedlegg', 20, 20);

      let yPos = 30;
      vedlegg.forEach((v, i) => {
        if (v.type === 'image') {
          doc.addImage(v.data, 'JPEG', 20, yPos, 170, 100);
          yPos += 110;
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
        }
      });
    }

    doc.save(`Møtereferat-${moteInfo.tema}-${moteInfo.dato}.pdf`);
  };

  // Hjelpefunksjon for å beregne sluttid
  const beregnSluttTid = (startTid, varighet) => {
    try {
      const [timer, minutter] = startTid.split(':').map(Number);
      const tid = new Date();
      tid.setHours(timer);
      tid.setMinutes(minutter);
      tid.setMinutes(tid.getMinutes() + varighet);
      return tid.toLocaleTimeString('no-NO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '--:--';
    }
  };

  return (
    <button onClick={generatePDF} className={buttonClassName}>
      {children}
    </button>
  );
}

export default PrintView; 