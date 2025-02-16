import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Check } from 'lucide-react';

function Deltakere({ deltakere, setDeltakere, disabled }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [epostListe, setEpostListe] = useState('');

  const fagFunksjoner = [
    'BH', 'PGL', 'ARK', 'RIB', 'RIV', 'RIE', 'RIVA', 
    'LARK', 'RIBr', 'RIAKU', 'RIBy', 'RIM', 'RIG'
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
    const oppdaterteDeltakere = [...deltakere];
    oppdaterteDeltakere[index][felt] = verdi;
    setDeltakere(oppdaterteDeltakere);
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
    <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold">Deltakere</h2>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </div>

      {isExpanded && (
        <div className="mt-4">
          {/* Epostliste input */}
          <div className="mb-4">
            <textarea
              value={epostListe}
              onChange={(e) => handleEpostListeEndring(e.target.value)}
              className="w-full border rounded p-2 text-sm"
              placeholder="Lim inn e-postadresser (kommaseparert eller én per linje)"
              rows="1"
              disabled={disabled}
            />
          </div>

          <div className="grid grid-cols-12 gap-4 mb-2 font-medium text-sm text-gray-700">
            <div className="col-span-2">Funksjon</div>
            <div className="col-span-3">Navn</div>
            <div className="col-span-3">E-post</div>
            <div className="col-span-3">Forberedelser</div>
            <div className="col-span-1"></div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {deltakere.map((deltaker, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-2">
                    <div className="relative">
                      <input
                        type="text"
                        list={`fagfunksjoner-${index}`}
                        value={deltaker.fagFunksjon}
                        onChange={(e) => handleDeltakerEndring(index, 'fagFunksjon', e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Velg eller skriv"
                        disabled={disabled}
                      />
                      <datalist id={`fagfunksjoner-${index}`}>
                        {fagFunksjoner.map((funksjon) => (
                          <option key={funksjon} value={funksjon} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={deltaker.navn}
                      onChange={(e) => handleDeltakerEndring(index, 'navn', e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Navn"
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="email"
                      value={deltaker.epost}
                      onChange={(e) => handleDeltakerEndring(index, 'epost', e.target.value)}
                      onPaste={handlePaste}
                      className="w-full border rounded p-2"
                      placeholder="E-post"
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={deltaker.forberedelser}
                      onChange={(e) => handleDeltakerEndring(index, 'forberedelser', e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="Hva må forberedes?"
                      disabled={disabled}
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => fjernDeltaker(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={disabled}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddRow}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            disabled={disabled}
          >
            <Plus size={16} />
            Legg til deltaker
          </button>
        </div>
      )}
    </div>
  );
}

export default Deltakere; 