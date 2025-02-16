import React, { useRef } from 'react';
import { FileDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format, addMinutes, parse } from 'date-fns';

// Ny komponent for agenda-eksport
function AgendaPrintView({ moteInfo, deltakere, agendaPunkter }) {
  const contentRef = useRef();

  // Funksjon for å beregne tidspunkt for hvert agendapunkt
  const beregnTidspunkt = (index) => {
    if (index === 0) return moteInfo.startTid;
    
    const startDato = parse(moteInfo.startTid, 'HH:mm', new Date());
    const totalMinutter = agendaPunkter
      .slice(0, index)
      .reduce((sum, punkt) => sum + punkt.varighet, 0);
    return format(addMinutes(startDato, totalMinutter), 'HH:mm');
  };

  // Funksjon for å beregne sluttid
  const beregnSluttTid = () => {
    const startDato = parse(moteInfo.startTid, 'HH:mm', new Date());
    const totalMinutter = agendaPunkter.reduce((sum, punkt) => sum + punkt.varighet, 0);
    return format(addMinutes(startDato, totalMinutter), 'HH:mm');
  };

  const handleExport = async () => {
    if (contentRef.current) {
      try {
        const content = contentRef.current;
        const contentScale = 1.2;
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        const canvas = await html2canvas(content, {
          scale: contentScale,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#FFFFFF'
        });

        const contentWidth = pdf.internal.pageSize.getWidth();
        const contentHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        let page = 1;

        // Første side
        pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= contentHeight;
        
        // Legg til flere sider hvis nødvendig
        while (heightLeft >= 0) {
          position = -contentHeight * page;
          pdf.addPage();
          pdf.addImage(canvas, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
          heightLeft -= contentHeight;
          page++;
        }

        pdf.save(`${moteInfo.tema || 'moteagenda'}.pdf`);
      } catch (error) {
        console.error('Eksport feilet:', error);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
      >
        <FileDown size={16} />
        Eksporter agenda
      </button>

      <div className="fixed -left-[9999px]">
        <div ref={contentRef} className="p-8 bg-white" style={{ width: '800px' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Møteagenda</h1>
              <h2 className="text-xl text-gray-600">{moteInfo.tema}</h2>
            </div>
            <img src="/Logolean.png" alt="LEAN Communications" className="h-16" />
          </div>

          {/* Møteinformasjon */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Møteinformasjon</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Dato og tid</p>
                  <p>{new Date(moteInfo.dato).toLocaleDateString()} kl. {moteInfo.startTid}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Møteeier</p>
                  <p>{moteInfo.eier}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium">Referent</p>
                  <p>{moteInfo.referent}</p>
                </div>
              </div>

              {/* Hensikt og målsetting */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium mb-1">Hensikt med møtet</p>
                  <p className="text-gray-700">{moteInfo.hensikt}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium mb-1">Målsetting for møtet</p>
                  <p className="text-gray-700">{moteInfo.mal}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deltakere */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Deltakere</h3>
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border p-2 text-left">Navn</th>
                  <th className="border p-2 text-left">Funksjon</th>
                  <th className="border p-2 text-left">Forberedelser</th>
                </tr>
              </thead>
              <tbody>
                {deltakere.map((deltaker, index) => (
                  <tr key={index}>
                    <td className="border p-2">{deltaker.navn}</td>
                    <td className="border p-2">{deltaker.fagFunksjon}</td>
                    <td className="border p-2">{deltaker.forberedelser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Agenda */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Agenda</h3>
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border p-2 text-left">Tid</th>
                  <th className="border p-2 text-left">Varighet</th>
                  <th className="border p-2 text-left">Agendapunkt</th>
                  <th className="border p-2 text-left">Ansvarlig</th>
                </tr>
              </thead>
              <tbody>
                {agendaPunkter.map((punkt, index) => (
                  <tr key={index}>
                    <td className="border p-2 font-medium">{beregnTidspunkt(index)}</td>
                    <td className="border p-2">{punkt.varighet} min</td>
                    <td className="border p-2">{punkt.punkt}</td>
                    <td className="border p-2">{punkt.ansvarlig}</td>
                  </tr>
                ))}
                {/* Møteslutt som siste rad med fet skrift */}
                <tr className="bg-gray-50 font-bold">
                  <td className="border p-2 text-lg">{beregnSluttTid()}</td>
                  <td className="border p-2 text-lg" colSpan={3}>
                    Møteslutt
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default AgendaPrintView; 