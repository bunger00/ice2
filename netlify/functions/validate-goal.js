const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { mal } = JSON.parse(event.body);

    if (!mal || mal.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Målsetting mangler' }),
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, text: responseText }),
    };
  } catch (error) {
    console.error('Validate goal error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
