import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, GripVertical } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { format, addMinutes, parse } from 'date-fns';

function Agenda({ agendaPunkter, setAgendaPunkter, startTid, deltakere, disabled }) {
  const [isExpanded, setIsExpanded] = useState(true);

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
          <div className="grid grid-cols-[40px_1fr_6fr_3fr_40px] gap-4 p-4 bg-gray-50 border-b text-gray-800">
            <div></div> {/* Tom kolonne for gripehåndtak */}
            <div className="text-center font-bold">Tid</div>
            <div className="font-bold">Agendapunkt</div>
            <div className="font-bold">Ansvarlig</div>
            <div className="font-bold text-center">Slett</div>
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
                          className="p-4"
                        >
                          <div className="grid grid-cols-[40px_1fr_6fr_3fr_40px] gap-4 items-center">
                            <div {...provided.dragHandleProps} className="flex justify-center text-gray-400 hover:text-gray-600">
                              <GripVertical size={20} />
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="text-lg font-medium text-gray-800">
                                {tid}
                              </div>
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

                            <div>
                              <textarea
                                value={punkt.punkt}
                                onChange={(e) => handleAgendaEndring(index, 'punkt', e.target.value)}
                                className="w-full border rounded p-2 text-sm"
                                rows="2"
                                placeholder="Beskriv agendapunktet"
                                disabled={disabled}
                              />
                            </div>

                            <div className="flex items-center">
                              <select
                                value={punkt.ansvarlig}
                                onChange={(e) => handleAgendaEndring(index, 'ansvarlig', e.target.value)}
                                className="w-full border rounded p-2"
                                disabled={disabled}
                              >
                                <option value="">Velg ansvarlig</option>
                                {deltakere.map((deltaker, i) => (
                                  deltaker.navn && (
                                    <option key={i} value={deltaker.navn}>
                                      {deltaker.navn}
                                    </option>
                                  )
                                ))}
                              </select>
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
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Møteslutt og Legg til punkt */}
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