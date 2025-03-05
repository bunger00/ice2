import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Slider from 'rc-slider';
// Fjerner direkte CSS-import som kan forårsake problemer under bygging
// import 'rc-slider/assets/index.css';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Inline styles for Slider-komponenten for å unngå CSS-importfeil
const sliderStyles = {
  rail: { backgroundColor: '#e5e7eb', height: 8 },
  track: { backgroundColor: '#3b82f6', height: 8 },
  handle: {
    borderColor: '#3b82f6',
    backgroundColor: 'white',
    height: 20,
    width: 20,
    marginTop: -6
  }
};

const SurveyForm = () => {
  const { moteId } = useParams();
  const [moteInfo, setMoteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  const [answers, setAnswers] = useState({
    preparedRating: 3,
    effectiveRating: 3,
    contributionRating: 3
  });

  useEffect(() => {
    const fetchMoteInfo = async () => {
      try {
        if (!moteId) {
          setError('Ingen møte-ID funnet i URL-en');
          setLoading(false);
          return;
        }

        const moteRef = doc(db, 'moter', moteId);
        const moteSnap = await getDoc(moteRef);

        if (moteSnap.exists()) {
          setMoteInfo(moteSnap.data());
        } else {
          setError('Møtet ble ikke funnet');
        }
      } catch (err) {
        console.error('Feil ved henting av møtedata:', err);
        setError('Det oppstod en feil ved henting av møteinformasjon');
      } finally {
        setLoading(false);
      }
    };

    fetchMoteInfo();
  }, [moteId]);

  const handleChange = (type) => (value) => {
    setAnswers(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Samle dataene
      const surveyData = {
        moteId,
        moteTema: moteInfo?.tema || 'Ukjent',
        moteDato: moteInfo?.dato || 'Ukjent',
        preparedRating: answers.preparedRating,
        effectiveRating: answers.effectiveRating,
        contributionRating: answers.contributionRating,
        timestamp: serverTimestamp()
      };

      // Lagre i Firestore
      const surveysRef = collection(db, 'surveys');
      await addDoc(surveysRef, surveyData);
      
      // Vis bekreftelse
      setSubmitted(true);
    } catch (err) {
      console.error('Feil ved innsending av data:', err);
      setError('Det oppstod en feil ved innsending av dine svar. Vennligst prøv igjen.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold">Feil</h2>
          </div>
          <p className="text-gray-700 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-green-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-semibold">Takk for dine svar!</h2>
          </div>
          <p className="text-gray-700 text-center mb-4">
            Dine tilbakemeldinger er verdifulle for oss og vil hjelpe til med å forbedre fremtidige møter.
          </p>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Du kan nå lukke dette vinduet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white">
          <h1 className="text-xl font-bold text-center">Møteevaluering</h1>
          {moteInfo && (
            <div className="mt-2 text-center">
              <p className="text-sm font-medium">{moteInfo.tema}</p>
              <p className="text-xs opacity-80">{moteInfo.dato}</p>
            </div>
          )}
        </div>
        
        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <div className="space-y-6">
            {/* Question 1 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Hvor forberedt følte du de andre var?
              </label>
              <div className="px-2">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={answers.preparedRating}
                  onChange={handleChange('preparedRating')}
                  railStyle={sliderStyles.rail}
                  trackStyle={sliderStyles.track}
                  handleStyle={sliderStyles.handle}
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Ikke forberedt</span>
                  <span>Veldig godt forberedt</span>
                </div>
                <div className="text-center mt-1 font-medium">
                  {answers.preparedRating} / 5
                </div>
              </div>
            </div>
            
            {/* Question 2 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Hvor effektivt var dette møtet for deg?
              </label>
              <div className="px-2">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={answers.effectiveRating}
                  onChange={handleChange('effectiveRating')}
                  railStyle={sliderStyles.rail}
                  trackStyle={sliderStyles.track}
                  handleStyle={sliderStyles.handle}
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Ikke effektivt</span>
                  <span>Veldig effektivt</span>
                </div>
                <div className="text-center mt-1 font-medium">
                  {answers.effectiveRating} / 5
                </div>
              </div>
            </div>
            
            {/* Question 3 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Hvor godt følte du at du selv bidro?
              </label>
              <div className="px-2">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={answers.contributionRating}
                  onChange={handleChange('contributionRating')}
                  railStyle={sliderStyles.rail}
                  trackStyle={sliderStyles.track}
                  handleStyle={sliderStyles.handle}
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Bidro lite</span>
                  <span>Bidro mye</span>
                </div>
                <div className="text-center mt-1 font-medium">
                  {answers.contributionRating} / 5
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Send inn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyForm; 