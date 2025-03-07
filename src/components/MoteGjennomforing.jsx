import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, ArrowLeft, Check, Calendar, Image, X, Save, Printer, FileDown, Lock, Unlock, ChevronDown, ChevronUp, AlertCircle, Plus, QrCode, BarChart, Eye, Upload, FileText, Paperclip, ExternalLink, Download, Pencil } from 'lucide-react';
import MoteReferatPrintView from './MoteReferatPrintView';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import DrawingEditor from './DrawingEditor';
import QRCodeModal from './QRCodeModal';
import SurveyResults from './SurveyResults';

// Hjelpefunksjon for å komprimere bilder - uten å bruke Image-konstruktøren
const compressImage = async (dataUrl, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    try {
      if (!dataUrl || typeof dataUrl !== 'string') {
        console.error('Ugyldig dataUrl:', typeof dataUrl);
        reject(new Error('Ugyldig dataUrl-format'));
        return;
      }
      
      // Bruk en allerede eksisterende img-element eller lag en via DOM
      const img = document.createElement('img');
      
      // Håndter lasting av bilde
      img.onload = () => {
        try {
          console.log(`Bilde lastet: ${img.width}x${img.height}`);
          
          // Beregn ny bredde (maks 800px) og høyde med samme forhold
          let newWidth = img.width;
          let newHeight = img.height;
          
          if (newWidth > maxWidth) {
            newHeight = Math.round((newHeight * maxWidth) / newWidth);
            newWidth = maxWidth;
          }
          
          console.log(`Ny bildestørrelse: ${newWidth}x${newHeight}`);

          // Tegn bildet på canvas med ny størrelse
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Konverter canvas til komprimert dataURL
          const komprimertData = canvas.toDataURL('image/jpeg', quality);
          console.log('Bilde komprimert vellykket');
          resolve(komprimertData);
        } catch (err) {
          console.error('Feil ved komprimering av bilde:', err);
          resolve(dataUrl); // Returner originalt bilde ved feil
        }
      };
      
      // Håndter feil ved lasting av bilde
      img.onerror = (err) => {
        console.error('Feil ved lasting av bilde:', err);
        resolve(dataUrl); // Returner originalt bilde ved feil
      };
      
      // Sett src etter at event handlers er definert
      img.src = dataUrl;
    } catch (err) {
      console.error('Uventet feil i compressImage:', err);
      resolve(dataUrl); // Returner originalt bilde ved feil
    }
  });
};

