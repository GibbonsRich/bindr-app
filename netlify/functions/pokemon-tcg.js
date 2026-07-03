const TCG_BASE = 'https://api.pokemontcg.io/v2/cards';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const query = event.queryStringParameters?.q;
  if (!query) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Missing search query (q)' }),
    };
  }

  const apiKey =
    process.env.EXPO_PUBLIC_POKEMON_TCG_API_KEY || process.env.POKEMON_TCG_API_KEY;

  const pageSize = event.queryStringParameters?.pageSize ?? '20';
  const url = `${TCG_BASE}?q=${encodeURIComponent(query)}&pageSize=${encodeURIComponent(pageSize)}`;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey?.trim()) {
    headers['X-Api-Key'] = apiKey.trim();
  }

  try {
    const response = await fetch(url, { headers });
    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
      body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Pokemon TCG proxy failed',
      }),
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}
