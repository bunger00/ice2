import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';

function Status({ status, setStatus }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [nyttMoteDate, setNyttMoteDate] = useState('');

  const handleStatusClick = (newStatus) => {
    // Hvis samme status klikkes igjen, nullstill
    if (status === newStatus) {
      setStatus('');
      setNyttMoteDate('');
    } else {
      setStatus(newStatus);
      // Nullstill dato hvis man bytter til JA
      if (newStatus === 'JA') {
        setNyttMoteDate('');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold">Status</h2>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </div>

      {isExpanded && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Oppnådde dere målet med møtet?
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => handleStatusClick('JA')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                status === 'JA'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Check 
                size={18} 
                className={status === 'JA' ? 'text-green-500' : 'text-gray-400'} 
              />
              Oppnådd
            </button>

            <button
              onClick={() => handleStatusClick('NEI')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                status === 'NEI'
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <X 
                size={18} 
                className={status === 'NEI' ? 'text-red-500' : 'text-gray-400'} 
              />
              Ikke oppnådd
            </button>
          </div>

          {/* Nytt møte datovelger som vises når status er NEI */}
          {status === 'NEI' && (
            <div className="mt-4 animate-fadeIn">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nytt møte
              </label>
              <input
                type="date"
                value={nyttMoteDate}
                onChange={(e) => setNyttMoteDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]} // Setter minimum dato til i dag
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Status; 