import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Registrer Chart.js komponenter
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SurveyResults = ({ passedMoteId, onClose }) => {
  const { moteId: urlMoteId } = useParams();
  const effectiveMoteId = passedMoteId || urlMoteId;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moteInfo, setMoteInfo] = useState(null);
  const [surveyResults, setSurveyResults] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

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

  // Lytt til endringer i spørreundersøkelsesresultater i sanntid
  useEffect(() => {
    if (!effectiveMoteId) return;

    setLoading(true);
    console.log('Setter opp lytter for surveys med moteId:', effectiveMoteId);

    const surveysRef = collection(db, 'surveys');
    const surveysQuery = query(surveysRef, where('moteId', '==', effectiveMoteId));

    const unsubscribe = onSnapshot(surveysQuery, (snapshot) => {
      try {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Mottok ${results.length} surveyresultater i sanntid`);
        setSurveyResults(results);
        setLoading(false);
      } catch (err) {
        console.error('Feil ved henting av undersøkelsesdata:', err);
        setError(`Det oppstod en feil ved henting av evalueringsresultater: ${err.message}`);
        setLoading(false);
      }
    }, (err) => {
      console.error('Lyttefeil:', err);
      setError(`Det oppstod en feil ved lytting til evalueringsresultater: ${err.message}`);
      setLoading(false);
    });

    return () => {
      console.log('Rydder opp lytter for surveys');
      unsubscribe();
    };
  }, [effectiveMoteId]);

  // Beregn gjennomsnitt og forbered diagramdata
  useEffect(() => {
    if (surveyResults.length === 0) return;

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
  }, [surveyResults]);

  // Renderingsfunksjon for modal eller fullside
  const renderContent = () => (
    <div className={onClose ? "p-4" : "min-h-screen bg-gray-50 p-4"}>
      <div className={`${onClose ? "w-full" : "max-w-4xl mx-auto"} bg-white rounded-lg shadow-md overflow-hidden`}>
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h1 className="text-xl font-bold">Møteevaluering - Resultater</h1>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {moteInfo && (
          <div className="p-2 bg-blue-50 text-center border-b border-blue-100">
            <p className="text-sm font-medium text-blue-800">{moteInfo.tema}</p>
            <p className="text-xs text-blue-600">{moteInfo.dato}</p>
          </div>
        )}
        
        {/* Results */}
        <div className="p-4">
          {surveyResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Ingen evalueringsresultater ennå. Resultater vil vises her når deltakere begynner å svare.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500 text-center">
                  Viser resultater fra {surveyResults.length} {surveyResults.length === 1 ? 'deltaker' : 'deltakere'}
                </p>
              </div>
              
              <div className="h-80 w-full">
                <Bar options={chartOptions} data={chartData} />
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {chartData.labels.map((label, index) => (
                  <div key={label} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-700">{label}</h3>
                    <div className="mt-2 text-3xl font-bold text-blue-600">
                      {chartData.datasets[0].data[index]}
                      <span className="text-lg text-gray-500 ml-1">/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (loading && !chartData.datasets.length) {
    return (
      <div className={onClose ? "p-4" : "min-h-screen flex items-center justify-center bg-gray-50 p-4"}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster evalueringsresultater...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={onClose ? "p-4" : "min-h-screen flex items-center justify-center bg-gray-50 p-4"}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold">Feil</h2>
          </div>
          <p className="text-gray-700 text-center">{error}</p>
          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
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