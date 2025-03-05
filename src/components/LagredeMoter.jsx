import React, { useState } from 'react';
import { Edit2, FileDown, Search, Trash2, Play, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PrintView from './PrintView';
import DeleteDialog from './DeleteDialog';

function LagredeMoter({ moter, onVelgMote, onSlettMote, onStatusChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    moteId: null,
    moteTema: ''
  });

  const filtrerteMoter = moter.filter(mote => 
    (mote.tema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     mote.dato?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const gjennomforteMoter = filtrerteMoter.filter(mote => mote.erGjennomfort);
  const ikkeGjennomforteMoter = filtrerteMoter.filter(mote => !mote.erGjennomfort);

  // Legg til søkefunksjonalitet
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Forhindre oppdatering hvis droppet i samme liste
    if (source.droppableId === destination.droppableId) return;

    // Finn møtet som ble dratt
    const mote = moter.find(m => m.id === draggableId);
    if (!mote) return;

    // Bestem ny status basert på destinasjonslisten
    const nyStatus = destination.droppableId === 'gjennomforte';
    
    // Ikke gjør noe hvis statusen allerede er riktig
    if (mote.erGjennomfort === nyStatus) return;

    // Oppdater status
    onStatusChange(draggableId, nyStatus);
  };

  const handleDelete = (e, mote) => {
    e.stopPropagation();
    e.preventDefault();
    
    setDeleteDialog({ 
      isOpen: true, 
      moteId: mote.id,
      moteTema: mote.tema
    });
  };

  const handleConfirmDelete = () => {
    try {
      onSlettMote(deleteDialog.moteId);
      setDeleteDialog({ isOpen: false, moteId: null, moteTema: '' });
    } catch (error) {
      console.error('Feil ved sletting:', error);
    }
  };

  return (
    <>
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, moteId: null, moteTema: '' })}
        onConfirm={handleConfirmDelete}
        moteTema={deleteDialog.moteTema}
      />
      
      {/* Søkefelt */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Søk i møter..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          {/* Planlagte møter */}
          <Droppable droppableId="ikke_gjennomforte">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="relative"
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4">Planlagte møter</h2>
                <div className="space-y-3">
                  {ikkeGjennomforteMoter.map((mote, index) => (
                    <Draggable key={mote.id} draggableId={mote.id} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <div className="mb-2 sm:mb-0">
                              <h3 className="text-base font-medium text-gray-900 break-words">{mote.tema}</h3>
                              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                                Planlagt: {mote.dato} kl. {mote.startTid}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <button
                                onClick={() => onVelgMote(mote)}
                                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-blue-600 transition-colors duration-200"
                                title="Rediger"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  onVelgMote(mote);
                                  navigate('/gjennomforing');
                                }}
                                className="p-1.5 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors duration-200"
                                title="Start gjennomføring"
                              >
                                <Play size={16} />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, mote)}
                                className="p-1.5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Slett"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {ikkeGjennomforteMoter.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      Ingen planlagte møter
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>

          {/* Møtereferater */}
          <Droppable droppableId="gjennomforte">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="relative"
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4 mt-6 md:mt-0">Møtereferater</h2>
                <div className="space-y-3">
                  {gjennomforteMoter.map((mote, index) => (
                    <Draggable key={mote.id} draggableId={mote.id} index={index}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <div className="mb-2 sm:mb-0">
                              <h3 className="text-base font-medium text-gray-900 break-words">{mote.tema}</h3>
                              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                                Gjennomført: {mote.dato} kl. {mote.startTid}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <button
                                onClick={() => {
                                  onVelgMote(mote);
                                  navigate('/gjennomforing', { 
                                    state: { shouldLock: true }
                                  });
                                }}
                                className="p-1.5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors duration-200"
                                title="Se referat"
                              >
                                <Eye size={16} />
                              </button>
                              <div className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors duration-200">
                                <PrintView moteData={mote} iconOnly={true} />
                              </div>
                              <button
                                onClick={(e) => handleDelete(e, mote)}
                                className="p-1.5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Slett"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {gjennomforteMoter.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      Ingen møtereferater
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </>
  );
}

export default LagredeMoter; 