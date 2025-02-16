import React, { useState } from 'react';
import { Edit2, FileDown, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintView from './PrintView';

function LagredeMoter({ onVelgMote, moter, setLagredeMoter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Filtrer møter basert på søkeord
  const filtrerteMoter = moter.filter(mote => 
    mote.tema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const moteReferater = filtrerteMoter.filter(mote => mote.erGjennomfort);
  const planlagteMoter = filtrerteMoter.filter(mote => !mote.erGjennomfort);

  const handleVelgMote = (mote) => {
    onVelgMote(mote);
    if (mote.erGjennomfort) {
      navigate('/gjennomforing');
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Søk i lagrede møter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg pl-10 pr-4 py-2"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Planlagte møter */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-blue-50 p-3 border-b">
              <h3 className="font-medium text-blue-700">Planlagte møter</h3>
            </div>
            <div className="p-4 space-y-4">
              {planlagteMoter.map(mote => (
                <div 
                  key={mote.id} 
                  className="flex border rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                >
                  <div className="w-2 bg-blue-500" />
                  <div className="flex-1 p-4">
                    <div className="font-medium mb-1">{mote.tema}</div>
                    <div className="text-sm text-gray-500">
                      Planlagt: {new Date(mote.dato).toLocaleDateString()} kl. {mote.startTid}
                    </div>
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleVelgMote(mote)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        <Edit2 size={16} />
                        Rediger agenda
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {planlagteMoter.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  Ingen planlagte møter
                </div>
              )}
            </div>
          </div>

          {/* Møtereferater */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-pink-50 p-3 border-b">
              <h3 className="font-medium text-pink-700">Møtereferater</h3>
            </div>
            <div className="p-4 space-y-4">
              {moteReferater.map(mote => (
                <div 
                  key={mote.id} 
                  className="flex border rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
                >
                  <div className="w-2 bg-pink-500" />
                  <div className="flex-1 p-4">
                    <div className="font-medium mb-1">{mote.tema}</div>
                    <div className="text-sm text-gray-500">
                      Gjennomført: {new Date(mote.dato).toLocaleDateString()} kl. {mote.startTid}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleVelgMote(mote)}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white text-sm rounded hover:bg-pink-600"
                      >
                        <FileDown size={16} />
                        Se møtereferat
                      </button>
                      <PrintView
                        moteInfo={mote}
                        deltakere={mote.deltakere}
                        agendaPunkter={mote.agendaPunkter}
                        status={mote.status}
                        statusOppnadd={mote.statusOppnadd}
                        nyDato={mote.nyDato}
                        buttonClassName="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        <FileDown size={16} />
                        Last ned PDF
                      </PrintView>
                    </div>
                  </div>
                </div>
              ))}
              {moteReferater.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  Ingen møtereferater
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LagredeMoter; 