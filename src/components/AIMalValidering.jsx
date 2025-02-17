import React, { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { CheckCircle2 } from 'lucide-react';

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

      console.log('Starter AI-vurdering med nøkkel:', import.meta.env.VITE_ANTHROPIC_API_KEY ? 'Nøkkel finnes' : 'Ingen nøkkel');
      
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

      console.log('Respons fra AI:', message);

      const response = message.content[0].text;
      const [vurdering, forslag] = response.split('FORSLAG:');
      
      setAiVurdering(vurdering.replace('VURDERING:', '').trim());
      const rensetForslag = forslag?.trim()
        .match(/"([^"]*)"/)?.[ 1 ] || forslag?.trim() || '';
      setForslag(rensetForslag);
    } catch (error) {
      console.error('Detaljert feil ved AI-vurdering:', error);
      setAiVurdering(`Kunne ikke utføre vurdering: ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={validerMal}
        disabled={isLoading}
        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
      >
        {isLoading ? 'Vurderer...' : 'Valider mål'}
      </button>
      
      {aiVurdering && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg max-w-md">
          <p className="text-sm text-gray-700 mb-3">{aiVurdering}</p>
          {forslag && (
            <>
              <p className="text-sm font-semibold text-gray-900 mt-2">Forslag til forbedring:</p>
              <p className="text-sm text-gray-700">{forslag}</p>
              <button
                onClick={() => onUpdateMal(forslag)}
                className="mt-2 flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
              >
                <CheckCircle2 size={16} />
                Bruk dette forslaget
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AIMalValidering; 