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
      console.log('Forbereder diagramdata fra', surveyResults.length, 'resultater');
      
      // Beregn gjennomsnitt for hvert spørsmål
      const preparedSum = surveyResults.reduce((sum, result) => sum + (result.preparedRating || 0), 0);
      const effectiveSum = surveyResults.reduce((sum, result) => sum + (result.effectiveRating || 0), 0);
      const contributionSum = surveyResults.reduce((sum, result) => sum + (result.contributionRating || 0), 0);
      
      const preparedAvg = (preparedSum / surveyResults.length).toFixed(1);
      const effectiveAvg = (effectiveSum / surveyResults.length).toFixed(1);
      const contributionAvg = (contributionSum / surveyResults.length).toFixed(1);
      
      console.log('Gjennomsnitt beregnet:', { preparedAvg, effectiveAvg, contributionAvg });
      
      // Sett opp data for gauge charts
      setGaugeData({
        prepared: {
          value: preparedAvg,
          percentage: (preparedAvg / 5) * 100
        },
        effective: {
          value: effectiveAvg,
          percentage: (effectiveAvg / 5) * 100
        },
        contribution: {
          value: contributionAvg,
          percentage: (contributionAvg / 5) * 100
        }
      });
      
      // Fortsett å sette opp data for bar chart for kompabilitet
      if (!Bar || !Chart) {
        console.error('Chart.js komponenter mangler');
        setChartComponents({
          loaded: false,
          error: true
        });
        return;
      }
      
      const data = {
        labels: ['Forberedelse', 'Effektivitet', 'Bidrag'],
        datasets: [{
          label: 'Gjennomsnittlig vurdering',
          data: [preparedAvg, effectiveAvg, contributionAvg],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderColor: [
            'rgb(54, 162, 235)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)'
          ],
          borderWidth: 1
        }]
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

  // State for gauge-stil data
  const [gaugeData, setGaugeData] = useState({
    prepared: { value: 0, percentage: 0 },
    effective: { value: 0, percentage: 0 },
    contribution: { value: 0, percentage: 0 }
  });

  // Gauge Chart Component
  const GaugeChart = ({ title, data }) => (
    <div className="mb-10">
      <h3 className="text-lg font-medium mb-2 text-gray-700">{title}</h3>
      <div className="relative w-full h-20 bg-gray-100 rounded-full overflow-hidden">
        {/* Bakgrunnsbølgeeffekt */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute bottom-0 w-full" style={{ height: '70%' }}>
            <svg viewBox="0 0 1440 120" className="absolute bottom-0 w-full h-full">
              <path
                fill="rgba(186, 230, 240, 0.4)"
                d="M0,32L48,37.3C96,43,192,53,288,64C384,75,480,85,576,80C672,75,768,53,864,48C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
              ></path>
            </svg>
          </div>
        </div>
        
        {/* Progress bar */}
        <div 
          className="absolute top-0 left-0 h-full bg-teal-600 rounded-r-full transition-all duration-700 ease-in-out z-10"
          style={{ width: `${data.percentage}%` }}
        ></div>
        
        {/* Verdi-indikator */}
        <div className="absolute top-0 left-0 w-full h-full z-20">
          <div 
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: `${data.percentage}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="bg-teal-700 text-white h-12 w-12 flex items-center justify-center rounded-full shadow-lg">
              <span className="text-md font-bold">{data.value}</span>
            </div>
          </div>
        </div>
        
        {/* Skala */}
        <div className="w-full h-full flex items-end px-4 pb-1 z-20 relative">
          <div className="grid grid-cols-5 w-full">
            {[1, 2, 3, 4, 5].map(num => (
              <div key={num} className="flex justify-center">
                <span className="text-xs font-medium text-gray-600">{num}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>Dårlig</span>
        <span>Utmerket</span>
      </div>
    </div>
  );

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
          
          {/* Ny gauge style visning */}
          <div className="mb-8 py-4">
            <GaugeChart title="Hvor godt var møtet forberedt?" data={gaugeData.prepared} />
            <GaugeChart title="Hvor effektivt var møtet?" data={gaugeData.effective} />
            <GaugeChart title="Hvor godt bidro deltakerne?" data={gaugeData.contribution} />
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
              {/* Original bar chart (skjult) */}
              <div className="hidden">
                {chartComponents.loaded && Bar && (
                  <div className="relative h-80">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                )}
              </div>
              
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