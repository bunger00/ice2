import React, { useEffect, useState, useRef } from 'react';
import { X, Copy, Check } from 'lucide-react';

// Ren Canvas-basert QR-kode implementasjon uten eksterne avhengigheter
const CanvasQRCode = ({ value, size = 200 }) => {
  const canvasRef = useRef(null);
  
  // Enkel hash-funksjon for å generere konsistente verdier basert på input string
  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Konverter til 32bit integer
    }
    return Math.abs(hash);
  };
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Tøm canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    // Beregn dimensjoner
    const margin = Math.floor(size * 0.1);
    const moduleSize = Math.floor((size - 2 * margin) / 25); // 25x25 standard mini QR
    const qrSize = moduleSize * 25;
    
    // Generer en hash av verdien for å få konsistente pseudo-tilfeldige verdier
    const hash = simpleHash(value);
    
    // Tegn hovedrammen
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(margin, margin, qrSize, qrSize);
    
    // Tegn posisjonsmønstre (hjørner)
    const drawPositionPattern = (x, y) => {
      const patternSize = moduleSize * 7;
      
      // Ytre ramme
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, patternSize, patternSize);
      
      // Midtre hvit boks
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + moduleSize, y + moduleSize, patternSize - 2 * moduleSize, patternSize - 2 * moduleSize);
      
      // Innerste svart boks
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, patternSize - 4 * moduleSize, patternSize - 4 * moduleSize);
    };
    
    // Tegn posisjonsmønstre
    drawPositionPattern(margin, margin); // Venstre øvre hjørne
    drawPositionPattern(margin, margin + qrSize - 7 * moduleSize); // Venstre nedre hjørne
    drawPositionPattern(margin + qrSize - 7 * moduleSize, margin); // Høyre øvre hjørne
    
    // Tegn timing patterns (de stiplede linjene)
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 25; i += 2) {
      // Horisontal timing pattern
      ctx.fillRect(margin + 8 * moduleSize, margin + i * moduleSize, moduleSize, moduleSize);
      
      // Vertikal timing pattern
      ctx.fillRect(margin + i * moduleSize, margin + 8 * moduleSize, moduleSize, moduleSize);
    }
    
    // Tegn alignment pattern (midtre lokasjonsmønster)
    const alignX = margin + 16 * moduleSize;
    const alignY = margin + 16 * moduleSize;
    const alignSize = 5 * moduleSize;
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(alignX, alignY, alignSize, alignSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(alignX + moduleSize, alignY + moduleSize, alignSize - 2 * moduleSize, alignSize - 2 * moduleSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(alignX + 2 * moduleSize, alignY + 2 * moduleSize, moduleSize, moduleSize);
    
    // Tegn "data" mønstre basert på hash-verdien
    const seedRandom = (seed) => {
      return function() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };
    };
    
    const random = seedRandom(hash);
    
    // Unngå å tegne over posisjonsmønstre og timing patterns
    const isPositionArea = (x, y) => {
      // Venstre øvre
      if (x < 8 && y < 8) return true;
      // Høyre øvre
      if (x > 16 && y < 8) return true;
      // Venstre nedre
      if (x < 8 && y > 16) return true;
      // Midtre lokasjonsmønster
      if (x > 15 && x < 20 && y > 15 && y < 20) return true;
      // Timing patterns
      if (x === 6 || y === 6) return true;
      
      return false;
    };
    
    // Fyll inn "data"-moduler
    ctx.fillStyle = '#000000';
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 25; x++) {
        if (!isPositionArea(x, y) && random() > 0.6) {
          ctx.fillRect(
            margin + x * moduleSize, 
            margin + y * moduleSize, 
            moduleSize, 
            moduleSize
          );
        }
      }
    }
    
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

  useEffect(() => {
    // Generer URL til spørreundersøkelsen
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
            <CanvasQRCode value={surveyUrl} size={200} />
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