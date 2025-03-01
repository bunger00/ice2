import { useEffect, useState } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Eksporter som default i stedet for named export
const useAutoSave = (moteId, data, type) => {
  const [harEndringer, setHarEndringer] = useState(false);
  const [sisteEndring, setSisteEndring] = useState(null);

  useEffect(() => {
    if (harEndringer && moteId) {
      const timer = setTimeout(async () => {
        try {
          const moteRef = doc(db, 'moter', moteId);
          const oppdatering = {};

          switch (type) {
            case 'moteInfo':
              oppdatering.tema = data.tema;
              oppdatering.dato = data.dato;
              oppdatering.startTid = data.startTid;
              oppdatering.innkallingsDato = data.innkallingsDato;
              oppdatering.eier = data.eier;
              oppdatering.fasilitator = data.fasilitator;
              oppdatering.referent = data.referent;
              oppdatering.hensikt = data.hensikt;
              oppdatering.mal = data.mal;
              break;
            case 'deltakere':
              oppdatering.deltakere = data;
              break;
            case 'agenda':
              oppdatering.agendaPunkter = data;
              break;
            default:
              console.warn('Ukjent type:', type);
              return;
          }

          oppdatering.sistOppdatert = serverTimestamp();
          await updateDoc(moteRef, oppdatering);

          const historikkRef = collection(db, 'moter', moteId, 'historikk');
          await addDoc(historikkRef, {
            tidspunkt: serverTimestamp(),
            endretAv: auth.currentUser?.email || 'Ukjent',
            type,
            endringer: data
          });

          setHarEndringer(false);
          console.log(`Automatisk lagring av ${type} fullført`);
        } catch (error) {
          console.error('Feil ved automatisk lagring:', error);
        }
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [sisteEndring, harEndringer, moteId, data, type]);

  return [setHarEndringer, setSisteEndring];
};

// Eksporter som default
export default useAutoSave; 