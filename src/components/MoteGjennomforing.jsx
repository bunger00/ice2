import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, ArrowLeft, Check, Calendar, Image, X, Save, Printer, FileDown, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';
import MoteReferatPrintView from './MoteReferatPrintView';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

function MoteGjennomforing({ moteInfo, deltakere, agendaPunkter, status, setStatus, setDeltakere, setAgendaPunkter, lagreMote, resetMote, setVisMoteSkjema, setVisLagredeMoter }) {
  const location = useLocation();
  
  // Sett isLocked til true hvis vi kommer fra "Se møtereferat"
  const [isLocked, setIsLocked] = useState(location.state?.shouldLock ?? true);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deltakereStatus, setDeltakereStatus] = useState(
    deltakere.map(d => ({ 
      ...d, 
      utfortStatus: d.utfortStatus || 'none',
      oppmoteStatus: d.oppmoteStatus || 'none'
    }))
  );
  const [agendaStatus, setAgendaStatus] = useState(
    agendaPunkter.map(a => ({ 
      ...a, 
      kommentar: a.kommentar || '', 
      startTid: a.startTid || null,
      ferdig: a.ferdig || false,
      tidBrukt: a.tidBrukt || null,
      vedlegg: a.vedlegg || [], // Behold eksisterende vedlegg
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

  // Oppdater klokken hvert sekund
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const handleAgendaKommentar = (index, kommentar) => {
    const oppdaterteAgendaPunkter = [...agendaStatus];
    oppdaterteAgendaPunkter[index] = {
      ...oppdaterteAgendaPunkter[index],
      kommentar: kommentar
    };
    setAgendaStatus(oppdaterteAgendaPunkter);
  };

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
            timestamp: new Date().toISOString()
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

  const visVedlegg = (vedlegg) => {
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
    modal.onclick = () => document.body.removeChild(modal);

    const img = document.createElement('img');
    img.src = vedlegg.data;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';
    img.style.objectFit = 'contain';
    
    modal.appendChild(img);
    document.body.appendChild(modal);
  };

  const handleSave = async () => {
    try {
      const oppdaterteAgendaPunkter = agendaStatus.map(punkt => ({
        punkt: punkt.punkt || '',
        ansvarlig: punkt.ansvarlig || '',
        varighet: punkt.varighet || 15,
        kommentar: punkt.kommentar || '',
        startTid: punkt.startTid,
        ferdig: punkt.ferdig || false,
        tidBrukt: punkt.tidBrukt,
        vedlegg: Array.isArray(punkt.vedlegg) ? punkt.vedlegg : [],
        erLast: punkt.erLast || false,
        notater: punkt.notater || '',
        beslutninger: punkt.beslutninger || '',
        aksjoner: Array.isArray(punkt.aksjoner) ? punkt.aksjoner : []
      }));

      const gjennomforingsData = {
        id: moteInfo.id,
        tema: moteInfo.tema,
        dato: moteInfo.dato,
        startTid: moteInfo.startTid,
        eier: moteInfo.eier,
        referent: moteInfo.referent,
        mal: moteInfo.mal,
        gjennomforingsStatus: {
          statusOppnadd,
          nyDato,
          mal: moteInfo.mal
        },
        statusInfo: {
          fullfortePunkter: agendaStatus.filter(p => p.ferdig).length,
          gjenstaendePunkter: agendaStatus.filter(p => !p.ferdig).length,
          totaltAntallPunkter: agendaStatus.length
        },
        deltakereStatus: deltakereStatus.map(d => ({
          navn: d.navn,
          fagFunksjon: d.fagFunksjon,
          utfortStatus: d.utfortStatus,
          oppmoteStatus: d.oppmoteStatus,
          forberedelser: d.forberedelser,
          epost: d.epost
        })),
        agendaPunkter: oppdaterteAgendaPunkter
      };

      // Oppdater hovedstate
      setDeltakere(deltakereStatus);
      setAgendaPunkter(oppdaterteAgendaPunkter);

      const success = await lagreMote(true, gjennomforingsData);
      if (success) {
        setShowToast(true);
      }
      return success;
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

  return (
    <div className={`min-h-screen bg-gray-100 py-8 ${isLocked ? 'opacity-75' : ''}`}>
      {showToast && (
        <Toast 
          message="Møtet er lagret!" 
          onClose={() => setShowToast(false)} 
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

      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Møtegjennomføring</h1>
          <button
            onClick={toggleLock}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            title={isLocked ? "Lås opp møtereferatet" : "Lås møtereferatet"}
          >
            {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
            {isLocked ? "Lås opp" : "Lås"}
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Tilbake til møteagenda
          </button>

          <div className="flex gap-3">
            <MoteReferatPrintView 
              moteInfo={moteInfo}
              deltakere={deltakereStatus}
              agendaPunkter={agendaStatus}
              buttonClassName="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <FileDown size={14} />
              Eksporter møtereferat
            </MoteReferatPrintView>
          </div>
        </div>

        {/* Klokke og møteinfo */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-6xl font-bold mb-2">
              {currentTime.toLocaleTimeString('no-NO', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <h1 className="text-2xl font-semibold mb-2">{moteInfo.tema}</h1>
            <div className="text-lg text-gray-600">
              {new Date(moteInfo.dato).toLocaleDateString('no-NO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Deltakerliste */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('deltakere')}
          >
            <h2 className="text-xl font-semibold">Deltakere</h2>
            {expandedSections.deltakere ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSections.deltakere && (
            <div className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-gray-800">
              <div className="col-span-3 text-xl font-bold">Deltaker</div>
              <div className="col-span-6 text-xl font-bold">Forberedelser</div>
              <div className="col-span-1.5 text-xl font-bold text-center">Utført</div>
              <div className="col-span-1.5 text-xl font-bold text-center">Oppmøte</div>
            </div>
            <div>
              {deltakereStatus.map((deltaker, index) => (
                <div 
                  key={index} 
                  className={`grid grid-cols-12 gap-4 p-4 items-center border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <div className="col-span-3 flex flex-col">
                    <span className="text-lg font-bold text-gray-800">{deltaker.navn}</span>
                    <span className="text-sm text-gray-500">{deltaker.fagFunksjon}</span>
                  </div>
                  <div className="col-span-6 text-sm text-gray-600">
                    {deltaker.forberedelser}
                  </div>
                  <div className="col-span-1.5 flex justify-center">
                    <button
                      onClick={() => !isLocked && syklusDeltakerStatus(index, 'utfortStatus')}
                      disabled={isLocked}
                      className={`w-6 h-6 rounded-full border-2 transition-colors shadow-sm hover:shadow ${
                        isLocked ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        deltaker.utfortStatus === 'green' ? 'bg-green-500 border-green-500 hover:bg-green-600' :
                        deltaker.utfortStatus === 'red' ? 'bg-red-500 border-red-500 hover:bg-red-600' :
                        'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    />
                  </div>
                  <div className="col-span-1.5 flex justify-center">
                    <button
                      onClick={() => !isLocked && syklusDeltakerStatus(index, 'oppmoteStatus')}
                      disabled={isLocked}
                      className={`w-6 h-6 rounded-full border-2 transition-colors shadow-sm hover:shadow ${
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
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('agenda')}
          >
            <h2 className="text-xl font-semibold">Agenda</h2>
            {expandedSections.agenda ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSections.agenda && (
            <div className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            {/* Overskrifter */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b text-gray-800">
              <div className="col-span-1 text-center font-bold">Tid planlagt</div>
              <div className="col-span-1 text-center font-bold border-l pl-2">Tid faktisk</div>
              <div className="col-span-5 font-bold">Agendapunkt</div>
              <div className="col-span-3 font-bold text-center">Kommentar</div>
              <div className="col-span-2 font-bold text-center">Handling</div>
            </div>

            {/* Agenda innhold */}
            <div className="divide-y">
              {agendaStatus.map((punkt, index) => (
                <div key={index} className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Planlagt tid */}
                    <div className="col-span-1 text-center">
                      <div className="text-lg font-medium text-gray-800">
                        {getPlanlagtStartTid(index)}
                      </div>
                      <div className="text-sm text-gray-500">{punkt.varighet} min</div>
                    </div>

                    {/* Faktisk tid */}
                    <div className="col-span-1 text-center border-l pl-2">
                      {punkt.startTid ? (
                        <>
                          <div className="text-lg font-medium text-gray-800">
                            {new Date(punkt.startTid).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {punkt.tidBrukt && (
                            <div className={`text-sm ${punkt.tidBrukt > punkt.varighet ? 'text-red-500' : 'text-green-500'}`}>
                              {punkt.tidBrukt} min
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">Ikke startet</div>
                      )}
                    </div>

                    {/* Agenda innhold */}
                    <div className="col-span-5">
                      <div className="font-medium">{punkt.punkt}</div>
                      <div className="text-sm text-gray-500">
                        Ansvarlig: {punkt.ansvarlig}
                      </div>
                    </div>

                    {/* Kommentar */}
                    <div className="col-span-3">
                      <div className="relative">
                        <textarea
                          placeholder="Kommentar... (Ctrl+V for å lime inn skjermbilde)"
                          value={punkt.kommentar}
                          onChange={(e) => handleAgendaKommentar(index, e.target.value)}
                          onPaste={(e) => !isLocked && handlePasteImage(index, e)}
                          disabled={isLocked}
                          className={`w-full border rounded p-2 text-sm ${isLocked ? 'bg-gray-50' : ''}`}
                          rows="2"
                        />
                        <div className="absolute right-2 bottom-2 text-gray-400">
                          <Image size={16} />
                        </div>
                      </div>
                      {punkt.vedlegg.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {punkt.vedlegg.map((vedlegg, vedleggIndex) => (
                            <div
                              key={vedleggIndex}
                              className="relative group"
                            >
                              <button
                                onClick={() => visVedlegg(vedlegg)}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm text-gray-600"
                              >
                                <Image size={14} />
                                <span>Skjermbilde {vedleggIndex + 1}</span>
                              </button>
                              <button
                                onClick={() => slettVedlegg(index, vedleggIndex)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Handling (Start/Ferdig knapp) */}
                    <div className="col-span-2 flex justify-center items-start">
                      {!punkt.ferdig && (
                        aktivtPunkt === index ? (
                          <button
                            onClick={() => ferdigstillAgendaPunkt(index)}
                            disabled={isLocked}
                            className={`flex items-center gap-1 px-3 py-1 ${
                              isLocked ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                            } text-white text-sm rounded`}
                          >
                            <Check size={14} />
                            Ferdig
                          </button>
                        ) : !punkt.startTid && aktivtPunkt === null && (
                          <button
                            onClick={() => startAgendaPunkt(index)}
                            disabled={isLocked}
                            className={`flex items-center gap-1 px-3 py-1 ${
                              isLocked ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                            } text-white text-sm rounded`}
                          >
                            <Clock size={14} />
                            Start
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
            </div>
          )}
        </div>

        {/* Status med oppnådd/ikke oppnådd */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('status')}
          >
            <h2 className="text-xl font-semibold">Status</h2>
            {expandedSections.status ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSections.status && (
            <div className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <div className="text-lg font-medium mb-2">Målsetting for møtet:</div>
              <div className="text-gray-700 mb-4 p-3 bg-white border rounded-md">
                {moteInfo.mal}
              </div>
              <div className="text-lg font-medium mb-2">Oppnådde dere målet med møtet?</div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => !isLocked && setStatusOppnadd('oppnadd')}
                  disabled={isLocked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    statusOppnadd === 'oppnadd' ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  <Check size={16} />
                  Oppnådd
                </button>
                <button
                  onClick={() => !isLocked && setStatusOppnadd('ikke_oppnadd')}
                  disabled={isLocked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                    isLocked ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                        statusOppnadd === 'ikke_oppnadd' 
                          ? 'bg-red-500 text-white border-red-500' 
                          : 'border-gray-300 hover:border-red-500'
                  }`}
                >
                  <Calendar size={16} />
                  Ikke oppnådd
                </button>
              </div>

              {statusOppnadd === 'ikke_oppnadd' && (
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-gray-600">Velg ny dato:</span>
                  <input
                    type="date"
                    value={nyDato}
                    onChange={(e) => setNyDato(e.target.value)}
                    disabled={isLocked}
                    className={`border rounded-md p-2 text-sm ${isLocked ? 'bg-gray-50' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
          </div>
            </div>
          )}
        </div>

        {/* Lagreknapp */}
        {!isLocked && (
          <div className="fixed bottom-4 right-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Save size={16} />
              Lagre endringer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MoteGjennomforing; 