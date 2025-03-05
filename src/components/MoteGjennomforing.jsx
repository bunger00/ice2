import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, ArrowLeft, Check, Calendar, Image, X, Save, Printer, FileDown, Lock, Unlock, ChevronDown, ChevronUp, AlertCircle, Plus, QrCode, BarChart } from 'lucide-react';
import MoteReferatPrintView from './MoteReferatPrintView';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import DrawingEditor from './DrawingEditor';
import QRCodeModal from './QRCodeModal';
import SurveyResults from './SurveyResults';

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

  // Oppdater initialiseringen av agendaStatus for å inkludere unike IDer
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

  const [aktivtPunkt, setAktivtPunkt] = useState(null);
  const [statusOppnadd, setStatusOppnadd] = useState(
    moteInfo.statusOppnadd || moteInfo.gjennomforingsStatus?.statusOppnadd || null
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
            statusOppnadd: statusOppnadd || '',
            nyDato: nyDato || '',
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

  const handlePasteImage = (index, event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          const oppdaterteAgendaPunkter = [...agendaStatus];
          oppdaterteAgendaPunkter[index].vedlegg.push({
            type: 'image',
            data: e.target.result,
            timestamp: new Date().toISOString(),
            navn: `Skjermbilde ${oppdaterteAgendaPunkter[index].vedlegg.length + 1}`,
            id: Math.random().toString(36).substring(2, 15),
            strokes: [] // Initialiser med et tomt strokes-array
          });
          setAgendaStatus(oppdaterteAgendaPunkter);
        };
        reader.readAsDataURL(blob);
        event.preventDefault();
      }
    }
  };

  const slettVedlegg = (agendaIndex, vedleggIndex) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[agendaIndex].vedlegg.splice(vedleggIndex, 1);
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

  const visVedlegg = (vedlegg, agendaIndex, vedleggIndex) => {
    // Opprett en modal eller dialog for å vise bildet
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    // Endrer onclick til å bare lukke modalen hvis klikket er utenfor innholdet
    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };

    // Opprett en container for innholdet
    const container = document.createElement('div');
    container.style.backgroundColor = 'white';
    container.style.padding = '20px';
    container.style.borderRadius = '8px';
    container.style.position = 'relative';
    container.style.maxWidth = '90%';
    container.style.maxHeight = '90%';
    container.style.overflow = 'auto';
    
    // Opprett en tittel
    const title = document.createElement('h3');
    title.textContent = 'Vedlegg: ' + vedlegg.navn;
    title.style.marginTop = '0';
    title.style.marginBottom = '15px';
    
    // Opprett knapper i en verktøylinje
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.marginBottom = '15px';
    toolbar.style.gap = '10px';
    
    // Lukke-knapp
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Lukk';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = '#f0f0f0';
    closeButton.style.border = '1px solid #ccc';
    closeButton.style.borderRadius = '4px';
    closeButton.style.marginLeft = 'auto';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => document.body.removeChild(modal);
    
    // Rediger-knapp (kun for bilder)
    if (vedlegg.type === 'image') {
      const editButton = document.createElement('button');
      editButton.textContent = 'Tegn på bildet';
      editButton.style.padding = '5px 10px';
      editButton.style.backgroundColor = '#4CAF50';
      editButton.style.color = 'white';
      editButton.style.border = 'none';
      editButton.style.borderRadius = '4px';
      editButton.style.cursor = 'pointer';
      
      editButton.onclick = () => {
        // Fjern eksisterende innhold
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        
        // Mount the DrawingEditor React component
        const drawingRoot = document.createElement('div');
        container.appendChild(drawingRoot);
        
        // Use ReactDOM to render the component
        const onSaveDrawing = (newImageData, strokes) => {
          // Oppdater vedlegget med det redigerte bildet og strekene
          const oppdaterteAgendaPunkter = [...agendaStatus];
          oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].data = newImageData;
          // Lagre streker separat
          oppdaterteAgendaPunkter[agendaIndex].vedlegg[vedleggIndex].strokes = strokes;
          setAgendaStatus(oppdaterteAgendaPunkter);
        };
        
        const onCloseDrawing = () => {
          document.body.removeChild(modal);
        };
        
        // Hent eventuelle eksisterende streker
        const initialStrokes = vedlegg.strokes || [];
        
        ReactDOM.render(
          <DrawingEditor 
            imageData={vedlegg.data}
            initialStrokes={initialStrokes}
            onSave={onSaveDrawing} 
            onClose={onCloseDrawing} 
          />, 
          drawingRoot
        );
      };
      
      toolbar.appendChild(editButton);
    }
    
    toolbar.appendChild(closeButton);
    
    // Legg til bilde eller annet innhold
    const content = document.createElement('div');
    if (vedlegg.type === 'image') {
    const img = document.createElement('img');
    img.src = vedlegg.data;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '70vh';
    img.style.objectFit = 'contain';
      content.appendChild(img);
    } else {
      const p = document.createElement('p');
      p.textContent = 'Ikke-bilde vedlegg';
      content.appendChild(p);
    }
    
    // Bygg opp DOM-strukturen
    container.appendChild(title);
    container.appendChild(toolbar);
    container.appendChild(content);
    modal.appendChild(container);
    document.body.appendChild(modal);
  };

  const handleSave = async () => {
    try {
      if (!moteInfo.id) {
        setShowToast(false);
        alert('Kan ikke lagre: Møtet mangler ID');
        return false;
      }

      const oppdaterteAgendaPunkter = agendaStatus.map(punkt => ({
        punkt: punkt.punkt || '',
        ansvarlig: punkt.ansvarlig || '',
        varighet: punkt.varighet || 15,
        startTid: punkt.startTid || null,
        ferdig: punkt.ferdig || false,
        tidBrukt: punkt.tidBrukt || null,
        kommentar: punkt.kommentar || '',
        notater: punkt.notater || '',
        beslutninger: punkt.beslutninger || '',
        vedlegg: (punkt.vedlegg || []).map(v => ({
          type: v.type || 'image',
          data: v.data || '',
          timestamp: v.timestamp || new Date().toISOString(),
          navn: v.navn || 'Vedlegg',
          id: v.id || Math.random().toString(36).substring(2, 15)
        })),
        aksjoner: (punkt.aksjoner || []).map(a => ({
          ansvarlig: a.ansvarlig || '',
          beskrivelse: a.beskrivelse || '',
          frist: a.frist || '',
          opprettet: a.opprettet || new Date().toISOString(),
          status: a.status || 'åpen'
        })),
        erLast: punkt.erLast || false
      }));

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
          statusOppnadd: statusOppnadd || '',
          nyDato: nyDato || '',
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

      // Oppdater hovedstate
      setDeltakere(deltakereStatus);
      setAgendaPunkter(oppdaterteAgendaPunkter);

      const success = await lagreMote(true, gjennomforingsData);
      if (success) {
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
             a.notater !== (original.notater || '') ||
             a.beslutninger !== (original.beslutninger || '') ||
             (a.aksjoner?.length || 0) !== (original.aksjoner?.length || 0) ||
             a.erLast !== (original.erLast || false);
    });

    // Sjekk om det er endringer i møtestatus
    const originalStatusOppnadd = moteInfo.gjennomforingsStatus?.statusOppnadd || null;
    const originalNyDato = moteInfo.gjennomforingsStatus?.nyDato || '';
    
    const harStatusEndringer = 
      statusOppnadd !== originalStatusOppnadd || 
      nyDato !== originalNyDato;

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
      setStatusOppnadd(moteInfo.gjennomforingsStatus.statusOppnadd);
      setNyDato(moteInfo.gjennomforingsStatus.nyDato || '');
    }
  }, [moteInfo]);

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

  return (
    <div className={`min-h-screen bg-gray-100 py-4 sm:py-8 ${isLocked ? 'opacity-75' : ''}`}>
      {showToast && (
        <Toast 
          message="Møtet er lagret!" 
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
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-colors shadow-sm hover:shadow ${
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
                    {/* Faktisk tid */}
                          {punkt.startTid && (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <span className="text-gray-500 text-xs sm:text-sm">Faktisk start:</span>
                              <span className="text-sm sm:text-lg font-medium text-gray-900">
                                {new Date(punkt.startTid).toLocaleTimeString('no-NO', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                          {punkt.tidBrukt && (
                                <>
                                  <span className="text-gray-500 text-xs sm:text-sm ml-2 sm:ml-4">Faktisk varighet:</span>
                                  <span className={`text-xs sm:text-sm font-medium ${punkt.tidBrukt > punkt.varighet ? 'text-red-500' : 'text-green-500'}`}>
                              {punkt.tidBrukt} min
                                  </span>
                        </>
                      )}
                    </div>
                          )}

                          {/* Handlingsknapper */}
                          {!punkt.ferdig && (
                            aktivtPunkt === index ? (
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
                            ) : !punkt.startTid && aktivtPunkt === null && (
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
                            )
                          )}
                          {punkt.ferdig && (
                            <div className="flex items-center gap-1 sm:gap-2 text-green-600 bg-green-50 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full">
                              <Check size={16} />
                              <span className="text-sm sm:text-base font-medium">Fullført</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hovedinnhold */}
                    <div className="p-3 sm:p-8 bg-white">
                      {/* Innhold i to kolonner med lik høyde på desktop, stacking på mobil */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-12">
                        {/* Venstre kolonne: Kommentarer og vedlegg */}
                        <div className="flex flex-col">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                            Kommentar
                          </label>
                          <div className="relative flex-1">
                        <textarea
                              placeholder="Skriv kommentar... (Ctrl+V for å lime inn skjermbilde)"
                          value={punkt.kommentar}
                          onChange={(e) => handleAgendaKommentar(index, e.target.value)}
                          onPaste={(e) => !isLocked && handlePasteImage(index, e)}
                          disabled={isLocked}
                              className={`w-full border border-gray-200 rounded-xl p-2 sm:p-4 min-h-[100px] sm:min-h-[120px] text-sm sm:text-base text-gray-700 placeholder-gray-400 ${
                                isLocked ? 'bg-gray-50' : 'focus:ring-2 focus:ring-blue-100 focus:border-blue-300'
                              }`}
                              rows="3"
                            />
                            <div className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 text-gray-400">
                          <Image size={16} />
                        </div>
                      </div>

                          {/* Vedlegg */}
                      {punkt.vedlegg.length > 0 && (
                            <div className="mt-4 sm:mt-6">
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                Vedlegg
                              </label>
                              <div className="flex flex-wrap gap-2">
                          {punkt.vedlegg.map((vedlegg, vedleggIndex) => (
                            <div
                                    key={vedlegg.id}
                                    className="relative group bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                            >
                              <button
                                      onClick={(e) => visVedlegg(vedlegg, index, vedleggIndex)}
                                      className="w-full flex flex-col items-start gap-1 px-2 sm:px-3 py-1 sm:py-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Image size={14} className="text-gray-400" />
                                        {!isLocked ? (
                                          <input
                                            type="text"
                                            value={vedlegg.navn}
                                            onChange={(e) => handleRenameVedlegg(index, vedleggIndex, e.target.value)}
                                            className="text-xs sm:text-sm text-gray-700 border-none bg-transparent hover:bg-gray-50 focus:ring-1 focus:ring-blue-100 rounded px-1 py-0.5 w-[72px] sm:w-24"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <span className="text-xs sm:text-sm text-gray-700">{vedlegg.navn}</span>
                                        )}
                                      </div>
                                      {vedlegg.type === 'image' && (
                                        <div
                                          className="mt-1 w-16 h-12 sm:w-20 sm:h-16 rounded bg-cover bg-center border border-gray-100"
                                          style={{ backgroundImage: `url(${vedlegg.data})` }}
                                        />
                                      )}
                              </button>
                                    {!isLocked && (
                              <button
                                onClick={() => slettVedlegg(index, vedleggIndex)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              >
                                <X size={12} />
                              </button>
                                    )}
                            </div>
                          ))}
                              </div>
                        </div>
                      )}
                    </div>

                        {/* Høyre kolonne: Aksjoner */}
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700">
                              Aksjoner
                            </label>
                            {!isLocked && (
                          <button
                                onClick={() => handleAddAksjon(index)}
                                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                              >
                                <Plus size={16} />
                                <span className="text-sm font-medium">Legg til aksjon</span>
                          </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            {punkt.aksjoner?.length > 0 ? (
                              punkt.aksjoner.map((aksjon, aksjonIndex) => (
                                <div
                                  key={aksjonIndex}
                                  className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-all"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-start gap-2 mb-1">
                                        <AlertCircle size={14} className="text-yellow-500 mt-1 flex-shrink-0" />
                                        <div className="space-y-0.5">
                                          <p className="font-medium text-gray-900 text-sm">{aksjon.beskrivelse}</p>
                                          <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{aksjon.ansvarlig}</span>
                                            <span>•</span>
                                            <span>Frist: {new Date(aksjon.frist).toLocaleDateString()}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    {!isLocked && (
                          <button
                                        onClick={() => handleDeleteAksjon(index, aksjonIndex)}
                                        className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-50"
                                      >
                                        <X size={14} />
                          </button>
                      )}
                    </div>
                  </div>
                              ))
                            ) : (
                              <div className="text-center text-gray-500 text-sm">
                                Ingen aksjoner lagt til
                </div>
                            )}
            </div>
                        </div>
                      </div>
                    </div>
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