import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Trash2 } from 'lucide-react';
import DialogModal from './DialogModal';

function LagredemMoter({ onVelgMote, moter, setLagredeMoter }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sokeOrd, setSokeOrd] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [moteToDelete, setMoteToDelete] = useState(null);

  const handleSlettMote = (id, e) => {
    e.stopPropagation();
    setMoteToDelete(id);
    setShowDeleteDialog(true);
  };

  const slettMote = () => {
    const oppdaterteMoter = moter.filter(mote => mote.id !== moteToDelete);
    localStorage.setItem('moter', JSON.stringify(oppdaterteMoter));
    setLagredeMoter(oppdaterteMoter); // Oppdater state direkte i stedet for page reload
    setShowDeleteDialog(false);
  };

  const filtrerteMoter = moter.filter(mote => 
    mote.tema.toLowerCase().includes(sokeOrd.toLowerCase()) ||
    mote.dato.includes(sokeOrd)
  );

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="text-xl font-semibold">Lagrede møter</h2>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>

        {isExpanded && (
          <div className="mt-4">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Søk i lagrede møter..."
                value={sokeOrd}
                onChange={(e) => setSokeOrd(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-0 outline-none"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <div className="space-y-2">
              {filtrerteMoter.map((mote) => (
                <div
                  key={mote.id}
                  className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-md border group"
                >
                  <button
                    onClick={() => onVelgMote(mote)}
                    className="flex-grow text-left"
                  >
                    <div className="font-medium">{mote.tema || 'Uten tittel'}</div>
                    <div className="text-sm text-gray-500">
                      {mote.dato ? new Date(mote.dato).toLocaleDateString('no-NO') : 'Ingen dato'} - {mote.startTid}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleSlettMote(mote.id, e)}
                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Slett møte"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {filtrerteMoter.length === 0 && (
                <p className="text-gray-500 text-sm">Ingen lagrede møter</p>
              )}
            </div>
          </div>
        )}
      </div>

      <DialogModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={slettMote}
        title="Bekreft sletting"
        message="Er du sikker på at du vil slette dette møtet? Denne handlingen kan ikke angres."
        confirmText="Slett"
        cancelText="Avbryt"
      />
    </>
  );
}

export default LagredemMoter; 