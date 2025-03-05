import { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { PlusCircle, Database, Play, FolderOpen, FileDown, ChevronUp, ChevronDown, LogOut, Share, Save } from 'lucide-react';
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
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import Toast from './components/Toast';
import VersjonsHistorikk from './components/VersjonsHistorikk';
import DeltMote from './components/DeltMote';
import SurveyForm from './components/SurveyForm';
import SurveyResults from './components/SurveyResults';

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

  const [visMoteSkjema, setVisMoteSkjema] = useState(true);

  const [showToast, setShowToast] = useState(false);

  const [versjoner, setVersjoner] = useState([]);
  const [sisteEndring, setSisteEndring] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    moteInfo: true,
    deltakere: true,
    agenda: true
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(agendaPunkter);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    handleAgendaChange(items);
  };

  const lagreMote = async (erGjennomforing = false, gjennomforingsData = null) => {
    try {
      if (!moteInfo.id) {
        console.error('Kan ikke lagre: Møtet mangler ID');
        return false;
      }

        const moteRef = doc(db, 'moter', moteInfo.id);
        
      let oppdatertData = {};
      
      if (erGjennomforing && gjennomforingsData) {
        // Konverter vedlegg til gyldig Firestore-format
        const konverterVedlegg = (vedlegg) => {
          if (!vedlegg || typeof vedlegg !== 'object') return null;
          return {
            type: String(vedlegg.type || 'image'),
            data: String(vedlegg.data || ''),
            timestamp: String(vedlegg.timestamp || new Date().toISOString()),
            navn: String(vedlegg.navn || 'Vedlegg'),
            id: String(vedlegg.id || Math.random().toString(36).substring(2, 15))
          };
        };

        // Konverter aksjoner til gyldig Firestore-format
        const konverterAksjon = (aksjon) => {
          if (!aksjon || typeof aksjon !== 'object') return null;
          return {
            ansvarlig: String(aksjon.ansvarlig || ''),
            beskrivelse: String(aksjon.beskrivelse || ''),
            frist: String(aksjon.frist || ''),
            opprettet: String(aksjon.opprettet || new Date().toISOString()),
            status: String(aksjon.status || 'åpen')
          };
        };

        oppdatertData = {
          id: String(gjennomforingsData.id || ''),
          tema: String(gjennomforingsData.tema || ''),
          dato: String(gjennomforingsData.dato || ''),
          startTid: String(gjennomforingsData.startTid || ''),
          innkallingsDato: String(gjennomforingsData.innkallingsDato || ''),
          eier: String(gjennomforingsData.eier || ''),
          fasilitator: String(gjennomforingsData.fasilitator || ''),
          referent: String(gjennomforingsData.referent || ''),
          hensikt: String(gjennomforingsData.hensikt || ''),
          mal: String(gjennomforingsData.mal || ''),
          erGjennomfort: true,
          gjennomforingsStatus: gjennomforingsData.gjennomforingsStatus ? {
            statusOppnadd: String(gjennomforingsData.gjennomforingsStatus.statusOppnadd || ''),
            nyDato: String(gjennomforingsData.gjennomforingsStatus.nyDato || ''),
            mal: String(gjennomforingsData.gjennomforingsStatus.mal || '')
          } : null,
          statusInfo: {
            fullfortePunkter: Number(gjennomforingsData.statusInfo?.fullfortePunkter || 0),
            gjenstaendePunkter: Number(gjennomforingsData.statusInfo?.gjenstaendePunkter || 0),
            totaltAntallPunkter: Number(gjennomforingsData.statusInfo?.totaltAntallPunkter || 0)
          },
          deltakere: Array.isArray(gjennomforingsData.deltakere) ? gjennomforingsData.deltakere.map(d => ({
            navn: String(d.navn || ''),
            fagFunksjon: String(d.fagFunksjon || ''),
            utfortStatus: String(d.utfortStatus || 'none'),
            oppmoteStatus: String(d.oppmoteStatus || 'none'),
            forberedelser: String(d.forberedelser || ''),
            epost: String(d.epost || '')
          })) : [],
          agendaPunkter: Array.isArray(gjennomforingsData.agendaPunkter) ? gjennomforingsData.agendaPunkter.map(punkt => {
            if (!punkt || typeof punkt !== 'object') return null;
            return {
              id: String(punkt.id || Math.random().toString(36).substring(2, 15)),
              punkt: String(punkt.punkt || ''),
              ansvarlig: String(punkt.ansvarlig || ''),
              varighet: Number(punkt.varighet || 15),
              startTid: punkt.startTid ? String(punkt.startTid) : null,
              ferdig: Boolean(punkt.ferdig),
              tidBrukt: punkt.tidBrukt ? Number(punkt.tidBrukt) : null,
              kommentar: String(punkt.kommentar || ''),
              notater: String(punkt.notater || ''),
              beslutninger: String(punkt.beslutninger || ''),
              vedlegg: Array.isArray(punkt.vedlegg) 
                ? punkt.vedlegg.map(konverterVedlegg).filter(v => v !== null)
                : [],
              aksjoner: Array.isArray(punkt.aksjoner)
                ? punkt.aksjoner.map(konverterAksjon).filter(a => a !== null)
                : [],
              erLast: Boolean(punkt.erLast)
            };
          }).filter(punkt => punkt !== null) : []
        };
      } else {
        // Vanlig lagring av møte
        oppdatertData = {
          tema: String(moteInfo.tema || ''),
          dato: String(moteInfo.dato || ''),
          startTid: String(moteInfo.startTid || ''),
          innkallingsDato: String(moteInfo.innkallingsDato || ''),
          eier: String(moteInfo.eier || ''),
          fasilitator: String(moteInfo.fasilitator || ''),
          referent: String(moteInfo.referent || ''),
          hensikt: String(moteInfo.hensikt || ''),
          mal: String(moteInfo.mal || ''),
          agendaPunkter: Array.isArray(agendaPunkter) ? agendaPunkter.map(punkt => ({
            id: String(punkt.id || Math.random().toString(36).substring(2, 15)),
            punkt: String(punkt.punkt || ''),
            ansvarlig: String(punkt.ansvarlig || ''),
            varighet: Number(punkt.varighet || 15),
            kommentar: String(punkt.kommentar || ''),
            vedlegg: [],
            aksjoner: []
          })) : [],
          deltakere: Array.isArray(deltakere) ? deltakere.map(d => ({
            fagFunksjon: String(d.fagFunksjon || ''),
            navn: String(d.navn || ''),
            epost: String(d.epost || ''),
            forberedelser: String(d.forberedelser || ''),
            utfortStatus: String(d.utfortStatus || 'none'),
            oppmoteStatus: String(d.oppmoteStatus || 'none')
          })) : [],
          sistOppdatert: serverTimestamp()
        };
      }

      await updateDoc(moteRef, oppdatertData);
      
      // Oppdater historikk
      const historikkRef = collection(db, 'moter', moteInfo.id, 'historikk');
      await addDoc(historikkRef, {
        ...oppdatertData,
        tidspunkt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Detaljert feil ved lagring:', error);
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
      const path = window.location.pathname;
      // Ikke redirect hvis vi er på en delt møte-URL
      if (!user && !path.startsWith('/delt/')) {
        setIsAuthenticated(false);
        setVisMoteSkjema(false);
        setVisLagredeMoter(true);
        navigate('/login');
      } else if (user) {
        setIsAuthenticated(true);
        hentLagredeMoter();
        setVisMoteSkjema(false);
        setVisLagredeMoter(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const lastMote = async (moteData) => {
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

    // Hent versjoner for møtet
    await hentVersjoner(moteData.id);

    // Start historikk-lytting
    const unsubscribeHistorikk = await hentHistorikk(moteData.id);
    
    // Cleanup når komponenten unmountes
    return () => {
      if (unsubscribeHistorikk) unsubscribeHistorikk();
    };
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

  // Funksjon for å lagre ny versjon i Firestore
  const lagreVersjon = async () => {
    try {
      if (!moteInfo.id) return; // Ikke lagre versjoner for umøter som ikke er lagret

      const versjonData = {
        moteId: moteInfo.id,
        tidspunkt: serverTimestamp(),
        endretAv: moteInfo.fasilitator || 'Ukjent',
        data: {
          moteInfo,
          deltakere,
          agendaPunkter
        }
      };

      // Legg til i Firestore
      await addDoc(collection(db, 'versjoner'), versjonData);

      // Hent oppdaterte versjoner
      await hentVersjoner(moteInfo.id);
    } catch (error) {
      console.error('Feil ved lagring av versjon:', error);
    }
  };

  // Funksjon for å hente versjoner fra Firestore
  const hentVersjoner = async (moteId) => {
    try {
      const versjonerRef = collection(db, 'versjoner');
      const q = query(
        versjonerRef, 
        where('moteId', '==', moteId),
        orderBy('tidspunkt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const versjonListe = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tidspunkt: doc.data().tidspunkt?.toDate() || new Date()
      }));

      setVersjoner(versjonListe);
    } catch (error) {
      console.error('Feil ved henting av versjoner:', error);
    }
  };

  // Oppdater useEffect for automatisk lagring
  useEffect(() => {
    if (sisteEndring && moteInfo.id) {
      const timer = setTimeout(() => {
        lagreVersjon();
      }, 10 * 60 * 1000); // 10 minutter
      
      return () => clearTimeout(timer);
    }
  }, [sisteEndring]);

  // Oppdater gjenopprettVersjon funksjonen
  const gjenopprettVersjon = async (versjon) => {
    if (!moteInfo.id || !versjon) return;

    try {
      const moteRef = doc(db, 'moter', moteInfo.id);
      await updateDoc(moteRef, {
        tema: versjon.endringer.tema,
        deltakere: versjon.endringer.deltakere,
        agendaPunkter: versjon.endringer.agendaPunkter,
        sistOppdatert: serverTimestamp()
      });

      setToastMessage('Tidligere versjon gjenopprettet');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Feil ved gjenoppretting:', error);
      alert('Kunne ikke gjenopprette versjonen');
    }
  };

  // Oppdater genererDelingsLink funksjonen
  const genererDelingsLink = async () => {
    try {
      if (!moteInfo.id) {
        alert('Du må lagre møtet først før du kan dele det');
        return;
      }

      // Generer en tilfeldig aksesstoken
      const aksessToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);

      // Oppdater møtet med aksesstoken
      const moteRef = doc(db, 'moter', moteInfo.id);
      await updateDoc(moteRef, {
        aksessToken,
        erDelt: true
      });

      // Generer full URL
      const baseUrl = window.location.origin;
      const delingsUrl = `${baseUrl}/delt/${moteInfo.id}/${aksessToken}`;

      // Kopier til utklippstavle
      await navigator.clipboard.writeText(delingsUrl);
      
      // Vis bekreftelse med Toast
      setToastMessage('Delingslink kopiert til utklippstavle!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

    } catch (error) {
      console.error('Feil ved generering av delingslink:', error);
      alert('Kunne ikke generere delingslink. Vennligst prøv igjen.');
    }
  };

  // Lytt til endringer i aktivt møte
  useEffect(() => {
    if (!moteInfo.id) return;

    console.log('Setter opp real-time lytter for møte:', moteInfo.id);
    
    const unsubscribe = onSnapshot(doc(db, 'moter', moteInfo.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Oppdater møtedata
        setMoteInfo({
          id: doc.id,
          tema: data.tema || '',
          dato: data.dato || '',
          startTid: data.startTid || '09:00',
          innkallingsDato: data.innkallingsDato || '',
          eier: data.eier || '',
          fasilitator: data.fasilitator || '',
          referent: data.referent || '',
          hensikt: data.hensikt || '',
          mal: data.mal || ''
        });
        
        // Oppdater deltakere og agenda
        setDeltakere(data.deltakere || []);
        setAgendaPunkter(data.agendaPunkter || []);
        
        console.log('Mottok real-time oppdatering for møte');
      }
    }, (error) => {
      console.error('Feil ved real-time oppdatering:', error);
    });

    // Cleanup listener når møtet endres eller komponenten unmountes
    return () => unsubscribe();
  }, [moteInfo.id]);

  // Legg til en funksjon for umiddelbar oppdatering
  const oppdaterMoteData = async (oppdateringer) => {
    if (!moteInfo.id) return;

    try {
      const moteRef = doc(db, 'moter', moteInfo.id);
      const oppdateringer = {
        tema: oppdateringer.tema,
        dato: oppdateringer.dato,
        startTid: oppdateringer.startTid,
        innkallingsDato: oppdateringer.innkallingsDato,
        eier: oppdateringer.eier,
        fasilitator: oppdateringer.fasilitator,
        referent: oppdateringer.referent,
        hensikt: oppdateringer.hensikt,
        mal: oppdateringer.mal,
        sistOppdatert: serverTimestamp()
      };

      updateDoc(moteRef, oppdateringer);
      // Ikke sett state direkte - la onSnapshot håndtere det
    } catch (error) {
      console.error('Feil ved oppdatering:', error);
    }
  };

  // Oppdater hvordan vi håndterer endringer i møtedata
  const handleMoteInfoChange = (oppdatertMoteInfo) => {
    if (!moteInfo.id) return;

    try {
      const moteRef = doc(db, 'moter', moteInfo.id);
      const oppdateringer = {
        tema: oppdatertMoteInfo.tema,
        dato: oppdatertMoteInfo.dato,
        startTid: oppdatertMoteInfo.startTid,
        innkallingsDato: oppdatertMoteInfo.innkallingsDato,
        eier: oppdatertMoteInfo.eier,
        fasilitator: oppdatertMoteInfo.fasilitator,
        referent: oppdatertMoteInfo.referent,
        hensikt: oppdatertMoteInfo.hensikt,
        mal: oppdatertMoteInfo.mal,
        sistOppdatert: serverTimestamp()
      };

      updateDoc(moteRef, oppdateringer);
      // Ikke sett state direkte - la onSnapshot håndtere det
    } catch (error) {
      console.error('Feil ved oppdatering:', error);
    }
  };

  // Oppdater handleDeltakereChange
  const handleDeltakereChange = (oppdaterteDeltakere) => {
    if (!moteInfo.id) return;

    try {
      const moteRef = doc(db, 'moter', moteInfo.id);
      updateDoc(moteRef, {
        deltakere: oppdaterteDeltakere.map(d => ({
          fagFunksjon: d.fagFunksjon || '',
          navn: d.navn || '',
          epost: d.epost || '',
          forberedelser: d.forberedelser || '',
          utfortStatus: d.utfortStatus || 'none',
          oppmoteStatus: d.oppmoteStatus || 'none'
        })),
        sistOppdatert: serverTimestamp()
      });
    } catch (error) {
      console.error('Feil ved oppdatering av deltakere:', error);
    }
  };

  // Oppdater handleAgendaChange
  const handleAgendaChange = (oppdatertAgenda) => {
    if (!moteInfo.id) return;

    try {
      const moteRef = doc(db, 'moter', moteInfo.id);
      updateDoc(moteRef, {
        agendaPunkter: oppdatertAgenda.map(a => ({
          // Grunnleggende felter
          punkt: a.punkt || '',
          ansvarlig: a.ansvarlig || '',
          varighet: a.varighet || 15,
          fullfort: a.fullfort || false,
          
          // Gjennomføringsdata
          startTid: a.startTid || null,
          ferdig: a.ferdig || false,
          tidBrukt: a.tidBrukt || null,
          
          // Kommentarer og notater
          kommentar: a.kommentar || '',
          notater: a.notater || '',
          beslutninger: a.beslutninger || '',
          
          // Vedlegg
          vedlegg: Array.isArray(a.vedlegg) ? a.vedlegg.map(v => ({
            type: v.type,
            data: v.data,
            timestamp: v.timestamp,
            navn: v.navn,
            id: v.id
          })) : [],
          
          // Aksjoner
          aksjoner: Array.isArray(a.aksjoner) ? a.aksjoner.map(aksjon => ({
            ansvarlig: aksjon.ansvarlig,
            beskrivelse: aksjon.beskrivelse,
            frist: aksjon.frist,
            opprettet: aksjon.opprettet,
            status: aksjon.status
          })) : [],
          
          // Status
          erLast: a.erLast || false
        })),
        sistOppdatert: serverTimestamp()
      });
    } catch (error) {
      console.error('Feil ved oppdatering av agenda:', error);
    }
  };

  // Legg til en funksjon for å hente historikk
  const hentHistorikk = async (moteId) => {
    if (!moteId) return;

    try {
      const historikkRef = collection(db, 'moter', moteId, 'historikk');
      const q = query(historikkRef, orderBy('tidspunkt', 'desc'));
      
      // Sett opp real-time lytter for historikk
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const historikkData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          historikkData.push({
            id: doc.id,
            tidspunkt: data.tidspunkt?.toDate() || new Date(),
            endretAv: data.endretAv,
            endringer: {
              tema: data.tema,
              deltakere: data.deltakere,
              agendaPunkter: data.agendaPunkter
            }
          });
        });
        setVersjoner(historikkData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Feil ved henting av historikk:', error);
    }
  };

  const handleManuellLagring = async () => {
    try {
      if (!moteInfo.id || !auth.currentUser) {
        setToastMessage('Du må være logget inn og ha et aktivt møte for å lagre');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      const moteRef = doc(db, 'moter', moteInfo.id);
      await updateDoc(moteRef, {
        tema: moteInfo.tema || '',
        dato: moteInfo.dato || '',
        startTid: moteInfo.startTid || '09:00',
        innkallingsDato: moteInfo.innkallingsDato || '',
        eier: moteInfo.eier || '',
        fasilitator: moteInfo.fasilitator || '',
        referent: moteInfo.referent || '',
        hensikt: moteInfo.hensikt || '',
        mal: moteInfo.mal || '',
        deltakere: deltakere.map(d => ({
          ...d,
          fagFunksjon: d.fagFunksjon || '',
          navn: d.navn || '',
          epost: d.epost || '',
          forberedelser: d.forberedelser || ''
        })),
        agendaPunkter: agendaPunkter.map(a => ({
          ...a,
          punkt: a.punkt || '',
          ansvarlig: a.ansvarlig || '',
          varighet: a.varighet || 15
        })),
        sistOppdatert: serverTimestamp()
      });

      setToastMessage('Møtet er lagret');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Feil ved lagring:', error);
      setToastMessage('Kunne ikke lagre møtet. Sjekk at du er logget inn og har tilgang.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
      <Route path="/login" element={
        !isAuthenticated ? (
          <Login setIsAuthenticated={setIsAuthenticated} />
        ) : (
          <Navigate to="/" />
        )
      } />
      
      {/* Offentlige ruter - ingen auth-sjekk */}
      <Route path="/delt/:moteId/:token" element={<DeltMote />} />
      <Route path="/survey/:moteId" element={<SurveyForm />} />
      <Route path="/survey-results/:moteId" element={<SurveyResults />} />
      
      {/* Beskyttet hovedrute */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <div className="min-h-screen bg-gray-100">
              {showToast && (
                <Toast 
                  message={toastMessage || 'Agenda er lagret!'} 
                  onClose={() => setShowToast(false)} 
                />
              )}
              <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-2 sm:space-x-8">
                      <div className="flex items-center">
                        <img 
                          src="/Logolean.png" 
                          alt="ICE Meeting" 
                          className="h-6 sm:h-8 w-auto"
                        />
                        <span className="ml-2 sm:ml-3 text-base sm:text-xl font-light text-gray-900">ICE Meeting</span>
                      </div>
                      <button
                        onClick={nyttMote}
                        className="hidden sm:inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                      >
                        <PlusCircle size={16} className="mr-1 sm:mr-2" />
                        <span className="whitespace-nowrap">Nytt møte</span>
                      </button>
                      {/* Mobil Nytt møte-knapp */}
                      <button
                        onClick={nyttMote}
                        className="sm:hidden inline-flex items-center p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                        aria-label="Nytt møte"
                      >
                        <PlusCircle size={18} />
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      {/* Desktop verktøylinje */}
                      <div className="hidden sm:flex items-end space-x-6 h-8">
                        <button 
                          onClick={handleManuellLagring}
                          className="text-gray-700 hover:text-gray-900 transition-colors duration-200 relative group pb-1"
                          title="Lagre møte"
                        >
                          <Save size={18} />
                          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Lagre møte
                          </span>
                        </button>
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
                          onClick={genererDelingsLink}
                          className="text-gray-700 hover:text-gray-900 transition-colors duration-200 relative group pb-1"
                          title="Del møte"
                        >
                          <Share size={18} />
                          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Del møte
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
                      
                      {/* Mobil verktøylinje - kompakt */}
                      <div className="flex sm:hidden items-center space-x-1.5">
                        <button 
                          onClick={handleManuellLagring}
                          className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100"
                          title="Lagre møte"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={startMote}
                          className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100"
                          title="Start møte"
                        >
                          <Play size={18} />
                        </button>
                        <button 
                          onClick={genererDelingsLink}
                          className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100"
                          title="Del møte"
                        >
                          <Share size={18} />
                        </button>
                        <div className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100">
                          <AgendaPrintView
                            moteInfo={moteInfo}
                            deltakere={deltakere}
                            agendaPunkter={agendaPunkter}
                            iconOnly={true}
                          />
                        </div>
                        <button 
                          onClick={handleLogout}
                          className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100"
                          title="Logg ut"
                        >
                          <LogOut size={18} />
                        </button>
                      </div>
                      
                      <div className="ml-3 sm:ml-6">
                      <VersjonsHistorikk 
                        versjoner={versjoner}
                        onVelgVersjon={gjenopprettVersjon}
                      />
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
                        setAgendaPunkter={handleAgendaChange}
                        startTid={moteInfo.startTid}
                        deltakere={deltakere}
                        onDragEnd={handleDragEnd}
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