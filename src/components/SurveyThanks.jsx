import React from 'react';
import { CheckCircle } from 'lucide-react';

function SurveyThanks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={80} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Takk for din tilbakemelding!</h1>
        <p className="text-lg text-gray-600 mb-6">
          Din respons er nå registrert og vil hjelpe oss med å forbedre fremtidige møter.
        </p>
        <p className="text-sm text-gray-500">
          Du kan nå lukke dette vinduet.
        </p>
      </div>
    </div>
  );
}

export default SurveyThanks; 