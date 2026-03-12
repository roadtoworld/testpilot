cat > lib/ai.ts << 'ENDOFFILE'
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

export async function generateTestsFromUrl(url: string, html?: string): Promise<{
  tests: Array<{ name: string; description: string; steps: TestStep[] }>;
}> {
  const systemPrompt = `You are an expert QA engineer. Generate comprehensive end-to-end test cases for web applications. You must respond ONLY with valid JSON — no markdown, no explanation, no backticks. Each test should have: name, description, and steps array. Each step must have: id (unique short string), instruction (plain English), type (navigate|click|type|assert|wait|screenshot|custom). Generate 5-8 test cases covering: page load, navigation, key interactions, forms, assertions.`;
  const userPrompt = `Generate E2E test cases for this website: ${url}. Respond with JSON only: { "tests": [{ "name": "Test name", "description": "What this tests", "steps": [{ "id": "s1", "instruction": "Go to ${url}", "type": "navigate" }] }] }`;
  const text = await callAI(systemPrompt, userPrompt, 4000);
  const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
  return JSON.parse(clean);
}

export async function generateStepsFromDescription(description: string, url: string): Promise<TestStep[]> {
  const systemPrompt = `You are an expert QA engineer. Convert test descriptions into actionable Playwright steps. Respond ONLY with valid JSON array — no markdown, no explanation.`;
  const userPrompt = `Convert this test description into steps for URL: ${url}. Description: "${description}". Respond with JSON array only: [{ "id": "s1", "instruction": "Go to ${url}", "type": "navigate" }]`;
  const text = await callAI(systemPrompt, userPrompt, 2000);
  const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
  return JSON.parse(clean);
}
ENDOFFILE