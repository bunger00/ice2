import React, { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { CheckCircle2 } from 'lucide-react';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

function AIMalValidering({ mal, onUpdateMal }) {
  const [aiVurdering, setAiVurdering] = useState('');
  const [forslag, setForslag] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validerMal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/validate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mal })
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      const message = data.data;
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