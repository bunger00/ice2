import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

function MoteInformasjon({ moteInfo, setMoteInfo, deltakere, setDeltakere }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showInnkallingsDato, setShowInnkallingsDato] = useState(true);
  const [pendingParticipant, setPendingParticipant] = useState(null);
  const [showDropdown, setShowDropdown] = useState({ eier: false, fasilitator: false, referent: false });
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Sett starttid til 09:00 og dagens dato som innkallingsdato når komponenten lastes
    if (moteInfo.startTid !== '09:00' || !moteInfo.innkallingsDato) {
      setMoteInfo({ 
        ...moteInfo, 
        startTid: '09:00',
        innkallingsDato: !moteInfo.innkallingsDato ? new Date().toISOString().split('T')[0] : moteInfo.innkallingsDato
      });
    }
  }, []);

  useEffect(() => {
    const savedPreference = localStorage.getItem('showInnkallingsDato');
    if (savedPreference !== null) {
      setShowInnkallingsDato(savedPreference === 'true');
    }
  }, []);

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
    
    // Hvis det blir 60 minutter, juster timen
    if (roundedMinutes === 60) {
      const newHours = (parseInt(hours) + 1).toString().padStart(2, '0');
      setMoteInfo({ ...moteInfo, startTid: `${newHours}:00` });
    } else {
      setMoteInfo({ ...moteInfo, startTid: `${hours}:${formattedMinutes}` });
    }
  };

  const toggleInnkallingsDato = () => {
    const newValue = !showInnkallingsDato;
    setShowInnkallingsDato(newValue);
    localStorage.setItem('showInnkallingsDato', newValue);
    
    if (!newValue) {
      setMoteInfo({ ...moteInfo, innkallingsDato: '' });
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

  const renderRoleInput = (role, label) => {
    const names = getAllUniqueNames();
    
    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
            value={moteInfo[role]}
            onChange={(e) => handleRoleChange(role, e.target.value)}
            onFocus={() => setShowDropdown({ ...showDropdown, [role]: true })}
            onBlur={(e) => {
              setTimeout(() => {
                handleRoleBlur(role, e.target.value);
                setShowDropdown({ ...showDropdown, [role]: false });
              }, 200);
            }}
          />
          {showDropdown[role] && names.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {names.map((navn) => (
                <div
                  key={navn}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
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
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold">Møteinformasjon</h2>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Møtetema</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
              value={moteInfo.tema}
              onChange={(e) => setMoteInfo({...moteInfo, tema: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dato for møtet</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
                value={moteInfo.dato}
                onChange={(e) => setMoteInfo({...moteInfo, dato: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starttid
              </label>
              <select
                value={moteInfo.startTid}
                onChange={handleTimeChange}
                className="w-full p-2 border rounded-md"
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

          <div className={showInnkallingsDato ? 'block' : 'hidden'}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Innkallingsdato
              </label>
              <button
                onClick={toggleInnkallingsDato}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={showInnkallingsDato ? "Skjul innkallingsdato" : "Vis innkallingsdato"}
              >
                {showInnkallingsDato ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
              value={moteInfo.innkallingsDato}
              onChange={(e) => setMoteInfo({...moteInfo, innkallingsDato: e.target.value})}
            />
          </div>

          {!showInnkallingsDato && (
            <div className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
              <span className="text-sm text-gray-500">Innkallingsdato er skjult</span>
              <button
                onClick={toggleInnkallingsDato}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  Vis felt
                </div>
              </button>
            </div>
          )}

          <div>
            {renderRoleInput('eier', 'Møteeier')}
          </div>

          <div>
            {renderRoleInput('fasilitator', 'Fasilitator')}
          </div>

          <div>
            {renderRoleInput('referent', 'Referent')}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Hensikt med møtet
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
              rows="2"
              value={moteInfo.hensikt}
              onChange={(e) => setMoteInfo({...moteInfo, hensikt: e.target.value})}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Målsetting for møtet
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
              rows="2"
              value={moteInfo.mal}
              onChange={(e) => setMoteInfo({...moteInfo, mal: e.target.value})}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MoteInformasjon; 