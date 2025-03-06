import React, { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { CheckCircle2, Brain, Sparkles, ThumbsUp } from 'lucide-react';

function AIMalValidering({ mal, onUpdateMal }) {
  const [aiVurdering, setAiVurdering] = useState('');
  const [forslag, setForslag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validerMal = async () => {
    setIsLoading(true);
    try {
      const anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const message = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Vurder følgende målsetting for et møte og gi konstruktiv tilbakemelding: "${mal}". 
                    Gi også et konkret forslag til forbedret målformulering hvis nødvendig.
                    Svar på norsk i følgende format:
                    VURDERING: Din vurdering her
                    FORSLAG: Ditt forslag til forbedret målformulering her (hvis nødvendig)`
        }]
      });

      const responseText = message.content[0].text;
      const [vurdering, forslag] = responseText.split('FORSLAG:');
      
      setAiVurdering(vurdering.replace('VURDERING:', '').trim());
      const rensetForslag = forslag?.trim()
        .match(/"([^"]*)"/)?.[ 1 ] || forslag?.trim() || '';
      setForslag(rensetForslag);
    } catch (error) {
      console.error('Feil ved AI-vurdering:', error);
      setAiVurdering(`Kunne ikke utføre vurdering: ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={validerMal}
        disabled={isLoading}
        className="self-start flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60 disabled:pointer-events-none"
      >
        {isLoading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Analyserer målet...</span>
          </>
        ) : (
          <>
            <Brain size={16} />
            <span>Valider mål med AI</span>
          </>
        )}
      </button>
      
      {aiVurdering && (
        <div className="mt-1 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm">
          <div className="flex gap-2 items-start mb-3">
            <Sparkles size={18} className="text-blue-500 mt-0.5" />
            <h3 className="text-sm font-semibold text-gray-800">AI-Vurdering av målsettingen</h3>
          </div>
          
          <p className="text-sm leading-relaxed text-gray-700 mb-4 ml-6">{aiVurdering}</p>
          
          {forslag && (
            <div className="ml-6 mt-4 p-4 bg-white rounded-md border border-blue-100">
              <div className="flex gap-2 items-start mb-2">
                <ThumbsUp size={16} className="text-green-600 mt-0.5" />
                <p className="text-sm font-semibold text-gray-800">Forslag til forbedring:</p>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 ml-6 italic">"{forslag}"</p>
              <button
                onClick={() => onUpdateMal(forslag)}
                className="ml-6 mt-3 flex items-center gap-2 px-4 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-200"
              >
                <CheckCircle2 size={16} />
                Bruk dette forslaget
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIMalValidering; 