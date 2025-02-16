import { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Save, PlusCircle, Database, Play, Eye } from 'lucide-react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import MoteInformasjon from './components/MoteInformasjon';
import Deltakere from './components/Deltakere';
import Agenda from './components/Agenda';
import Status from './components/Status';
import LagredemMoter from './components/LagredemMoter';
import PrintView from './components/PrintView';
import DialogModal from './components/DialogModal';
import MoteGjennomforing from './components/MoteGjennomforing';
import AgendaPrintView from './components/AgendaPrintView';

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
  const [agendaPunkter, setAgendaPunkter] = useState([]);

  const [lagredeMoter, setLagredeMoter] = useState(
    JSON.parse(localStorage.getItem('moter') || '[]')
  );

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [erGjennomfort, setErGjennomfort] = useState(false);

  const navigate = useNavigate();

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(agendaPunkter);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAgendaPunkter(items);
  };

  const lagreMote = (fraGjennomforing = false) => {
    const moteData = {
      id: moteInfo.id || Date.now(),
      tema: moteInfo.tema,
      dato: moteInfo.dato,
      startTid: moteInfo.startTid,
      innkallingsDato: moteInfo.innkallingsDato,
      eier: moteInfo.eier,
      fasilitator: moteInfo.fasilitator,
      referent: moteInfo.referent,
      hensikt: moteInfo.hensikt,
      mal: moteInfo.mal,
      deltakere,
      agendaPunkter,
      erGjennomfort: fraGjennomforing
    };

    let oppdatertMoter;
    if (moteInfo.id) {
      oppdatertMoter = lagredeMoter.map(mote => 
        mote.id === moteInfo.id ? moteData : mote
      );
    } else {
      oppdatertMoter = [...lagredeMoter, moteData];
    }

    localStorage.setItem('moter', JSON.stringify(oppdatertMoter));
    setLagredeMoter(oppdatertMoter);
    setShowSuccessDialog(true);
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
      mal: moteData.mal
    });
    setDeltakere(moteData.deltakere);
    setAgendaPunkter(moteData.agendaPunkter);
    setErGjennomfort(moteData.erGjennomfort || false);
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
      { fagFunksjon: '', navn: '', forberedelser: '' },
      { fagFunksjon: '', navn: '', forberedelser: '' },
      { fagFunksjon: '', navn: '', forberedelser: '' }
    ]);

    setAgendaPunkter([
      { tid: '', punkt: '', ansvarlig: '', varighet: 15 },
      { tid: '', punkt: '', ansvarlig: '', varighet: 15 }
    ]);
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

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="min-h-screen bg-gray-100 py-8">
                <div className="max-w-5xl mx-auto px-4">
                  {erGjennomfort && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                      Dette møtet er gjennomført og kan ikke redigeres
                    </div>
                  )}
                  
                  <div className="flex items-end justify-between mb-8">
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
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors"
                      >
                        <Database size={16} />
                        <span>Test Data</span>
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {erGjennomfort ? (
                        <button
                          onClick={startMote}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                        >
                          <Eye size={16} />
                          Se møtet
                        </button>
                      ) : (
                        <button
                          onClick={startMote}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 transition-colors"
                        >
                          <Play size={16} />
                          Start møte
                        </button>
                      )}
                      <button
                        onClick={nyttMote}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >
                        <PlusCircle size={16} />
                        Nytt møte
                      </button>
                      <button
                        onClick={lagreMote}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                      >
                        <Save size={16} />
                        Lagre agenda
                      </button>
                      <AgendaPrintView 
                        moteInfo={moteInfo}
                        deltakere={deltakere}
                        agendaPunkter={agendaPunkter}
                      />
                    </div>
                  </div>

                  <LagredemMoter 
                    onVelgMote={lastMote} 
                    moter={lagredeMoter}
                    setLagredeMoter={setLagredeMoter}
                  />
                  
                  <div className={erGjennomfort ? 'opacity-50 pointer-events-none' : ''}>
                    <MoteInformasjon 
                      moteInfo={moteInfo}
                      setMoteInfo={setMoteInfo}
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
              lagreMote={() => lagreMote(true)}
            />
          } 
        />
      </Routes>

      {showSaveDialog && (
        <DialogModal
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          onSave={lagreMote}
          title="Bekreft møteopprettelse"
          message="Er du sikker på at du vil lagre dette møtet?"
        />
      )}

      {showSuccessDialog && (
        <DialogModal
          isOpen={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          title="Møte lagret"
          message="Møtet er lagret i systemet."
        />
      )}
    </>
  );
}

export default App; 