import type { Handler } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }
    
    const { notes, vitals } = JSON.parse(event.body || '{}')
    const ai = new GoogleGenAI({ apiKey })
    const prompt = `
You are a medical triage assistant.
Review the following patient data and suggest a single triage urgency tag: "Routine", "Urgent", or "Emergency".
Only output the single word. No markdown or extra text.
Clinical Notes: ${notes || 'None provided'}
Vitals: ${JSON.stringify(vitals || {})}
`
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    })
    
    const triage = response.text?.trim() || 'Routine'
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triage })
    }
  } catch (error: any) {
    console.error('Triage Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to analyze triage urgency' })
    }
  }
}
