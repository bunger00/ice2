import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, GripVertical } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { format, addMinutes, parse } from 'date-fns';

function Agenda({ agendaPunkter, setAgendaPunkter, startTid, deltakere, disabled }) {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Legg til 2 tomme agendapunkter når komponenten lastes hvis det ikke finnes noen
    if (agendaPunkter.length === 0) {
      setAgendaPunkter([
        { punkt: '', ansvarlig: '', varighet: 15, fullfort: false },
        { punkt: '', ansvarlig: '', varighet: 15, fullfort: false }
      ]);
    }
  }, []);

  useEffect(() => {
    // Oppdater tidspunkter når startTid endres
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
    <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="text-xl font-semibold">Agenda</h2>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </div>

      {isExpanded && (
        <div className="mt-4">
          <div className="grid grid-cols-13 gap-4 mb-2 font-medium text-sm text-gray-700">
            <div className="col-span-1"></div>
            <div className="col-span-2">Tid ({startTid})</div>
            <div className="col-span-6">Agendapunkt</div>
            <div className="col-span-3">Ansvarlig</div>
            <div className="col-span-1">Slett</div>
          </div>

          <Droppable droppableId="agendapunkter">
            {(provided) => (
              <div className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                {agendaPunkter.map((punkt, index) => (
                  <Draggable key={index.toString()} draggableId={index.toString()} index={index} isDragDisabled={disabled}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps}>
                        <div className="grid grid-cols-13 gap-4 items-center bg-white p-2 border rounded-lg">
                          <div className="col-span-1 flex items-center justify-center cursor-grab" {...provided.dragHandleProps}>
                            <GripVertical size={20} className="text-gray-400 hover:text-gray-600" />
                          </div>
                          
                          <div className="col-span-2">
                            <div className="font-medium text-gray-700">
                              {beregnTidspunkt(index)}
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="120"
                              step="5"
                              value={punkt.varighet}
                              onChange={(e) => {
                                handleAgendaEndring(index, 'varighet', parseInt(e.target.value));
                                const oppdaterteAgendaPunkter = [...agendaPunkter];
                                for (let i = index + 1; i < oppdaterteAgendaPunkter.length; i++) {
                                  oppdaterteAgendaPunkter[i].tid = beregnTidspunkt(i);
                                }
                                setAgendaPunkter(oppdaterteAgendaPunkter);
                              }}
                              className="w-full"
                              disabled={disabled}
                            />
                            <div className="text-xs text-center text-gray-600">
                              {punkt.varighet} min
                            </div>
                          </div>

                          <div className="col-span-6">
                            <input
                              type="text"
                              value={punkt.punkt}
                              onChange={(e) => handleAgendaEndring(index, 'punkt', e.target.value)}
                              className="w-full border rounded p-2"
                              placeholder="Beskriv agendapunktet"
                              disabled={disabled}
                            />
                          </div>

                          <div className="col-span-3">
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

                          <div className="col-span-1 flex justify-center">
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
                ))}
                {provided.placeholder}

                <div className="grid grid-cols-13 gap-4 items-center bg-gray-50 p-2 rounded-lg">
                  <div className="col-span-1"></div>
                  <div className="col-span-2 text-lg font-bold text-gray-800">
                    {beregnSluttTid()}
                  </div>
                  <div className="col-span-9 font-bold text-gray-800">
                    Møteslutt
                  </div>
                  <div className="col-span-1"></div>
                </div>
              </div>
            )}
          </Droppable>

          <button
            onClick={() => setAgendaPunkter([...agendaPunkter, { tid: '', punkt: '', ansvarlig: '', varighet: 15 }])}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            disabled={disabled}
          >
            <Plus size={16} />
            Legg til agendapunkt
          </button>
        </div>
      )}
    </div>
  );
}

export default Agenda; 