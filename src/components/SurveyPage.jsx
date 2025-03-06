import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function SurveyPage() {
  const { moteId } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ratings, setRatings] = useState({
    preparation: 3,
    efficiency: 3,
    contribution: 3
  });

  const handleRatingChange = (field, value) => {
    setRatings(prev => ({
      ...prev,
      [field]: Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!moteId) {
      alert('Ugyldig møte-ID');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Legg til svar i Firestore
      await addDoc(collection(db, 'moteresponser'), {
        moteId,
        preparation: ratings.preparation,
        efficiency: ratings.efficiency,
        contribution: ratings.contribution,
        timestamp: serverTimestamp()
      });
      
      setIsSubmitted(true);
      setIsSubmitting(false);
      
      // Etter 3 sekunder, naviger til takk-siden
      setTimeout(() => {
        navigate(`/motesurvey-thanks`);
      }, 3000);
      
    } catch (error) {
      console.error('Feil ved sending av svar:', error);
      setIsSubmitting(false);
      alert('Det oppstod en feil. Vennligst prøv igjen.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Takk for din tilbakemelding!</h1>
            <p className="text-gray-600">
              Din respons er nå registrert og vil hjelpe oss med å forbedre fremtidige møter.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Møteevaluering</h1>
          <p className="text-gray-600">
            Vennligst vurder møtet på en skala fra 1 til 5, hvor 1 er lavest og 5 er høyest.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Hvor forberedt følte du de andre var?
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">1</span>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1"
                  value={ratings.preparation}
                  onChange={(e) => handleRatingChange('preparation', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-gray-500">5</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                  {ratings.preparation}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Hvor effektivt var dette møtet for deg?
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">1</span>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1"
                  value={ratings.efficiency}
                  onChange={(e) => handleRatingChange('efficiency', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-gray-500">5</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                  {ratings.efficiency}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Hvor godt følte du at du selv bidro?
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">1</span>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1"
                  value={ratings.contribution}
                  onChange={(e) => handleRatingChange('contribution', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-gray-500">5</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                  {ratings.contribution}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Sender...' : 'Send inn svar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SurveyPage; 