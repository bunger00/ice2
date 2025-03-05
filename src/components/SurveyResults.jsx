import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

// Deklarasjon av variabler for Chart.js komponenter
let Chart;
let CategoryScale;
let LinearScale;
let BarElement;
let Title;
let Tooltip;
let Legend;
let Bar;

const SurveyResults = ({ passedMoteId, onClose }) => {
  const { moteId: urlMoteId } = useParams();
  const [effectiveMoteId, setEffectiveMoteId] = useState(passedMoteId || urlMoteId);
  const [moteInfo, setMoteInfo] = useState(null);
  const [surveyResults, setSurveyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [chartComponents, setChartComponents] = useState({
    loaded: false,
    error: false
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  // Last inn Chart.js komponenter
  useEffect(() => {
    const loadChartComponents = async () => {
      try {
        // Importer Chart.js moduler
        const ChartModule = await import('chart.js');
        const ReactChartjs2 = await import('react-chartjs-2');
        
        // Tildel til variabler
        Chart = ChartModule.Chart;
        CategoryScale = ChartModule.CategoryScale;
        LinearScale = ChartModule.LinearScale;
        BarElement = ChartModule.BarElement;
        Title = ChartModule.Title;
        Tooltip = ChartModule.Tooltip;
        Legend = ChartModule.Legend;
        Bar = ReactChartjs2.Bar;
        
        // Registrer Chart.js komponenter
        Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
        console.log('Chart.js moduler ble lastet vellykket');
        
        setChartComponents({
          loaded: true,
          error: false
        });
      } catch (error) {
        console.error('Kunne ikke laste Chart.js:', error);
        setChartComponents({
          loaded: false,
          error: true
        });
      }
    };
    
    loadChartComponents();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Møteevalueringsresultater',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    },
  };

  // Lytt til autentiseringsendringer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("Autentiseringsstatus for resultatsiden:", currentUser ? "Pålogget" : "Ikke pålogget");
    });
    
    return () => unsubscribe();
  }, []);

  // Hent møteinformasjon
  useEffect(() => {
    const fetchMoteInfo = async () => {
      try {
        if (!effectiveMoteId) {
          console.error('Ingen møte-ID funnet for resultatsiden');
          setError('Ingen møte-ID funnet');
          setLoading(false);
          return;
        }

        console.log('Henter møteinfo for resultatsiden, ID:', effectiveMoteId);
        const moteRef = doc(db, 'moter', effectiveMoteId);
        const moteSnap = await getDoc(moteRef);

        if (moteSnap.exists()) {
          const data = moteSnap.data();
          console.log('Møtedata hentet for resultatsiden:', data.tema);
          setMoteInfo(data);
        } else {
          console.error('Møtet ble ikke funnet for resultatsiden med ID:', effectiveMoteId);
          setError('Møtet ble ikke funnet');
        }
      } catch (err) {
        console.error('Feil ved henting av møtedata for resultatsiden:', err);
        setError(`Det oppstod en feil ved henting av møteinformasjon: ${err.message}`);
      }
    };

    fetchMoteInfo();
  }, [effectiveMoteId]);

  // Funksjon for anonym autentisering
  const ensureAuthentication = async () => {
    if (!user) {
      try {
        console.log('Starter anonym autentisering for resultatsiden...');
        const anonymousAuth = await signInAnonymously(auth);
        console.log('Anonym autentisering vellykket for resultatsiden. Bruker-ID:', anonymousAuth.user.uid);
        return anonymousAuth.user;
      } catch (authError) {
        console.error('Kunne ikke logge inn anonymt for resultatsiden:', authError);
        return null;
      }
    }
    return user;
  };

  // Lytt til endringer i spørreundersøkelsesresultater i sanntid
  useEffect(() => {
    if (!effectiveMoteId) return;

    setLoading(true);
    console.log('Setter opp lytter for surveys med moteId:', effectiveMoteId);

    // Bruk getDocs i stedet for onSnapshot for å unngå tilgangsproblemer
    const fetchSurveyResults = async () => {
      try {
        // Sørg for autentisering før vi henter data
        await ensureAuthentication();
        
        console.log('Henter undersøkelsesresultater med autentisert bruker');
        const surveysRef = collection(db, 'surveys');
        const surveysQuery = query(surveysRef, where('moteId', '==', effectiveMoteId));
        const snapshot = await getDocs(surveysQuery);
        
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Hentet ${results.length} surveyresultater`);
        setSurveyResults(results);
        setLoading(false);
      } catch (err) {
        console.error('Feil ved henting av undersøkelsesdata:', err);
        setError(`Det oppstod en feil ved henting av evalueringsresultater: ${err.message}`);
        setLoading(false);
      }
    };

    // Kall funksjonen umiddelbart
    fetchSurveyResults();

    // Oppdater resultatene hvert 10. sekund for å simulere sanntidsoppdateringer
    const interval = setInterval(fetchSurveyResults, 10000);
    
    return () => {
      console.log('Rydder opp intervall for surveys');
      clearInterval(interval);
    };
  }, [effectiveMoteId]);

  // Beregn gjennomsnitt og forbered diagramdata
  useEffect(() => {
    if (surveyResults.length === 0) return;

    try {
      if (!Bar || !Chart) {
        console.error('Chart.js komponenter mangler');
        setChartComponents({
          loaded: false,
          error: true
        });
        return;
      }

      console.log('Oppdaterer diagramdata basert på', surveyResults.length, 'svar');
      
      // Beregn gjennomsnitt for hver spørsmålstype
      const averageRatings = {
        preparedRating: 0,
        effectiveRating: 0,
        contributionRating: 0
      };

      const count = surveyResults.length;
      
      surveyResults.forEach(result => {
        averageRatings.preparedRating += result.preparedRating || 0;
        averageRatings.effectiveRating += result.effectiveRating || 0;
        averageRatings.contributionRating += result.contributionRating || 0;
      });

      // Del på antall for å få gjennomsnitt
      if (count > 0) {
        averageRatings.preparedRating = +(averageRatings.preparedRating / count).toFixed(1);
        averageRatings.effectiveRating = +(averageRatings.effectiveRating / count).toFixed(1);
        averageRatings.contributionRating = +(averageRatings.contributionRating / count).toFixed(1);
      }

      console.log('Beregnede gjennomsnitt:', averageRatings);

      // Opprett diagramdata
      const data = {
        labels: ['Forberedelse', 'Effektivitet', 'Bidrag'],
        datasets: [
          {
            label: 'Gjennomsnittsvurdering (1-5)',
            data: [
              averageRatings.preparedRating,
              averageRatings.effectiveRating,
              averageRatings.contributionRating
            ],
            backgroundColor: [
              'rgba(54, 162, 235, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)'
            ],
            borderColor: [
              'rgb(54, 162, 235)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)'
            ],
            borderWidth: 1,
          }
        ]
      };

      setChartData(data);
      setChartComponents({
        loaded: true,
        error: false
      });
    } catch (err) {
      console.error('Feil ved oppdatering av diagramdata:', err);
      setChartComponents({
        loaded: false,
        error: true
      });
    }
  }, [surveyResults]);

  // Renderingsfunksjon for resultattabellen (fallback når diagram ikke fungerer)
  const renderResultTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-blue-100">
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Nr.</th>
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dato</th>
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Forberedt</th>
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Effektivt</th>
            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Bidrag</th>
          </tr>
        </thead>
        <tbody>
          {surveyResults.map((result, index) => (
            <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
              <td className="border border-gray-300 px-3 py-2 text-sm">{result.timestamp ? new Date(result.timestamp.seconds * 1000).toLocaleString() : 'Ukjent'}</td>
              <td className="border border-gray-300 px-3 py-2 text-sm">{result.preparedRating}</td>
              <td className="border border-gray-300 px-3 py-2 text-sm">{result.effectiveRating}</td>
              <td className="border border-gray-300 px-3 py-2 text-sm">{result.contributionRating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Renderingsfunksjon for modal eller fullside
  const renderContent = () => (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6 max-w-4xl w-full mx-auto">
      {onClose && (
        <div className="text-right mb-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">{moteInfo?.tema || 'Møteevaluering'}</h2>
        <p className="text-gray-600">
          {moteInfo?.dato ? new Date(moteInfo.dato).toLocaleDateString() : 'Ukjent dato'}
        </p>
      </div>
      
      {surveyResults.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700">Ingen svar ennå</h3>
          <p className="text-sm text-gray-500 mt-1">Det har ikke kommet inn noen svar på denne evalueringen ennå.</p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Evalueringsresultater</h3>
            <p className="text-sm text-gray-500">{surveyResults.length} svar mottatt</p>
          </div>
          
          {chartComponents.error ? (
            <>
              <div className="text-amber-600 mb-4 text-center text-sm p-2 bg-amber-50 rounded">
                <p>Kunne ikke laste diagram-komponenten.</p>
                <p>Viser resultater i tabellform i stedet.</p>
              </div>
              {renderResultTable()}
            </>
          ) : (
            <>
              {chartComponents.loaded && Bar ? (
                <div className="relative h-80">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="flex justify-center items-center h-80">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              <div className="mt-8">
                <h4 className="text-md font-medium mb-2 text-gray-700">Detaljerte resultater</h4>
                {renderResultTable()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster inn evalueringsresultater...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md w-full">
          <div className="text-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold">Feil ved lasting av evalueringsresultater</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="text-center">
            <button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-300">
              Prøv igjen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return renderContent();
};

export default SurveyResults; 