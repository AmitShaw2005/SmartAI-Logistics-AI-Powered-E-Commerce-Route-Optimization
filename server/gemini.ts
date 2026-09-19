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
    const weatherTele = route.weatherTelemetry;
    const incidentsList = route.incidents?.map(inc => `* [${inc.severity}] ${inc.title}: ${inc.description} (+${inc.delayImpactMinutes}m delay)`).join('\n') || 'None detected.';
    const perishableOrders = orders.filter(o => o.items.some(i => i.productName.toLowerCase().includes('milk') || i.productName.toLowerCase().includes('mango') || i.productName.toLowerCase().includes('curd') || i.productName.toLowerCase().includes('butter')));

    const prompt = `
You are the SmartAI Logistics Dispatch & Route Intelligence Engine.
Analyze the active delivery batch and environmental conditions to provide high-impact route optimization insights, traffic bottleneck advisories, and weather safety recommendations for courier ${partner.name}.

Courier Details:
- Vehicle: ${partner.vehicleType} (${partner.fuelType}, efficiency ${partner.vehicleEfficiency})
- Active Stops: ${orders.length} orders
- Multi-Order Co-Delivery Batch: ${route.isMultiOrderBatch ? `YES (${route.bundledCustomers?.join(' & ')} bundled along ${route.coDeliveryCorridor}; saves ~${route.batchFuelSavedLiters} ${partner.fuelType === 'Electric' ? 'kWh' : 'L'} fuel / ₹${route.batchCostSaved})` : 'Single order'}
- Optimized Distance: ${route.totalDistanceKm} km (Baseline was ${route.baselineDistanceKm} km)
- Estimated Transit Time: ${route.totalDurationMinutes} mins
- Fuel/Energy Saved: ${route.fuelSavedLiters} ${partner.fuelType === 'Electric' ? 'kWh' : 'liters'}

Environmental & Weather Telemetry:
- Weather Condition: ${simulation.weather}
- Ambient Temperature: ${weatherTele?.temperatureC ?? 28}°C | Precipitation Risk: ${weatherTele?.precipitationChance ?? 0}%
- Road Friction Index: ${weatherTele?.roadFrictionIndex ?? 0.95} (1.0 = dry asphalt, <0.6 = slippery wet asphalt)
- Braking Distance Penalty: +${weatherTele?.brakingDistancePenaltyPercent ?? 0}%
- Perishable/Temperature-Sensitive Orders: ${perishableOrders.length > 0 ? perishableOrders.map(o => o.id).join(', ') : 'None'}

Traffic & Identified Bottlenecks:
- Traffic Level: ${simulation.traffic}
- Identified Incidents along corridor:
${incidentsList}
- Smart Detour Available: ${route.smartDetourAvailable ? 'YES (Saves ~' + route.smartDetourSavingsMinutes + ' mins by bypassing 100ft road)' : 'NO'}

Delivery Stops Sequence:
${route.stops
  .map(
    s =>
      `- Stop #${s.sequenceNumber}: Order #${s.orderId} (${s.priority} priority) - ${s.itemsSummary} -> ETA ${s.estimatedArrival}`
  )
  .join('\n')}

Respond in valid JSON with:
1. "explanation": A clear 2-3 sentence logistics explanation addressing why this sequence was selected, how current traffic bottlenecks were handled (or bypassed), and how the weather condition affects courier dispatch.
2. "recommendations": Array of 3-4 tactical tips for the driver covering:
   - Traffic guidance & detour advice
   - Weather & road friction safety (braking, visibility)
   - Order temperature/moisture preservation (waterproofing/cold packs)
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
