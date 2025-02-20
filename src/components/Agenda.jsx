import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, GripVertical } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { format, addMinutes, parse } from 'date-fns';
import useAutoSave from '../hooks/useAutoSave';

function Agenda({ agendaPunkter, setAgendaPunkter, startTid, deltakere, disabled, moteId }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [setHarEndringer, setSisteEndring] = useAutoSave(moteId, agendaPunkter, 'agenda');

  useEffect(() => {
    // Oppdater tidspunkter når startTid endres eller når komponenten lastes
    const oppdaterteAgendaPunkter = agendaPunkter.map((punkt, index) => ({
      ...punkt,
      tid: beregnTidspunkt(index)
    }));
    setAgendaPunkter(oppdaterteAgendaPunkter);
  }, [startTid]);

  const handleAgendaEndring = (index, felt, verdi) => {
    const oppdaterteAgendaPunkter = [...agendaPunkter];
    oppdaterteAgendaPunkter[index][felt] = verdi;
    setAgendaPunkter(oppdaterteAgendaPunkter);
    setHarEndringer(true);
    setSisteEndring(new Date());
  };

  const beregnTidspunkt = (index) => {
    if (index === 0) return startTid;
    
    const startDato = parse(startTid, 'HH:mm', new Date());
    const totalMinutter = agendaPunkter
      .slice(0, index)
      .reduce((sum, punkt) => sum + punkt.varighet, 0);
    return format(addMinutes(startDato, totalMinutter), 'HH:mm');
  };

  const beregnSluttTid = () => {
    const startDato = parse(startTid, 'HH:mm', new Date());
    const totalMinutter = agendaPunkter.reduce((sum, punkt) => sum + punkt.varighet, 0);
    return format(addMinutes(startDato, totalMinutter), 'HH:mm');
  };

  const renderAnsvarligInput = (index, punkt) => {
    // Hent unike navn fra deltakerlisten
    const deltakerNavn = deltakere
      .map(d => d.navn)
      .filter(navn => navn.trim() !== '');

    return (
      <div className="relative">
        <input
          type="text"
          value={punkt.ansvarlig}
          onChange={(e) => handleAgendaEndring(index, 'ansvarlig', e.target.value)}
          className="w-full border rounded p-2 bg-white cursor-pointer focus:border-blue-500 focus:ring-blue-500"
          placeholder="Velg eller skriv navn"
          list="deltakere-list"
          disabled={disabled}
        />
        <datalist id="deltakere-list">
          {deltakerNavn.map((navn, i) => (
            <option key={i} value={navn} />
          ))}
        </datalist>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-2xl font-bold">Agenda</h2>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {isExpanded && (
        <div className="border rounded-lg overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[40px_1fr_6fr_3fr_40px] gap-4 font-medium text-gray-700 p-2">
            <div></div>
            <div className="text-center">Tid</div>
            <div>Agendapunkt</div>
            <div>Ansvarlig</div>
            <div></div>
          </div>

          <Droppable droppableId="agenda">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="divide-y">
                {agendaPunkter.map((punkt, index) => {
                  const tid = beregnTidspunkt(index);
                  return (
                    <Draggable key={index} draggableId={`agenda-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-white rounded-lg shadow-sm md:shadow-none"
                        >
                          <div className="hidden md:grid md:grid-cols-[40px_1fr_6fr_3fr_40px] gap-4 items-center p-4">
                            <div {...provided.dragHandleProps} className="flex justify-center text-gray-400 hover:text-gray-600">
                              <GripVertical size={20} />
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <div className="text-lg font-medium text-gray-800">{tid}</div>
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  type="range"
                                  min="5"
                                  max="60"
                                  step="5"
                                  value={punkt.varighet}
                                  onChange={(e) => handleAgendaEndring(index, 'varighet', parseInt(e.target.value))}
                                  disabled={disabled}
                                  className="w-20"
                                />
                                <span className="text-sm text-gray-500">{punkt.varighet} min</span>
                              </div>
                            </div>

                            <div className="flex items-start">
                              <textarea
                                value={punkt.punkt}
                                onChange={(e) => handleAgendaEndring(index, 'punkt', e.target.value)}
                                className="w-full p-2 border rounded resize-none overflow-hidden text-lg font-medium"
                                style={{ fontSize: '28px' }}  // Legg til direkte style for fontstørrelse
                                placeholder="Beskriv agendapunktet"
                                rows="1"
                                onInput={e => {
                                  e.target.style.height = 'auto';
                                  e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                disabled={disabled}
                              />
                            </div>

                            <div className="flex items-center">
                              <div className="p-2 w-full">
                                {renderAnsvarligInput(index, punkt)}
                              </div>
                            </div>

                            <div className="flex justify-center">
                              <button
                                onClick={() => {
                                  const nyeAgendaPunkter = agendaPunkter.filter((_, i) => i !== index);
                                  setAgendaPunkter(nyeAgendaPunkter);
                                }}
                                className="text-red-500 hover:text-red-700"
                                disabled={disabled}
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>

                          <div className="md:hidden p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="text-gray-400">
                                  <GripVertical size={20} />
                                </div>
                                <div className="text-lg font-medium text-gray-800">{tid}</div>
                              </div>
                              <button
                                onClick={() => {
                                  const nyeAgendaPunkter = agendaPunkter.filter((_, i) => i !== index);
                                  setAgendaPunkter(nyeAgendaPunkter);
                                }}
                                className="text-red-500"
                                disabled={disabled}
                              >
                                <X size={20} />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <textarea
                                value={punkt.punkt}
                                onChange={(e) => handleAgendaEndring(index, 'punkt', e.target.value)}
                                className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 text-base"
                                rows="3"
                                placeholder="Beskriv agendapunktet"
                                disabled={disabled}
                              />

                              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                <span className="text-sm text-gray-600">Varighet:</span>
                                <input
                                  type="range"
                                  min="5"
                                  max="60"
                                  step="5"
                                  value={punkt.varighet}
                                  onChange={(e) => handleAgendaEndring(index, 'varighet', parseInt(e.target.value))}
                                  disabled={disabled}
                                  className="flex-1"
                                />
                                <span className="text-sm font-medium">{punkt.varighet} min</span>
                              </div>

                              <div className="bg-gray-50 p-2 rounded-lg">
                                {renderAnsvarligInput(index, punkt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="p-4 space-y-4">
            {!disabled && (
              <button
                onClick={() => setAgendaPunkter([...agendaPunkter, { 
                  punkt: '', 
                  ansvarlig: '', 
                  varighet: 15,
                  fullfort: false 
                }])}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} />
                Legg til punkt
              </button>
            )}

            <div className="grid grid-cols-12 gap-4 items-start bg-gray-50 p-4 rounded-lg">
              <div className="col-span-2">
                <div className="text-lg font-bold text-gray-800">
                  {beregnSluttTid()}
                </div>
              </div>
              <div className="col-span-9 font-bold text-gray-800">
                Møteslutt
              </div>
              <div className="col-span-1"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agenda; 