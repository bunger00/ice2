import { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Save, PlusCircle, Database, Play, FolderOpen, FileDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Routes, Route, useNavigate, BrowserRouter as Router } from 'react-router-dom';
import MoteInformasjon from './components/MoteInformasjon';
import Deltakere from './components/Deltakere';
import Agenda from './components/Agenda';
import Status from './components/Status';
import LagredemMoter from './components/LagredemMoter';
import PrintView from './components/PrintView';
import DialogModal from './components/DialogModal';
import MoteGjennomforing from './components/MoteGjennomforing';
import AgendaPrintView from './components/AgendaPrintView';
import { Dialog } from '@headlessui/react';

function App() {
  const [moteInfo, setMoteInfo] = useState({
    id: null,
    tema: '',
    dato: '',
    startTid: '09:00',
    innkallingsDato: '',
    eier: '',
    fasilitator: '',
    referent: '',
    hensikt: '',
    mal: ''
  });

  const [deltakere, setDeltakere] = useState([]);
  const [agendaPunkter, setAgendaPunkter] = useState([
    { punkt: '', ansvarlig: '', varighet: 15, fullfort: false },
    { punkt: '', ansvarlig: '', varighet: 15, fullfort: false },
    { punkt: '', ansvarlig: '', varighet: 15, fullfort: false }
  ]);

  const [lagredeMoter, setLagredeMoter] = useState(
    JSON.parse(localStorage.getItem('moter') || '[]')
  );

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [erGjennomfort, setErGjennomfort] = useState(false);

  const [visLagredeMoter, setVisLagredeMoter] = useState(false);

  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(false);

  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const navigate = useNavigate();

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(agendaPunkter);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAgendaPunkter(items);
  };

  const lagreMote = (fraGjennomforing = false, statusInfo = null) => {
    try {
      // Sjekk om vi har nødvendig data
      if (!moteInfo.tema || !moteInfo.dato) {
        alert('Møtet må ha tema og dato for å kunne lagres');
        return;
      }

      // Rens data før lagring
      const cleanDeltakere = deltakere.filter(d => 
        d.navn || d.fagFunksjon || d.epost || d.forberedelser
      );

      const cleanAgendaPunkter = agendaPunkter.filter(a => 
        a.punkt || a.ansvarlig
      );

      const moteData = {
        id: moteInfo.id || Date.now(),
        tema: moteInfo.tema || '',
        dato: moteInfo.dato || '',
        startTid: moteInfo.startTid || '09:00',
        innkallingsDato: moteInfo.innkallingsDato || '',
        eier: moteInfo.eier || '',
        fasilitator: moteInfo.fasilitator || '',
        referent: moteInfo.referent || '',
        hensikt: moteInfo.hensikt || '',
        mal: moteInfo.mal || '',
        deltakere: deltakere,
        agendaPunkter: agendaPunkter,
        erGjennomfort: fraGjennomforing,
        sistEndret: new Date().toISOString(),
        ...(statusInfo && {
          statusOppnadd: statusInfo.statusOppnadd,
          nyDato: statusInfo.nyDato
        })
      };

      console.log('Lagrer møtedata:', moteData); // For debugging

      let oppdatertMoter;
      if (moteInfo.id) {
        oppdatertMoter = lagredeMoter.map(mote => 
          mote.id === moteInfo.id ? moteData : mote
        );
      } else {
        oppdatertMoter = [...lagredeMoter, moteData];
      }

      // Lagre til localStorage
      localStorage.setItem('moter', JSON.stringify(oppdatertMoter));
      setLagredeMoter(oppdatertMoter);
      
      // Vis suksessmelding i 0.5 sekunder
      setShowSuccessDialog(true);
      setTimeout(() => {
        setShowSuccessDialog(false);
      }, 500);

    } catch (error) {
      console.error('Feil ved lagring av møte:', error);
      alert('En feil oppstod ved lagring av møtet. Prøv igjen.');
    }
  };

  const lastMote = (moteData) => {
    setMoteInfo({
      id: moteData.id,
      tema: moteData.tema,
      dato: moteData.dato,
      startTid: moteData.startTid,
      innkallingsDato: moteData.innkallingsDato,
      eier: moteData.eier,
      fasilitator: moteData.fasilitator,
      referent: moteData.referent,
      hensikt: moteData.hensikt,
      mal: moteData.mal,
      statusOppnadd: moteData.statusOppnadd,
      nyDato: moteData.nyDato
    });
    setDeltakere(moteData.deltakere);
    setAgendaPunkter(moteData.agendaPunkter);
    setErGjennomfort(moteData.erGjennomfort || false);

    if (moteData.erGjennomfort) {
      navigate('/gjennomforing', { state: { shouldLock: true } });
    }
  };

  const harEndringer = () => {
    return moteInfo.tema !== '' || 
           moteInfo.dato !== '' || 
           deltakere.length > 0 || 
           agendaPunkter.length > 0;
  };

  const nyttMote = () => {
    if (harEndringer()) {
      setShowSaveDialog(true);
    } else {
      resetMote();
    }
  };

  const resetMote = () => {
    setMoteInfo({
      id: null,
      tema: '',
      dato: '',
      startTid: '09:00',
      innkallingsDato: new Date().toISOString().split('T')[0],
      eier: '',
      fasilitator: '',
      referent: '',
      hensikt: '',
      mal: ''
    });

    setDeltakere([
      { fagFunksjon: '', navn: '', forberedelser: '', epost: '' },
      { fagFunksjon: '', navn: '', forberedelser: '', epost: '' },
      { fagFunksjon: '', navn: '', forberedelser: '', epost: '' }
    ]);

    setAgendaPunkter([
      { punkt: '', ansvarlig: '', varighet: 15, fullfort: false },
      { punkt: '', ansvarlig: '', varighet: 15, fullfort: false },
      { punkt: '', ansvarlig: '', varighet: 15, fullfort: false }
    ]);

    // Nullstill erGjennomfort når vi starter et nytt møte
    setErGjennomfort(false);
  };

  const fyllDummyData = () => {
    const tilfeldigeTider = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
      '14:00', '14:30', '15:00', '15:30'
    ];
    const tilfeldigStartTid = tilfeldigeTider[Math.floor(Math.random() * tilfeldigeTider.length)];

    setMoteInfo({
      id: null,
      tema: 'Fremdriftsmøte byggeprosjekt',
      dato: new Date().toISOString().split('T')[0],
      startTid: tilfeldigStartTid,
      innkallingsDato: new Date().toISOString().split('T')[0],
      eier: 'Anders Byggmester',
      fasilitator: 'Mari Prosjektleder',
      referent: 'Ole Teknisk',
      hensikt: 'Gjennomgang av fremdrift, HMS-status og koordinering mellom fag',
      mal: 'Sikre god flyt i byggeprosessen og løse eventuelle utfordringer mellom fagene'
    });

    const dummyDeltakere = [
      { fagFunksjon: 'BL', navn: 'Anders Byggmester', forberedelser: 'Fremdriftsplan' },
      { fagFunksjon: 'ARK', navn: 'Kari Arkitekt', forberedelser: 'Tegningsunderlag' },
      { fagFunksjon: 'RIB', navn: 'Per Konstruktør', forberedelser: 'Konstruksjonsdetaljer' },
      { fagFunksjon: 'RIE', navn: 'Lisa Elektro', forberedelser: 'El-tegninger' },
      { fagFunksjon: 'RIV', navn: 'Erik VVS', forberedelser: 'VVS-underlag' },
      { fagFunksjon: 'UE', navn: 'Tom Graving', forberedelser: 'Graveplan' }
    ];

    const oppdaterteDeltakere = deltakere.map((deltaker, index) => ({
      ...deltaker,
      fagFunksjon: deltaker.fagFunksjon || dummyDeltakere[index % 6].fagFunksjon,
      navn: deltaker.navn || dummyDeltakere[index % 6].navn,
      forberedelser: deltaker.forberedelser || dummyDeltakere[index % 6].forberedelser
    }));

    if (oppdaterteDeltakere.length === 0) {
      setDeltakere(dummyDeltakere.slice(0, 3));
    } else {
      setDeltakere(oppdaterteDeltakere);
    }

    const dummyAgendaPunkter = [
      { tid: '09:00', punkt: 'Gjennomgang av HMS-status og RUH', ansvarlig: 'Anders Byggmester', varighet: 15 },
      { tid: '09:15', punkt: 'Status betongarbeider og fremdrift', ansvarlig: 'Per Konstruktør', varighet: 20 },
      { tid: '09:35', punkt: 'Koordinering tekniske fag', ansvarlig: 'Erik VVS', varighet: 25 },
      { tid: '10:00', punkt: 'Arkitektens endringer og løsninger', ansvarlig: 'Kari Arkitekt', varighet: 20 },
      { tid: '10:20', punkt: 'Logistikk og riggplan', ansvarlig: 'Tom Graving', varighet: 15 }
    ];

    const oppdaterteAgendaPunkter = agendaPunkter.map((punkt, index) => ({
      ...punkt,
      punkt: punkt.punkt || dummyAgendaPunkter[index % 5].punkt,
      ansvarlig: punkt.ansvarlig || dummyAgendaPunkter[index % 5].ansvarlig,
      varighet: punkt.varighet || dummyAgendaPunkter[index % 5].varighet
    }));

    if (oppdaterteAgendaPunkter.length === 0) {
      setAgendaPunkter(dummyAgendaPunkter.slice(0, 3));
    } else {
      setAgendaPunkter(oppdaterteAgendaPunkter);
    }
  };

  const startMote = () => {
    navigate('/gjennomforing');
  };

  const saveToHistory = () => {
    const currentState = {
      moteInfo: { ...moteInfo },
      deltakere: [...deltakere],
      agendaPunkter: [...agendaPunkter]
    };

    const newHistory = history.slice(0, currentIndex + 1);
    setHistory([...newHistory, currentState]);
    setCurrentIndex(newHistory.length);
  };

  const undo = () => {
    if (currentIndex > 0) {
      const previousState = history[currentIndex - 1];
      setMoteInfo(previousState.moteInfo);
      setDeltakere(previousState.deltakere);
      setAgendaPunkter(previousState.agendaPunkter);
      setCurrentIndex(currentIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, history]);

  useEffect(() => {
    if (
      moteInfo.tema || 
      moteInfo.dato || 
      deltakere.some(d => d.navn || d.fagFunksjon || d.forberedelser) ||
      agendaPunkter.some(a => a.punkt || a.ansvarlig)
    ) {
      saveToHistory();
    }
  }, [moteInfo, deltakere, agendaPunkter]);

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-5xl mx-auto px-4">
                  <div>
                    <div className="flex items-end justify-between mb-4">
                      <div className="flex items-end gap-6">
                        <img 
                          src="/Logolean.png"
                          alt="LEAN Communications" 
                          className="h-20 object-contain"
                        />
                        <h1 className="text-3xl font-bold text-gray-800 leading-none">
                          Møteagenda
                        </h1>
                        <button
                          onClick={fyllDummyData}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          <Database size={14} />
                          Test Data
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={startMote}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          <Play size={14} />
                          Start møte
                        </button>
                        <button
                          onClick={nyttMote}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          <PlusCircle size={14} />
                          Nytt møte
                        </button>
                        <button
                          onClick={() => lagreMote(false)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          <Save size={14} />
                          Lagre agenda
                        </button>
                        <AgendaPrintView 
                          moteInfo={moteInfo}
                          deltakere={deltakere}
                          agendaPunkter={agendaPunkter}
                          buttonClassName="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-700 text-sm rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          <FileDown size={14} />
                          Eksporter PDF
                        </AgendaPrintView>
                      </div>
                    </div>

                    <div className="mb-6">
                      <button
                        onClick={() => setVisLagredeMoter(!visLagredeMoter)}
                        className="w-full flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 text-gray-700">
                          <FolderOpen size={16} />
                          <span className="font-medium">Lagrede møter</span>
                        </div>
                        {visLagredeMoter ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      
                      {visLagredeMoter && (
                        <div className="mt-2">
                          <LagredemMoter 
                            onVelgMote={lastMote} 
                            moter={lagredeMoter}
                            setLagredeMoter={setLagredeMoter}
                          />
                        </div>
                      )}
                    </div>
                    
                    <MoteInformasjon 
                      moteInfo={moteInfo}
                      setMoteInfo={setMoteInfo}
                      deltakere={deltakere}
                      setDeltakere={setDeltakere}
                      disabled={erGjennomfort}
                    />
                    
                    <Deltakere 
                      deltakere={deltakere}
                      setDeltakere={setDeltakere}
                      disabled={erGjennomfort}
                    />
                    
                    <Agenda 
                      agendaPunkter={agendaPunkter}
                      setAgendaPunkter={setAgendaPunkter}
                      startTid={moteInfo.startTid}
                      deltakere={deltakere}
                      disabled={erGjennomfort}
                    />
                  </div>
                </div>
              </div>
            </DragDropContext>
          } 
        />
        <Route 
          path="/gjennomforing" 
          element={
            <MoteGjennomforing
              moteInfo={moteInfo}
              deltakere={deltakere}
              agendaPunkter={agendaPunkter}
              setDeltakere={setDeltakere}
              setAgendaPunkter={setAgendaPunkter}
              lagreMote={(statusInfo) => lagreMote(true, statusInfo)}
              resetMote={resetMote}
            />
          } 
        />
      </Routes>

      {showNewMeetingDialog && (
        <DialogModal
          isOpen={showNewMeetingDialog}
          onClose={() => setShowNewMeetingDialog(false)}
          title="Lagre endringer?"
          message="Du har ulagrede endringer i gjeldende møte. Hva ønsker du å gjøre?"
          buttons={[
            {
              text: "Lagre og start nytt møte",
              onClick: () => {
                lagreMote(false);
                resetMote();
                setShowNewMeetingDialog(false);
              },
              primary: true
            },
            {
              text: "Forkast endringer og start nytt møte",
              onClick: () => {
                resetMote();
                setShowNewMeetingDialog(false);
              }
            },
            {
              text: "Avbryt",
              onClick: () => setShowNewMeetingDialog(false)
            }
          ]}
        />
      )}

      {showSaveDialog && (
        <DialogModal
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          title="Hva vil du gjøre?"
          message="Du har et pågående møte. Velg hva du vil gjøre:"
          buttons={[
            {
              text: "Lagre gjeldende møte og start nytt",
              onClick: () => {
                lagreMote(false);
                resetMote();
                setShowSaveDialog(false);
              },
              primary: true
            },
            {
              text: "Forkast endringer og start nytt",
              onClick: () => {
                resetMote();
                setShowSaveDialog(false);
              }
            },
            {
              text: "Avbryt og gå tilbake",
              onClick: () => setShowSaveDialog(false)
            }
          ]}
        />
      )}

      {showSuccessDialog && (
        <DialogModal
          isOpen={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          title="Suksess"
          message="Møtet er lagret"
          autoClose={true}
        />
      )}
    </>
  );
}

export default App; 