import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, GripVertical, Clock, ListChecks, Users, PlusCircle, Calendar, Timer } from 'lucide-react';
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
    // Oppdater textarea høyde umiddelbart først for å unngå forsinkelse
    if (felt === 'punkt') {
      const textarea = document.activeElement;
      if (textarea && (textarea.id === `agendapunkt-${index}` || textarea.id === `agendapunkt-mobile-${index}`)) {
        // Juster høyden umiddelbart mens brukeren skriver
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    }

    // Oppdater state for agendapunkter
    const oppdaterteAgendaPunkter = [...agendaPunkter];
    oppdaterteAgendaPunkter[index][felt] = verdi;
    
    // Lagre høyde for agendapunkt i lokalt minne hvis relevant
    if (felt === 'punkt' && verdi.length > 0) {
      // Prøv å hente textarea-elementer
      const desktopTextarea = document.getElementById(`agendapunkt-${index}`);
      const mobileTextarea = document.getElementById(`agendapunkt-mobile-${index}`);
      
      // Lagre høyde for desktop og mobile (bruker samme høyde)
      if (desktopTextarea) {
        const height = desktopTextarea.scrollHeight;
        localStorage.setItem(`agendaPunkt_${index}_height`, height);
      } else if (mobileTextarea) {
        const height = mobileTextarea.scrollHeight;
        localStorage.setItem(`agendaPunkt_${index}_height`, height);
      }
    }
    
    // Kjør setAgendaPunkter umiddelbart uten debouncing for bedre respons
    setAgendaPunkter(oppdaterteAgendaPunkter);
    
    // Marker som endret for auto-save systemet
    setHarEndringer(true);
    setSisteEndring(new Date());
  };

  // Helper for å laste inn lagret høyde for et tekstfelt
  const getStoredHeight = (index) => {
    // Prøv å hente lagret høyde fra localStorage
    const storedHeight = localStorage.getItem(`agendaPunkt_${index}_height`);
    
    // Hvis vi har en lagret høyde, returner den
    if (storedHeight) {
      return `${storedHeight}px`;
    }
    
    // Hvis ikke, beregn en fornuftig standardhøyde basert på innholdslengde
    const punktInnhold = agendaPunkter[index]?.punkt || '';
    const antallTegn = punktInnhold.length;
    const antallLinjer = Math.max(1, Math.ceil(antallTegn / 40)); // antatt ca 40 tegn per linje
    
    // Grunnhøyde + ekstra høyde per linje
    const beregnetHoyde = 40 + ((antallLinjer - 1) * 24);
    
    // Returner beregnet høyde som string med px
    return `${beregnetHoyde}px`;
  };

  // Setup auto-resize for textarea ved første render
  useEffect(() => {
    agendaPunkter.forEach((_, index) => {
      const textarea = document.getElementById(`agendapunkt-${index}`);
      if (textarea) {
        const storedHeight = getStoredHeight(index);
        if (storedHeight !== 'auto') {
          textarea.style.height = `${storedHeight}px`;
        }
      }
    });
  }, [agendaPunkter.length]);

  useEffect(() => {
    // Når agenda punkter lastes inn, ventetid for å sikre at DOM er klar
    if (agendaPunkter && agendaPunkter.length > 0) {
      setTimeout(() => {
        // Gå gjennom hvert agendapunkt og oppdater høyden
        agendaPunkter.forEach((_, index) => {
          const storedHeight = localStorage.getItem(`agendaPunkt_${index}_height`);
          if (storedHeight) {
            const desktopTextarea = document.getElementById(`agendapunkt-${index}`);
            const mobileTextarea = document.getElementById(`agendapunkt-mobile-${index}`);
            
            if (desktopTextarea) {
              desktopTextarea.style.height = `${storedHeight}px`;
              // Juster om nødvendig for å matche faktisk innhold
              desktopTextarea.style.height = 'auto';
              desktopTextarea.style.height = Math.max(desktopTextarea.scrollHeight, storedHeight) + 'px';
            }
            
            if (mobileTextarea) {
              mobileTextarea.style.height = `${storedHeight}px`;
              // Juster om nødvendig for å matche faktisk innhold
              mobileTextarea.style.height = 'auto';
              mobileTextarea.style.height = Math.max(mobileTextarea.scrollHeight, storedHeight) + 'px';
            }
          }
        });
      }, 500); // Kort forsinkelse for å sikre at DOM er ferdig rendret
    }
  }, [agendaPunkter]);

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
        <div className="relative flex items-center rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
          <span className="pl-2 text-gray-500"><Users size={16} /></span>
          <input
            type="text"
            value={punkt.ansvarlig}
            onChange={(e) => handleAgendaEndring(index, 'ansvarlig', e.target.value)}
            className="w-full pl-2 py-2 rounded-md focus:outline-none"
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
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-200">
      <div
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <ListChecks size={20} className="text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-800">Agenda</h2>
        </div>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          {isExpanded ? <ChevronUp size={20} className="text-gray-600" /> : <ChevronDown size={20} className="text-gray-600" />}
        </button>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[40px_1fr_6fr_3fr_40px] gap-4 font-medium text-gray-700 p-4 bg-gray-100 rounded-t-lg">
            <div></div>
            <div className="flex items-center">
              <Clock size={16} className="mr-2 text-gray-500" />
              <span>Tid</span>
            </div>
            <div className="flex items-center">
              <ListChecks size={16} className="mr-2 text-gray-500" />
              <span>Agendapunkt</span>
            </div>
            <div className="flex items-center">
              <Users size={16} className="mr-2 text-gray-500" />
              <span>Ansvarlig</span>
            </div>
            <div></div>
          </div>

          <Droppable droppableId="agenda">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="p-4 space-y-3"
              >
                {agendaPunkter.map((punkt, index) => {
                  const tid = beregnTidspunkt(index);
                  return (
                    <Draggable key={index} draggableId={`agenda-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors shadow-sm"
                        >
                          {/* Desktop layout */}
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
                                  className="w-full accent-blue-500"
                                />
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Timer size={14} className="mr-1" />
                                  <span>{punkt.varighet} min</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="relative flex items-center rounded-md shadow-sm border border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                                <span className="pl-2 text-gray-500"><ListChecks size={16} /></span>
                                <textarea
                                  id={`agendapunkt-${index}`}
                                  value={punkt.punkt}
                                  onChange={(e) => handleAgendaEndring(index, 'punkt', e.target.value)}
                                  className="w-full pl-2 py-2 rounded-md focus:outline-none resize-none agenda-input"
                                  placeholder="Beskriv agendapunktet"
                                  rows="1"
                                  onInput={e => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = (e.target.scrollHeight) + 'px';
                                  }}
                                  style={{ 
                                    height: getStoredHeight(index)
                                  }}
                                  disabled={disabled}
                                />
                              </div>
                            </div>

                            <div>
                              {renderAnsvarligInput(index, punkt)}
                            </div>

                            <div className="flex justify-center">
                              {!disabled && (
                                <button
                                  onClick={() => {
                                    const nyeAgendaPunkter = agendaPunkter.filter((_, i) => i !== index);
                                    setAgendaPunkter(nyeAgendaPunkter);
                                  }}
                                  className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Fjern agendapunkt"
                                >
                                  <X size={18} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Mobile layout */}
                          <div className="md:hidden p-4 space-y-3">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="text-gray-400">
                                  <GripVertical size={20} />
                                </div>
                                <div className="text-lg font-medium text-gray-800">{tid}</div>
                              </div>
                              {!disabled && (
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
                              )}
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                                  <ListChecks size={14} className="mr-1" />
                                  <span>Agendapunkt</span>
                                </label>
                                <textarea
                                  id={`agendapunkt-mobile-${index}`}
                                  value={punkt.punkt}
                                  onChange={(e) => handleAgendaEndring(index, 'punkt', e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none agenda-input"
                                  rows="2"
                                  placeholder="Beskriv agendapunktet"
                                  onInput={e => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = (e.target.scrollHeight) + 'px';
                                  }}
                                  style={{ 
                                    height: getStoredHeight(index)
                                  }}
                                  disabled={disabled}
                                />
                              </div>

                              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                <span className="text-sm text-gray-600 flex items-center">
                                  <Timer size={14} className="mr-1" />
                                  <span>Varighet:</span>
                                </span>
                                <input
                                  type="range"
                                  min="5"
                                  max="60"
                                  step="5"
                                  value={punkt.varighet}
                                  onChange={(e) => handleAgendaEndring(index, 'varighet', parseInt(e.target.value))}
                                  className="flex-1 accent-blue-500"
                                  disabled={disabled}
                                />
                                <span className="text-sm font-medium text-gray-700">{punkt.varighet} min</span>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center">
                                  <Users size={14} className="mr-1" />
                                  <span>Ansvarlig</span>
                                </label>
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
            <button
              onClick={() => {
                const nyttPunkt = {
                  punkt: '',
                  ansvarlig: '',
                  varighet: 15,
                  fullfort: false
                };
                setAgendaPunkter([...agendaPunkter, nyttPunkt]);
                setHarEndringer(true);
                setSisteEndring(new Date());
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <PlusCircle size={16} />
              Legg til punkt
            </button>

            <div className="grid grid-cols-12 gap-4 items-start bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="col-span-2">
                <div className="text-lg font-bold text-gray-800 flex items-center justify-center">
                  <Clock size={16} className="mr-2 text-blue-500" />
                  {beregnSluttTid()}
                </div>
              </div>
              <div className="col-span-9 font-bold text-gray-800 flex items-center">
                <Calendar size={16} className="mr-2 text-blue-500" />
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