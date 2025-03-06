import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Check, Users, Briefcase, Mail, BookOpen, Download, PlusCircle } from 'lucide-react';
import useAutoSave from '../hooks/useAutoSave';

function Deltakere({ deltakere, setDeltakere, disabled, moteId }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [epostListe, setEpostListe] = useState('');
  const [setHarEndringer, setSisteEndring] = useAutoSave(moteId, deltakere, 'deltakere');

  const fagFunksjoner = [
    { kode: 'ARK', navn: 'ARK - Arkitekt' },
    { kode: 'RIB', navn: 'RIB - Rådgivende Ingeniør Bygg' },
    { kode: 'RIV', navn: 'RIV - Rådgivende Ingeniør VVS' },
    { kode: 'RIE', navn: 'RIE - Rådgivende Ingeniør Elektro' },
    { kode: 'RIVA', navn: 'RIVA - Rådgivende Ingeniør VA' },
    { kode: 'LARK', navn: 'LARK - Landskapsarkitekt' },
    { kode: 'RIBr', navn: 'RIBr - Rådgivende Ingeniør Brann' },
  ];

  useEffect(() => {
    // Legg til 3 tomme deltakere når komponenten lastes hvis det ikke finnes noen
    if (deltakere.length === 0) {
      setDeltakere([
        { fagFunksjon: '', navn: '', forberedelser: '', epost: '', fullfort: false },
        { fagFunksjon: '', navn: '', forberedelser: '', epost: '', fullfort: false },
        { fagFunksjon: '', navn: '', forberedelser: '', epost: '', fullfort: false }
      ]);
    }
  }, []);

  const handleDeltakerEndring = (index, felt, verdi) => {
    const nyeDeltakere = [...deltakere];
    nyeDeltakere[index][felt] = verdi;
    setDeltakere(nyeDeltakere);
    setHarEndringer(true);
    setSisteEndring(new Date());
  };

  const handleEpostListeEndring = (verdi) => {
    // Bare oppdater tekstfelt-verdien, ikke prosesser e-poster automatisk
    setEpostListe(verdi);
  };
  
  // Ny funksjon for å legge til deltakere fra e-postlisten
  const leggTilFraEpostliste = () => {
    if (epostListe.trim()) {
      // Del opp på linjeskift, semikolon eller komma
      const linjer = epostListe
        .split(/[;\n,]+/)
        .map(e => e.trim())
        .filter(e => e && e.includes('@')); // Sørg for at vi bare tar med linjer som inneholder @
      
      const nyeDeltakere = linjer.map(linje => {
        // Sjekk om det er et format med navn og e-post, f.eks. "Navn <epost@example.com>"
        const epostMatch = linje.match(/<(.+?)>/);
        
        if (epostMatch) {
          // Format: "Navn <epost@example.com>"
          const epost = epostMatch[1].trim(); // Hent kun teksten mellom < og >
          
          // Hent navnet (alt før <) og behandle det
          let navn = linje.split('<')[0].trim();
          
          // Håndter "Etternavn, Fornavn" format
          if (navn.includes(',')) {
            const deler = navn.split(',').map(n => n.trim());
            if (deler.length >= 2) {
              const etternavn = deler[0];
              const fornavn = deler[1].split(' ')[0]; // Tar første ord etter komma
              navn = `${fornavn} ${etternavn}`;
            }
          }
          
          // Erstatt punktum med mellomrom i navnet (etter håndtering av komma)
          navn = navn.replace(/\./g, ' ');
          
          return {
            fagFunksjon: '',
            navn: navn,
            forberedelser: '',
            epost: epost
          };
        } else if (linje.includes('@')) {
          // Format: Bare e-postadresse uten navn
          const epost = linje.trim();
          
          // Bruk teksten før @ som navn og erstatt punktum med mellomrom
          let navn = epost.split('@')[0].replace(/\./g, ' ');
          
          return {
            fagFunksjon: '',
            navn: navn,
            forberedelser: '',
            epost: epost
          };
        }
        
        return null;
      }).filter(Boolean);

      if (nyeDeltakere.length > 0) {
        // Behold eksisterende deltakere som har data
        const eksisterendeDeltakere = deltakere.filter(d => 
          d.navn || d.fagFunksjon || d.epost || d.forberedelser
        );

        // Hvis vi har eksisterende deltakere, legg til nye under dem
        setDeltakere([...eksisterendeDeltakere, ...nyeDeltakere]);
        
        // Tøm input-feltet etter vellykket parsing
        setEpostListe('');
      }
    }
  };

  const handleAddRow = () => {
    setDeltakere([...deltakere, { fagFunksjon: '', navn: '', forberedelser: '', epost: '' }]);
  };

  const fjernDeltaker = (index) => {
    const nyeDeltakere = deltakere.filter((_, i) => i !== index);
    setDeltakere(nyeDeltakere);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-200">
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Users size={20} className="text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-800">Deltakere</h2>
        </div>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          {isExpanded ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Paste e-post list section - gjort mindre og mer kompakt */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Mail size={16} className="text-blue-500 mr-2" />
              <label className="text-sm font-medium text-gray-700">
                Legg til deltakere fra e-postliste
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <textarea
                  value={epostListe}
                  onChange={(e) => handleEpostListeEndring(e.target.value)}
                  className="w-full p-2 border border-gray-300 text-sm rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="2"
                  placeholder="Lim inn e-poster (Format: Navn <epost@example.com>)"
                  disabled={disabled}
                />
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={leggTilFraEpostliste}
                  disabled={!epostListe.trim() || disabled}
                  className="h-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center">
                    <PlusCircle size={16} className="mr-2" />
                    Legg til
                  </span>
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-start">
              <Download size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <span>Støtter både "Navn &lt;epost@eksempel.no&gt;" og direkte e-postadresser. Del med semikolon, komma eller linjeskift.</span>
            </div>
          </div>

          {/* Deltaker table */}
          <div className="bg-gray-50 p-4 rounded-lg">
            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-[120px_180px_1fr_1fr_40px] gap-4 p-3 bg-gray-100 rounded-t-lg mb-3">
              <div className="font-medium text-gray-700 flex items-center">
                <Briefcase size={16} className="mr-2 text-gray-500" />
                <span>Funksjon</span>
              </div>
              <div className="font-medium text-gray-700 flex items-center">
                <Users size={16} className="mr-2 text-gray-500" />
                <span>Navn</span>
              </div>
              <div className="font-medium text-gray-700 flex items-center">
                <Mail size={16} className="mr-2 text-gray-500" />
                <span>E-post</span>
              </div>
              <div className="font-medium text-gray-700 flex items-center">
                <BookOpen size={16} className="mr-2 text-gray-500" />
                <span>Forberedelser</span>
              </div>
              <div></div>
            </div>

            <div className="space-y-3">
              {deltakere.map((deltaker, index) => (
                <div key={index} className="group">
                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-[120px_180px_1fr_1fr_40px] gap-4 p-3 bg-white rounded-md border border-gray-200 hover:border-blue-200 transition-colors">
                    <div className="flex items-center">
                      <div className="relative flex items-center w-full rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                        <span className="pl-2 text-gray-500"><Briefcase size={16} /></span>
                        <input
                          type="text"
                          value={deltaker.fagFunksjon}
                          onChange={(e) => handleDeltakerEndring(index, 'fagFunksjon', e.target.value)}
                          className="w-full pl-2 py-1.5 rounded-md focus:outline-none text-sm"
                          placeholder="Funksjon"
                          disabled={disabled}
                          list={`fagfunksjon-list-${index}`}
                        />
                        <datalist id={`fagfunksjon-list-${index}`}>
                          {fagFunksjoner.map(f => (
                            <option key={f.kode} value={f.kode}>{f.navn}</option>
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="relative flex items-center w-full rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                        <span className="pl-2 text-gray-500"><Users size={16} /></span>
                        <input
                          type="text"
                          value={deltaker.navn}
                          onChange={(e) => handleDeltakerEndring(index, 'navn', e.target.value)}
                          className="w-full pl-2 py-1.5 rounded-md focus:outline-none text-sm"
                          placeholder="Navn"
                          disabled={disabled}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="relative flex items-center w-full rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                        <span className="pl-2 text-gray-500"><Mail size={16} /></span>
                        <input
                          type="email"
                          value={deltaker.epost}
                          onChange={(e) => handleDeltakerEndring(index, 'epost', e.target.value)}
                          className="w-full pl-2 py-1.5 rounded-md focus:outline-none text-sm"
                          placeholder="E-post"
                          disabled={disabled}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="relative flex items-center w-full rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                        <span className="pl-2 text-gray-500"><BookOpen size={16} /></span>
                        <input
                          type="text"
                          value={deltaker.forberedelser}
                          onChange={(e) => handleDeltakerEndring(index, 'forberedelser', e.target.value)}
                          className="w-full pl-2 py-1.5 rounded-md focus:outline-none text-sm"
                          placeholder="Forberedelser"
                          disabled={disabled}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      {!disabled && (
                        <button
                          onClick={() => fjernDeltaker(index)}
                          className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Fjern deltaker"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className="block md:hidden p-4 bg-white rounded-md border border-gray-200 hover:border-blue-200 transition-colors">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          <div className="flex items-center">
                            <Briefcase size={14} className="mr-1" />
                            <span>Funksjon</span>
                          </div>
                        </label>
                        {!disabled && (
                          <button
                            onClick={() => fjernDeltaker(index)}
                            className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Fjern deltaker"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={deltaker.fagFunksjon}
                        onChange={(e) => handleDeltakerEndring(index, 'fagFunksjon', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Funksjon"
                        disabled={disabled}
                        list={`fagfunksjon-mobile-list-${index}`}
                      />
                      <datalist id={`fagfunksjon-mobile-list-${index}`}>
                        {fagFunksjoner.map(f => (
                          <option key={f.kode} value={f.kode}>{f.navn}</option>
                        ))}
                      </datalist>

                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        <div className="flex items-center">
                          <Users size={14} className="mr-1" />
                          <span>Navn</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={deltaker.navn}
                        onChange={(e) => handleDeltakerEndring(index, 'navn', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Navn"
                        disabled={disabled}
                      />

                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        <div className="flex items-center">
                          <Mail size={14} className="mr-1" />
                          <span>E-post</span>
                        </div>
                      </label>
                      <input
                        type="email"
                        value={deltaker.epost}
                        onChange={(e) => handleDeltakerEndring(index, 'epost', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="E-post"
                        disabled={disabled}
                      />

                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        <div className="flex items-center">
                          <BookOpen size={14} className="mr-1" />
                          <span>Forberedelser</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={deltaker.forberedelser}
                        onChange={(e) => handleDeltakerEndring(index, 'forberedelser', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Forberedelser"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!disabled && (
              <button
                onClick={handleAddRow}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <PlusCircle size={16} />
                Legg til deltaker
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Deltakere; 