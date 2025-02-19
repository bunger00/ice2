import React, { useState } from 'react';
import { Database } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

function VersjonsHistorikk({ versjoner, onVelgVersjon }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-700 hover:text-gray-900 transition-colors duration-200"
        title="Versjonshistorikk"
      >
        <Database size={18} />
      </button>

      {isOpen && versjoner.length > 0 && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Versjonshistorikk</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {versjoner.map((versjon) => (
                <div
                  key={versjon.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onVelgVersjon(versjon);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(versjon.tidspunkt).toLocaleString('no-NO')}
                      </p>
                      <p className="text-sm text-gray-500">{versjon.endretAv}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VersjonsHistorikk; 