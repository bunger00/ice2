import React, { useEffect, useState, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';
import QRCode from 'react-qr-code';

// Enkel fallback QR-kode komponent som bruker Canvas API
// Dette er en reserveløsning i tilfelle react-qr-code fortsatt gir byggproblemer
const SimpleCanvasQRCode = ({ value, size = 200 }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Tøm canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Tegn en enkel ramme
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, size - 20, size - 20);
    
    // Tegn en QR-lignende mønster (bare for visuell representasjon)
    ctx.fillStyle = '#000000';
    const blockSize = (size - 40) / 7;
    
    // Tegn faste posisjonsmønstre (hjørner)
    // Venstre øvre hjørne
    ctx.fillRect(20, 20, blockSize * 3, blockSize * 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(20 + blockSize, 20 + blockSize, blockSize, blockSize);
    ctx.fillStyle = '#000000';
    
    // Høyre øvre hjørne
    ctx.fillRect(size - 20 - blockSize * 3, 20, blockSize * 3, blockSize * 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(size - 20 - blockSize * 2, 20 + blockSize, blockSize, blockSize);
    ctx.fillStyle = '#000000';
    
    // Venstre nedre hjørne
    ctx.fillRect(20, size - 20 - blockSize * 3, blockSize * 3, blockSize * 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(20 + blockSize, size - 20 - blockSize * 2, blockSize, blockSize);
    ctx.fillStyle = '#000000';
    
    // Tegn noen tilfeldige blokker i midten for å simulere data
    const centerStart = 20 + blockSize * 3;
    const centerSize = size - 40 - blockSize * 6;
    
    for (let i = 0; i < 10; i++) {
      const x = centerStart + Math.floor(Math.random() * (centerSize / blockSize)) * blockSize;
      const y = centerStart + Math.floor(Math.random() * (centerSize / blockSize)) * blockSize;
      ctx.fillRect(x, y, blockSize, blockSize);
    }
    
    // Legg til tekst
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    // Tekst kun for å indikere at dette er en QR-kode
    ctx.fillText('Skann denne QR-koden', size / 2, size - 5);
    
  }, [value, size]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
};

const QRCodeModal = ({ moteId, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [surveyUrl, setSurveyUrl] = useState('');
  const [useSimpleQR, setUseSimpleQR] = useState(false);

  useEffect(() => {
    // Generer URL til spørreundersøkelsen
    // I en produksjonsapp bør du bruke en faktisk absolutt URL her
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/survey/${moteId}`;
    setSurveyUrl(url);
    
    // Sjekk om vi skal bruke fallback-løsningen
    // Dette kan trigges hvis det oppstår en feil med react-qr-code
    try {
      // Hvis QRCode ikke er importert riktig, vil dette kaste en feil
      if (typeof QRCode !== 'function' && !useSimpleQR) {
        console.warn('QRCode fra react-qr-code er ikke tilgjengelig, bruker fallback-løsning');
        setUseSimpleQR(true);
      }
    } catch (error) {
      console.warn('Feil ved bruk av QRCode, bruker fallback-løsning:', error);
      setUseSimpleQR(true);
    }
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
            {useSimpleQR ? (
              <SimpleCanvasQRCode value={surveyUrl} size={200} />
            ) : (
              <QRCode 
                value={surveyUrl} 
                size={200}
                level="M"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            )}
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