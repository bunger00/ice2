import { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Save, PlusCircle, Database, Play, FolderOpen, FileDown, ChevronUp, ChevronDown, LogOut } from 'lucide-react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import MoteInformasjon from './components/MoteInformasjon';
import Deltakere from './components/Deltakere';
import Agenda from './components/Agenda';
import Status from './components/Status';
import LagredeMoter from './components/LagredeMoter';
import PrintView from './components/PrintView';
import DialogModal from './components/DialogModal';
import MoteGjennomforing from './components/MoteGjennomforing';
import AgendaPrintView from './components/AgendaPrintView';
import { Dialog } from '@headlessui/react';
import Login from './components/Login';
import { auth, db } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import Toast from './components/Toast';

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

  const [lagredeMoter, setLagredeMoter] = useState([]);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [erGjennomfort, setErGjennomfort] = useState(false);

  const [visLagredeMoter, setVisLagredeMoter] = useState(true);

  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(false);

  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [visMoteSkjema, setVisMoteSkjema] = useState(false);

  const [showToast, setShowToast] = useState(false);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(agendaPunkter);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAgendaPunkter(items);
  };

  const lagreMote = async (fraGjennomforing = false, gjennomforingsData = null) => {
    try {
      if (!auth.currentUser) {
        console.log('Ingen bruker er logget inn');
        alert('Du må være logget inn for å lagre møter');
        return;
      }

      if (!moteInfo.tema) {
        alert('Møtet må ha en tittel før det kan lagres');
        return;
      }

      // Viktig: Sett erGjennomfort til false når vi lagrer fra hovedsiden
      const erGjennomfort = fraGjennomforing === true;
      
      console.log('Starter lagring av møte...', { fraGjennomforing, erGjennomfort });

      const moteData = {
        userId: auth.currentUser.uid,
        tema: String(moteInfo.tema || ''),
        dato: String(moteInfo.dato || ''),
        startTid: String(moteInfo.startTid || ''),
        innkallingsDato: String(moteInfo.innkallingsDato || ''),
        eier: String(moteInfo.eier || ''),
        fasilitator: String(moteInfo.fasilitator || ''),
        referent: String(moteInfo.referent || ''),
        hensikt: String(moteInfo.hensikt || ''),
        mal: String(moteInfo.mal || ''),
        deltakere: deltakere.map(d => ({
          fagFunksjon: String(d.fagFunksjon || ''),
          navn: String(d.navn || ''),
          epost: String(d.epost || ''),
          forberedelser: String(d.forberedelser || ''),
          utfortStatus: String(d.utfortStatus || 'none'),
          oppmoteStatus: String(d.oppmoteStatus || 'none')
        })),
        agendaPunkter: agendaPunkter.map(a => ({
          punkt: String(a.punkt || ''),
          ansvarlig: String(a.ansvarlig || ''),
          varighet: Number(a.varighet || 15),
          kommentar: String(a.kommentar || ''),
          startTid: a.startTid ? String(a.startTid) : null,
          ferdig: Boolean(a.ferdig),
          tidBrukt: a.tidBrukt ? Number(a.tidBrukt) : null,
          vedlegg: Array.isArray(a.vedlegg) ? a.vedlegg : [],
          erLast: Boolean(a.erLast),
          notater: String(a.notater || ''),
          beslutninger: String(a.beslutninger || ''),
          aksjoner: Array.isArray(a.aksjoner) ? a.aksjoner.map(String) : []
        })),
        erGjennomfort: erGjennomfort,
        // Kun inkluder gjennomføringsstatus hvis møtet er gjennomført
        ...(erGjennomfort && gjennomforingsData ? {
          gjennomforingsStatus: {
            statusOppnadd: String(gjennomforingsData?.statusOppnadd || ''),
            nyDato: String(gjennomforingsData?.nyDato || ''),
            fullfortePunkter: Number(gjennomforingsData?.statusInfo?.fullfortePunkter || 0),
            gjenstaendePunkter: Number(gjennomforingsData?.statusInfo?.gjenstaendePunkter || 0),
            totaltAntallPunkter: Number(gjennomforingsData?.statusInfo?.totaltAntallPunkter || 0),
            deltakereStatus: Array.isArray(gjennomforingsData?.deltakereStatus) 
              ? gjennomforingsData.deltakereStatus.map(d => ({
                  navn: String(d.navn || ''),
                  fagFunksjon: String(d.fagFunksjon || ''),
                  utfortStatus: String(d.utfortStatus || 'none'),
                  oppmoteStatus: String(d.oppmoteStatus || 'none')
                }))
              : []
          }
        } : {}),
        sistOppdatert: new Date().toISOString()
      };

      console.log('MoteData som skal lagres:', moteData);

      const moterRef = collection(db, 'moter');

      if (moteInfo.id) {
        console.log('Oppdaterer eksisterende møte:', moteInfo.id);
        const moteRef = doc(db, 'moter', moteInfo.id);
        await updateDoc(moteRef, moteData);
        console.log('Møte oppdatert');
      } else {
        console.log('Oppretter nytt møte');
        const docRef = await addDoc(moterRef, {
          ...moteData,
          opprettetDato: new Date().toISOString()
        });
        console.log('Nytt møte opprettet med ID:', docRef.id);
        setMoteInfo(prev => ({ ...prev, id: docRef.id }));
      }

      await hentLagredeMoter();
      setShowToast(true);
      return true;
    } catch (error) {
      console.error('Feil ved lagring:', error);
      alert(`Kunne ikke lagre møtet: ${error.message}`);
      return false;
    }
  };

  const hentLagredeMoter = async () => {
    if (!auth.currentUser) {
      setLagredeMoter([]);
      return;
    }

    try {
      const moterRef = collection(db, 'moter');
      const q = query(moterRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const moter = [];
      querySnapshot.forEach((doc) => {
        moter.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('Hentet møter:', moter.length);
      setLagredeMoter(moter);
    } catch (error) {
      console.error('Feil ved henting av møter:', error);
      alert(`Kunne ikke hente møter: ${error.message}`);
    }
  };

  const slettMote = async (moteId) => {
    if (!auth.currentUser || !moteId) return;

    try {
      // Slett dokumentet fra Firestore
      await deleteDoc(doc(db, 'moter', moteId));
      
      // Oppdater UI ved å hente møtene på nytt
      await hentLagredeMoter();
      
      // Vis bekreftelse
      setShowToast(true);
      
      // Reset møteskjema hvis det slettede møtet var åpent
      if (moteInfo.id === moteId) {
        resetMote();
        setVisMoteSkjema(false);
      }
    } catch (error) {
      console.error('Feil ved sletting:', error);
      alert('Kunne ikke slette møtet. Vennligst prøv igjen.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth status:', user ? `Logged in as ${user.email}` : 'Not logged in');
      if (user) {
        console.log('User ID:', user.uid);
        setIsAuthenticated(true);
        hentLagredeMoter();
        setVisMoteSkjema(false);
        setVisLagredeMoter(true);
      } else {
        setIsAuthenticated(false);
        setVisMoteSkjema(false);
        setVisLagredeMoter(true);
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const lastMote = (moteData) => {
    if (!moteData) {
      console.error('Ugyldig møtedata:', moteData);
      return;
    }

    setMoteInfo({
      id: moteData.id,
      tema: moteData.tema || '',
      dato: moteData.dato || '',
      startTid: moteData.startTid || '09:00',
      innkallingsDato: moteData.innkallingsDato || '',
      eier: moteData.eier || '',
      fasilitator: moteData.fasilitator || '',
      referent: moteData.referent || '',
      hensikt: moteData.hensikt || '',
      mal: moteData.mal || ''
    });

    setDeltakere(moteData.deltakere?.map(d => ({
      fagFunksjon: d.fagFunksjon || '',
      navn: d.navn || '',
      epost: d.epost || '',
      forberedelser: d.forberedelser || '',
      utfortStatus: d.utfortStatus || 'none',
      oppmoteStatus: d.oppmoteStatus || 'none'
    })) || []);

    setAgendaPunkter(moteData.agendaPunkter?.map(a => ({
      punkt: a.punkt || '',
      ansvarlig: a.ansvarlig || '',
      varighet: a.varighet || 15,
      fullfort: a.fullfort || false,
      kommentar: a.kommentar || '',
      startTid: a.startTid || null,
      ferdig: a.ferdig || false,
      tidBrukt: a.tidBrukt || null,
      vedlegg: Array.isArray(a.vedlegg) ? a.vedlegg : [],
      erLast: a.erLast || false,
      notater: a.notater || '',
      beslutninger: a.beslutninger || '',
      aksjoner: Array.isArray(a.aksjoner) ? a.aksjoner : []
    })) || []);

    setErGjennomfort(moteData.erGjennomfort || false);
    setVisLagredeMoter(false);
    setVisMoteSkjema(true);
  };

  const harEndringer = () => {
    return moteInfo.tema !== '' || 
           moteInfo.dato !== '' || 
           deltakere.length > 0 || 
           agendaPunkter.length > 0;
  };

  const nyttMote = () => {
    if (harEndringer() && visMoteSkjema) {
      setShowSaveDialog(true);
    } else {
      resetMote();
      setVisMoteSkjema(true);
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

    setErGjennomfort(false);
  };

  const fyllDummyData = () => {
    const tilfeldigeTider = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
      '14:00', '14:30', '15:00', '15:30'
    ];
    
    const tilfeldigDato = () => {
      const dato = new Date();
      dato.setDate(dato.getDate() + Math.floor(Math.random() * 14)); // 0-14 dager frem i tid
      return dato.toISOString().split('T')[0];
    };

    const tilfeldigVarighet = () => Math.floor(Math.random() * 4 + 1) * 15; // 15, 30, 45 eller 60 min

    setMoteInfo({
      id: null,
      tema: 'Fremdriftsmøte byggeprosjekt' + Math.floor(Math.random() * 9999999),
      dato: tilfeldigDato(),
      startTid: tilfeldigeTider[Math.floor(Math.random() * tilfeldigeTider.length)],
      innkallingsDato: new Date().toISOString().split('T')[0],
      eier: 'Anders Byggmester',
      fasilitator: 'Mari Prosjektleder',
      referent: 'Ole Teknisk',
      hensikt: 'Gjennomgang av fremdrift, HMS-status og koordinering mellom fag',
      mal: 'Sikre god flyt i byggeprosessen og løse eventuelle utfordringer mellom fagene'
    });

    const dummyDeltakere = [
      { fagFunksjon: 'BL', navn: 'Anders Byggmester', forberedelser: 'Fremdriftsplan', epost: 'anders@bygg.no' },
      { fagFunksjon: 'ARK', navn: 'Kari Arkitekt', forberedelser: 'Tegningsunderlag', epost: 'kari@ark.no' },
      { fagFunksjon: 'RIB', navn: 'Per Konstruktør', forberedelser: 'Konstruksjonsdetaljer', epost: 'per@rib.no' },
      { fagFunksjon: 'RIE', navn: 'Lisa Elektro', forberedelser: 'El-tegninger', epost: 'lisa@rie.no' },
      { fagFunksjon: 'RIV', navn: 'Erik VVS', forberedelser: 'VVS-underlag', epost: 'erik@riv.no' },
      { fagFunksjon: 'UE', navn: 'Tom Graving', forberedelser: 'Graveplan', epost: 'tom@ue.no' },
      { fagFunksjon: 'HMS', navn: 'Siri Sikkerhet', forberedelser: 'HMS-rapport', epost: 'siri@hms.no' },
      { fagFunksjon: 'PL', navn: 'Pål Planlegger', forberedelser: 'Fremdriftsplan', epost: 'pal@pl.no' }
    ];

    // Velg tilfeldig antall deltakere (3-8)
    const antallDeltakere = Math.floor(Math.random() * 6) + 3;
    const blandedeDeltakere = [...dummyDeltakere]
      .sort(() => Math.random() - 0.5)
      .slice(0, antallDeltakere);

    setDeltakere(blandedeDeltakere);

    const dummyAgendaPunkter = [
      { punkt: 'Gjennomgang av HMS-status og RUH', ansvarlig: 'Anders Byggmester', varighet: tilfeldigVarighet() },
      { punkt: 'Status betongarbeider og fremdrift', ansvarlig: 'Per Konstruktør', varighet: tilfeldigVarighet() },
      { punkt: 'Koordinering tekniske fag', ansvarlig: 'Erik VVS', varighet: tilfeldigVarighet() },
      { punkt: 'Arkitektens endringer og løsninger', ansvarlig: 'Kari Arkitekt', varighet: tilfeldigVarighet() },
      { punkt: 'Logistikk og riggplan', ansvarlig: 'Tom Graving', varighet: tilfeldigVarighet() },
      { punkt: 'Kvalitetssikring og kontroll', ansvarlig: 'Siri Sikkerhet', varighet: tilfeldigVarighet() },
      { punkt: 'Fremdriftsplan og milepæler', ansvarlig: 'Pål Planlegger', varighet: tilfeldigVarighet() }
    ];

    // Velg tilfeldig antall agendapunkter (3-7)
    const antallPunkter = Math.floor(Math.random() * 5) + 3;
    const blandedePunkter = [...dummyAgendaPunkter]
      .sort(() => Math.random() - 0.5)
      .slice(0, antallPunkter);

    setAgendaPunkter(blandedePunkter);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleMoteStatusChange = async (moteId, erGjennomfort) => {
    try {
      const moteRef = doc(db, 'moter', moteId);
      const mote = lagredeMoter.find(m => m.id === moteId);
      if (!mote) return;

      // Hvis vi flytter til planlagte møter, fjern gjennomføringsstatus
      const oppdatering = {
        erGjennomfort: erGjennomfort,
        sistOppdatert: new Date().toISOString()
      };

      if (!erGjennomfort) {
        oppdatering.gjennomforingsStatus = null; // Fjern gjennomføringsstatus
      }

      // Oppdater Firestore
      await updateDoc(moteRef, oppdatering);

      // Oppdater lokal state
      const oppdaterteMoter = lagredeMoter.map(m => 
        m.id === moteId 
          ? { ...m, 
              erGjennomfort,
              ...((!erGjennomfort) && { gjennomforingsStatus: null })
            }
          : m
      );
      setLagredeMoter(oppdaterteMoter);

      // Vis bekreftelse
      const melding = erGjennomfort 
        ? 'Møtet er flyttet til gjennomførte møter' 
        : 'Møtet er flyttet tilbake til planlagte møter og kan nå redigeres';
      alert(melding);

    } catch (error) {
      console.error('Feil ved oppdatering av møtestatus:', error);
      alert('Kunne ikke oppdatere møtestatus. Vennligst prøv igjen.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          !isAuthenticated ? (
            <Login setIsAuthenticated={setIsAuthenticated} />
          ) : (
            <Navigate to="/" />
          )
        } 
      />
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <div className="min-h-screen bg-gray-100">
              {showToast && (
                <Toast 
                  message="Agenda er lagret!" 
                  onClose={() => setShowToast(false)} 
                />
              )}
              <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                      <div className="flex items-center">
                        <img 
                          src="/Logolean.png" 
                          alt="ICE Meeting" 
                          className="h-8 w-auto"
                        />
                        <span className="ml-3 text-xl font-light text-gray-900">ICE Meeting</span>
                      </div>
                      <button
                        onClick={nyttMote}
                        className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                      >
                        <PlusCircle size={18} className="mr-2" />
                        Nytt møte
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="flex items-end space-x-6 h-8">
                        <button 
                          onClick={startMote}
                          className="text-gray-700 hover:text-gray-900 transition-colors duration-200 relative group pb-1"
                          title="Start møte"
                        >
                          <Play size={18} />
                          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Start møte
                          </span>
                        </button>
                        <button 
                          onClick={lagreMote}
                          className="text-gray-700 hover:text-gray-900 transition-colors duration-200 relative group pb-1"
                          title="Lagre agenda"
                        >
                          <Save size={18} />
                          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Lagre agenda
                          </span>
                        </button>
                        <AgendaPrintView
                          moteInfo={moteInfo}
                          deltakere={deltakere}
                          agendaPunkter={agendaPunkter}
                        >
                          <FileDown size={18} />
                        </AgendaPrintView>
                        <button 
                          onClick={handleLogout}
                          className="text-gray-700 hover:text-gray-900 transition-colors duration-200 relative group pb-1"
                          title="Logg ut"
                        >
                          <LogOut size={18} />
                          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Logg ut
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                  <button
                    onClick={() => setVisLagredeMoter(!visLagredeMoter)}
                    className="w-full flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 text-gray-700">
                      <FolderOpen size={18} />
                      <span className="font-medium">Lagrede møter</span>
                    </div>
                    {visLagredeMoter ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {visLagredeMoter && (
                    <div className="mt-2">
                      <LagredeMoter 
                        onVelgMote={lastMote} 
                        moter={lagredeMoter}
                        onSlettMote={slettMote}
                        onStatusChange={handleMoteStatusChange}
                      />
                    </div>
                  )}
                </div>

                {visMoteSkjema && (
                  <div className="space-y-6">
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
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Agenda 
                        agendaPunkter={agendaPunkter}
                        setAgendaPunkter={setAgendaPunkter}
                        startTid={moteInfo.startTid}
                        deltakere={deltakere}
                        disabled={erGjennomfort}
                      />
                    </DragDropContext>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/gjennomforing" 
        element={
          isAuthenticated ? (
            <MoteGjennomforing
              moteInfo={moteInfo}
              deltakere={deltakere}
              agendaPunkter={agendaPunkter}
              setDeltakere={setDeltakere}
              setAgendaPunkter={setAgendaPunkter}
              lagreMote={lagreMote}
              resetMote={resetMote}
              setVisMoteSkjema={setVisMoteSkjema}
              setVisLagredeMoter={setVisLagredeMoter}
            />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
    </Routes>
  );
}

export default App; 