import { TestStep } from './runner';

function getProvider() {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  throw new Error('No AI API key found.');
}

async function callAI(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const provider = getProvider();
  if (provider === 'gemini') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
        }),
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return response.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('');
  }
}

export async function generateTestsFromUrl(url: string, html?: string): Promise<{ tests: Array<{ name: string; description: string; steps: TestStep[] }> }> {
  const systemPrompt = `You are an expert QA engineer. Respond ONLY with valid JSON. Generate 5-8 E2E test cases. Each test has: name, description, steps array. Each step has: id, instruction, type (navigate|click|type|assert|wait|screenshot|custom).`;
  const userPrompt = `Generate E2E tests for: ${url}\nJSON format: {"tests":[{"name":"","description":"","steps":[{"id":"s1","instruction":"Go to ${url}","type":"navigate"}]}]}`;
  const text = await callAI(systemPrompt, userPrompt, 4000);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function generateStepsFromDescription(description: string, url: string): Promise<TestStep[]> {
  const systemPrompt = `You are an expert QA engineer. Respond ONLY with a JSON array of steps. Each step has: id, instruction, type.`;
  const userPrompt = `Steps for: ${description} on ${url}\nJSON: [{"id":"s1","instruction":"Go to ${url}","type":"navigate"}]`;
  const text = await callAI(systemPrompt, userPrompt, 2000);
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
