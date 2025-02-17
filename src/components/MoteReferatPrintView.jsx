import React from 'react';
import { jsPDF } from 'jspdf';
import { CheckCircle, XCircle } from 'lucide-react';

function MoteReferatPrintView({ moteInfo, deltakere, agendaPunkter, children, buttonClassName }) {
  const handleExport = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // Legg til logo
      pdf.addImage('/Logolean.png', 'PNG', 450, 20, 100, 40);

      // Tittel og undertittel
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Møtereferat', 40, 40);
      
      pdf.setFontSize(14);
      pdf.text(moteInfo.tema || '', 40, 70);

      // Møteinformasjon header
      pdf.setFontSize(14);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Møteinformasjon', 40, 110);

      // Grid for møteinfo
      const infoBoxes = [
        { title: 'Dato og tid', content: `${moteInfo.dato} kl. ${moteInfo.startTid}`, width: 160 },
        { title: 'Møteeier', content: moteInfo.eier || '', width: 160 },
        { title: 'Referent', content: moteInfo.referent || '', width: 160 }
      ];

      const infoBoxHeight = 40;
      
      let xPos = 40;
      infoBoxes.forEach(box => {
        // Bakgrunn
        pdf.setFillColor(247, 247, 247);
        pdf.rect(xPos, 130, box.width, infoBoxHeight, 'F');
        
        // Border
        pdf.setDrawColor(230, 230, 230);
        pdf.rect(xPos, 130, box.width, infoBoxHeight, 'S');
        
        // Tekst
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text(box.title, xPos + 10, 145);
        pdf.setFont(undefined, 'normal');
        pdf.text(box.content, xPos + 10, 160);
        
        xPos += box.width + 10;
      });

      // Deltakere og oppmøte header
      pdf.setFontSize(14);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Deltakere og oppmøte', 40, 200);

      // Deltakertabell
      const tableHeaders = ['Navn', 'Funksjon', 'Forberedelser', 'Utført', 'Oppmøte'];
      const colWidths = [150, 80, 180, 50, 50];
      const tableWidth = sum(colWidths);
      const rowHeight = 30;
      
      // Tabellramme
      pdf.setDrawColor(230, 230, 230);
      pdf.rect(40, 220, tableWidth, 25 + (deltakere.length * rowHeight), 'S');

      // Header bakgrunn
      pdf.setFillColor(247, 247, 247);
      pdf.rect(40, 220, tableWidth, 25, 'F');

      // Vertikale linjer
      xPos = 40;
      colWidths.forEach(width => {
        pdf.line(xPos, 220, xPos, 245 + (deltakere.length * rowHeight));
        xPos += width;
      });

      // Header tekst
      xPos = 40;
      pdf.setFontSize(10);
      tableHeaders.forEach((header, i) => {
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(header, xPos + 10, 237);
        xPos += colWidths[i];
      });

      // Deltakerrader
      let yPos = 245;
      pdf.setFontSize(9);
      deltakere.forEach((deltaker, i) => {
        pdf.line(40, yPos, 40 + tableWidth, yPos);

        pdf.setFont(undefined, 'normal');
        xPos = 40;
        
        pdf.text(deltaker.navn || '', xPos + 10, yPos + 15);
        xPos += colWidths[0];
        
        pdf.text(deltaker.fagFunksjon || '', xPos + 10, yPos + 15);
        xPos += colWidths[1];
        
        pdf.text(deltaker.forberedelser || '', xPos + 10, yPos + 15);
        xPos += colWidths[2];

        // Status sirkler
        const drawCircle = (x, y, color) => {
          pdf.setFillColor(...color);
          pdf.circle(x + 25, y + 10, 5, 'F');
        };

        drawCircle(xPos, yPos + 2, deltaker.utfortStatus === 'green' ? [39, 174, 96] : [220, 53, 69]);
        xPos += colWidths[3];
        
        drawCircle(xPos, yPos + 2, deltaker.oppmoteStatus === 'green' ? [39, 174, 96] : [220, 53, 69]);

        yPos += rowHeight;
      });

      // Agenda og gjennomføring header
      pdf.setFontSize(14);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Agenda og gjennomføring', 40, yPos + 40);

      // Agendapunkter
      const agendaStartY = yPos + 60;
      let currentY = agendaStartY;
      
      agendaPunkter.forEach((punkt, index) => {
        // Sjekk om vi trenger ny side (hvis mindre enn 150pt igjen på siden)
        if (currentY > 750) {  // A4 er ca 842pt høy
          pdf.addPage();
          currentY = 40;  // Start på toppen av ny side
        }

        const boxY = currentY;
        
        // Hovedboks med lys grå bakgrunn og avrundede hjørner
        pdf.setFillColor(247, 247, 247);
        pdf.roundedRect(40, boxY, 520, 100, 3, 3, 'F');
        
        // Del opp i fire kolonner
        const colX = {
          planlagt: 40,
          faktisk: 160,
          agenda: 280,
          kommentar: 400
        };
        
        // Planlagt tid
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text('Planlagt tid', colX.planlagt + 10, boxY + 20);
        pdf.setFont(undefined, 'bold');  // Beholder bold for klokkeslettet
        pdf.text('12:30', colX.planlagt + 10, boxY + 40);  // Klokkeslett i bold
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Varighet: ${punkt.varighet} min`, colX.planlagt + 10, boxY + 55);
        
        // Faktisk tid
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text('Faktisk tid', colX.faktisk + 10, boxY + 20);
        pdf.setFont(undefined, 'normal');
        pdf.text(punkt.faktiskStartTid || 'Ikke startet', colX.faktisk + 10, boxY + 40);
        
        // Agendapunkt
        pdf.setFont(undefined, 'bold');
        pdf.text('Agendapunkt', colX.agenda + 10, boxY + 20);
        pdf.setFont(undefined, 'normal');
        // Del teksten over flere linjer hvis den er for lang
        const agendaLinjer = pdf.splitTextToSize(punkt.punkt || '', colX.kommentar - colX.agenda - 20);
        agendaLinjer.forEach((linje, i) => {
          pdf.text(linje, colX.agenda + 10, boxY + 40 + (i * 12));
        });
        pdf.setTextColor(128, 128, 128);
        pdf.text(`Ansvarlig: ${punkt.ansvarlig}`, colX.agenda + 10, boxY + 70);  // Justert Y-posisjon
        
        // Kommentar
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text('Kommentar', colX.kommentar + 10, boxY + 20);
        pdf.setFont(undefined, 'normal');
        
        if (punkt.vedlegg && punkt.vedlegg.length > 0) {
          pdf.text('Vedlagte skjermbilder:', colX.kommentar + 10, boxY + 40);
          punkt.vedlegg.forEach((vedlegg, i) => {
            pdf.addImage(
              vedlegg.data,
              'PNG',
              colX.kommentar + 10,
              boxY + 45,
              100,  // Bredde
              45    // Høyde
            );
          });
        } else if (punkt.kommentar) {
          const kommentarLinjer = pdf.splitTextToSize(punkt.kommentar, 110);
          kommentarLinjer.forEach((linje, i) => {
            pdf.text(linje, colX.kommentar + 10, boxY + 40 + (i * 12));
          });
        }

        currentY += 120;  // Øk Y-posisjonen for neste punkt
      });

      // Måloppnåelse - sjekk om vi trenger ny side
      if (currentY + 200 > 750) {  // 200pt er estimert høyde for måloppnåelse-seksjonen
        pdf.addPage();
        currentY = 40;
      }

      // Måloppnåelse header
      const malY = currentY + 40;
      pdf.setFontSize(14);
      pdf.setTextColor(51, 102, 255);
      pdf.text('Måloppnåelse', 40, malY);

      // Målsetting label og tekst
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text('Målsetting:', 40, malY + 30);
      pdf.setFont(undefined, 'normal');

      // Del målsettingsteksten over flere linjer hvis nødvendig
      const malLinjer = pdf.splitTextToSize(moteInfo.mal || '', 500);
      malLinjer.forEach((linje, i) => {
        pdf.text(linje, 40, malY + 50 + (i * 15));
      });

      // Status boks
      const statusY = malY + 70 + (malLinjer.length * 15);
      
      // Sjekk om status er oppnådd - matcher datastrukturen fra handleSave
      const isOppnadd = moteInfo.gjennomforingsStatus?.statusOppnadd === 'oppnadd';
      
      if (isOppnadd) {
        // Lys grønn bakgrunnsboks
        pdf.setFillColor(236, 252, 243);  // #ecfcf3
        pdf.roundedRect(40, statusY, 520, 60, 3, 3, 'F');

        // Grønn "Oppnådd" knapp med sirkel og hake
        pdf.setFillColor(39, 174, 96);  // #27ae60
        pdf.roundedRect(55, statusY + 15, 100, 30, 3, 3, 'F');
        
        // Hvit sirkel og hake
        pdf.setFillColor(255, 255, 255);
        pdf.circle(70, statusY + 30, 8, 'F');
        
        // Hvit tekst "Oppnådd"
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, 'bold');
        pdf.text('✓ Oppnådd', 75, statusY + 33);
      } else {
        // Lys rød bakgrunnsboks
        pdf.setFillColor(255, 235, 235);  // Lys rød bakgrunn
        pdf.roundedRect(40, statusY, 520, 60, 3, 3, 'F');

        // Hvit knapp med rød border
        pdf.setDrawColor(220, 53, 69);  // Rød border
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(55, statusY + 15, 120, 30, 3, 3, 'FD');
        
        // Rød tekst "Ikke oppnådd"
        pdf.setTextColor(220, 53, 69);
        pdf.setFont(undefined, 'bold');
        pdf.text('Ikke oppnådd', 75, statusY + 33);

        // Ny dato (hvis den finnes)
        if (moteInfo.nyDato) {
          pdf.setTextColor(0, 0, 0);
          pdf.text('Ny dato:', 190, statusY + 33);
          pdf.setFont(undefined, 'normal');
          pdf.text(moteInfo.nyDato, 250, statusY + 33);
        }
      }

      pdf.save(`${moteInfo.tema || 'motereferat'}.pdf`);
    } catch (error) {
      console.error('Feil ved PDF-generering:', error);
      alert('Kunne ikke generere PDF: ' + error.message);
    }
  };

  const sum = arr => arr.reduce((a, b) => a + b, 0);

  return (
    <div className="inline-block">
      <button onClick={handleExport} className={buttonClassName}>
        {children}
      </button>
    </div>
  );
}

export default MoteReferatPrintView; 