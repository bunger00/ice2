import React, { useState, useEffect } from 'react';
import { Edit2, FileDown, Search, Trash2, Play, Eye, Calendar, Clock, Plus, Filter, SortAsc, SortDesc, CheckCircle, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MoteReferatPrintView from './MoteReferatPrintView';
import DeleteDialog from './DeleteDialog';

function LagredeMoter({ moter, onVelgMote, onSlettMote, onStatusChange }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ 
    isOpen: false, 
    moteId: null,
    moteTema: ''
  });
  const [visningsType, setVisningsType] = useState('kort'); // 'kort' eller 'liste'
  const [sortering, setSortering] = useState({ felt: 'dato', retning: 'desc' });
  const [filterStatus, setFilterStatus] = useState('alle'); // 'alle', 'planlagt', 'gjennomfort'

  // Filtrer møter basert på søkeord og filterStatus
  const filtrerMoter = () => {
    let resultat = moter.filter(mote =>
      (mote.tema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       mote.dato?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Filtrer basert på status
    if (filterStatus === 'planlagt') {
      resultat = resultat.filter(mote => !mote.erGjennomfort);
    } else if (filterStatus === 'gjennomfort') {
      resultat = resultat.filter(mote => mote.erGjennomfort);
    }

    // Sorter resultatene
    resultat.sort((a, b) => {
      let verdiA, verdiB;
      
      if (sortering.felt === 'dato') {
        verdiA = new Date(a.dato + 'T' + (a.startTid || '00:00'));
        verdiB = new Date(b.dato + 'T' + (b.startTid || '00:00'));
      } else if (sortering.felt === 'tema') {
        verdiA = a.tema?.toLowerCase() || '';
        verdiB = b.tema?.toLowerCase() || '';
      }
      
      if (sortering.retning === 'asc') {
        return verdiA > verdiB ? 1 : -1;
      } else {
        return verdiA < verdiB ? 1 : -1;
      }
    });

    return resultat;
  };

  const filtrerteMoter = filtrerMoter();
  const gjennomforteMoter = filtrerteMoter.filter(mote => mote.erGjennomfort);
  const ikkeGjennomforteMoter = filtrerteMoter.filter(mote => !mote.erGjennomfort);

  // Håndter søk
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Håndter sortering
  const handleSortering = (felt) => {
    if (sortering.felt === felt) {
      // Bytt retning hvis samme felt klikkes igjen
      setSortering({
        ...sortering,
        retning: sortering.retning === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Nytt felt, standard er desc
      setSortering({ felt, retning: 'desc' });
    }
  };

  // Håndter drag-and-drop
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

  // Håndter sletting
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

  // Formater dato for visning
  const formaterDato = (dato, tid) => {
    if (!dato) return '';
    
    try {
      const datoObj = new Date(dato);
      const dag = datoObj.getDate().toString().padStart(2, '0');
      const maned = (datoObj.getMonth() + 1).toString().padStart(2, '0');
      const ar = datoObj.getFullYear();
      
      return `${dag}.${maned}.${ar}${tid ? ` kl. ${tid}` : ''}`;
    } catch (e) {
      return dato + (tid ? ` kl. ${tid}` : '');
    }
  };

  // Render møtekort
  const renderMoteKort = (mote, index, erGjennomfort) => {
    return (
      <Draggable key={mote.id} draggableId={mote.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${
              erGjennomfort ? 'border-green-500' : 'border-blue-500'
            } ${snapshot.isDragging ? 'shadow-lg scale-[1.02]' : ''}`}
            onClick={() => onVelgMote(mote)}
          >
            <div className="flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-medium text-gray-900 break-words pr-2">{mote.tema || 'Uten tittel'}</h3>
                <div className="flex items-center space-x-1">
                  {erGjennomfort ? 
                    <CheckCircle size={16} className="text-green-500" /> : 
                    <Circle size={16} className="text-blue-500" />
                  }
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <Calendar size={14} className="mr-1" />
                <span>{formaterDato(mote.dato, mote.startTid)}</span>
              </div>
              
              {mote.deltakere && mote.deltakere.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Deltakere: {mote.deltakere.length}</p>
                  <div className="flex flex-wrap gap-1">
                    {mote.deltakere.slice(0, 3).map((deltaker, idx) => (
                      <span key={idx} className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs">
                        {deltaker.navn}
                      </span>
                    ))}
                    {mote.deltakere.length > 3 && (
                      <span className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs">
                        +{mote.deltakere.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  {erGjennomfort ? 'Gjennomført' : 'Planlagt'}
                </div>
                <div className="flex items-center space-x-2">
                  {erGjennomfort ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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
                        <MoteReferatPrintView
                          moteInfo={mote}
                          deltakere={mote.deltakere || []}
                          agendaPunkter={mote.agendaPunkter || []}
                          buttonClassName=""
                          iconOnly={true}
                        >
                          <FileDown size={16} />
                        </MoteReferatPrintView>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVelgMote(mote);
                        }}
                        className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-blue-600 transition-colors duration-200"
                        title="Rediger"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVelgMote(mote);
                          navigate('/gjennomforing');
                        }}
                        className="p-1.5 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors duration-200"
                        title="Start møtet"
                      >
                        <Play size={16} />
                      </button>
                    </>
                  )}
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
          </div>
        )}
      </Draggable>
    );
  };

  // Render møteliste
  const renderMoteListe = (mote, index, erGjennomfort) => {
    return (
      <Draggable key={mote.id} draggableId={mote.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${
              erGjennomfort ? 'border-green-500' : 'border-blue-500'
            } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
            onClick={() => onVelgMote(mote)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {erGjennomfort ? 
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : 
                  <Circle size={16} className="text-blue-500 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 truncate">{mote.tema || 'Uten tittel'}</h3>
                  <p className="text-xs text-gray-500">{formaterDato(mote.dato, mote.startTid)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {erGjennomfort ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                      <MoteReferatPrintView
                        moteInfo={mote}
                        deltakere={mote.deltakere || []}
                        agendaPunkter={mote.agendaPunkter || []}
                        buttonClassName=""
                        iconOnly={true}
                      >
                        <FileDown size={16} />
                      </MoteReferatPrintView>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVelgMote(mote);
                      }}
                      className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-blue-600 transition-colors duration-200"
                      title="Rediger"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVelgMote(mote);
                        navigate('/gjennomforing');
                      }}
                      className="p-1.5 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors duration-200"
                      title="Start møtet"
                    >
                      <Play size={16} />
                    </button>
                  </>
                )}
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
    );
  };

  return (
    <>
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, moteId: null, moteTema: '' })}
        onConfirm={handleConfirmDelete}
        moteTema={deleteDialog.moteTema}
      />

      {/* Verktøylinje */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        {/* Søkefelt */}
        <div className="relative flex-grow">
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
        
        {/* Kontroller */}
        <div className="flex gap-2">
          {/* Filter */}
          <div className="relative">
            <button 
              className="px-3 py-2 border border-gray-300 rounded-md flex items-center gap-1 hover:bg-gray-50"
              onClick={() => setFilterStatus(filterStatus === 'alle' ? 'planlagt' : filterStatus === 'planlagt' ? 'gjennomfort' : 'alle')}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">
                {filterStatus === 'alle' ? 'Alle' : filterStatus === 'planlagt' ? 'Planlagte' : 'Gjennomførte'}
              </span>
            </button>
          </div>
          
          {/* Sortering */}
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md flex items-center gap-1 hover:bg-gray-50"
            onClick={() => handleSortering('dato')}
          >
            {sortering.felt === 'dato' && sortering.retning === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            <span className="hidden sm:inline">Dato</span>
          </button>
          
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md flex items-center gap-1 hover:bg-gray-50"
            onClick={() => handleSortering('tema')}
          >
            {sortering.felt === 'tema' && sortering.retning === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            <span className="hidden sm:inline">Tittel</span>
          </button>
          
          {/* Visningstype */}
          <button 
            className={`px-3 py-2 border rounded-md flex items-center gap-1 ${
              visningsType === 'kort' 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setVisningsType('kort')}
            title="Kortvisning"
          >
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-2 h-2 bg-current rounded-sm"></div>
              <div className="w-2 h-2 bg-current rounded-sm"></div>
              <div className="w-2 h-2 bg-current rounded-sm"></div>
              <div className="w-2 h-2 bg-current rounded-sm"></div>
            </div>
          </button>
          
          <button 
            className={`px-3 py-2 border rounded-md flex items-center gap-1 ${
              visningsType === 'liste' 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setVisningsType('liste')}
            title="Listevisning"
          >
            <div className="flex flex-col gap-0.5 items-start">
              <div className="w-4 h-1 bg-current rounded-sm"></div>
              <div className="w-4 h-1 bg-current rounded-sm"></div>
              <div className="w-4 h-1 bg-current rounded-sm"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Statistikk */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Totalt</div>
          <div className="text-xl font-semibold">{moter.length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Planlagte</div>
          <div className="text-xl font-semibold text-blue-600">{moter.filter(m => !m.erGjennomfort).length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Gjennomførte</div>
          <div className="text-xl font-semibold text-green-600">{moter.filter(m => m.erGjennomfort).length}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Filtrert</div>
          <div className="text-xl font-semibold text-purple-600">{filtrerteMoter.length}</div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {visningsType === 'kort' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Planlagte møter */}
            {(filterStatus === 'alle' || filterStatus === 'planlagt') && ikkeGjennomforteMoter.map((mote, index) => 
              renderMoteKort(mote, index, false)
            )}
            
            {/* Gjennomførte møter */}
            {(filterStatus === 'alle' || filterStatus === 'gjennomfort') && gjennomforteMoter.map((mote, index) => 
              renderMoteKort(mote, index, true)
            )}
            
            {/* Ingen møter */}
            {filtrerteMoter.length === 0 && (
              <div className="col-span-full text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Ingen møter funnet</p>
                <p className="text-sm text-gray-400 mt-1">Prøv å endre søk eller filter</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Planlagte møter */}
            {(filterStatus === 'alle' || filterStatus === 'planlagt') && (
              <Droppable droppableId="ikke_gjennomforte">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {ikkeGjennomforteMoter.map((mote, index) => 
                      renderMoteListe(mote, index, false)
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
            
            {/* Gjennomførte møter */}
            {(filterStatus === 'alle' || filterStatus === 'gjennomfort') && (
              <Droppable droppableId="gjennomforte">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {gjennomforteMoter.map((mote, index) => 
                      renderMoteListe(mote, index, true)
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
            
            {/* Ingen møter */}
            {filtrerteMoter.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Ingen møter funnet</p>
                <p className="text-sm text-gray-400 mt-1">Prøv å endre søk eller filter</p>
              </div>
            )}
          </div>
        )}
      </DragDropContext>
    </>
  );
}

export default LagredeMoter; 