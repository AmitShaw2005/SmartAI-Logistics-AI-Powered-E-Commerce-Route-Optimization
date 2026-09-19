import { GoogleGenAI } from '@google/genai';
import { RouteOptimizationResult, Order, DeliveryPartner, SimulationState } from '../src/types.js';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function generateAILogisticsInsight(
  partner: DeliveryPartner,
  orders: Order[],
  route: RouteOptimizationResult,
  simulation: SimulationState
): Promise<{ explanation: string; recommendations: string[] }> {
  const client = getGeminiClient();

  if (!client) {
    // Return rule-grounded explanation when Gemini API key is not configured
    return {
      explanation: route.aiExplanation,
      recommendations: route.recommendations,
    };
  }

  try {
    const prompt = `
You are the SmartAI Logistics Dispatch & Route Intelligence Engine.
Analyze the following active delivery batch and provide a concise, high-impact route optimization insight and safety recommendations for delivery partner ${partner.name}.

Delivery Partner Details:
- Vehicle: ${partner.vehicleType} (${partner.fuelType}, efficiency ${partner.vehicleEfficiency})
- Assigned Deliveries: ${orders.length}
- Total Optimized Distance: ${route.totalDistanceKm} km (Baseline was ${route.baselineDistanceKm} km)
- Estimated Duration: ${route.totalDurationMinutes} minutes
- Estimated Fuel Saved: ${route.fuelSavedLiters} ${partner.fuelType === 'Electric' ? 'kWh' : 'liters'}
- Simulated Traffic: ${simulation.traffic}
- Simulated Weather: ${simulation.weather}

Stops Sequence:
${route.stops
  .map(
    s =>
      `- Stop ${s.sequenceNumber}: Order #${s.orderId} (${s.priority} priority) - ${s.itemsSummary} -> ETA ${s.estimatedArrival}`
  )
  .join('\n')}

Respond in clean JSON with two fields:
1. "explanation": A clear 2-3 sentence logistics explanation of why this sequence is optimal (e.g. priority deadlines, traffic bypass, and distance economy).
2. "recommendations": Array of 3 tactical tips for the driver (e.g. speed, fuel savings, traffic caution).
`;

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text.trim());
      if (parsed.explanation && Array.isArray(parsed.recommendations)) {
        return {
          explanation: parsed.explanation,
          recommendations: parsed.recommendations,
        };
      }
    }
  } catch (error) {
    console.warn('Gemini API call failed or timed out, using fallback intelligence:', error);
  }

  return {
    explanation: route.aiExplanation,
    recommendations: route.recommendations,
  };
}
