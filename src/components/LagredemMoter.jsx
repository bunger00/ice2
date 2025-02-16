import React, { useState } from 'react';
import { Edit2, FileDown, Search, Trash2, Play, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrintView from './PrintView';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function LagredemMoter({ onVelgMote, moter, setLagredeMoter }) {
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

  const slettMote = (moteId) => {
    const oppdaterteMoter = moter.filter(mote => mote.id !== moteId);
    setLagredeMoter(oppdaterteMoter);
    localStorage.setItem('moter', JSON.stringify(oppdaterteMoter));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const alleMoter = [...moter];
    const mote = alleMoter.find(m => m.id.toString() === result.draggableId);

    if (source.droppableId !== destination.droppableId) {
      // Flytter mellom listene - oppdater erGjennomfort status
      mote.erGjennomfort = destination.droppableId === 'referater';
      
      const oppdaterteMoter = alleMoter.map(m => 
        m.id === mote.id ? mote : m
      );

      setLagredeMoter(oppdaterteMoter);
      localStorage.setItem('moter', JSON.stringify(oppdaterteMoter));
    }
  };

  const renderMote = (mote, index, type) => (
    <Draggable 
      key={mote.id} 
      draggableId={mote.id.toString()} 
      index={index}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="flex border rounded-lg overflow-hidden hover:bg-gray-50 transition-colors mb-4"
        >
          <div className="w-2 bg-gray-300" />
          <div className="flex-1 p-4">
            <div className="font-medium mb-1">{mote.tema}</div>
            <div className="text-sm text-gray-500">
              {type === 'planlagt' ? 'Planlagt: ' : 'Gjennomført: '}
              {new Date(mote.dato).toLocaleDateString()} kl. {mote.startTid}
            </div>
            <div className="flex justify-end items-center gap-2 mt-2">
              {type === 'planlagt' ? (
                <>
                  <button
                    onClick={() => handleVelgMote(mote)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <Edit2 size={16} />
                    Rediger agenda
                  </button>
                  <button
                    onClick={() => {
                      onVelgMote(mote);
                      navigate('/gjennomforing');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <Play size={16} />
                    Start møte
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onVelgMote(mote);
                      navigate('/gjennomforing', { state: { shouldLock: true } });
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    <FileText size={14} />
                    Se møtereferat
                  </button>
                  <PrintView
                    moteInfo={mote}
                    deltakere={mote.deltakere}
                    agendaPunkter={mote.agendaPunkter}
                    status={mote.status}
                    statusOppnadd={mote.statusOppnadd}
                    nyDato={mote.nyDato}
                    buttonClassName="p-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <FileDown size={16} />
                  </PrintView>
                </>
              )}
              <button
                onClick={() => slettMote(mote.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Slett møte"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Søk i lagrede møter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded-lg pl-10 pr-4 py-2 focus:border-gray-400 focus:ring-0"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 gap-6">
          {/* Planlagte møter */}
          <Droppable droppableId="planlagt">
            {(provided) => (
              <div 
                className="border rounded-lg overflow-hidden"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <div className="bg-gray-50 p-3 border-b">
                  <h3 className="font-medium text-gray-700">Planlagte møter</h3>
                </div>
                <div className="p-4">
                  {planlagteMoter.map((mote, index) => renderMote(mote, index, 'planlagt'))}
                  {planlagteMoter.length === 0 && (
                    <div className="text-gray-500 text-center py-8">
                      Ingen planlagte møter
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>

          {/* Møtereferater */}
          <Droppable droppableId="referater">
            {(provided) => (
              <div 
                className="border rounded-lg overflow-hidden"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <div className="bg-gray-50 p-3 border-b">
                  <h3 className="font-medium text-gray-700">Møtereferater</h3>
                </div>
                <div className="p-4">
                  {moteReferater.map((mote, index) => renderMote(mote, index, 'referat'))}
                  {moteReferater.length === 0 && (
                    <div className="text-gray-500 text-center py-8">
                      Ingen møtereferater
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}

export default LagredemMoter; 