import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    this.modelName = import.meta.env.VITE_AI_MODEL_NAME || 'gemini-1.5-flash';
    this.isEnabled = import.meta.env.VITE_AI_ENABLED === 'true';
    
    if (!this.apiKey && this.isEnabled) {
      console.warn('Gemini API key not configured. AI features will be disabled.');
      this.isEnabled = false;
      return;
    }

    if (this.isEnabled) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ 
          model: this.modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        });
        console.log('Gemini AI service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
        this.isEnabled = false;
      }
    }
  }

  isServiceAvailable() {
    // Check if all required components are available
    if (!this.isEnabled) {
      console.warn('AI Service is disabled in configuration');
      return false;
    }
    if (!this.apiKey) {
      console.warn('AI Service: No API key configured');
      return false;
    }
    if (!this.model) {
      console.warn('AI Service: Model not initialized');
      return false;
    }
    return true;
  }

  async generateResponse(prompt, context = []) {
    if (!this.isServiceAvailable()) {
      throw new Error('Gemini AI service is not available');
    }

    try {
      // Build conversation history for context
      const conversationHistory = context.map(msg => 
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      const fullPrompt = `${conversationHistory}\nHuman: ${prompt}\nAssistant:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        content: text,
        usage: {
          promptTokens: 0, // Gemini doesn't provide token count in free tier
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error) {
      console.error('Error generating AI response:', error);

      // Handle specific error types
      const errorMessage = error.message || error.toString();

      if (errorMessage.includes('API_KEY') || errorMessage.includes('403')) {
        throw new Error('AI service authentication failed. The API key may be invalid or expired.');
      } else if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to AI service. This may be due to browser security restrictions.');
      } else if (errorMessage.includes('404') || errorMessage.includes('Not found')) {
        throw new Error('AI service endpoint not found. The service may be temporarily unavailable.');
      } else if (errorMessage.includes('RATE_LIMIT') || errorMessage.includes('429')) {
        throw new Error('AI service is temporarily busy. Please try again in a moment.');
      } else if (errorMessage.includes('SAFETY')) {
        throw new Error('Your request was blocked by safety filters. Please rephrase your question.');
      } else {
        throw new Error(`AI service error: ${errorMessage}. Please try again later.`);
      }
    }
  }

  async generateStreamResponse(prompt, context = [], onChunk) {
    if (!this.isServiceAvailable()) {
      throw new Error('Gemini AI service is not available');
    }

    try {
      const conversationHistory = context.map(msg => 
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      const fullPrompt = `${conversationHistory}\nHuman: ${prompt}\nAssistant:`;

      const result = await this.model.generateContentStream(fullPrompt);
      let fullResponse = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        if (onChunk) {
          onChunk(chunkText);
        }
      }

      return {
        success: true,
        content: fullResponse
      };
    } catch (error) {
      console.error('Error generating streaming AI response:', error);
      throw error;
    }
  }

  // Method to check if the service is properly configured
  async testConnection() {
    if (!this.isServiceAvailable()) {
      return { success: false, error: 'Service not available' };
    }

    try {
      const testPrompt = "Hello, please respond with 'AI service is working correctly'";
      const response = await this.generateResponse(testPrompt);
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const geminiService = new GeminiService();

export default geminiService;
