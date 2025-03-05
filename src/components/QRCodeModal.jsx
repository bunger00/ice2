import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';

// Fjernet SimpleQRCode-komponenten og byttet den ut med direkte bruk av react-qr-code

const QRCodeModal = ({ moteId, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState('');

  useEffect(() => {
    // Generer URL til spørreundersøkelsen
    // I en produksjonsapp bør du bruke en faktisk absolutt URL her
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/survey/${moteId}`;
    setSurveyUrl(url);
  }, [moteId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(surveyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Del spørreundersøkelse</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Lukk"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Del denne lenken med møtedeltakerne for å få tilbakemelding. Åpne lenken i mobilnettleseren for å svare på spørreundersøkelsen.
        </p>

        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="bg-white p-3 rounded-lg mb-2">
            <QRCode 
              value={surveyUrl} 
              size={200}
              level="M"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Skann QR-koden med mobilkameraet eller del lenken direkte
          </p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Lenke til spørreundersøkelse:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={surveyUrl}
              readOnly
              className="flex-1 p-2 text-sm border border-gray-300 rounded-md bg-gray-50"
            />
            <button
              onClick={copyToClipboard}
              className={`p-2 rounded-md ${
                copied 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } transition-colors`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => window.open(surveyUrl, '_blank')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Åpne i nettleser
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal; 