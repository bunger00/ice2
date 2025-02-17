import React, { useState } from 'react';
import { Edit2, FileDown, Search, Trash2, Play } from 'lucide-react';
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
      
      <div className="grid grid-cols-2 gap-12">
        {/* Planlagte møter */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-6">Planlagte møter</h2>
          <div className="space-y-4">
            {ikkeGjennomforteMoter.map((mote) => (
              <div 
                key={mote.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{mote.tema}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Planlagt: {mote.dato} kl. {mote.startTid}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onVelgMote(mote)}
                      className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => navigate('/gjennomforing')}
                      className="text-green-600 hover:text-green-700 transition-colors duration-200"
                    >
                      <Play size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, mote)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {ikkeGjennomforteMoter.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Ingen planlagte møter
              </div>
            )}
          </div>
        </div>

        {/* Møtereferater */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-6">Møtereferater</h2>
          <div className="space-y-4">
            {gjennomforteMoter.map((mote) => (
              <div 
                key={mote.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{mote.tema}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Gjennomført: {mote.dato} kl. {mote.startTid}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        onVelgMote(mote);
                        navigate('/gjennomforing', { 
                          state: { shouldLock: true }
                        });
                      }}
                      className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      Se referat
                    </button>
                    <PrintView moteData={mote} />
                    <button
                      onClick={(e) => handleDelete(e, mote)}
                      className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {gjennomforteMoter.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Ingen møtereferater
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default LagredeMoter; 