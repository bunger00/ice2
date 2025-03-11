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
const compressImage = async (dataUrl, maxWidth = 1600, quality = 0.9) => {
  // Skip komprimering for små bilder
  if (dataUrl.length < 100000) {
    console.log("Bildet er lite, hopper over komprimering");
    return dataUrl;
  }
  
  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Hvis bildet allerede er mindre enn maxWidth, ikke skaler det ned
          if (img.width <= maxWidth) {
            console.log("Bilde er allerede innenfor størrelsesgrense, beholder originalstørrelse");
            resolve(dataUrl);
            return;
          }
          
          // Beregn ny høyde for å beholde størrelsesforholdet
          const scaleFactor = maxWidth / img.width;
          const height = img.height * scaleFactor;
          
          // Lag en canvas for å tegne det skalerte bildet
          const canvas = document.createElement('canvas');
          canvas.width = maxWidth;
          canvas.height = height;
          
          // Tegn bildet på canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, maxWidth, height);
          
          // Konverter canvas til data URL med høyere kvalitet
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Logg komprimeringsresultat
          console.log(`Bilde komprimert: Original ${Math.round(dataUrl.length/1024)}KB -> Ny ${Math.round(compressedDataUrl.length/1024)}KB`);
          console.log(`Bildedimensjoner: ${img.width}x${img.height} -> ${maxWidth}x${height}`);
          
          resolve(compressedDataUrl);
        } catch (error) {
          console.error("Feil ved bildebehandling:", error);
          resolve(dataUrl); // Returner originalbilde ved feil
        }
      };
      img.onerror = (err) => {
        console.error("Kunne ikke laste bilde:", err);
        resolve(dataUrl); // Returner originalbilde ved feil
      };
      img.src = dataUrl;
    });
  } catch (error) {
    console.error("Uventet feil i compressImage:", error);
    return dataUrl; // Returner originalbilde ved feil
  }
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

  // Legg til denne hjelpefunksjonen øverst i komponenten
  const generateUniqueId = () => Math.random().toString(36).substring(2, 15);

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
  const [toastMessage, setToastMessage] = useState("Møtet er lagret!");

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
                
                // Komprimere bildet før lagring - bruk høyere kvalitet (0.95) for skjermbilder
                let bildeData;
                try {
                  // Bruk maxWidth=2000 og quality=0.95 for skjermbilder
                  bildeData = await compressImage(e.target.result, 2000, 0.95);
                  console.log("Bilde komprimert vellykket, størrelse:", bildeData.length);
                } catch (err) {
                  console.error("Feil ved komprimering, bruker originalt bilde:", err);
                  bildeData = e.target.result; // Bruk ukomprimert bilde ved feil
                }

                // Sett skjermbildenavnet
                const timestamp = new Date();
                const formattedDate = `${timestamp.getDate().toString().padStart(2, '0')}.${(timestamp.getMonth() + 1).toString().padStart(2, '0')}.${timestamp.getFullYear()} ${timestamp.getHours().toString().padStart(2, '0')}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
                const skjermbildeNavn = `Skjermbilde ${formattedDate}`;
                
                // Oppdater agendapunktet med det nye vedlegget
                const oppdaterteAgendaPunkter = [...agendaStatus];
                const nyVedlegg = {
                  type: 'image',
                  data: bildeData,
                  timestamp: timestamp.toISOString(),
                  navn: skjermbildeNavn,
                  id: Math.random().toString(36).substring(2, 15),
                  strokes: [] // Initialiser med et tomt strokes-array
                };

                // Legg til vedlegget og oppdater state
                oppdaterteAgendaPunkter[index].vedlegg.push(nyVedlegg);
                console.log("Bilde lagt til i vedlegg for agendapunkt", index, "- vedlegg count:", oppdaterteAgendaPunkter[index].vedlegg.length);
                
                // Force-update for å sikre at UI oppdateres
                setAgendaStatus([...oppdaterteAgendaPunkter]);

                // Vis en bekreftelse til brukeren
                setShowToast(true);
                setToastMessage("Skjermbilde limt inn");
                setTimeout(() => setShowToast(false), 2000);
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

  // Oppdater visVedlegg funksjonen for bedre bilde- og PDF-håndtering
  const visVedlegg = (vedlegg, agendaIndex, vedleggIndex) => {
    console.log("visVedlegg kalt for:", vedlegg.navn, "type:", vedlegg.type || vedlegg.mimeType);
    
    // Hvis det er en PDF, sjekk og reparer data URL
    if ((vedlegg.mimeType === 'application/pdf' || vedlegg.type === 'pdf') && vedlegg.data) {
      // Sjekk om dataURL har riktig prefix
      if (!vedlegg.data.startsWith('data:application/pdf;base64,')) {
        // Hvis ikke, fjern eventuelt eksisterende prefix og legg til riktig prefix
        const base64Data = vedlegg.data.includes('base64,') 
          ? vedlegg.data.split('base64,')[1] 
          : vedlegg.data;
        
        // Oppdater vedlegget med riktig data URL format
        const oppdaterteAgendaPunkter = [...agendaStatus];
        oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].data = `data:application/pdf;base64,${base64Data}`;
        setAgendaStatus(oppdaterteAgendaPunkter);
        
        // Sett aktivt vedlegg med reparert data
        setActiveAttachment({
          ...vedlegg, 
          data: `data:application/pdf;base64,${base64Data}`,
          agendaIndex, 
          vedleggIndex
        });
      } else {
        // Hvis formatet allerede er riktig
        setActiveAttachment({...vedlegg, agendaIndex, vedleggIndex});
      }
    } else if (vedlegg.type === 'image') {
      // For bilder, sjekk at data er gyldig
      console.log("Viser bilde, data-lengde:", vedlegg.data ? vedlegg.data.length : 'ingen data');
      
      if (!vedlegg.data) {
        console.error("Bildedata mangler");
        setShowToast(true);
        setToastMessage("Feil: Bildedata mangler");
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      
      // Sikre at bildet har riktig format
      if (!vedlegg.data.startsWith('data:image/')) {
        console.error("Bildedata har feil format");
        setShowToast(true);
        setToastMessage("Feil: Bildedata har feil format");
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      
      // Sett aktivt vedlegg
      setActiveAttachment({...vedlegg, agendaIndex, vedleggIndex});
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

  // Legg til funksjon for å lukke tegneeditoren med lagring
  const closeDrawingEditor = (dataURL, strokes) => {
    console.log("closeDrawingEditor kalt", dataURL ? "med data" : "uten data");
    if (dataURL && strokes) {
      // Kall saveDrawing for å lagre tegningen før vi lukker editoren
      saveDrawing(dataURL, strokes);
    } else {
      console.log("Ingen data å lagre ved lukking av tegningseditoren");
    }
    setShowDrawingEditor(false);
  };

  // Oppdater saveDrawing funksjonen
  const saveDrawing = async (dataURL, strokes) => {
    if (!activeAttachment) {
      console.error("saveDrawing: Ingen aktivt vedlegg");
      return;
    }
    
    console.log("saveDrawing kalt med strokes:", strokes.length);
    
    // Komprimer tegningen før lagring
    const komprimertTegning = await compressImage(dataURL, 2000, 0.95);
    
    const oppdaterteAgendaPunkter = [...agendaStatus];
    const { agendaIndex, vedleggIndex } = activeAttachment;
    
    console.log(`Lagrer tegning for vedlegg ${vedleggIndex} i agendapunkt ${agendaIndex}`);
    
    // Oppdater vedlegget med ny data og strokes
    oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].data = komprimertTegning;
    oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].strokes = strokes;
    
    console.log("Antall strokes lagret:", strokes.length);
    
    // Oppdater state for å trigge re-render
    setAgendaStatus([...oppdaterteAgendaPunkter]);
    
    // Oppdater activeAttachment med de nye dataene
    setActiveAttachment({
      ...activeAttachment,
      data: komprimertTegning,
      strokes: strokes
    });
    
    // Vis bekreftelse til brukeren
    setShowToast(true);
    setToastMessage("Tegning lagret");
    setTimeout(() => setShowToast(false), 2000);
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

  // Oppdater handleSave-funksjonen for å sikre at agendapunkt-status lagres korrekt
  const handleSave = async () => {
    try {
      if (!moteInfo.id) {
        setShowToast(false);
        alert('Kan ikke lagre: Møtet mangler ID');
        return false;
      }

      // Sørg for at vi bruker riktig starttid - prioriter lokal verdi
      const currentStartTid = moteInfo.startTid;
      const lokaltLagretStartTid = localStorage.getItem(`mote_${moteInfo.id}_startTid`);
      const effectiveStartTid = lokaltLagretStartTid || currentStartTid || '09:00';
      
      // Konsekvent bruk av tomme strenger i stedet for null
      const currentStatusOppnadd = statusOppnadd || '';
      const currentNyDato = nyDato || '';
      
      // Oppdater agendapunkter basert på gjeldende status med grundig logging
      console.log('Agenda status før lagring:', agendaStatus.map(p => ({
        punkt: p.punkt,
        ferdig: p.ferdig,
        startTid: p.startTid,
        tidBrukt: p.tidBrukt
      })));
      
      const oppdaterteAgendaPunkter = agendaStatus.map(punkt => {
        const oppdatertPunkt = {
          ...punkt,
          id: punkt.id || generateUniqueId(),
        punkt: punkt.punkt || '',
        ansvarlig: punkt.ansvarlig || '',
        varighet: punkt.varighet || 15,
          startTid: punkt.startTid, // Bevare som den er
          ferdig: punkt.ferdig,     // Bevare som den er
          tidBrukt: punkt.tidBrukt, // Bevare som den er
        kommentar: punkt.kommentar || '',
        erLast: punkt.erLast || false,
        notater: punkt.notater || '',
        beslutninger: punkt.beslutninger || '',
          vedlegg: (punkt.vedlegg || []).map(v => ({
            type: v.type || 'image',
            data: v.data || '',
            navn: v.navn || 'Vedlegg',
            id: v.id || Math.random().toString(36).substring(2, 15),
            mimeType: v.mimeType || '',
            strokes: v.strokes || [] // Bevar strokes
          })),
          aksjoner: (punkt.aksjoner || []).map(a => ({
            ansvarlig: a.ansvarlig || '',
            beskrivelse: a.beskrivelse || '',
            frist: a.frist || '',
            opprettet: a.opprettet || new Date().toISOString(),
            status: a.status || 'åpen'
          }))
        };
        return oppdatertPunkt;
      });

      console.log('Agenda før lagring til Firestore:', oppdaterteAgendaPunkter.map(p => ({
        punkt: p.punkt,
        ferdig: p.ferdig,
        startTid: p.startTid,
        tidBrukt: p.tidBrukt
      })));
      
      console.log('Aktivt punkt før lagring:', aktivtPunkt);

      // Lagre data med aktivt punkt
      const gjennomforingsData = {
        id: moteInfo.id,
        tema: moteInfo.tema || '',
        dato: moteInfo.dato || '',
        startTid: effectiveStartTid,
        innkallingsDato: moteInfo.innkallingsDato || '',
        eier: moteInfo.eier || '',
        fasilitator: moteInfo.fasilitator || '',
        referent: moteInfo.referent || '',
        hensikt: moteInfo.hensikt || '',
        mal: moteInfo.mal || '',
        erGjennomfort: true,
        aktivtPunkt: aktivtPunkt, // Lagre aktivt punkt i møtedata
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
        agendaPunkter: oppdaterteAgendaPunkter
      };

      console.log('Lagrer gjennomføringsdata med status:', gjennomforingsData.gjennomforingsStatus);
      console.log('Agenda-statuser som lagres:', oppdaterteAgendaPunkter.map(p => ({
        punkt: p.punkt,
        ferdig: p.ferdig,
        startTid: p.startTid,
        tidBrukt: p.tidBrukt
      })));

      // Oppdater hovedstate
      setDeltakere(deltakereStatus);
      setAgendaPunkter(oppdaterteAgendaPunkter);

      const success = await lagreMote(true, gjennomforingsData);
      
      if (success) {
        // Oppdater moteInfo også slik at den inneholder de nye gjennomforingsstatus-verdiene
        moteInfo.gjennomforingsStatus = {
          statusOppnadd: currentStatusOppnadd,
          nyDato: currentNyDato,
          mal: moteInfo.mal || ''
        };
        
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Detaljert feil ved lagring:', error);
      alert(`Kunne ikke lagre møtet: ${error.message}`);
      return false;
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

      const oppdaterteAgendaPunkter = [...agendaStatus];

      // Hvis vedlegg-arrayet ikke finnes, initialiser det
      if (!oppdaterteAgendaPunkter[index].vedlegg) {
        oppdaterteAgendaPunkter[index].vedlegg = [];
      }

      // For PDF-filer, sikre at data URL har riktig format og MIME-type
      if (file.type === 'application/pdf') {
        // Sjekk om dataURL har riktig prefix
        if (!fileData.startsWith('data:application/pdf;base64,')) {
          // Hvis ikke, fjern eventuelt eksisterende prefix og legg til riktig prefix
          const base64Data = fileData.includes('base64,') 
            ? fileData.split('base64,')[1] 
            : fileData;
          fileData = `data:application/pdf;base64,${base64Data}`;
        }
        console.log('PDF-fil lastet opp med MIME-type:', file.type);
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
    };

    // For alle filtyper, bruk readAsDataURL
    reader.readAsDataURL(file);
  };

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
        // Sjekk om dataURL har riktig prefix
        if (!v.data.startsWith('data:application/pdf;base64,')) {
          // Hvis ikke, fjern eventuelt eksisterende prefix og legg til riktig prefix
          const base64Data = v.data.includes('base64,') 
            ? v.data.split('base64,')[1] 
            : v.data;
          return {
            ...v,
            data: `data:application/pdf;base64,${base64Data}`
          };
        }
      }
      return v;
    });
  };

  // Funksjon for å reparere PDF-data i alle agendapunkter
  const repairAllPDFData = () => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    let harEndringer = false;
    
    // Gå gjennom alle agendapunkter og vedlegg
    oppdaterteAgendaPunkter.forEach((punkt, punktIndex) => {
      if (punkt.vedlegg && Array.isArray(punkt.vedlegg)) {
        punkt.vedlegg.forEach((vedlegg, vedleggIndex) => {
          // Hvis det er en PDF, sjekk og reparer data URL
          if (vedlegg.mimeType === 'application/pdf' && vedlegg.data) {
            // Sjekk om dataURL har riktig prefix
            if (!vedlegg.data.startsWith('data:application/pdf;base64,')) {
              // Hvis ikke, fjern eventuelt eksisterende prefix og legg til riktig prefix
              const base64Data = vedlegg.data.includes('base64,') 
                ? vedlegg.data.split('base64,')[1] 
                : vedlegg.data;
              
              // Oppdater vedlegget med riktig data URL format
              oppdaterteAgendaPunkter[punktIndex].vedlegg[vedleggIndex].data = 
                `data:application/pdf;base64,${base64Data}`;
              
              harEndringer = true;
            }
          }
        });
      }
    });
    
    // Oppdater state hvis det er gjort endringer
    if (harEndringer) {
      console.log('PDF-data reparert i agendapunkter');
      setAgendaStatus(oppdaterteAgendaPunkter);
    }
  };

  // Kjør PDF-reparasjon når komponenten lastes
  useEffect(() => {
    // Vent litt for å sikre at agendaStatus er initialisert
    const timer = setTimeout(() => {
      repairAllPDFData();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-gray-100 py-4 sm:py-8 ${isLocked ? 'opacity-75' : ''}`}>
      {showToast && (
        <Toast 
          message={toastMessage} 
          onClose={() => setShowToast(false)} 
        />
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
          <div className="bg-white rounded-lg shadow-xl max-w-[95vw] max-h-[95vh] flex flex-col w-auto" style={{ minWidth: '80vw' }}>
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
            
            <div className="overflow-auto p-0 flex-grow flex items-center justify-center bg-gray-100" style={{ maxHeight: 'calc(95vh - 130px)' }}>
              {showDrawingEditor && activeAttachment.type === 'image' ? (
                <DrawingEditor
                  imageData={activeAttachment.data}
                  onSave={saveDrawing}
                  onClose={closeDrawingEditor}
                  initialStrokes={activeAttachment.strokes || []}
                />
              ) : (
                <div className="p-0 w-full h-full flex items-center justify-center">
                  {activeAttachment.type === 'image' ? (
                    <div className="overflow-auto max-h-[85vh] w-full flex items-center justify-center bg-gray-600 bg-opacity-10">
                      <img
                        src={activeAttachment.data}
                        alt={activeAttachment.navn}
                        className="h-auto object-contain shadow-lg"
                        style={{ maxHeight: '85vh', maxWidth: '90vw', minWidth: 'auto', objectFit: 'contain' }}
                        onError={(e) => {
                          console.error("Feil ved lasting av bilde:", e);
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAxaDAtMjMgMGgtMXYxM2MwIDUuNTI1IDQuNDczIDEwIDkuOTk3IDEwIDUuNTI1IDAgMTAuMDAzLTQuNDc1IDEwLjAwMy0xMHYtMTN6bS0yIDEyYzAgNC40MTEtMy41OTEgOC04LjAwMyA4LTQuNDEyIDAtNy45OTctMy41ODktNy45OTctOHYtMTFoMTZ2MTF6bS01LTcuNWMwIC44MjguNjcyIDEuNSAxLjUgMS41cy0xLjUuNjcyIDEuNSAxLjVjMCAuODI4LS42NzIgMS41LTEuNSAxLjVzLTEuNS0uNjcyLTEuNS0xLjVoLTJjMCAxLjkzMyAxLjU2NyAzLjUgMy41IDMuNXMzLjUtMS41NjcgMy41LTMuNWMwLS44MjgtLjY3Mi0xLjUtMS41LTEuNXMtMS41LS42NzItMS41LTEuNWMwLS44MjguNjcyLTEuNSAxLjUtMS41czEuNS42NzIgMS41IDEuNWgyYzAtMS45MzMtMS41NjctMy41LTMuNS0zLjVzLTMuNSAxLjU2Ny0zLjUgMy41em0tNC00LjV2MmgydjJoMnYtMmgydi0yaC0ydi0yaC0ydjJoLTJ6Ii8+PC9zdmc+';
                          e.target.style.width = '60px';
                          e.target.style.height = '60px';
                          e.target.style.opacity = '0.5';
                          e.target.style.padding = '10px';
                        }}
                      />
                    </div>
                  ) : activeAttachment.mimeType === 'application/pdf' || activeAttachment.type === 'pdf' ? (
                    <div className="w-full h-[85vh] flex flex-col items-center justify-center">
                      {/* Sjekk om PDF-dataen har riktig format */}
                      {activeAttachment.data && (activeAttachment.data.startsWith('data:application/pdf;base64,') || activeAttachment.data.includes('base64,')) ? (
                        <iframe
                          src={activeAttachment.data.startsWith('data:application/pdf;base64,') ? activeAttachment.data : `data:application/pdf;base64,${activeAttachment.data.split('base64,')[1]}`}
                          className="w-full h-full border-0"
                          title={activeAttachment.navn}
                          style={{ width: '90vw', minHeight: '85vh' }}
                        />
                      ) : (
                        <div className="p-8 flex flex-col items-center justify-center h-full">
                          <AlertCircle size={48} className="text-amber-500 mb-4" />
                          <h3 className="text-lg font-medium text-gray-800 mb-2">Kunne ikke vise PDF</h3>
                          <p className="text-sm text-gray-500 mb-4 text-center">Det ser ut til at filformatet er skadet eller ikke støttet.</p>
                          <a
                            href={activeAttachment.data}
                            download={activeAttachment.navn}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Last ned filen i stedet
                          </a>
                        </div>
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
                              <div className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 flex items-center gap-1 text-gray-400 bg-white bg-opacity-70 p-1 rounded">
                                <Image size={16} />
                                <span className="text-xs text-gray-500">CTRL+V for å lime inn skjermbilde</span>
                              </div>
                            </div>
                            {!isLocked && (
                              <div className="mt-2 text-xs text-blue-600 flex items-center">
                                <AlertCircle size={12} className="mr-1" />
                                <span>Skjermbilder du limer inn vil vises i vedleggsseksjonen under. Klikk på miniatyren for å se hele bildet.</span>
                              </div>
                            )}
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
                                        className="w-full h-32 sm:h-36 rounded bg-contain bg-center bg-no-repeat border border-gray-100 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                                        style={{ 
                                          backgroundImage: `url(${vedlegg.data})`,
                                          backgroundSize: 'contain',
                                          backgroundColor: '#f8f9fa'
                                        }}
                                        onClick={() => visVedlegg(vedlegg, index, vedleggIndex)}
                                      />
                                    )}
                                    {/* Dokument-ikon for dokumenter */}
                                    {vedlegg.type !== 'image' && (
                                      <div 
                                        className="w-full h-32 sm:h-36 rounded border border-gray-100 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-300 hover:bg-gray-100 transition-all"
                                        onClick={() => visVedlegg(vedlegg, index, vedleggIndex)}
                                      >
                                        <FileText size={40} className="text-gray-400" />
                                        <span className="mt-2 text-xs text-gray-500">Klikk for å åpne</span>
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