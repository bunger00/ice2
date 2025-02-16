import { FileDown } from 'lucide-react';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format, addMinutes, parse } from 'date-fns';
import { nb } from 'date-fns/locale';

function PrintView({ moteInfo, deltakere, agendaPunkter, status, statusOppnadd, nyDato }) {
  const contentRef = useRef();

  const handleExport = async () => {
    if (contentRef.current) {
      try {
        const content = contentRef.current;
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        const canvas = await html2canvas(content, {
          scale: 1.2,
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

        pdf.save(`${moteInfo.tema || 'motereferat'}.pdf`);
      } catch (error) {
        console.error('Eksport feilet:', error);
      }
    }
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
    <>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
      >
        <FileDown size={16} />
        Eksporter PDF
      </button>

      <div className="fixed -left-[9999px]">
        <div 
          ref={contentRef} 
          className="p-8 bg-white" 
          style={{ 
            width: '800px',
            maxWidth: '800px',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          {/* Header med logo og tittel */}
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Møtereferat</h1>
              <h2 className="text-xl text-gray-600">{moteInfo.tema}</h2>
            </div>
            <img 
              src="/Logolean.png"
              alt="LEAN Communications" 
              className="h-16 object-contain"
            />
          </div>

          {/* Møteinformasjon */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Møteinformasjon</h3>
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
          </div>

          {/* Deltakere med status */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Deltakere og oppmøte</h3>
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border p-2 text-left">Navn</th>
                  <th className="border p-2 text-left">Funksjon</th>
                  <th className="border p-2 text-left">Forberedelser</th>
                  <th className="border p-2 text-center">Utført</th>
                  <th className="border p-2 text-center">Oppmøte</th>
                </tr>
              </thead>
              <tbody>
                {deltakere.map((deltaker, index) => (
                  <tr key={index}>
                    <td className="border p-2">{deltaker.navn}</td>
                    <td className="border p-2">{deltaker.fagFunksjon}</td>
                    <td className="border p-2">{deltaker.forberedelser}</td>
                    <td className="border p-2">
                      <div className="flex justify-center">
                        <div className={`w-4 h-4 rounded-full ${
                          deltaker.utfortStatus === 'green' ? 'bg-green-500' :
                          deltaker.utfortStatus === 'red' ? 'bg-red-500' :
                          'bg-gray-200'
                        }`} />
                      </div>
                    </td>
                    <td className="border p-2">
                      <div className="flex justify-center">
                        <div className={`w-4 h-4 rounded-full ${
                          deltaker.oppmoteStatus === 'green' ? 'bg-green-500' :
                          deltaker.oppmoteStatus === 'red' ? 'bg-red-500' :
                          'bg-gray-200'
                        }`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Agenda med kommentarer og vedlegg */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Agenda og gjennomføring</h3>
            <div className="space-y-4">
              {agendaPunkter.map((punkt, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 bg-gray-50 p-3">
                    {/* Planlagt tid */}
                    <div className="col-span-2 border-r pr-3">
                      <div className="text-sm text-gray-500">Planlagt tid</div>
                      <div>
                        <div className="text-lg font-bold mb-1">{punkt.tid || moteInfo.startTid}</div>
                        <div className="text-sm text-gray-500">
                          Varighet: {punkt.varighet} min
                        </div>
                      </div>
                    </div>

                    {/* Faktisk tid */}
                    <div className="col-span-2 border-r pr-3">
                      <div className="text-sm text-gray-500">Faktisk tid</div>
                      {punkt.startTid ? (
                        <>
                          <div className="font-medium">
                            {new Date(punkt.startTid).toLocaleTimeString('no-NO', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          {punkt.tidBrukt && (
                            <div className={`text-sm ${punkt.tidBrukt > punkt.varighet ? 'text-red-500' : 'text-green-500'}`}>
                              ({punkt.tidBrukt} min)
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">Ikke startet</div>
                      )}
                    </div>

                    {/* Agendapunkt */}
                    <div className="col-span-4 border-r pr-3">
                      <div className="text-sm text-gray-500">Agendapunkt</div>
                      <div className="font-medium">{punkt.punkt}</div>
                      <div className="text-sm text-gray-600">Ansvarlig: {punkt.ansvarlig}</div>
                    </div>

                    {/* Kommentar og vedlegg */}
                    <div className="col-span-4">
                      <div className="text-sm text-gray-500">Kommentar</div>
                      {punkt.kommentar && (
                        <div className="text-sm mt-1">{punkt.kommentar}</div>
                      )}
                      {punkt.vedlegg && punkt.vedlegg.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-500 mb-1">Vedlagte skjermbilder:</div>
                          <div className="grid grid-cols-2 gap-2">
                            {punkt.vedlegg.map((vedlegg, i) => (
                              <img 
                                key={i}
                                src={vedlegg.data}
                                alt={`Vedlegg ${i + 1}`}
                                className="max-w-[150px] border rounded"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Måloppnåelse og status */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-600">Måloppnåelse</h3>
            <div className="bg-gray-50 p-3 rounded mb-3">
              <p className="font-medium mb-1">Målsetting:</p>
              <p className="text-gray-700">{moteInfo.mal}</p>
            </div>
            <div className={`p-4 rounded ${
              statusOppnadd === 'oppnadd' ? 'bg-green-50 border border-green-200' :
              statusOppnadd === 'ikke_oppnadd' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                  statusOppnadd === 'oppnadd' ? 'bg-green-500 text-white' :
                  statusOppnadd === 'ikke_oppnadd' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {statusOppnadd === 'oppnadd' ? (
                    <>
                      <div className="w-4 h-4 rounded-full bg-white" />
                      <span>Oppnådd</span>
                    </>
                  ) : statusOppnadd === 'ikke_oppnadd' ? (
                    <>
                      <div className="w-4 h-4 rounded-full bg-white" />
                      <span>Ikke oppnådd</span>
                    </>
                  ) : (
                    <span>Ikke vurdert</span>
                  )}
                </div>
                {statusOppnadd === 'ikke_oppnadd' && nyDato && (
                  <div className="text-red-700">
                    Ny dato: {nyDato}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrintView; 