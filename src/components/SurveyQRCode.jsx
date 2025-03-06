import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { X } from 'lucide-react';

function SurveyQRCode({ moteId, moteInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Generer URL til spørreundersøkelsen
  const getSurveyUrl = () => {
    // Base URL for applikasjonen (bruker nåværende host)
    const baseUrl = window.location.origin;
    
    // Bygg URL med møte-ID som parameter
    return `${baseUrl}/motesurvey/${moteId}`;
  };
  
  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleModal}
        className="text-gray-700 hover:text-gray-900 transition-colors duration-200 flex items-center gap-2 px-4 py-2 rounded-md shadow-sm border border-gray-200 bg-white"
        title="Del spørreundersøkelse"
      >
        <span className="font-medium">Spørreundersøkelse</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Spørreundersøkelse</h2>
              <button
                onClick={toggleModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Del denne QR-koden med møtedeltakerne for å få deres tilbakemelding.
              </p>
              <p className="text-gray-600 mb-4">
                De kan skanne koden med mobilkameraet for å delta i spørreundersøkelsen.
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg">
              <div className="bg-white p-3 rounded-lg shadow-md mb-4">
                <QRCode 
                  value={getSurveyUrl()} 
                  size={200} 
                  level="H" 
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                {moteInfo?.tema || 'Møtetema'} - {new Date().toLocaleDateString('no-NO')}
              </p>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={toggleModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Lukk
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SurveyQRCode; 