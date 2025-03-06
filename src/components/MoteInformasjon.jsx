import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Calendar, Clock, User, Users, Flag, MessageSquare, Target, HelpCircle } from 'lucide-react';
import AIMalValidering from './AIMalValidering';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

function MoteInformasjon({ moteInfo, setMoteInfo, deltakere, setDeltakere }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInnkallingsDato, setShowInnkallingsDato] = useState(true);
  const [pendingParticipant, setPendingParticipant] = useState(null);
  const [showDropdown, setShowDropdown] = useState({ eier: false, fasilitator: false, referent: false });
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Sett starttid til 09:00 og dagens dato som innkallingsdato BARE hvis komponenten opprettes første gang
    if (!moteInfo.startTid && !moteInfo.innkallingsDato) {
      setMoteInfo(prevState => ({ 
        ...prevState, 
        startTid: '09:00',
        innkallingsDato: new Date().toISOString().split('T')[0]
      }));
    } else if (!moteInfo.innkallingsDato) {
      // Hvis starttid er satt, men ikke innkallingsDato, oppdater bare innkallingsDato
      setMoteInfo(prevState => ({ 
        ...prevState, 
        innkallingsDato: new Date().toISOString().split('T')[0]
      }));
    }
  }, []);

  useEffect(() => {
    const savedPreference = localStorage.getItem('showInnkallingsDato');
    if (savedPreference !== null) {
      setShowInnkallingsDato(savedPreference === 'true');
    }
  }, []);

  // Legg til en useEffect for å laste inn lagret starttid fra localStorage
  useEffect(() => {
    if (moteInfo.id) {
      const lagretStartTid = localStorage.getItem(`mote_${moteInfo.id}_startTid`);
      if (lagretStartTid) {
        console.log(`Laster starttid ${lagretStartTid} fra localStorage for møte ${moteInfo.id}`);
        // Forsiktig oppdatering av starttid uten å overskrive andre felter
        setMoteInfo(prevState => ({
          ...prevState,
          startTid: lagretStartTid
        }));
      }
    }
  }, [moteInfo.id]);

  // Hent unike navn fra deltakerlisten
  const deltakerNavn = deltakere
    .map(d => d.navn)
    .filter(navn => navn.trim() !== '');

  // Hent alle unike navn fra deltakerlisten, inkludert de som er i roller
  const getAllUniqueNames = () => {
    const allNames = new Set([
      ...deltakere.map(d => d.navn),
      moteInfo.eier,
      moteInfo.fasilitator,
      moteInfo.referent
    ]);
    
    // Fjern bare tomme verdier, ingen filtrering basert på input
    return Array.from(allNames)
      .filter(navn => navn && navn.trim() !== '')
      .sort();
  };

  const handleRoleChange = (role, value) => {
    setMoteInfo({ ...moteInfo, [role]: value });
  };

  const handleRoleBlur = (role, value) => {
    if (!value || deltakerNavn.includes(value)) return;
    
    if (pendingParticipant?.navn !== value) {
      const nyDeltaker = {
        fagFunksjon: '',
        navn: value,
        forberedelser: '',
        epost: ''
      };

      const emptyIndex = deltakere.findIndex(d => !d.navn);
      if (emptyIndex !== -1) {
        const oppdaterteDeltakere = [...deltakere];
        oppdaterteDeltakere[emptyIndex] = nyDeltaker;
        setDeltakere(oppdaterteDeltakere);
      } else {
        setDeltakere([...deltakere, nyDeltaker]);
      }
      
      setPendingParticipant(nyDeltaker);
    }
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    const [hours, minutes] = time.split(':');
    
    // Rund av til nærmeste 10 minutter
    const roundedMinutes = Math.round(minutes / 10) * 10;
    const formattedMinutes = roundedMinutes.toString().padStart(2, '0');
    
    let nyStartTid = '';
    
    // Hvis det blir 60 minutter, juster timen
    if (roundedMinutes === 60) {
      const newHours = (parseInt(hours) + 1).toString().padStart(2, '0');
      nyStartTid = `${newHours}:00`;
    } else {
      nyStartTid = `${hours}:${formattedMinutes}`;
    }
    
    // Oppdater lokalt state
    setMoteInfo(prevState => ({ ...prevState, startTid: nyStartTid }));
    
    // Lagre endringen direkte til localStorage for å unngå reset
    if (moteInfo.id) {
      localStorage.setItem(`mote_${moteInfo.id}_startTid`, nyStartTid);
      console.log(`Starttid ${nyStartTid} lagret for møte ${moteInfo.id} i localStorage`);
      
      // Lagre direkte til Firestore også
      const moteRef = doc(db, 'moter', moteInfo.id);
      updateDoc(moteRef, { startTid: nyStartTid })
        .then(() => console.log(`Starttid ${nyStartTid} lagret direkte til Firestore`))
        .catch(err => console.error('Feil ved lagring av starttid til Firestore:', err));
    }
  };

  const toggleInnkallingsDato = () => {
    const newValue = !showInnkallingsDato;
    setShowInnkallingsDato(newValue);
    localStorage.setItem('showInnkallingsDato', newValue);
    
    if (!newValue) {
      setMoteInfo(prevState => ({ ...prevState, innkallingsDato: '' }));
    }
  };

  // Lukk dropdown når man klikker utenfor
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown({ eier: false, fasilitator: false, referent: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderRoleInput = (role, label, icon) => {
    const names = getAllUniqueNames();
    
    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <div className="relative">
          <div className="flex items-center relative rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
            <span className="pl-3 text-gray-500">{icon}</span>
            <input
              type="text"
              className="block w-full pl-2 py-2.5 rounded-md focus:outline-none"
              value={moteInfo[role]}
              onChange={(e) => {
                const nyVerdi = e.target.value;
                handleRoleChange(role, nyVerdi);
                
                // Lagre direkte til Firestore hvis møtet er lagret
                if (moteInfo.id) {
                  const moteRef = doc(db, 'moter', moteInfo.id);
                  updateDoc(moteRef, { [role]: nyVerdi })
                    .catch(err => console.error(`Feil ved lagring av ${role} til Firestore:`, err));
                }
              }}
              onFocus={() => setShowDropdown({ ...showDropdown, [role]: true })}
              onBlur={(e) => {
                setTimeout(() => {
                  handleRoleBlur(role, e.target.value);
                  setShowDropdown({ ...showDropdown, [role]: false });
                }, 200);
              }}
              placeholder={`Velg ${label.toLowerCase()}`}
            />
          </div>

          {showDropdown[role] && names.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {names.map((navn) => (
                <div
                  key={navn}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                  onMouseDown={() => {
                    handleRoleChange(role, navn);
                    setShowDropdown({ ...showDropdown, [role]: false });
                  }}
                >
                  {navn}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-200">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <MessageSquare size={20} className="text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-800">Møteinformasjon</h2>
        </div>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          {isExpanded ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-6">
          {/* Møtetema */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Møtetema</label>
              <div className="relative flex items-center rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <span className="pl-3 text-gray-500"><Flag size={18} /></span>
                <input
                  type="text"
                  className="block w-full pl-2 py-2.5 rounded-md focus:outline-none"
                  value={moteInfo.tema}
                  onChange={(e) => {
                    const nyVerdi = e.target.value;
                    setMoteInfo({...moteInfo, tema: nyVerdi});
                    
                    // Lagre direkte til Firestore hvis møtet er lagret
                    if (moteInfo.id) {
                      const moteRef = doc(db, 'moter', moteInfo.id);
                      updateDoc(moteRef, { tema: nyVerdi })
                        .catch(err => console.error('Feil ved lagring av tema til Firestore:', err));
                    }
                  }}
                  placeholder="Skriv inn møtetema"
                />
              </div>
            </div>

            {/* Dato og tid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dato for møtet</label>
                <div className="relative flex items-center rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                  <span className="pl-3 text-gray-500"><Calendar size={18} /></span>
                  <input
                    type="date"
                    className="block w-full pl-2 py-2.5 rounded-md focus:outline-none"
                    value={moteInfo.dato}
                    onChange={(e) => {
                      const nyVerdi = e.target.value;
                      setMoteInfo({...moteInfo, dato: nyVerdi});
                      
                      // Lagre direkte til Firestore hvis møtet er lagret
                      if (moteInfo.id) {
                        const moteRef = doc(db, 'moter', moteInfo.id);
                        updateDoc(moteRef, { dato: nyVerdi })
                          .catch(err => console.error('Feil ved lagring av dato til Firestore:', err));
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Starttid</label>
                <div className="relative flex items-center rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                  <span className="pl-3 text-gray-500"><Clock size={18} /></span>
                  <select
                    value={moteInfo.startTid || '09:00'}
                    onChange={handleTimeChange}
                    className="block w-full pl-2 py-2.5 rounded-md focus:outline-none appearance-none bg-transparent"
                  >
                    {Array.from({ length: 9 }).map((_, hourIndex) => { // 9 timer fra 8 til 16
                      const hour = hourIndex + 8; // Starter på 8
                      return Array.from({ length: 6 }).map((_, tenMinutes) => {
                        const formattedHour = hour.toString().padStart(2, '0');
                        const formattedMinutes = (tenMinutes * 10).toString().padStart(2, '0');
                        const timeString = `${formattedHour}:${formattedMinutes}`;
                        return (
                          <option key={timeString} value={timeString}>
                            {timeString}
                          </option>
                        );
                      });
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Innkallingsdato og roller */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className={`mb-4 ${showInnkallingsDato ? 'block' : 'hidden'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Innkallingsdato
                </label>
                <button
                  onClick={toggleInnkallingsDato}
                  className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors"
                  title={showInnkallingsDato ? "Skjul innkallingsdato" : "Vis innkallingsdato"}
                >
                  {showInnkallingsDato ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="relative flex items-center rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <span className="pl-3 text-gray-500"><Calendar size={18} /></span>
                <input
                  type="date"
                  className="block w-full pl-2 py-2.5 rounded-md focus:outline-none"
                  value={moteInfo.innkallingsDato}
                  onChange={(e) => {
                    const nyVerdi = e.target.value;
                    setMoteInfo({...moteInfo, innkallingsDato: nyVerdi});
                    
                    // Lagre direkte til Firestore hvis møtet er lagret
                    if (moteInfo.id) {
                      const moteRef = doc(db, 'moter', moteInfo.id);
                      updateDoc(moteRef, { innkallingsDato: nyVerdi })
                        .catch(err => console.error('Feil ved lagring av innkallingsdato til Firestore:', err));
                    }
                  }}
                />
              </div>
            </div>

            {!showInnkallingsDato && (
              <button 
                onClick={toggleInnkallingsDato}
                className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Eye size={16} />
                <span>Vis innkallingsdato</span>
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderRoleInput('eier', 'Møteeier', <User size={18} />)}
              {renderRoleInput('fasilitator', 'Fasilitator', <Users size={18} />)}
              {renderRoleInput('referent', 'Referent', <Users size={18} />)}
            </div>
          </div>

          {/* Hensikt og målsetting */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hensikt med møtet</label>
              <div className="relative flex rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <span className="pl-3 pt-3 text-gray-500 self-start"><HelpCircle size={18} /></span>
                <textarea
                  rows="2"
                  className="block w-full pl-2 py-2.5 rounded-md focus:outline-none resize-none"
                  value={moteInfo.hensikt}
                  onChange={(e) => {
                    const nyVerdi = e.target.value;
                    setMoteInfo({...moteInfo, hensikt: nyVerdi});
                    
                    // Lagre direkte til Firestore hvis møtet er lagret
                    if (moteInfo.id) {
                      const moteRef = doc(db, 'moter', moteInfo.id);
                      updateDoc(moteRef, { hensikt: nyVerdi })
                        .catch(err => console.error('Feil ved lagring av hensikt til Firestore:', err));
                    }
                  }}
                  placeholder="Beskriv hensikten med møtet"
                />
              </div>
            </div>
              
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Målsetting for møtet</label>
              <div className="flex">
                <div className="w-full relative flex rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                  <span className="pl-3 pt-3 text-gray-500 self-start"><Target size={18} /></span>
                  <textarea
                    rows="2"
                    className="block w-full pl-2 py-2.5 rounded-md focus:outline-none resize-none"
                    value={moteInfo.mal}
                    onChange={(e) => {
                      const nyVerdi = e.target.value;
                      setMoteInfo({...moteInfo, mal: nyVerdi});
                      
                      // Lagre direkte til Firestore hvis møtet er lagret
                      if (moteInfo.id) {
                        const moteRef = doc(db, 'moter', moteInfo.id);
                        updateDoc(moteRef, { mal: nyVerdi })
                          .catch(err => console.error('Feil ved lagring av målsetting til Firestore:', err));
                      }
                    }}
                    placeholder="Sett et tydelig mål"
                  />
                </div>
              </div>
              <div className="mt-2">
                <AIMalValidering 
                  mal={moteInfo.mal}
                  onUpdateMal={(nyMal) => {
                    const nyVerdi = nyMal;
                    setMoteInfo({...moteInfo, mal: nyVerdi});
                    
                    // Lagre direkte til Firestore hvis møtet er lagret
                    if (moteInfo.id) {
                      const moteRef = doc(db, 'moter', moteInfo.id);
                      updateDoc(moteRef, { mal: nyVerdi })
                        .catch(err => console.error('Feil ved lagring av målsetting til Firestore:', err));
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoteInformasjon; 