require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json());
app.use(cors());

const apiKey = process.env.OPENAI_API_KEY || 'dummy_key';
const openai = new OpenAI({ apiKey });

const PRODUCTS = [
  { id: '1', name: 'Wireless Noise-Canceling Headphones', price: 199, stock: 15, category: 'Audio' },
  { id: '2', name: 'Ergonomic Mechanical Keyboard', price: 120, stock: 8, category: 'Peripherals' },
  { id: '3', name: 'Ultra-Wide Gaming Monitor 34"', price: 450, stock: 0, category: 'Monitors' },
  { id: '4', name: 'Smart Fitness Watch', price: 149, stock: 22, category: 'Wearables' },
];

const SYSTEM_PROMPT = `
You are SalesPulse AI, an autonomous sales assistant for an e-commerce store.
Your goals:
1. Answer questions ONLY using the provided product catalog data. If a product is out of stock or not listed, state that clearly.
2. If a user shows high interest or hesitates on price, you can call the function "apply_discount" to give them a 10% promo code (PROMO10).
3. Keep responses concise, friendly, and conversion-focused.
`;

app.post('/api/chat', async (req, res) => {
  const { message, cart } = req.body;

  try {
    // Attempt live OpenAI completion
    const contextPrompt = `Current Live Catalog: ${JSON.stringify(PRODUCTS)}\nUser Cart State: ${JSON.stringify(cart || [])}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: contextPrompt },
        { role: 'user', content: message }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'apply_discount',
            description: 'Triggers a 10% discount promo code for the user during checkout hesitation.',
            parameters: {
              type: 'object',
              properties: {
                discountCode: { type: 'string', example: 'SAVE10' },
                reason: { type: 'string', example: 'User expressed hesitation on price.' }
              },
              required: ['discountCode']
            }
          }
        }
      ],
      tool_choice: 'auto'
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === 'apply_discount') {
        return res.json({
          reply: "I can help with that! I've applied an exclusive 10% discount code **SAVE10** to your session.",
          appliedDiscount: 'SAVE10'
        });
      }
    }

    return res.json({ reply: responseMessage.content });

  } catch (error) {
    // Mock fallback when API Key is missing or invalid
    const lowerMsg = (message || '').toLowerCase();
    
    if (lowerMsg.includes('discount') || lowerMsg.includes('expensive') || lowerMsg.includes('price')) {
      return res.json({
        reply: "I can help with that! I've applied an exclusive 10% discount code **SAVE10** to your session.",
        appliedDiscount: 'SAVE10'
      });
    }

    return res.json({
      reply: `[Mock AI Response]: Based on our store inventory, we currently have ${PRODUCTS[0].name} ($${PRODUCTS[0].price}) in stock. How can I help you complete your purchase?`
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SalesPulse AI Server running on port ${PORT}`));