// Legg til en ny AksjonDialog komponent
const AksjonDialog = ({ isOpen, onClose, onSave, deltakere }) => {
  const [aksjon, setAksjon] = useState({
    ansvarlig: '',
    beskrivelse: '',
    frist: ''
  });
  const [visManuelInput, setVisManuelInput] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(aksjon);
    setAksjon({ ansvarlig: '', beskrivelse: '', frist: '' });
    setVisManuelInput(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Ny aksjon</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ansvarlig
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisManuelInput(!visManuelInput)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {visManuelInput ? "Velg fra liste" : "Skriv inn manuelt"}
                  </button>
                </div>
                {visManuelInput ? (
                  <input
                    type="text"
                    value={aksjon.ansvarlig}
                    onChange={(e) => setAksjon({ ...aksjon, ansvarlig: e.target.value })}
                    className="w-full border rounded-md p-2"
                    placeholder="Skriv inn navn"
                    required
                  />
                ) : (
                  <select
                    value={aksjon.ansvarlig}
                    onChange={(e) => setAksjon({ ...aksjon, ansvarlig: e.target.value })}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">Velg ansvarlig</option>
                    {deltakere.map((deltaker, index) => (
                      <option key={index} value={deltaker.navn}>
                        {deltaker.navn}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivelse
              </label>
              <textarea
                value={aksjon.beskrivelse}
                onChange={(e) => setAksjon({ ...aksjon, beskrivelse: e.target.value })}
                className="w-full border rounded-md p-2"
                rows="3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frist
              </label>
              <input
                type="date"
                value={aksjon.frist}
                onChange={(e) => setAksjon({ ...aksjon, frist: e.target.value })}
                className="w-full border rounded-md p-2"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Lagre aksjon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function MoteGjennomforing({ moteInfo, deltakere, agendaPunkter, status, setStatus, setDeltakere, setAgendaPunkter, lagreMote, resetMote, setVisMoteSkjema, setVisLagredeMoter }) {
  const location = useLocation();
  
  // Sett isLocked til false som standardverdi
  const [isLocked, setIsLocked] = useState(location.state?.shouldLock ?? false);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deltakereStatus, setDeltakereStatus] = useState(
    deltakere.map(d => ({ 
      ...d, 
      utfortStatus: d.utfortStatus || 'none',
      oppmoteStatus: d.oppmoteStatus || 'none'
    }))
  );

  // Last inn aktivt punkt fra moteInfo hvis det finnes
  const [aktivtPunkt, setAktivtPunkt] = useState(null);

  // Oppdater initialiseringen av agendaStatus for å inkludere alle nødvendige felter
  const [agendaStatus, setAgendaStatus] = useState(
    agendaPunkter.map(a => ({
      ...a,
      id: a.id || generateUniqueId(),
      kommentar: a.kommentar || '',
      startTid: a.startTid || null,
      ferdig: a.ferdig || false,
      tidBrukt: a.tidBrukt || null,
      vedlegg: a.vedlegg || [],
      erLast: a.erLast || false,
      notater: a.notater || '',
      beslutninger: a.beslutninger || '',
      aksjoner: a.aksjoner || []
    }))
  );

  // Legg til denne hjelpefunksjonen øverst i komponenten
  const generateUniqueId = () => Math.random().toString(36).substring(2, 15);

  // Last inn aktivt punkt fra moteInfo når komponenten lastes
  useEffect(() => {
    if (moteInfo) {
      console.log('MoteInfo i useEffect:', { 
        id: moteInfo.id, 
        aktivtPunkt: moteInfo.aktivtPunkt,
        agendaPunkter: agendaPunkter.map(p => ({ 
          punkt: p.punkt,
          ferdig: p.ferdig,
          startTid: p.startTid,
          tidBrukt: p.tidBrukt
        }))
      });
      
      if (typeof moteInfo.aktivtPunkt === 'number') {
        console.log(`Setter aktivt punkt til: ${moteInfo.aktivtPunkt}`);
        setAktivtPunkt(moteInfo.aktivtPunkt);
      }
    }
  }, [moteInfo, moteInfo.id]);

  // Oppdater initialiseringen av agendaStatus for å inkludere alle nødvendige felter
  useEffect(() => {
    console.log('Agendapunkter før oppdatering:', agendaPunkter.map(p => ({
      punkt: p.punkt,
      ferdig: p.ferdig,
      startTid: p.startTid,
      tidBrukt: p.tidBrukt
    })));
    
    // Initialiser agendaStatus med verdier fra agendaPunkter
    setAgendaStatus(
      agendaPunkter.map(a => ({
        ...a,
        id: a.id || generateUniqueId(),
        kommentar: a.kommentar || '',
        startTid: a.startTid || null,
        ferdig: a.ferdig || false,
        tidBrukt: a.tidBrukt || null,
        vedlegg: repairPDFData(a.vedlegg) || [], // Reparer PDF-data i vedlegg
        erLast: a.erLast || false,
        notater: a.notater || '',
        beslutninger: a.beslutninger || '',
        aksjoner: a.aksjoner || []
      }))
    );
  }, [agendaPunkter]);

  // Funksjon for å reparere PDF-data i vedlegg
  const repairPDFData = (vedlegg) => {
    if (!vedlegg || !Array.isArray(vedlegg)) return vedlegg;
    
    return vedlegg.map(v => {
      // Hvis det er en PDF-fil, sjekk og reparer data URL
      if (v.mimeType === 'application/pdf' && v.data) {
        // Bruk vår hjelpefunksjon for å sikre riktig format
        return {
          ...v,
          data: ensureCorrectPDFFormat(v.data)
        };
      }
      return v;
    });
  };

  // Funksjon for å reparere PDF-data i alle agendapunkter og lagre til databasen
  const repairAllPDFData = async () => {
    console.log('Starter reparasjon av PDF-data');
    const oppdaterteAgendaPunkter = [...agendaStatus];
    let harEndringer = false;
    
    // Gå gjennom alle agendapunkter og vedlegg
    oppdaterteAgendaPunkter.forEach((punkt, punktIndex) => {
      if (punkt.vedlegg && Array.isArray(punkt.vedlegg)) {
        punkt.vedlegg.forEach((vedlegg, vedleggIndex) => {
          // Hvis det er en PDF, sjekk og reparer data URL
          if (vedlegg.mimeType === 'application/pdf' && vedlegg.data) {
            console.log(`Sjekker PDF-vedlegg ${vedleggIndex} i agendapunkt ${punktIndex}`);
            
            // Sjekk om dataURL har riktig prefix
            if (!vedlegg.data.startsWith('data:application/pdf;base64,')) {
              console.log(`Reparerer PDF-format for vedlegg ${vedleggIndex}`);
              
              // Bruk vår hjelpefunksjon for å sikre riktig format
              oppdaterteAgendaPunkter[punktIndex].vedlegg[vedleggIndex].data = 
                ensureCorrectPDFFormat(vedlegg.data);
              
              harEndringer = true;
            } else {
              console.log(`PDF-vedlegg ${vedleggIndex} har allerede riktig format`);
            }
          }
        });
      }
    });
    
    // Oppdater state og lagre endringer hvis det er gjort endringer
    if (harEndringer) {
      console.log('PDF-data reparert, oppdaterer state og lagrer til database');
      setAgendaStatus(oppdaterteAgendaPunkter);
      
      // Lagre endringene til databasen
      try {
        // Vent litt for å sikre at statet er oppdatert
        setTimeout(async () => {
          await handleSave(true); // true indikerer at dette er en automatisk lagring
          console.log('PDF-reparasjoner lagret til databasen');
        }, 500);
      } catch (error) {
        console.error('Kunne ikke lagre PDF-reparasjoner til databasen:', error);
      }
    } else {
      console.log('Ingen PDF-data trengte reparasjon');
    }
  };

  const [statusOppnadd, setStatusOppnadd] = useState(
    moteInfo.statusOppnadd || moteInfo.gjennomforingsStatus?.statusOppnadd || ''
  );
  const [nyDato, setNyDato] = useState(
    moteInfo.nyDato || moteInfo.gjennomforingsStatus?.nyDato || ''
  );
  const [statusInfo, setStatusInfo] = useState({
    fullfortePunkter: 0,
    gjenstaendePunkter: agendaPunkter.length,
    totaltAntallPunkter: agendaPunkter.length
  });

  const navigate = useNavigate();

  // Legg til state for toast
  const [showToast, setShowToast] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    deltakere: true,
    agenda: true,
    status: true
  });

  const [activeAksjonIndex, setActiveAksjonIndex] = useState(null);
  const [showAksjonDialog, setShowAksjonDialog] = useState(false);

  const [showQRCode, setShowQRCode] = useState(false);
  const [showSurveyResults, setShowSurveyResults] = useState(false);

  // Legg til state for å holde styr på åpne/lukkede agendapunkter
  const [openAgendaItems, setOpenAgendaItems] = useState({});
  
  // Lukket alle agendapunkter som standard
  useEffect(() => {
    if (agendaStatus.length > 0) {
      const initialState = agendaStatus.reduce((acc, punkt, index) => {
        acc[index] = false; // Alle agendapunkter er lukket som standard
        return acc;
      }, {});
      setOpenAgendaItems(initialState);
    }
  }, [agendaStatus.length]);

  // Funksjon for å åpne/lukke ett agendapunkt
  const toggleAgendaItem = (index) => {
    setOpenAgendaItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Funksjon for å åpne alle agendapunkter
  const openAllAgendaItems = () => {
    const allOpen = agendaStatus.reduce((acc, _, index) => {
      acc[index] = true;
      return acc;
    }, {});
    setOpenAgendaItems(allOpen);
  };

  // Funksjon for å lukke alle agendapunkter
  const closeAllAgendaItems = () => {
    const allClosed = agendaStatus.reduce((acc, _, index) => {
      acc[index] = false;
      return acc;
    }, {});
    setOpenAgendaItems(allClosed);
  };

  // Oppdater klokken hvert sekund
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Legg til useRef for debounce timer
  const debounceTimer = useRef(null);

  const syklusDeltakerStatus = (index, statusType) => {
    const oppdaterteDeltakere = [...deltakereStatus];
    const currentStatus = oppdaterteDeltakere[index][statusType];
    
    const nextStatus = {
      'none': 'green',
      'green': 'red',
      'red': 'none'
    };
    
    oppdaterteDeltakere[index][statusType] = nextStatus[currentStatus];
    setDeltakereStatus(oppdaterteDeltakere);
    
    // Oppdater hovedstate med ny status
    setDeltakere(oppdaterteDeltakere);
  };

  const handleAgendaKommentar = async (index, kommentar) => {
    // Oppdater lokal state umiddelbart
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[index] = {
      ...oppdaterteAgendaPunkter[index],
      kommentar: kommentar
    };
    setAgendaStatus(oppdaterteAgendaPunkter);
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer for saving
    debounceTimer.current = setTimeout(async () => {
      try {
        // Konsekvent bruk av tomme strenger i stedet for null
        const currentStatusOppnadd = statusOppnadd || '';
        const currentNyDato = nyDato || '';
        
        const gjennomforingsData = {
          id: moteInfo.id,
          tema: moteInfo.tema || '',
          dato: moteInfo.dato || '',
          startTid: moteInfo.startTid || '',
          innkallingsDato: moteInfo.innkallingsDato || '',
          eier: moteInfo.eier || '',
          fasilitator: moteInfo.fasilitator || '',
          referent: moteInfo.referent || '',
          hensikt: moteInfo.hensikt || '',
          mal: moteInfo.mal || '',
          erGjennomfort: true,
          gjennomforingsStatus: {
            statusOppnadd: currentStatusOppnadd,
            nyDato: currentNyDato,
            mal: moteInfo.mal || ''
          },
          statusInfo: {
            fullfortePunkter: oppdaterteAgendaPunkter.filter(p => p.ferdig).length,
            gjenstaendePunkter: oppdaterteAgendaPunkter.filter(p => !p.ferdig).length,
            totaltAntallPunkter: oppdaterteAgendaPunkter.length
          },
          deltakere: deltakereStatus.map(d => ({
            navn: d.navn || '',
            fagFunksjon: d.fagFunksjon || '',
            utfortStatus: d.utfortStatus || 'none',
            oppmoteStatus: d.oppmoteStatus || 'none',
            forberedelser: d.forberedelser || '',
            epost: d.epost || ''
          })),
          agendaPunkter: oppdaterteAgendaPunkter.map(punkt => ({
            id: punkt.id || Math.random().toString(36).substring(2, 15),
            punkt: punkt.punkt || '',
            ansvarlig: punkt.ansvarlig || '',
            varighet: punkt.varighet || 15,
            startTid: punkt.startTid || null,
            ferdig: punkt.ferdig || false,
            tidBrukt: punkt.tidBrukt || null,
            kommentar: punkt.kommentar || '',  // Sikre at kommentar er inkludert
            notater: punkt.notater || '',
            beslutninger: punkt.beslutninger || '',
            vedlegg: Array.isArray(punkt.vedlegg) ? punkt.vedlegg.map(v => ({
              type: v.type || 'image',
              data: v.data || '',
              timestamp: v.timestamp || new Date().toISOString(),
              navn: v.navn || 'Vedlegg',
              id: v.id || Math.random().toString(36).substring(2, 15)
            })) : [],
            aksjoner: Array.isArray(punkt.aksjoner) ? punkt.aksjoner.map(a => ({
              ansvarlig: a.ansvarlig || '',
              beskrivelse: a.beskrivelse || '',
              frist: a.frist || '',
              opprettet: a.opprettet || new Date().toISOString(),
              status: a.status || 'åpen'
            })) : [],
            erLast: punkt.erLast || false
          }))
        };
        
        const success = await lagreMote(true, gjennomforingsData);
        if (!success) {
          console.error('Kunne ikke lagre kommentar');
        }
      } catch (error) {
        console.error('Feil ved lagring av kommentar:', error);
      }
    }, 1000);
  };

  // Cleanup timer når komponenten unmountes
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const startAgendaPunkt = (index) => {
    if (aktivtPunkt !== null) return; // Hvis det allerede er et aktivt punkt, ikke gjør noe
    
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[index].startTid = new Date().toISOString();
    setAgendaStatus(oppdaterteAgendaPunkter);
    setAktivtPunkt(index);
  };

  const ferdigstillAgendaPunkt = (index) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    const punkt = oppdaterteAgendaPunkter[index];
    
    const tidBrukt = Math.round((new Date() - new Date(punkt.startTid)) / 60000);
    punkt.tidBrukt = tidBrukt;
    punkt.ferdig = true;
    
    setAgendaStatus(oppdaterteAgendaPunkter);
    setAktivtPunkt(null); // Fjern aktivt punkt
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('no-NO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getPlannedEndTime = (startTime, duration) => {
    const time = new Date(startTime);
    time.setMinutes(time.getMinutes() + duration);
    return formatTime(time);
  };

  // Funksjon for å beregne planlagt starttid for hvert punkt
  const getPlanlagtStartTid = (index) => {
    let tid = new Date(`2000-01-01T${moteInfo.startTid}`);
    for (let i = 0; i < index; i++) {
      tid.setMinutes(tid.getMinutes() + agendaStatus[i].varighet);
    }
    return tid.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
  };

  // Oppdater handlePasteImage funksjonen for bedre feilhåndtering
  const handlePasteImage = (index, event) => {
    try {
      console.log("handlePasteImage kjørt for index:", index);
      
      if (!event || !event.clipboardData) {
        console.error("Ugyldig event eller manglende clipboardData");
        return;
      }
      
    const items = event.clipboardData.items;
      console.log("Antall items i clipboard:", items.length);
      
      if (!items || items.length === 0) {
        console.log("Ingen elementer i utklippstavlen");
        return;
      }
      
    for (let i = 0; i < items.length; i++) {
        console.log("Clipboard item type:", items[i].type);
        
      if (items[i].type.indexOf('image') !== -1) {
          console.log("Bildeinnhold oppdaget i utklippstavlen");
          
          try {
        const blob = items[i].getAsFile();
            if (!blob) {
              console.error("Kunne ikke hente fil fra utklippstavlen");
              continue;
            }
            
        const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                console.log("FileReader lastet inn bildedata");
                if (!e.target || !e.target.result) {
                  console.error("Manglende result i FileReader event");
                  return;
                }
                
                // Komprimere bildet
                let bildeData;
                try {
                  bildeData = await compressImage(e.target.result);
                  console.log("Bilde komprimert vellykket");
                } catch (err) {
                  console.error("Feil ved komprimering, bruker originalt bilde:", err);
                  bildeData = e.target.result; // Bruk ukomprimert bilde ved feil
                }

                // Oppdater agendapunktet
          const oppdaterteAgendaPunkter = [...agendaStatus];
          oppdaterteAgendaPunkter[index].vedlegg.push({
            type: 'image',
                  data: bildeData,
                  timestamp: new Date().toISOString(),
                  navn: `Skjermbilde ${oppdaterteAgendaPunkter[index].vedlegg.length + 1}`,
                  id: Math.random().toString(36).substring(2, 15),
                  strokes: [] // Initialiser med et tomt strokes-array
                });
                console.log("Bilde lagt til i vedlegg for agendapunkt", index);
          setAgendaStatus(oppdaterteAgendaPunkter);
              } catch (error) {
                console.error("Feil i onload-handler:", error);
              }
        };
            
            reader.onerror = (error) => {
              console.error("Feil ved lesing av bildedata:", error);
            };
            
        reader.readAsDataURL(blob);
        event.preventDefault();
            return; // Avslutt etter å ha funnet bildet
          } catch (error) {
            console.error("Feil ved håndtering av bildedata:", error);
      }
        }
      }
      console.log("Ingen bilder funnet i utklippstavlen");
    } catch (error) {
      console.error("Uventet feil i handlePasteImage:", error);
    }
  };

  const slettVedlegg = (agendaIndex, vedleggIndex) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[agendaIndex].vedlegg.splice(vedleggIndex, 1);
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

  // Legg til state for aktivt vedlegg og tegning
  const [activeAttachment, setActiveAttachment] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showDrawingEditor, setShowDrawingEditor] = useState(false);

  // Legg til state for å spore PDF-reparasjon
  const [isPDFRepairing, setIsPDFRepairing] = useState(false);
  const [toastMessage, setToastMessage] = useState('Møtet er lagret!');

  // Oppdater visVedlegg funksjonen for bedre PDF-håndtering
  const visVedlegg = (vedlegg, agendaIndex, vedleggIndex) => {
    // For PDF-vedlegg - gjør ekstra sjekk og reparasjon
    if (vedlegg.mimeType === 'application/pdf' && vedlegg.data) {
      console.log('Åpner PDF-vedlegg:', vedlegg.navn);
      
      // Sjekk om dataURL har riktig prefix
      if (!vedlegg.data.startsWith('data:application/pdf;base64,')) {
        console.log('PDF-data trenger reparasjon:', vedlegg.navn);
        
        try {
          // Indiker at PDF-reparasjon pågår
          setIsPDFRepairing(true);
          
          // Hvis ikke, fjern eventuelt eksisterende prefix og legg til riktig prefix
          const base64Data = vedlegg.data.includes('base64,') 
            ? vedlegg.data.split('base64,')[1] 
            : vedlegg.data;
          
          // Lag en ny data URL med riktig format
          const reparertData = `data:application/pdf;base64,${base64Data}`;
          
          // Oppdater vedlegget i agendaStatus
          const oppdaterteAgendaPunkter = [...agendaStatus];
          if (oppdaterteAgendaPunkter[agendaIndex] && 
              oppdaterteAgendaPunkter[agendaIndex].vedlegg && 
              oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex]) {
            
            // Oppdater data i agendaStatus-kopien
            oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].data = reparertData;
            
            // Oppdater state
            setAgendaStatus(oppdaterteAgendaPunkter);
            
            // Opprett en modifisert kopi av vedlegget for visning
            const reparertVedlegg = {
              ...vedlegg,
              data: reparertData,
              agendaIndex,
              vedleggIndex
            };
            
            // Sett vedlegget som aktivt
            setActiveAttachment(reparertVedlegg);
            
            // Lagre endringen til databasen
            setTimeout(async () => {
              try {
                await handleSave(true);
                console.log('Reparert PDF-data lagret til databasen');
                setToastMessage('PDF-visning forbedret og lagret');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              } catch (error) {
                console.error('Kunne ikke lagre reparert PDF-data:', error);
              } finally {
                setIsPDFRepairing(false);
              }
            }, 500);
          } else {
            console.error('Kunne ikke finne vedlegget for reparasjon');
            setIsPDFRepairing(false);
            setActiveAttachment({...vedlegg, agendaIndex, vedleggIndex});
          }
        } catch (error) {
          console.error('Feil ved reparasjon av PDF-data:', error);
          setIsPDFRepairing(false);
          setActiveAttachment({...vedlegg, agendaIndex, vedleggIndex});
        }
      } else {
        // Hvis formatet allerede er riktig
        setActiveAttachment({...vedlegg, agendaIndex, vedleggIndex});
      }
    } else {
      // For andre typer vedlegg
      setActiveAttachment({...vedlegg, agendaIndex, vedleggIndex});
    }
    
    setShowAttachmentModal(true);
    setShowDrawingEditor(false);
  };

  // Funksjon for å lukke modal
  const closeAttachmentModal = () => {
    setShowAttachmentModal(false);
    setShowDrawingEditor(false);
    setActiveAttachment(null);
  };

  // Funksjon for å åpne tegneredigereren
  const openDrawingEditor = () => {
    setShowDrawingEditor(true);
  };

  // Oppdater saveDrawing funksjonen
  const saveDrawing = async (dataURL, strokes) => {
    if (!activeAttachment) return;
    
    // Komprimer tegningen før lagring
    const komprimertTegning = await compressImage(dataURL);
    
    const oppdaterteAgendaPunkter = [...agendaStatus];
    const { agendaIndex, vedleggIndex } = activeAttachment;
    
    // Oppdater vedlegget med ny data og strokes
    oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].data = komprimertTegning;
    oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].strokes = strokes;
    
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

  // CSS for å skjule scrollbar på selve body når modal er åpen
  useEffect(() => {
    if (showAttachmentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAttachmentModal]);

  // Legg til feilmelding state
  const [feilmelding, setFeilmelding] = useState('');
  const [showFeilmelding, setShowFeilmelding] = useState(false);

  // Oppdater handleSave for å håndtere feilmeldinger
  const handleSave = async (isAutomaticSave = false) => {
    try {
      // Bare logg hvis dette ikke er en automatisk lagring
      if (!isAutomaticSave) {
        console.log('Lagrer manuelt...');
      }
      
      // Nullstill forrige feil
      setFeilmelding('');
      setShowFeilmelding(false);
      
      // Logger agendastatus før lagring (for debugging)
      console.log('Status før lagring:', agendaStatus);
      
      // Oppdater gjennomføringsdata med gjeldende status
      const gjennomforingsData = {
        gjennomforingsStatus: {
          statusOppnadd,
          nyDato,
          aktivtPunkt, // Lagrer også aktivt punkt
          deltakere: deltakereStatus.map(d => ({
            ...d,
            epost: d.epost || ''
          }))
        },
        agendaPunkter: agendaStatus.map(punkt => ({
          id: punkt.id || generateUniqueId(),
          punkt: punkt.punkt || '',
          ansvarlig: punkt.ansvarlig || '',
          varighet: punkt.varighet || 15,
          startTid: punkt.startTid,
          ferdig: punkt.ferdig,
          tidBrukt: punkt.tidBrukt,
          kommentar: punkt.kommentar || '',
          notater: punkt.notater || '',
          beslutninger: punkt.beslutninger || '',
          vedlegg: Array.isArray(punkt.vedlegg) ? punkt.vedlegg.map(v => ({
            id: v.id || generateUniqueId(),
            type: v.type || 'image',
            data: v.data || '',
            navn: v.navn || 'Vedlegg',
            mimeType: v.mimeType || '',
            lastModified: v.lastModified || Date.now(),
            strokes: v.strokes || []
          })) : [],
          aksjoner: Array.isArray(punkt.aksjoner) ? punkt.aksjoner.map(a => ({
            ansvarlig: a.ansvarlig || '',
            beskrivelse: a.beskrivelse || '',
            frist: a.frist || '',
            opprettet: a.opprettet || new Date().toISOString(),
            status: a.status || 'åpen'
          })) : [],
          erLast: punkt.erLast || false
        }))
      };

      const success = await lagreMote(true, gjennomforingsData);
      
      if (success) {
        if (!isAutomaticSave) {
          // Bare vis melding for manuelle lagringer
          setToastMessage('Møtet er lagret!');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      } else {
        setFeilmelding('Kunne ikke lagre møtet. Prøv igjen senere.');
        setShowFeilmelding(true);
        setTimeout(() => setShowFeilmelding(false), 5000);
      }
    } catch (error) {
      console.error('Feil ved lagring:', error);
      setFeilmelding('En feil oppstod ved lagring. Prøv igjen senere.');
      setShowFeilmelding(true);
      setTimeout(() => setShowFeilmelding(false), 5000);
    }
  };

  // Oppdater harUlagredeEndringer-funksjonen
  const harUlagredeEndringer = () => {
    // Sjekk om det er endringer i deltakerstatus
    const harDeltakerEndringer = deltakereStatus.some((d, index) => {
      const original = deltakere[index];
      return d.utfortStatus !== (original.utfortStatus || 'none') || 
             d.oppmoteStatus !== (original.oppmoteStatus || 'none');
    });

    // Sjekk om det er endringer i agendapunkter
    const harAgendaEndringer = agendaStatus.some((a, index) => {
      const original = agendaPunkter[index];
      return a.kommentar !== (original.kommentar || '') ||
             (a.vedlegg?.length || 0) !== (original.vedlegg?.length || 0) ||
             a.ferdig !== (original.ferdig || false) ||
             a.startTid !== (original.startTid || null) ||
             a.tidBrukt !== (original.tidBrukt || null) ||
             a.notater !== (original.notater || '') ||
             a.beslutninger !== (original.beslutninger || '') ||
             (a.aksjoner?.length || 0) !== (original.aksjoner?.length || 0) ||
             a.erLast !== (original.erLast || false);
    });

    // Sjekk om det er endringer i møtestatus
    const originalStatusOppnadd = moteInfo.gjennomforingsStatus?.statusOppnadd || '';
    const originalNyDato = moteInfo.gjennomforingsStatus?.nyDato || '';
    
    const currentStatusOppnadd = statusOppnadd || '';
    const currentNyDato = nyDato || '';
    
    const harStatusEndringer = 
      currentStatusOppnadd !== originalStatusOppnadd || 
      currentNyDato !== originalNyDato;

    console.log('Status sammenligning:', { 
      original: { status: originalStatusOppnadd, dato: originalNyDato },
      current: { status: currentStatusOppnadd, dato: currentNyDato },
      harEndringer: harStatusEndringer
    });

    const harEndringer = harDeltakerEndringer || harAgendaEndringer || harStatusEndringer;
    console.log('Har endringer:', { 
      deltaker: harDeltakerEndringer, 
      agenda: harAgendaEndringer, 
      status: harStatusEndringer 
    });

    return harEndringer;
  };

  // Oppdater handleBack-funksjonen
  const handleBack = async () => {
    try {
      // Hvis møtet er låst (møtereferat), naviger direkte tilbake
      if (isLocked) {
        navigate('/');
        setVisMoteSkjema(false);
        setVisLagredeMoter(true);  // Sørg for at lagrede møter vises
        resetMote();
        return;
      }

      // Ellers, sjekk om det er endringer som må lagres
      if (harUlagredeEndringer()) {
        setShowConfirmDialog(true);
        return;
      }

      // Hvis ingen endringer, bare naviger tilbake
      navigate('/');
      setVisMoteSkjema(false);
      setVisLagredeMoter(true);  // Sørg for at lagrede møter vises
      resetMote();
    } catch (error) {
      console.error('Feil ved tilbakenavigering:', error);
      alert('Kunne ikke navigere tilbake. Vennligst prøv igjen.');
    }
  };

  // Oppdater handleConfirmSave-funksjonen
  const handleConfirmSave = async () => {
    try {
      console.log('Starter lagring og navigering...');
      const success = await handleSave();
      
      if (success) {
        console.log('Lagring vellykket, venter før navigering...');
        // Vent litt så brukeren ser toast-meldingen
        setTimeout(() => {
          console.log('Navigerer tilbake...');
          setShowConfirmDialog(false);
          navigerTilbake();
        }, 800); // Øk tiden litt for å sikre at toast vises
      } else {
        console.log('Lagring feilet');
        setShowConfirmDialog(false);
        alert('Kunne ikke lagre endringene. Vennligst prøv igjen.');
      }
    } catch (error) {
      console.error('Feil ved lagring og navigering:', error);
      setShowConfirmDialog(false);
      alert('Kunne ikke lagre endringene: ' + error.message);
    }
  };

  // Oppdater navigerTilbake-funksjonen
  const navigerTilbake = () => {
    // Kun oppdater states hvis det faktisk er endringer
    if (harUlagredeEndringer()) {
    setDeltakere([...deltakereStatus]);
    setAgendaPunkter([...agendaStatus]);
    }
    
    // Reset og cleanup
    setVisMoteSkjema(false);
    setVisLagredeMoter(true);  // Sørg for at lagrede møter vises
    resetMote();
    
    // Naviger til hovedsiden
    navigate('/');
  };

  const toggleLock = async () => {
    try {
    if (!isLocked) {
        await handleSave();  // Vent på lagring før låsing
    }
    setIsLocked(!isLocked);
    } catch (error) {
      console.error('Feil ved låsing:', error);
      alert('Kunne ikke låse møtet. Vennligst prøv igjen.');
    }
  };

  // Initialiser status når komponenten lastes
  useEffect(() => {
    setDeltakereStatus(
      deltakere.map(d => ({
        ...d,
        utfortStatus: d.utfortStatus || 'none',
        oppmoteStatus: d.oppmoteStatus || 'none'
      }))
    );
  }, [deltakere]);

  // Oppdater status når agendapunkter endres
  useEffect(() => {
    const fullforte = agendaStatus.filter(punkt => punkt.ferdig).length;
    setStatusInfo({
      fullfortePunkter: fullforte,
      gjenstaendePunkter: agendaStatus.length - fullforte,
      totaltAntallPunkter: agendaStatus.length
    });
  }, [agendaStatus]);

  // Håndter låsing av agendapunkter
  const toggleLas = (index) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[index] = {
      ...oppdaterteAgendaPunkter[index],
      erLast: !oppdaterteAgendaPunkter[index].erLast
    };
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

  // Oppdater et agendapunkt
  const oppdaterAgendaPunkt = (index, endringer) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[index] = {
      ...oppdaterteAgendaPunkter[index],
      ...endringer
    };
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

  // Legg til en useEffect for å oppdatere status når moteInfo endres
  useEffect(() => {
    if (moteInfo.gjennomforingsStatus) {
      const savedStatusOppnadd = moteInfo.gjennomforingsStatus.statusOppnadd || '';
      const savedNyDato = moteInfo.gjennomforingsStatus.nyDato || '';
      
      console.log('Oppdaterer status fra moteInfo:', { 
        statusOppnadd: savedStatusOppnadd, 
        nyDato: savedNyDato 
      });
      
      setStatusOppnadd(savedStatusOppnadd);
      setNyDato(savedNyDato);
    }
  }, [moteInfo]);

  // Legg til en useEffect som automatisk låser opp når komponenten lastes
  useEffect(() => {
    // Hvis feltene er låst, lås dem opp automatisk
    if (isLocked) {
      console.log('Låser opp feltene automatisk ved oppstart');
      // Kort forsinkelse for å sikre at komponenten er ferdig lastet
      const timer = setTimeout(() => {
        setIsLocked(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Legg til funksjon for å håndtere nye aksjoner
  const handleAddAksjon = (index) => {
    setActiveAksjonIndex(index);
    setShowAksjonDialog(true);
  };

  const handleSaveAksjon = (nyAksjon) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    if (!oppdaterteAgendaPunkter[activeAksjonIndex].aksjoner) {
      oppdaterteAgendaPunkter[activeAksjonIndex].aksjoner = [];
    }
    oppdaterteAgendaPunkter[activeAksjonIndex].aksjoner.push({
      ...nyAksjon,
      opprettet: new Date().toISOString(),
      status: 'åpen'
    });
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

  const handleDeleteAksjon = (agendaIndex, aksjonIndex) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[agendaIndex].aksjoner.splice(aksjonIndex, 1);
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

  // Legg til rename-funksjon
  const handleRenameVedlegg = (agendaIndex, vedleggIndex, nyttNavn) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].navn = nyttNavn;
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

  const handleShowQRCode = () => {
    setShowQRCode(true);
  };

  const handleShowSurveyResults = () => {
    setShowSurveyResults(true);
  };

  // Hjelpefunksjon for å konvertere PDF-data til riktig format
  const ensureCorrectPDFFormat = (pdfData) => {
    if (!pdfData) return pdfData;
    
    // Hvis allerede riktig format, returner uendret
    if (pdfData.startsWith('data:application/pdf;base64,')) {
      return pdfData;
    }
    
    try {
      // Fjern eventuelt eksisterende prefix og bruk kun base64-delen
      const base64Data = pdfData.includes('base64,') 
        ? pdfData.split('base64,')[1] 
        : pdfData;
      
      // Legg til riktig prefix
      return `data:application/pdf;base64,${base64Data}`;
    } catch (error) {
      console.error('Feil ved konvertering av PDF-format:', error);
      return pdfData; // Returner original ved feil
    }
  };

  // Oppdater handleFileUpload funksjonen for bedre PDF-håndtering
  const handleFileUpload = (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vi støtter bildefiler og PDF-dokumenter
    const isSupportedFileType = file.type.startsWith('image/') || file.type === 'application/pdf' || 
                             file.type === 'application/msword' ||
                             file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                             file.type === 'application/vnd.ms-excel' ||
                             file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                             file.type === 'application/vnd.ms-powerpoint' ||
                             file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                             file.type === 'text/plain';

    if (!isSupportedFileType) {
      alert('Filtypen støttes ikke. Vennligst last opp bilder, PDF-filer, Office-dokumenter, eller tekstfiler.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      let fileData = e.target.result;

      // Komprimer bildet hvis det er et bilde
      if (file.type.startsWith('image/')) {
        fileData = await compressImage(fileData);
      }
      
      // For PDF-filer, sikre at data URL har riktig format
      if (file.type === 'application/pdf') {
        fileData = ensureCorrectPDFFormat(fileData);
        console.log('PDF-fil lastet opp og formatert med MIME-type:', file.type);
      }

      const oppdaterteAgendaPunkter = [...agendaStatus];

      // Hvis vedlegg-arrayet ikke finnes, initialiser det
      if (!oppdaterteAgendaPunkter[index].vedlegg) {
        oppdaterteAgendaPunkter[index].vedlegg = [];
      }

      // Legger til det nye vedlegget
      oppdaterteAgendaPunkter[index].vedlegg.push({
        type: file.type.startsWith('image/') ? 'image' : 'document',
        navn: file.name,
        data: fileData,
        mimeType: file.type,
        lastModified: file.lastModified || Date.now() // Lagre lastModified for å spore endringer
      });
      
      setAgendaStatus(oppdaterteAgendaPunkter);
      
      // Lagre endringene umiddelbart for PDF-filer for å sikre korrekt visning senere
      if (file.type === 'application/pdf') {
        try {
          setTimeout(async () => {
            await handleSave(true);
            console.log('PDF-fil ble lagret til databasen med riktig format');
          }, 500);
        } catch (error) {
          console.error('Kunne ikke lagre PDF-fil til databasen:', error);
        }
      }
    };

    // For alle filtyper, bruk readAsDataURL
    reader.readAsDataURL(file);
  };

  // Kjør PDF-reparasjon når komponenten lastes og når agendaStatus endres
  useEffect(() => {
    // Ikke kjør på første rendering eller hvis agendaStatus er tom
    if (!agendaStatus || agendaStatus.length === 0) return;
    
    console.log('AgendaStatus oppdatert, sjekker om PDF-filer trenger reparasjon');
    
    // Vent litt for å sikre at alt er initialisert
    const timer = setTimeout(() => {
      repairAllPDFData();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [agendaStatus.length]); // Kjør når antall agendapunkter endres

  // Også kjør på første rendering
  useEffect(() => {
    console.log('MoteGjennomforing montert, planlegger PDF-reparasjon');
    
    // Vent litt lengre på første rendering for å sikre at alt er lastet
    const timer = setTimeout(() => {
      repairAllPDFData();
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-100 py-4 sm:py-8 ${isLocked ? 'opacity-75' : ''}`}>
      {showToast && (
        <Toast
          message={toastMessage || "Møtet er lagret!"}
          onClose={() => setShowToast(false)}
        />
      )}
      
      {/* Feilmelding */}
      {showFeilmelding && feilmelding && (
        <div className="fixed top-20 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md max-w-md">
          <div className="flex items-start">
            <div className="py-1">
              <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M2.93 17.07A10 10 0 1117.07 2.93 10 10 0 012.93 17.07zM11.5 11.5v-6h-3v6h3zm0 4v-2h-3v2h3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Feil</p>
              <p className="text-sm">{feilmelding}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setShowFeilmelding(false)}
                className="text-red-700 hover:text-red-900"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showQRCode && (
        <QRCodeModal
          moteId={moteInfo.id}
          onClose={() => setShowQRCode(false)}
        />
      )}
      
      {showSurveyResults && (
        <SurveyResults
          passedMoteId={moteInfo.id}
          onClose={() => setShowSurveyResults(false)}
        />
      )}
      
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          navigerTilbake(); // Navigerer tilbake uten å lagre
        }}
        onConfirm={handleConfirmSave}
        title="Ulagrede endringer"
        message="Det ser ut som du har ulagrede endringer. Ønsker du å lagre endringene før du går tilbake til agendaen?"
      />

      {/* Vedlegg-modal */}
      {showAttachmentModal && activeAttachment && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-[90vw] max-h-[90vh] flex flex-col w-auto" style={{ minWidth: '50vw' }}>
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">{activeAttachment.navn}</h3>
              </div>
              <div className="flex items-center space-x-2">
                {activeAttachment.type === 'image' && !showDrawingEditor && (
                  <button
                    onClick={openDrawingEditor}
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                    title="Tegn på bildet"
                  >
                    <Pencil size={20} />
                  </button>
                )}
                <a
                  href={activeAttachment.data}
                  download={activeAttachment.navn}
                  className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                  title="Last ned"
                >
                  <Download size={20} />
                </a>
                <button
                  onClick={closeAttachmentModal}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="overflow-auto p-0 flex-grow flex items-center justify-center bg-gray-100" style={{ maxHeight: 'calc(90vh - 130px)' }}>
              {showDrawingEditor && activeAttachment.type === 'image' ? (
                <DrawingEditor
                  imageData={activeAttachment.data}
                  onSave={saveDrawing}
                  onClose={() => setShowDrawingEditor(false)}
                  initialStrokes={activeAttachment.strokes || []}
                />
              ) : (
                <div className="p-0">
                  {activeAttachment.type === 'image' ? (
                    <div className="overflow-auto max-h-[70vh] max-w-full flex items-center justify-center">
                      <img
                        src={activeAttachment.data}
                        alt={activeAttachment.navn}
                        className="max-w-full h-auto object-contain"
                        style={{ maxHeight: '70vh', width: 'auto', objectFit: 'contain' }}
                      />
                    </div>
                  ) : activeAttachment.mimeType === 'application/pdf' ? (
                    <div className="w-full h-[80vh] flex flex-col">
                      {/* Viser loading hvis PDF-reparasjon pågår */}
                      {isPDFRepairing ? (
                        <div className="p-8 flex flex-col items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                          <p className="text-gray-700 mb-2">Forbedrer PDF-visningen...</p>
                          <p className="text-gray-500 text-sm">Dette kan ta et øyeblikk</p>
                        </div>
                      ) : (
                        /* Sjekk om PDF-dataen har riktig format */
                        activeAttachment.data && activeAttachment.data.startsWith('data:application/pdf;base64,') ? (
                          <>
                            <iframe
                              src={activeAttachment.data}
                              className="w-full h-full border-0"
                              title={activeAttachment.navn}
                              onError={(e) => {
                                console.error('Feil ved visning av PDF i iframe:', e);
                              }}
                            ></iframe>
                            <div className="bg-gray-50 p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
                              Tips: Hvis PDF-visning er treg, kan du laste ned filen og åpne den lokalt.
                            </div>
                          </>
                        ) : (
                          <div className="p-8 flex flex-col items-center justify-center h-full">
                            <FileText size={64} className="text-gray-400 mb-4" />
                            <p className="mb-4 text-gray-700">PDF-filen kan ikke forhåndsvises i dette formatet.</p>
                            <a
                              href={activeAttachment.data}
                              download={activeAttachment.navn}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                            >
                              <Download size={16} />
                              Last ned PDF-filen
                            </a>
                            <button 
                              onClick={() => {
                                visVedlegg(activeAttachment, activeAttachment.agendaIndex, activeAttachment.vedleggIndex);
                              }}
                              className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-1 underline"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Prøv på nytt
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center">
                      <FileText size={64} className="text-gray-400 mb-4" />
                      <p className="mb-4 text-gray-700">Dette dokumentet kan ikke forhåndsvises.</p>
                      <a
                        href={activeAttachment.data}
                        download={activeAttachment.navn}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      >
                        <Download size={16} />
                        Last ned fil
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Møtegjennomføring</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShowQRCode}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-gray-700 text-xs sm:text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
              title="Del spørreundersøkelse"
            >
              <QrCode size={16} />
              <span className="hidden sm:inline">Del spørreundersøkelse</span>
            </button>
            <button
              onClick={handleShowSurveyResults}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-gray-700 text-xs sm:text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
              title="Se evaluering"
            >
              <BarChart size={16} />
              <span className="hidden sm:inline">Se evaluering</span>
            </button>
          <button
            onClick={toggleLock}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-gray-900 transition-colors"
            title={isLocked ? "Lås opp møtereferatet" : "Lås møtereferatet"}
          >
              {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
              <span className="hidden sm:inline">{isLocked ? "Lås opp" : "Lås"}</span>
          </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={18} />
            <span className="text-sm sm:text-base">Tilbake til møteagenda</span>
          </button>

          <div className="flex gap-2 sm:gap-3">
            <MoteReferatPrintView 
              moteInfo={moteInfo}
              deltakere={deltakereStatus}
              agendaPunkter={agendaStatus}
              buttonClassName="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-white text-gray-700 text-xs sm:text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <FileDown size={14} />
              <span className="hidden xs:inline">Eksporter</span> 
              <span className="hidden sm:inline">møtereferat</span>
            </MoteReferatPrintView>
          </div>
        </div>

        {/* Klokke og møteinfo */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="text-center mb-2 sm:mb-4">
            <div className="text-4xl sm:text-6xl font-bold mb-2">
              {currentTime.toLocaleTimeString('no-NO', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold mb-1 sm:mb-2">{moteInfo.tema}</h1>
            <div className="text-base sm:text-lg text-gray-600">
              {new Date(moteInfo.dato).toLocaleDateString('no-NO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Deltakerliste */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 p-3 sm:p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('deltakere')}
          >
            <h2 className="text-lg sm:text-xl font-semibold">Deltakere</h2>
            {expandedSections.deltakere ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSections.deltakere && (
            <div className="mt-3 sm:mt-4 overflow-x-auto">
              <div className="min-w-full border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-4 bg-gray-50 border-b text-gray-800">
                  <div className="col-span-4 sm:col-span-4 text-sm sm:text-base font-bold">Deltaker</div>
                  <div className="col-span-4 sm:col-span-4 text-sm sm:text-base font-bold">Forberedelser</div>
                  <div className="col-span-2 sm:col-span-2 text-xs sm:text-sm font-bold text-center">Utført</div>
                  <div className="col-span-2 sm:col-span-2 text-xs sm:text-sm font-bold text-center">Oppmøte</div>
            </div>
            <div>
              {deltakereStatus.map((deltaker, index) => (
                <div 
                  key={index} 
                      className={`grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-4 items-center border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                      <div className="col-span-4 sm:col-span-4 flex flex-col">
                        <span className="text-sm sm:text-base font-bold text-gray-800 truncate">{deltaker.navn}</span>
                        <span className="text-xs sm:text-sm text-gray-500 truncate">{deltaker.fagFunksjon}</span>
                  </div>
                      <div className="col-span-4 sm:col-span-4 text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {deltaker.forberedelser}
                  </div>
                      <div className="col-span-2 sm:col-span-2 flex justify-center">
                    <button
                      onClick={() => !isLocked && syklusDeltakerStatus(index, 'utfortStatus')}
                      disabled={isLocked}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-colors shadow-sm hover:shadow ${
                        isLocked ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        deltaker.utfortStatus === 'green' ? 'bg-green-500 border-green-500 hover:bg-green-600' :
                        deltaker.utfortStatus === 'red' ? 'bg-red-500 border-red-500 hover:bg-red-600' :
                        'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    />
                  </div>
                      <div className="col-span-2 sm:col-span-2 flex justify-center">
                    <button
                      onClick={() => !isLocked && syklusDeltakerStatus(index, 'oppmoteStatus')}
                      disabled={isLocked}
                          className={`w-5 h-5 sm:w-6 sm:w-6 rounded-full border-2 transition-colors shadow-sm hover:shadow ${
                        isLocked ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        deltaker.oppmoteStatus === 'green' ? 'bg-green-500 border-green-500 hover:bg-green-600' :
                        deltaker.oppmoteStatus === 'red' ? 'bg-red-500 border-red-500 hover:bg-red-600' :
                        'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
            </div>
          )}
        </div>

        {/* Agenda */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 p-3 sm:p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('agenda')}
          >
            <h2 className="text-lg sm:text-xl font-semibold">Agenda</h2>
            {expandedSections.agenda ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSections.agenda && (
            <div className="mt-3 sm:mt-4">
              {/* Legg til knapper for å åpne/lukke alle agendapunkter */}
              <div className="mb-4 flex justify-end gap-2">
                <button
                  onClick={openAllAgendaItems}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  Åpne alle
                </button>
                <button
                  onClick={closeAllAgendaItems}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  Lukk alle
                </button>
            </div>

            <div className="divide-y">
              {agendaStatus.map((punkt, index) => (
                  <div
                    key={punkt.id || index}
                    className="bg-white rounded-xl shadow-sm overflow-hidden mb-3 sm:mb-6 transition-all duration-200 hover:shadow-md border border-gray-100"
                  >
                    {/* Kombinert header med all informasjon */}
                    <div className="px-3 sm:px-4 py-3 sm:py-4 bg-gray-100/90">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                        {/* Venstre side: Tid og agendapunkt */}
                        <div className="flex items-center gap-3 sm:gap-8 flex-1">
                    {/* Planlagt tid */}
                          <div className="flex flex-col items-center min-w-[60px] sm:min-w-[100px] pl-0 sm:pl-2">
                            <span className="text-base sm:text-xl font-medium text-gray-900">{getPlanlagtStartTid(index)}</span>
                            <span className="text-xs sm:text-sm text-gray-500">({punkt.varighet} min)</span>
                      </div>

                          {/* Agendapunkt og ansvarlig */}
                          <div className="flex-1">
                            <h3 className="text-base sm:text-xl font-medium text-gray-900">{punkt.punkt}</h3>
                            <div className="text-xs sm:text-sm text-gray-600">
                              Ansvarlig: {punkt.ansvarlig}
                            </div>
                          </div>
                    </div>

                        {/* Høyre side: Faktisk tid og handlingsknapper */}
                        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-6 mt-2 sm:mt-0">
                          {aktivtPunkt === index ? (
                            <>
                              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-100 text-blue-700">
                                <Clock size={16} />
                                <span className="text-sm font-medium">
                                  {formatTime(currentTime)}
                                </span>
                          </div>
                              <button
                                onClick={() => ferdigstillAgendaPunkt(index)}
                                disabled={isLocked}
                                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full transition-all duration-200 ${
                                  isLocked
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-sm'
                                }`}
                              >
                                <Check size={16} />
                                <span className="text-sm sm:text-base font-medium">Ferdig</span>
                              </button>
                            </>
                          ) : punkt.ferdig ? (
                            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-100 text-green-700">
                              <Check size={16} />
                              <span className="text-sm font-medium">
                              {punkt.tidBrukt} min
                              </span>
                            </div>
                          ) : aktivtPunkt === null ? (
                            <button
                              onClick={() => startAgendaPunkt(index)}
                              disabled={isLocked}
                              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full transition-all duration-200 ${
                                isLocked
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm'
                              }`}
                            >
                              <Clock size={16} />
                              <span className="text-sm sm:text-base font-medium">Start</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 text-gray-700">
                              <Clock size={16} />
                              <span className="text-sm font-medium">Venter...</span>
                    </div>
                          )}
                          
                          {/* Legg til trekkspill-knapp */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Forhindre at klikket trigger andre funksjoner
                              toggleAgendaItem(index);
                            }}
                            className="flex items-center justify-center p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                          >
                            {openAgendaItems[index] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Agenda-innhold når åpent */}
                    {openAgendaItems[index] && (
                      <>
                        {/* Kommentar og vedlegg */}
                        <div className="p-3 sm:p-4 border-t border-gray-100 space-y-6">
                          {/* Kommentar-seksjon - ØVERST */}
                          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-sm sm:text-base font-medium text-gray-700">Kommentarer</h4>
                              <div className="flex items-center gap-2">
                                {!isLocked && (
                                  <label className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm cursor-pointer mr-2">
                                    <Paperclip size={16} />
                                    <span>Last opp fil</span>
                                    <input 
                                      type="file" 
                                      className="hidden"
                                      onChange={(e) => handleFileUpload(index, e)}
                                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                    />
                                  </label>
                                )}
                                
                                {!isLocked && !punkt.erLast && (
                                  <button
                                    onClick={() => toggleLas(index)}
                                    className="text-gray-500 hover:text-gray-700"
                                    title="Lås denne kommentaren"
                                  >
                                    <Lock size={16} />
                                  </button>
                                )}
                                {!isLocked && punkt.erLast && (
                                  <button
                                    onClick={() => toggleLas(index)}
                                    className="text-orange-500 hover:text-orange-700"
                                    title="Lås opp denne kommentaren"
                                  >
                                    <Unlock size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                      <div className="relative">
                        <textarea
                                value={punkt.kommentar || ''}
                          onChange={(e) => handleAgendaKommentar(index, e.target.value)}
                          onPaste={(e) => !isLocked && handlePasteImage(index, e)}
                          disabled={isLocked}
                                className={`w-full border border-gray-200 rounded-lg p-2 sm:p-4 min-h-[100px] text-sm sm:text-base text-gray-700 placeholder-gray-400 ${
                                  isLocked ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-100 focus:border-blue-300'
                                }`}
                                placeholder="Skriv kommentar eller lim inn skjermbilde (CTRL+V)"
                                rows="3"
                              />
                              <div className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 text-gray-400">
                          <Image size={16} />
                        </div>
                      </div>
                          </div>

                          {/* Beslutninger og aksjoner i 2 kolonner - I MIDTEN */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Beslutninger - venstre kolonne */}
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                              <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2">Beslutninger</h4>
                              <textarea
                                value={punkt.beslutninger || ''}
                                onChange={(e) => oppdaterAgendaPunkt(index, { beslutninger: e.target.value })}
                                disabled={isLocked}
                                className={`w-full border border-gray-200 rounded-lg p-2 min-h-[120px] text-sm text-gray-700 ${
                                  isLocked ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-100 focus:border-blue-300'
                                }`}
                                placeholder="Skriv inn beslutninger..."
                                rows="3"
                              />
                            </div>

                            {/* Aksjoner - høyre kolonne - forbedret design */}
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm sm:text-base font-medium text-gray-700">Aksjoner</h4>
                                {!isLocked && (
                              <button
                                    onClick={() => handleAddAksjon(index)}
                                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                              >
                                    <Plus size={14} />
                                    <span>Ny aksjon</span>
                              </button>
                                )}
                              </div>

                              <div className="border border-gray-200 rounded-lg h-[120px] overflow-y-auto">
                                {punkt.aksjoner && punkt.aksjoner.length > 0 ? (
                                  <div className="divide-y divide-gray-100">
                                    {punkt.aksjoner.map((aksjon, aksjonIndex) => (
                                      <div
                                        key={aksjonIndex}
                                        className="p-2 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-gray-800 truncate">{aksjon.ansvarlig}</span>
                                            <span className="text-xs text-blue-600 whitespace-nowrap ml-2">Frist: {aksjon.frist}</span>
                                          </div>
                                          <p className="text-xs text-gray-600 mt-1 truncate">{aksjon.beskrivelse}</p>
                                        </div>
                                        {!isLocked && (
                              <button
                                            onClick={() => handleDeleteAksjon(index, aksjonIndex)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 flex-shrink-0"
                              >
                                            <X size={14} />
                              </button>
                                        )}
                            </div>
                          ))}
                        </div>
                                ) : (
                                  <div className="p-3 text-center text-sm text-gray-500 h-full flex items-center justify-center">
                                    Ingen aksjoner lagt til
                        </div>
                      )}
                              </div>
                            </div>
                    </div>

                          {/* Innlimte bilder og vedlegg - NEDERST */}
                          {punkt.vedlegg && punkt.vedlegg.length > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm sm:text-base font-medium text-gray-700">Vedlegg</h4>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {punkt.vedlegg.map((vedlegg, vedleggIndex) => (
                                  <div
                                    key={vedleggIndex}
                                    className="relative group bg-white border border-gray-200 rounded-lg p-2 hover:shadow-sm transition-all"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2 truncate pr-6">
                                        {vedlegg.type === 'image' ? (
                                          <Image size={16} className="text-blue-500 flex-shrink-0" />
                                        ) : (
                                          <FileText size={16} className="text-orange-500 flex-shrink-0" />
                                        )}
                                        <input
                                          type="text"
                                          value={vedlegg.navn}
                                          onChange={(e) => handleRenameVedlegg(index, vedleggIndex, e.target.value)}
                            disabled={isLocked}
                                          className="flex-1 min-w-0 text-sm text-gray-700 bg-transparent border-0 focus:ring-0 focus:outline-none truncate"
                                        />
                                      </div>
                                      <div className="absolute right-2 top-2 flex gap-1">
                                        <button
                                          onClick={() => visVedlegg(vedlegg, index, vedleggIndex)}
                                          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
                                        >
                                          <Eye size={14} />
                          </button>
                                        {!isLocked && (
                          <button
                                            onClick={() => slettVedlegg(index, vedleggIndex)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                          >
                                            <X size={14} />
                          </button>
                      )}
                    </div>
                  </div>
                                    {/* Vis miniatyrbilde hvis vedlegget er et bilde */}
                                    {vedlegg.type === 'image' && (
                                      <div 
                                        className="w-full h-24 rounded bg-cover bg-center border border-gray-100"
                                        style={{ backgroundImage: `url(${vedlegg.data})` }}
                                        onClick={() => visVedlegg(vedlegg, index, vedleggIndex)}
                                      />
                                    )}
                                    {/* Dokument-ikon for dokumenter */}
                                    {vedlegg.type !== 'image' && (
                                      <div 
                                        className="w-full h-24 rounded border border-gray-100 flex items-center justify-center bg-gray-50"
                                        onClick={() => visVedlegg(vedlegg, index, vedleggIndex)}
                                      >
                                        <FileText size={32} className="text-gray-400" />
                                      </div>
                                    )}
                </div>
              ))}
            </div>
          </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status med oppnådd/ikke oppnådd */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 p-3 sm:p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('status')}
          >
            <h2 className="text-lg sm:text-xl font-semibold">Status</h2>
            {expandedSections.status ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSections.status && (
            <div className="mt-4">
              {/* Målsetting fra møteinformasjon */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-500 mb-1">Målsetting for møtet:</div>
                <div className="text-base text-gray-700">{moteInfo.mal || 'Ingen målsetting definert'}</div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="text-sm sm:text-base">Ble målsettingen med møtet oppnådd?</div>
                <div className="flex gap-3">
                <button
                  onClick={() => !isLocked && setStatusOppnadd('oppnadd')}
                  disabled={isLocked}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border ${
                      statusOppnadd === 'oppnadd'
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <Check size={16} className={statusOppnadd === 'oppnadd' ? 'text-green-500' : 'text-gray-400'} />
                    <span className="text-sm sm:text-base font-medium">Oppnådd</span>
                </button>
                <button
                  onClick={() => !isLocked && setStatusOppnadd('ikke_oppnadd')}
                  disabled={isLocked}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border ${
                        statusOppnadd === 'ikke_oppnadd' 
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <X size={16} className={statusOppnadd === 'ikke_oppnadd' ? 'text-red-500' : 'text-gray-400'} />
                    <span className="text-sm sm:text-base font-medium">Ikke oppnådd</span>
                </button>
                </div>
              </div>

              {statusOppnadd === 'ikke_oppnadd' && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fadeIn">
                  <div className="text-sm sm:text-base">Ny dato for oppfølging:</div>
                  <input
                    type="date"
                    value={nyDato || ''}
                    onChange={(e) => !isLocked && setNyDato(e.target.value)}
                    disabled={isLocked}
                    className={`px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md w-full sm:w-auto ${
                      isLocked ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''
                    }`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lagre-knapp */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mb-8">
            <button
              onClick={handleSave}
            disabled={isLocked}
            className={`px-4 py-2 rounded-md flex items-center justify-center gap-2 ${
              isLocked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
            } transition-all duration-200`}
            >
              <Save size={16} />
            <span className="font-medium">Lagre endringer</span>
            </button>
          </div>

        {/* Legg til AksjonDialog */}
        <AksjonDialog
          isOpen={showAksjonDialog}
          onClose={() => setShowAksjonDialog(false)}
          onSave={handleSaveAksjon}
          deltakere={deltakereStatus}
        />
      </div>
    </div>
  );
}

export default MoteGjennomforing; 