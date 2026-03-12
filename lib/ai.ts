import Anthropic from '@anthropic-ai/sdk';
import { TestStep } from './runner';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateTestsFromUrl(url: string, html?: string): Promise<{
  tests: Array<{ name: string; description: string; steps: TestStep[] }>;
}> {
  const systemPrompt = `You are an expert QA engineer. Generate comprehensive end-to-end test cases for web applications.
You must respond ONLY with valid JSON — no markdown, no explanation, no backticks.
Each test should have: name, description, and steps array.
Each step must have: id (unique short string), instruction (plain English), type (navigate|click|type|assert|wait|screenshot|custom).
Generate 5-8 test cases covering: page load, navigation, key interactions, forms, assertions.`;

  const userPrompt = `Generate E2E test cases for this website: ${url}
${html ? `\nPage HTML snippet:\n${html.substring(0, 3000)}` : ''}

Respond with JSON only:
{
  "tests": [
    {
      "name": "Test name",
      "description": "What this tests",
      "steps": [
        { "id": "s1", "instruction": "Go to ${url}", "type": "navigate" },
        { "id": "s2", "instruction": "Verify page title is visible", "type": "assert" }
      ]
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function generateStepsFromDescription(description: string, url: string): Promise<TestStep[]> {
  const systemPrompt = `You are an expert QA engineer. Convert test descriptions into actionable Playwright steps.
Respond ONLY with valid JSON array — no markdown, no explanation.`;

  const userPrompt = `Convert this test description into steps for URL: ${url}
Description: "${description}"

Respond with JSON array only:
[
  { "id": "s1", "instruction": "Go to ${url}", "type": "navigate" },
  { "id": "s2", "instruction": "Verify something is visible", "type": "assert" }
]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
