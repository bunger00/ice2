import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Check } from 'lucide-react';
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
    // ... legg til flere funksjoner etter behov
  ];

  useEffect(() => {
    // Legg til 3 tomme deltakere når komponenten lastes hvis det ikke finnes noen
    if (deltakere.length === 0) {
      setDeltakere([
        { fagFunksjon: '', navn: '', forberedelser: '', fullfort: false },
        { fagFunksjon: '', navn: '', forberedelser: '', fullfort: false },
        { fagFunksjon: '', navn: '', forberedelser: '', fullfort: false }
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
    setEpostListe(verdi);
    
    if (verdi.trim()) {
      // Del opp på linjeskift eller semikolon
      const linjer = verdi
        .split(/[;\n]+/)
        .map(e => e.trim())
        .filter(e => e);
      
      const nyeDeltakere = linjer.map(linje => {
        // Finn e-postadressen mellom < og >
        const epostMatch = linje.match(/<(.+?)>/);
        if (!epostMatch) return null;
        const epost = epostMatch[1];

        // Finn navnet (alt før <)
        const navnDel = linje.split('<')[0].trim();
        let navn = navnDel;

        // Hvis navnet inneholder komma, omorganiser det
        if (navnDel.includes(',')) {
          const [etternavn, fornavnDel] = navnDel.split(',').map(n => n.trim());
          navn = `${fornavnDel} ${etternavn}`;
        }

        return {
          fagFunksjon: '',
          navn: navn,
          forberedelser: '',
          epost: epost
        };
      }).filter(Boolean);

      if (nyeDeltakere.length > 0) {
        // Behold eksisterende deltakere som har data
        const eksisterendeDeltakere = deltakere.filter(d => 
          d.navn || d.fagFunksjon || d.epost || d.forberedelser
        );

        // Kombiner eksisterende og nye deltakere
        setDeltakere([...eksisterendeDeltakere, ...nyeDeltakere]);
        
        // Tøm input-feltet etter vellykket parsing
        setEpostListe('');
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedEmails = pastedText
      .split(/[\n,]/) // Del på linjeskift eller komma
      .map(email => email.trim())
      .filter(email => email && email.includes('@')); // Filtrer ut tomme linjer og sjekk @

    if (pastedEmails.length > 0) {
      // Finn første tomme rad
      const firstEmptyIndex = deltakere.findIndex(d => !d.navn && !d.fagFunksjon && !d.epost);
      
      // Hvis vi har eksisterende deltakere, legg til nye under dem
      const existingParticipants = deltakere.filter(d => d.navn || d.fagFunksjon || d.epost);
      const newParticipants = pastedEmails.map(email => ({
        fagFunksjon: '',
        navn: '',
        forberedelser: '',
        epost: email
      }));

      // Kombiner eksisterende og nye deltakere
      const updatedDeltakere = [
        ...existingParticipants,
        ...newParticipants
      ];

      setDeltakere(updatedDeltakere);
    }
  };

  const handleAddRow = () => {
    setDeltakere([...deltakere, { fagFunksjon: '', navn: '', forberedelser: '', epost: '' }]);
  };

  const fjernDeltaker = (index) => {
    const oppdaterteDeltakere = deltakere.filter((_, i) => i !== index);
    setDeltakere(oppdaterteDeltakere);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-medium">Deltakere</h2>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t">
          {/* Desktop header - justerte kolonnebredder */}
          <div className="hidden md:grid md:grid-cols-[120px_180px_1fr_1fr_40px] gap-4 p-4 bg-gray-50 border-b">
            <div className="font-medium text-gray-700">Funksjon</div>
            <div className="font-medium text-gray-700">Navn</div>
            <div className="font-medium text-gray-700">E-post</div>
            <div className="font-medium text-gray-700">Forberedelser</div>
            <div></div>
          </div>

          <div className="divide-y divide-gray-200">
            {deltakere.map((deltaker, index) => (
              <div key={index} className="group">
                {/* Desktop layout - justerte kolonnebredder */}
                <div className="hidden md:grid md:grid-cols-[120px_180px_1fr_1fr_40px] gap-4 p-4">
                  <div className="flex items-start">
                    <input
                      type="text"
                      value={deltaker.fagFunksjon}
                      onChange={(e) => handleDeltakerEndring(index, 'fagFunksjon', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Funksjon"
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex items-start">
                    <input
                      type="text"
                      value={deltaker.navn}
                      onChange={(e) => handleDeltakerEndring(index, 'navn', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Navn"
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex items-start">
                    <input
                      type="email"
                      value={deltaker.epost}
                      onChange={(e) => handleDeltakerEndring(index, 'epost', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="E-post"
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex items-start">
                    <textarea
                      value={deltaker.forberedelser}
                      onChange={(e) => handleDeltakerEndring(index, 'forberedelser', e.target.value)}
                      className="w-full p-2 border rounded resize-none overflow-hidden"
                      placeholder="Hva må forberedes?"
                      rows="1"
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      disabled={disabled}
                    />
                  </div>
                  <button
                    onClick={() => fjernDeltaker(index)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={disabled}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobil layout */}
                <div className="md:hidden p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Funksjon
                        </label>
                        <input
                          type="text"
                          value={deltaker.fagFunksjon}
                          onChange={(e) => handleDeltakerEndring(index, 'fagFunksjon', e.target.value)}
                          className="w-full p-3 border rounded-lg"
                          placeholder="Funksjon"
                          disabled={disabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Navn
                        </label>
                        <input
                          type="text"
                          value={deltaker.navn}
                          onChange={(e) => handleDeltakerEndring(index, 'navn', e.target.value)}
                          className="w-full p-3 border rounded-lg text-base"
                          placeholder="Navn"
                          disabled={disabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          E-post
                        </label>
                        <input
                          type="email"
                          value={deltaker.epost}
                          onChange={(e) => handleDeltakerEndring(index, 'epost', e.target.value)}
                          className="w-full p-3 border rounded-lg text-base"
                          placeholder="E-post"
                          disabled={disabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Forberedelser
                        </label>
                        <textarea
                          value={deltaker.forberedelser}
                          onChange={(e) => handleDeltakerEndring(index, 'forberedelser', e.target.value)}
                          className="w-full p-3 border rounded-lg resize-none overflow-hidden"
                          placeholder="Hva må forberedes?"
                          rows="1"
                          onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          disabled={disabled}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => fjernDeltaker(index)}
                      className="text-red-500 p-2"
                      disabled={disabled}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!disabled && (
            <div className="p-4 border-t">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full md:w-auto justify-center"
              >
                <Plus size={16} />
                Legg til deltaker
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Deltakere; 