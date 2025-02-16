import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function MoteInformasjon({ moteInfo, setMoteInfo }) {
  const [isExpanded, setIsExpanded] = useState(true);

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

  const handleMoteEierChange = (e) => {
    const nyEier = e.target.value;
    setMoteInfo({...moteInfo, eier: nyEier});
    localStorage.setItem('sisteMoteEier', nyEier); // Lagre ny møteeier
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Innkallingsdato</label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
              value={moteInfo.innkallingsDato}
              onChange={(e) => setMoteInfo({...moteInfo, innkallingsDato: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Møteeier</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
              value={moteInfo.eier}
              onChange={handleMoteEierChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fasilitator</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
              value={moteInfo.fasilitator}
              onChange={(e) => setMoteInfo({...moteInfo, fasilitator: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Referent</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-0 outline-none"
              value={moteInfo.referent}
              onChange={(e) => setMoteInfo({...moteInfo, referent: e.target.value})}
            />
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