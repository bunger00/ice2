import React from 'react';
import { jsPDF } from 'jspdf';
import { FileDown } from 'lucide-react';

function MoteReferatPrintView({ moteInfo, deltakere, agendaPunkter, children, buttonClassName, iconOnly = false }) {
  // Funksjon for å komprimere base64-bilde
  const compressImage = (base64String, maxWidth = 800, quality = 0.6) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Beregn nye dimensjoner hvis bildet er for stort
        if (width > maxWidth) {
          height = Math.floor(height * (maxWidth / width));
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Komprimer til JPEG med redusert kvalitet
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64String;
    });
  };

  const handleExport = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 20;

      // Komprimer og legg til logo med redusert størrelse
      const logoImg = document.createElement('img');
      logoImg.src = "/Logolean.png";
      await new Promise((resolve) => {
        logoImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = logoImg.width / 2;
          canvas.height = logoImg.height / 2;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
          doc.addImage(
            logoImg.src,  // Bruk original PNG istedenfor konvertert JPEG
            "PNG",        // Bruk PNG-format for å beholde transparens og farger
            pageWidth - 50,
            yPos,
            30,
            10,
            undefined,
            'FAST'
          );
          resolve();
        };
      });

      // Hovedtittel
      doc.setFontSize(24);
      doc.text("Møtereferat", margin, yPos + 10);
      yPos += 25;

      // Undertittel (møtenavn)
      doc.setFontSize(16);
      doc.text(moteInfo.tema || "Fremdriftsmøte", margin, yPos);
      yPos += 20;

      // Seksjonstittel - Møteinformasjon
      doc.setFontSize(14);
      doc.setTextColor(40, 80, 160);
      doc.text("Møteinformasjon", margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      // Funksjon for å beregne tekst høyde
      const getTextHeight = (text, maxWidth) => {
        const lines = doc.splitTextToSize(text.toString(), maxWidth - 6);
        return lines.length * 4;  // 4mm per linje
      };

      // Funksjon for å tegne statussirkler
      const drawStatusCircle = (x, y, status) => {
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(
          status === 'green' ? '#4CAF50' :
          status === 'red' ? '#F44336' :
          '#FFFFFF'
        );
        doc.circle(x, y, 2.5, 'FD');  // Redusert radius fra 3 til 2.5
      };

      // Funksjon for å tegne tabell med grå header
      const drawTableWithHeader = (headers, rows, startY, rowHeight = 8) => {  // Redusert fra 10 til 8
        const colWidth = contentWidth / headers.length;
        let currentY = startY;

        // Tegn header bakgrunn
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

        // Beregn høyde for hver rad basert på innhold
        const rowHeights = rows.map(row => {
          const heights = row.map((cell, colIndex) => {
            if (colIndex < 3) {  // Bare beregn høyde for de første 3 kolonnene
              return getTextHeight(cell, colWidth);
            }
            return 4;  // Minimum høyde for status-kolonner
          });
          return Math.max(...heights, rowHeight);  // Minimum rowHeight
        });

        const totalHeight = rowHeight + rowHeights.reduce((a, b) => a + b, 0);

        // Tegn ramme rundt hele tabellen
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, currentY, contentWidth, totalHeight, 'S');

        // Tegn horisontale linjer
        let accumHeight = currentY + rowHeight;
        rowHeights.forEach(height => {
          doc.line(margin, accumHeight, margin + contentWidth, accumHeight);
          accumHeight += height;
        });

        // Tegn vertikale linjer
        for (let i = 1; i < headers.length; i++) {
          doc.line(
            margin + (colWidth * i),
            currentY,
            margin + (colWidth * i),
            currentY + totalHeight
          );
        }

        // Header tekst
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        headers.forEach((header, i) => {
          if (header === 'Utført' || header === 'Oppmøte') {
            const textWidth = doc.getTextWidth(header);
            const xPos = margin + (colWidth * i) + (colWidth - textWidth) / 2;
            doc.text(header, xPos, currentY + 6);  // Justert fra 7 til 6
          } else {
            doc.text(header, margin + (colWidth * i) + 3, currentY + 6);  // Justert fra 7 til 6
          }
        });

        // Rad tekst
        doc.setFont(undefined, 'normal');
        let yOffset = rowHeight;
        rows.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            if (colIndex < 3) {  // Bare tekst for de første 3 kolonnene
              const lines = doc.splitTextToSize(cell.toString(), colWidth - 6);
              lines.forEach((line, lineIndex) => {
                doc.text(
                  line,
                  margin + (colWidth * colIndex) + 3,
                  currentY + yOffset + (lineIndex * 4) + 4
                );
              });
            }
          });
          yOffset += rowHeights[rowIndex];
        });

        return currentY + totalHeight;
      };

      // Møteinformasjon tabell
      const infoHeaders = ['Dato og tid', 'Møteeier', 'Referent'];
      const infoData = [[
        `${new Date(moteInfo.dato).toLocaleDateString('no-NO')} kl. ${moteInfo.startTid}`,
        moteInfo.eier,
        moteInfo.referent
      ]];

      yPos = drawTableWithHeader(infoHeaders, infoData, yPos);
      yPos += 10;

      // Seksjonstittel - Deltakere
      doc.setFontSize(14);
      doc.setTextColor(40, 80, 160);
      doc.text("Deltakere og oppmøte", margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      // Deltakere tabell
      const deltakereHeaders = ['Navn', 'Funksjon', 'Forberedelser', 'Utført', 'Oppmøte'];
      const deltakereRows = deltakere.map(d => [
        d.navn,
        d.fagFunksjon,
        d.forberedelser,
        '',
        ''
      ]);

      const deltakerStartY = yPos;
      
      // Beregn høyde for hver deltakerrad basert på innhold
      const deltakerRowHeights = deltakereRows.map(row => {
        const textHeights = row.slice(0, 3).map(cell => getTextHeight(cell, contentWidth / 5));
        return Math.max(...textHeights, 8); // Minimum 8mm høyde
      });

      // Tegn deltakertabell med dynamisk høyde
      const colWidth = contentWidth / deltakereHeaders.length;
      
      // Header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, deltakerStartY, contentWidth, 8, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, deltakerStartY, contentWidth, 8, 'S');
      
      // Header tekst
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      deltakereHeaders.forEach((header, i) => {
        const xPos = margin + (colWidth * i);
        if (header === 'Utført' || header === 'Oppmøte') {
          const textWidth = doc.getTextWidth(header);
          doc.text(header, xPos + (colWidth - textWidth) / 2, deltakerStartY + 6);
        } else {
          doc.text(header, xPos + 3, deltakerStartY + 6);
        }
      });

      // Tegn vertikale linjer
      let currentY = deltakerStartY;
      const totalHeight = 8 + deltakerRowHeights.reduce((a, b) => a + b, 0);
      for (let i = 1; i < deltakereHeaders.length; i++) {
        doc.line(
          margin + (colWidth * i),
          currentY,
          margin + (colWidth * i),
          currentY + totalHeight
        );
      }

      // Tegn rader med innhold
      currentY += 8; // Start etter header
      doc.setFont(undefined, 'normal');
      deltakereRows.forEach((row, rowIndex) => {
        const rowHeight = deltakerRowHeights[rowIndex];
        
        // Tegn horisontal linje
        doc.line(margin, currentY, margin + contentWidth, currentY);
        
        // Tegn celleinnhold
        row.slice(0, 3).forEach((cell, colIndex) => {
          const lines = doc.splitTextToSize(cell.toString(), colWidth - 6);
          lines.forEach((line, lineIndex) => {
            doc.text(
              line,
              margin + (colWidth * colIndex) + 3,
              currentY + 4 + (lineIndex * 4)
            );
          });
        });

        // Tegn statussirkler
        const utfortX = margin + colWidth * 3 + colWidth / 2;
        const oppmoteX = margin + colWidth * 4 + colWidth / 2;
        const circleY = currentY + rowHeight / 2;
        
        // Tegn statussirkler
        const deltaker = deltakere[rowIndex];
        drawStatusCircle(utfortX, circleY, deltaker.utfortStatus);
        drawStatusCircle(oppmoteX, circleY, deltaker.oppmoteStatus);

        currentY += rowHeight;
      });

      // Tegn bunnlinje
      doc.line(margin, currentY, margin + contentWidth, currentY);
      
      yPos = currentY + 10;

      // Seksjonstittel - Agenda
      doc.setFontSize(14);
      doc.setTextColor(40, 80, 160);
      doc.text("Agenda og gjennomføring", margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 5;

      // Agenda tabell med dynamisk høyde
      const agendaHeaders = ['Tid', 'Agendapunkt', 'Kommentar'];
      const colWidths = [30, 70, contentWidth - 100];

      // Funksjon for å beregne høyde for agendapunkt
      const getAgendaRowHeight = (punkt) => {
        const tidHeight = 8 + 4; // Høyde for klokkeslett + varighet
        const punktHeight = getTextHeight(punkt.punkt, colWidths[1]) + 
                          getTextHeight(`Ansvarlig: ${punkt.ansvarlig}`, colWidths[1]);
        const kommentarHeight = getTextHeight(punkt.kommentar || '', colWidths[2]);
        return Math.max(tidHeight, punktHeight, kommentarHeight, 12); // Minimum 12mm høyde for å romme to linjer
      };

      // Funksjon for å tegne tabellrammer
      const drawTableBorders = (startY, height) => {
        // Ytre ramme
        doc.rect(margin, startY, contentWidth, height, 'S');

      // Vertikale linjer
        doc.line(margin + colWidths[0], startY, margin + colWidths[0], startY + height);
        doc.line(margin + colWidths[0] + colWidths[1], startY, margin + colWidths[0] + colWidths[1], startY + height);
      };

      // Header bakgrunn og ramme
      const headerHeight = 8; // Redusert fra 10
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos, contentWidth, headerHeight, 'F');
      drawTableBorders(yPos, headerHeight);

      // Header tekst
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      let xPos = margin;
      agendaHeaders.forEach((header, i) => {
        doc.text(header, xPos + 3, yPos + 6);
        xPos += colWidths[i];
      });
      yPos += headerHeight;

      // Funksjon for å sjekke om agendapunkt passer på siden
      const sjekkSideskift = (punkt, currentYPos) => {
        const punktHoyde = getAgendaRowHeight(punkt);
        return (currentYPos + punktHoyde) > 270; // Redusert margin for sideskift
      };

      // Funksjon for å skrive seksjonstittel
      const writeSectionTitle = (title, currentY) => {
        doc.setFontSize(14);
        doc.setTextColor(40, 80, 160);
        doc.text(title, margin, currentY);
        doc.setTextColor(0, 0, 0);
        return currentY + 15;
      };

      // Agenda innhold
      const processAgendaPunkter = async () => {
        for (const punkt of agendaPunkter) {
          // Sjekk om vi trenger ny side
          if (sjekkSideskift(punkt, yPos)) {
            doc.addPage();
            yPos = 20;
            
            // Gjenta overskrift på ny side
            yPos = writeSectionTitle("Agenda og gjennomføring", yPos);
            
            // Gjenta header på ny side
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPos, contentWidth, headerHeight, 'F');
            drawTableBorders(yPos, headerHeight);
            
            let headerXPos = margin;
            agendaHeaders.forEach((header, i) => {
              doc.setFont(undefined, 'bold');
              doc.setFontSize(10);
              doc.text(header, headerXPos + 3, yPos + 6);
              headerXPos += colWidths[i];
            });
            yPos += headerHeight;
          }

          // Beregn klokkeslett
          const index = agendaPunkter.indexOf(punkt);
          const klokkeslett = punkt.tid || 
            (index === 0 ? moteInfo.startTid : 
              (() => {
                const startTid = new Date(`2000-01-01T${moteInfo.startTid}`);
                for (let i = 0; i < index; i++) {
                  startTid.setMinutes(startTid.getMinutes() + agendaPunkter[i].varighet);
                }
                return startTid.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
              })());

          // Beregn radhøyde basert på innhold
          const rowHeight = getAgendaRowHeight(punkt);
          
          // Tegn tabellramme for hovedraden
          doc.setDrawColor(200, 200, 200);
          drawTableBorders(yPos, rowHeight);

          // Tid kolonne
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.text(klokkeslett, margin + 3, yPos + 5);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.text(`${punkt.varighet} min`, margin + 3, yPos + 10);

          // Agendapunkt og ansvarlig
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          const punktLinjer = doc.splitTextToSize(punkt.punkt, colWidths[1] - 6);
          punktLinjer.forEach((linje, i) => {
            doc.text(linje, margin + colWidths[0] + 3, yPos + 5 + (i * 4));
          });
          
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
          doc.text(
            `Ansvarlig: ${punkt.ansvarlig}`, 
            margin + colWidths[0] + 3, 
            yPos + 5 + (punktLinjer.length * 4) + 2  // Redusert fra 4 til 2
          );
        
        // Kommentar
          if (punkt.kommentar) {
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            const kommentarLinjer = doc.splitTextToSize(punkt.kommentar, colWidths[2] - 6);
            kommentarLinjer.forEach((linje, i) => {
              doc.text(linje, margin + colWidths[0] + colWidths[1] + 3, yPos + 5 + (i * 4));
            });
          }

          yPos += rowHeight;

          // Hvis det finnes aksjoner eller vedlegg
          if ((punkt.aksjoner && punkt.aksjoner.length > 0) || (punkt.vedlegg && punkt.vedlegg.length > 0)) {
            const ekstraRadHoyde = 50; // Økt høyde for bedre plass
            
            // Tegn hovedramme for rad 2
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, yPos, contentWidth, ekstraRadHoyde, 'S');
            
            // Del opp i to kolonner med vertikal linje
            const aksjonerBredde = contentWidth * 0.6;
            const vedleggBredde = contentWidth * 0.4;
            doc.line(
              margin + aksjonerBredde,
              yPos,
              margin + aksjonerBredde,
              yPos + ekstraRadHoyde
            );

            // Aksjoner seksjon (venstre kolonne)
            if (punkt.aksjoner && punkt.aksjoner.length > 0) {
              // Overskrift for aksjoner
              doc.setFont(undefined, 'bold');
              doc.setFontSize(9);
              doc.text("Aksjoner", margin + 3, yPos + 7);

              // Aksjonstabell header med grå bakgrunn
              const aksjonHeaderY = yPos + 10;
              doc.setFillColor(245, 245, 245);
              doc.rect(margin + 2, aksjonHeaderY, aksjonerBredde - 4, 8, 'F');

              const kolonnebredder = [
                (aksjonerBredde - 4) * 0.5,
                (aksjonerBredde - 4) * 0.25,
                (aksjonerBredde - 4) * 0.25
              ];

              // Tegn aksjonstabell header
              doc.setFont(undefined, 'bold');
              doc.setFontSize(8);
              doc.text("Aksjon", margin + 5, aksjonHeaderY + 6);
              doc.text("Ansvarlig", margin + 5 + kolonnebredder[0], aksjonHeaderY + 6);
              doc.text("Frist", margin + 5 + kolonnebredder[0] + kolonnebredder[1], aksjonHeaderY + 6);

              // Vertikale linjer i aksjonstabell header
              doc.line(
                margin + 2 + kolonnebredder[0],
                aksjonHeaderY,
                margin + 2 + kolonnebredder[0],
                aksjonHeaderY + 8
              );
              doc.line(
                margin + 2 + kolonnebredder[0] + kolonnebredder[1],
                aksjonHeaderY,
                margin + 2 + kolonnebredder[0] + kolonnebredder[1],
                aksjonHeaderY + 8
              );

              // Aksjonrader
              let currentY = aksjonHeaderY + 8;
              punkt.aksjoner.forEach((aksjon) => {
                const radHoyde = 6;
                doc.setDrawColor(200, 200, 200);
                doc.rect(margin + 2, currentY, aksjonerBredde - 4, radHoyde, 'S');
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
                const beskrivelse = doc.splitTextToSize(aksjon.beskrivelse, kolonnebredder[0] - 6);
                doc.text(beskrivelse, margin + 5, currentY + 4);
                doc.text(aksjon.ansvarlig, margin + 5 + kolonnebredder[0], currentY + 4);
                doc.text(
                  new Date(aksjon.frist).toLocaleDateString('no-NO'),
                  margin + 5 + kolonnebredder[0] + kolonnebredder[1],
                  currentY + 4
                );

                // Vertikale linjer i aksjonrad
                doc.line(
                  margin + 2 + kolonnebredder[0],
                  currentY,
                  margin + 2 + kolonnebredder[0],
                  currentY + radHoyde
                );
                doc.line(
                  margin + 2 + kolonnebredder[0] + kolonnebredder[1],
                  currentY,
                  margin + 2 + kolonnebredder[0] + kolonnebredder[1],
                  currentY + radHoyde
                );

                currentY += radHoyde;
              });
            }

            // Vedlegg seksjon (høyre kolonne)
            if (punkt.vedlegg && punkt.vedlegg.length > 0) {
              // Overskrift for vedlegg
              doc.setFont(undefined, 'bold');
              doc.setFontSize(9);
              doc.text(
                "Skjermbilder",
                margin + aksjonerBredde + 3,
                yPos + 7
              );

              let vedleggY = yPos + 12;
              const maxVedleggPerRad = 2;
              const vedleggPadding = 3;
              const maxBildeHoyde = (ekstraRadHoyde - 15) / Math.ceil(punkt.vedlegg.length / maxVedleggPerRad);
              const maxBildeBredde = (vedleggBredde - (vedleggPadding * 3)) / maxVedleggPerRad;

              // Behandle vedlegg
              for (let i = 0; i < punkt.vedlegg.length; i++) {
                const vedlegg = punkt.vedlegg[i];
                try {
                  const komprimertBilde = await compressImage(vedlegg.data, 600, 0.5);
                  
                  // Beregn X-posisjon basert på kolonne
                  const kolonne = i % maxVedleggPerRad;
                  const xPos = margin + aksjonerBredde + vedleggPadding + 
                             (kolonne * (maxBildeBredde + vedleggPadding));

                  // Beregn Y-posisjon basert på rad
                  const rad = Math.floor(i / maxVedleggPerRad);
                  const yPosForBilde = vedleggY + (rad * (maxBildeHoyde + vedleggPadding));

                  doc.addImage(
                    komprimertBilde,
                    'JPEG',
                    xPos,
                    yPosForBilde,
                    maxBildeBredde,
                    maxBildeHoyde - 5,
                    undefined,
                    'FAST'
                  );

                  // Legg til bildenavn under bildet
                  doc.setFont(undefined, 'italic');
                  doc.setFontSize(7);
                  const navnX = xPos;
                  const navnY = yPosForBilde + maxBildeHoyde - 3;
                  doc.text(vedlegg.navn, navnX, navnY);

                } catch (error) {
                  console.error('Kunne ikke legge til vedlegg:', error);
                }
              }
            } else if (punkt.aksjoner && punkt.aksjoner.length > 0) {
              // Hvis det bare er aksjoner, vis en melding i høyre kolonne
              doc.setFont(undefined, 'italic');
              doc.setFontSize(8);
              doc.text(
                "Ingen skjermbilder",
                margin + aksjonerBredde + 3,
                yPos + 25
              );
            }

            yPos += ekstraRadHoyde;
          }

          yPos += 5;
        }
      };

      await processAgendaPunkter();

      // Status i bunn
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 80, 160);
      doc.text("Status", margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      // Tegn statusboks
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPos, contentWidth, 35, 'F');  // Økt høyde for å få plass til knapper og dato
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, contentWidth, 35, 'S');
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text("Målsetting for møtet:", margin + 3, yPos + 6);
      doc.setFont(undefined, 'normal');
      doc.text(moteInfo.mal || '', margin + 3, yPos + 12);

      // Tegn "Oppnådde dere målet med møtet?" tekst
      doc.setFont(undefined, 'bold');
      doc.text("Oppnådde dere målet med møtet?", margin + 3, yPos + 20);

      // Tegn knapper
      const buttonWidth = 25;
      const buttonHeight = 8;
      const buttonSpacing = 5;
      const buttonY = yPos + 23;

      // "Oppnådd" knapp
      doc.setDrawColor(200, 200, 200);
      if (moteInfo.gjennomforingsStatus?.statusOppnadd === 'oppnadd') {
        doc.setFillColor(76, 175, 80); // Grønn farge
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.setTextColor(0, 0, 0);
      }
      doc.roundedRect(margin + 3, buttonY, buttonWidth, buttonHeight, 1, 1, 'FD');
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text("Oppnådd", margin + 5, buttonY + 5.5);

      // "Ikke oppnådd" knapp
      if (moteInfo.gjennomforingsStatus?.statusOppnadd === 'ikke_oppnadd') {
        doc.setFillColor(244, 67, 54); // Rød farge
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.setTextColor(0, 0, 0);
      }
      doc.roundedRect(margin + buttonWidth + buttonSpacing + 3, buttonY, buttonWidth + 5, buttonHeight, 1, 1, 'FD');
      doc.text("Ikke oppnådd", margin + buttonWidth + buttonSpacing + 5, buttonY + 5.5);

      // Vis ny dato hvis status er "ikke oppnådd"
      if (moteInfo.gjennomforingsStatus?.statusOppnadd === 'ikke_oppnadd' && moteInfo.gjennomforingsStatus?.nyDato) {
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text("Ny dato:", margin + buttonWidth * 2 + buttonSpacing + 10, buttonY + 5.5);
        doc.setFont(undefined, 'normal');
        doc.text(
          new Date(moteInfo.gjennomforingsStatus.nyDato).toLocaleDateString('no-NO'),
          margin + buttonWidth * 2 + buttonSpacing + 35,
          buttonY + 5.5
        );
      }

      doc.setTextColor(0, 0, 0); // Reset text color

      // Optimaliser PDF før lagring
      doc.setProperties({
        title: `Møtereferat-${moteInfo.tema}`,
        creator: 'ICE Meeting',
        producer: 'ICE Meeting',
        compressed: true
      });

      // Lagre PDF med optimaliserte innstillinger
      const filnavn = `Møtereferat-${moteInfo.tema}-${new Date().toLocaleDateString('no-NO')}.pdf`;
      doc.save(filnavn);

    } catch (error) {
      console.error('Feil ved eksport av møtereferat:', error);
      alert('Kunne ikke eksportere møtereferatet. Vennligst prøv igjen.');
    }
  };

  return (
    <button 
      onClick={handleExport} 
      className={buttonClassName || "flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"}
      title="Last ned møtereferat som PDF"
    >
      {children || (
        iconOnly ? <FileDown size={16} /> : (
          <>
            <FileDown size={14} />
            Eksporter møtereferat
          </>
        )
      )}
      </button>
  );
}

export default MoteReferatPrintView; 