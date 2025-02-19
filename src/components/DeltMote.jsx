import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { DragDropContext } from '@hello-pangea/dnd';
import { db } from '../firebase';
import MoteInformasjon from './MoteInformasjon';
import Deltakere from './Deltakere';
import Agenda from './Agenda';
import AgendaPrintView from './AgendaPrintView';
import { ChevronUp, ChevronDown } from 'lucide-react';

function DeltMote() {
  const { moteId, token } = useParams();
  const [moteData, setMoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  
  // Legg til state for trekkspill
  const [isExpanded, setIsExpanded] = useState({
    moteInfo: false,    // Lukket som standard
    deltakere: false,   // Lukket som standard
    agenda: true        // Åpen som standard
  });

  useEffect(() => {
    const hentMote = async () => {
      try {
        console.log('Prøver å hente møte med ID:', moteId);
        const moteRef = doc(db, 'moter', moteId);
        const moteDoc = await getDoc(moteRef);

        if (!moteDoc.exists()) {
          console.log('Møtet finnes ikke');
          setError('Møtet finnes ikke');
          setLoading(false);
          return;
        }

        const data = moteDoc.data();
        console.log('Møtedata hentet:', { erDelt: data.erDelt, harToken: !!data.aksessToken });
        
        // Sjekk om møtet er delt og har riktig token
        if (!data.erDelt || data.aksessToken !== token) {
          console.log('Ugyldig tilgang:', { 
            erDelt: data.erDelt, 
            tokenMatch: data.aksessToken === token 
          });
          setError('Ugyldig tilgangslenke');
          setLoading(false);
          return;
        }

        // Konverter data til riktig format
        const formatertData = {
          ...data,
          id: moteDoc.id,
          deltakere: data.deltakere || [],
          agendaPunkter: data.agendaPunkter || []
        };

        setMoteData(formatertData);
        setLoading(false);
      } catch (error) {
        console.error('Feil ved henting av møte:', error);
        setError('Kunne ikke hente møtet. Vennligst sjekk linken og prøv igjen.');
        setLoading(false);
      }
    };

    hentMote();
  }, [moteId, token]);

  // Lytt til endringer i møtet
  useEffect(() => {
    if (!moteId) return;

    console.log('Setter opp real-time lytter for møte:', moteId);
    
    const unsubscribe = onSnapshot(doc(db, 'moter', moteId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.erDelt && data.aksessToken === token) {
          const formatertData = {
            ...data,
            id: doc.id,
            deltakere: data.deltakere || [],
            agendaPunkter: data.agendaPunkter || []
          };
          
          console.log('Mottok real-time oppdatering:', formatertData);
          setMoteData(formatertData);
        }
      }
    }, (error) => {
      console.error('Feil ved real-time oppdatering:', error);
    });

    return () => unsubscribe();
  }, [moteId, token]);

  // Funksjon for å oppdatere møtet
  const oppdaterMote = async (oppdateringer) => {
    try {
      const moteRef = doc(db, 'moter', moteId);
      await updateDoc(moteRef, {
        ...oppdateringer,
        sistOppdatert: serverTimestamp()
      });
      
      // Ikke oppdater state direkte - la onSnapshot håndtere det
    } catch (error) {
      console.error('Feil ved oppdatering:', error);
      alert('Kunne ikke oppdatere møtet. Vennligst prøv igjen.');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(moteData.agendaPunkter);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Oppdater Firestore direkte
    oppdaterMote({ agendaPunkter: items });
  };

  if (loading) {
    return <div>Laster...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/Logolean.png" 
                alt="ICE Meeting" 
                className="h-8 w-auto"
              />
              <span className="ml-3 text-xl font-light text-gray-900">ICE Meeting</span>
            </div>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{moteData.tema}</h1>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    {isEditing ? 'Avslutt redigering' : 'Rediger'}
                  </button>
                  <AgendaPrintView
                    moteInfo={moteData}
                    deltakere={moteData.deltakere}
                    agendaPunkter={moteData.agendaPunkter}
                  />
                </div>
              </div>
              
              {/* Møteinformasjon med trekkspill */}
              <div className="mb-6">
                <button
                  onClick={() => setIsExpanded(prev => ({ ...prev, moteInfo: !prev.moteInfo }))}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  <span className="font-medium">Møteinformasjon</span>
                  {isExpanded.moteInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {isExpanded.moteInfo && (
                  <div className="mt-4">
                    <MoteInformasjon
                      moteInfo={moteData}
                      setMoteInfo={(oppdatert) => oppdaterMote(oppdatert)}
                      deltakere={moteData.deltakere || []}
                      setDeltakere={(oppdaterteDeltakere) => oppdaterMote({ deltakere: oppdaterteDeltakere })}
                      disabled={!isEditing}
                    />
                  </div>
                )}
              </div>

              {/* Deltakere med trekkspill */}
              <div className="mb-6">
                <button
                  onClick={() => setIsExpanded(prev => ({ ...prev, deltakere: !prev.deltakere }))}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  <span className="font-medium">Deltakere</span>
                  {isExpanded.deltakere ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {isExpanded.deltakere && (
                  <div className="mt-4">
                    <Deltakere
                      deltakere={moteData.deltakere}
                      setDeltakere={(oppdatert) => oppdaterMote({ deltakere: oppdatert })}
                      disabled={!isEditing}
                    />
                  </div>
                )}
              </div>

              {/* Agenda med trekkspill (åpen som standard) */}
              <div>
                <button
                  onClick={() => setIsExpanded(prev => ({ ...prev, agenda: !prev.agenda }))}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg"
                >
                  <span className="font-medium">Agenda</span>
                  {isExpanded.agenda ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                {isExpanded.agenda && (
                  <div className="mt-4">
                    <Agenda
                      agendaPunkter={moteData.agendaPunkter}
                      setAgendaPunkter={(oppdatert) => oppdaterMote({ agendaPunkter: oppdatert })}
                      startTid={moteData.startTid}
                      deltakere={moteData.deltakere}
                      disabled={!isEditing}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

export default DeltMote; 