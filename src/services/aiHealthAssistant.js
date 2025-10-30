import geminiService from './geminiService.js';

// Health-focused system prompt for the AI
const HEALTH_SYSTEM_PROMPT = `You are a helpful health information assistant for this EHR (Electronic Health Record) system named VitalLink, a medical records platform. Your role is to provide general health education and support.

IMPORTANT GUIDELINES:
- Provide general health information and education only
- Always recommend consulting healthcare professionals for medical concerns
- Never provide specific medical diagnoses or treatment plans
- Be empathetic, supportive, and use simple language
- Include medical disclaimers when appropriate
- Focus on evidence-based information
- Encourage healthy lifestyle choices
- Emphasize the importance of professional medical care

WHAT YOU CAN HELP WITH:
✅ General health information and education
✅ Explanation of medical terms and procedures
✅ Lifestyle and wellness tips
✅ Understanding symptoms (general information only)
✅ Medication information (general, not specific to individuals)
✅ Health prevention strategies
✅ Mental health awareness and support

WHAT YOU CANNOT DO:
❌ Provide specific medical diagnoses
❌ Replace professional medical advice
❌ Analyze personal medical records
❌ Prescribe medications or treatments
❌ Handle medical emergencies
❌ Give advice on stopping medications

RESPONSE FORMAT:
- Start with helpful information
- Use bullet points or numbered lists when appropriate
- Include emojis sparingly for readability
- End with appropriate medical disclaimers
- Keep responses concise but informative (200-400 words)

EMERGENCY SITUATIONS:
If someone mentions emergency symptoms (chest pain, difficulty breathing, severe bleeding, etc.), immediately advise them to seek emergency medical care.

Remember: You are providing educational information only. All medical decisions should be made in consultation with qualified healthcare providers.`;

class AIHealthAssistant {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 messages for context
  }

  async askHealthQuestion(question, userId = null) {
    try {
      // Sanitize input to remove any personal information
      const sanitizedQuestion = this.sanitizeInput(question);
      
      // Check if service is available
      if (!geminiService.isServiceAvailable()) {
        return this.getFallbackResponse();
      }

      // Check for emergency keywords
      if (this.containsEmergencyKeywords(sanitizedQuestion)) {
        return this.getEmergencyResponse();
      }

      // Build the full prompt with system instructions
      const fullPrompt = `${HEALTH_SYSTEM_PROMPT}\n\nUser Question: ${sanitizedQuestion}`;

      // Get AI response
      const response = await geminiService.generateResponse(
        fullPrompt, 
        this.conversationHistory
      );

      if (response.success) {
        // Add to conversation history
        this.addToHistory('user', sanitizedQuestion);
        this.addToHistory('assistant', response.content);

        // Log interaction (without sensitive content)
        this.logInteraction(userId, 'success');

        return {
          success: true,
          content: response.content,
          type: 'ai_response',
          timestamp: new Date().toISOString(),
          disclaimer: this.getMedicalDisclaimer()
        };
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }

    } catch (error) {
      console.error('Error in AI Health Assistant:', error);
      
      // Log error (without sensitive content)
      this.logInteraction(userId, 'error', error.message);

      return this.getErrorResponse(error.message);
    }
  }

  async streamHealthResponse(question, onChunk, userId = null) {
    try {
      const sanitizedQuestion = this.sanitizeInput(question);
      
      if (!geminiService.isServiceAvailable()) {
        return this.getFallbackResponse();
      }

      if (this.containsEmergencyKeywords(sanitizedQuestion)) {
        return this.getEmergencyResponse();
      }

      const fullPrompt = `${HEALTH_SYSTEM_PROMPT}\n\nUser Question: ${sanitizedQuestion}`;

      let fullContent = '';
      const response = await geminiService.generateStreamResponse(
        fullPrompt,
        this.conversationHistory,
        (chunk) => {
          fullContent += chunk;
          if (onChunk) onChunk(chunk);
        }
      );

      if (response.success) {
        this.addToHistory('user', sanitizedQuestion);
        this.addToHistory('assistant', fullContent);
        this.logInteraction(userId, 'success');

        return {
          success: true,
          content: fullContent,
          type: 'ai_response',
          timestamp: new Date().toISOString(),
          disclaimer: this.getMedicalDisclaimer()
        };
      }

    } catch (error) {
      console.error('Error in streaming AI response:', error);
      this.logInteraction(userId, 'error', error.message);
      return this.getErrorResponse(error.message);
    }
  }

  // Sanitize user input to remove personal information
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove potential personal identifiers (basic implementation)
    let sanitized = input
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]') // SSN pattern
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]') // Phone pattern
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Email pattern
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '[DATE]') // Date pattern
      .replace(/\b(my name is|i'm|i am)\s+[A-Za-z]+/gi, 'my name is [NAME]'); // Name patterns

    return sanitized.trim();
  }

  // Check for emergency-related keywords
  containsEmergencyKeywords(text) {
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'stroke', 'can\'t breathe', 'difficulty breathing',
      'severe bleeding', 'unconscious', 'seizure', 'overdose', 'poisoning',
      'severe allergic reaction', 'anaphylaxis', 'suicide', 'self harm'
    ];

    const lowerText = text.toLowerCase();
    return emergencyKeywords.some(keyword => lowerText.includes(keyword));
  }

  // Add message to conversation history
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content, timestamp: Date.now() });
    
    // Keep only recent messages to prevent context from getting too long
    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
    }
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Log interaction for analytics (privacy-compliant)
  logInteraction(userId, status, error = null) {
    try {
      // Only log non-sensitive metadata
      const logData = {
        timestamp: new Date().toISOString(),
        status,
        hasUserId: Boolean(userId),
        error: error ? 'error_occurred' : null, // Don't log actual error messages
        service: 'ai_health_assistant'
      };
      
      // You can send this to your analytics service
      console.log('AI Interaction Log:', logData);
    } catch (err) {
      console.error('Failed to log AI interaction:', err);
    }
  }

  // Response generators
  getEmergencyResponse() {
    return {
      success: true,
      content: `🚨 **EMERGENCY NOTICE**

This appears to be a medical emergency. Please:

1. **Call emergency services immediately** (911 in the US)
2. **Seek immediate medical attention**
3. **Do not delay for any reason**

If you're experiencing:
- Chest pain or heart problems
- Difficulty breathing
- Severe bleeding
- Signs of stroke
- Allergic reactions
- Thoughts of self-harm

**Please contact emergency services or go to the nearest emergency room immediately.**

This AI assistant cannot help with emergency medical situations. Your safety is the priority.`,
      type: 'emergency_response',
      timestamp: new Date().toISOString(),
      isEmergency: true
    };
  }

  getFallbackResponse() {
    return {
      success: true,
      content: `I'm sorry, but the AI health assistant is currently unavailable. However, I can still help you with some general guidance:

**For general health questions:**
- Consult reputable health websites like WebMD, Mayo Clinic, or CDC
- Speak with a healthcare professional
- Contact your doctor's office for advice

**For urgent concerns:**
- Call your healthcare provider
- Visit an urgent care center
- Go to the emergency room if serious

**For emergencies:**
- Call 911 (US) or your local emergency number immediately

Remember, while AI can provide helpful information, it should never replace professional medical advice.`,
      type: 'fallback_response',
      timestamp: new Date().toISOString(),
      disclaimer: this.getMedicalDisclaimer()
    };
  }

  getErrorResponse(errorMessage) {
    return {
      success: false,
      content: `I apologize, but I'm experiencing some technical difficulties right now. 

**What you can do:**
- Try asking your question again in a few moments
- Consult with a healthcare professional for medical concerns
- Visit reputable health websites for general information

**For urgent health matters:**
- Contact your healthcare provider directly
- Call a nurse hotline if available
- Seek immediate medical attention if needed

Please don't hesitate to reach out to a medical professional for any health concerns.`,
      type: 'error_response',
      timestamp: new Date().toISOString(),
      error: 'service_unavailable',
      disclaimer: this.getMedicalDisclaimer()
    };
  }

  getMedicalDisclaimer() {
    return "⚕️ **Medical Disclaimer:** This information is for educational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for medical concerns.";
  }

  // Get suggested health topics
  getSuggestedTopics() {
    return [
      "What is a healthy diet?",
      "How much exercise do I need?",
      "What are the signs of dehydration?",
      "How can I improve my sleep?",
      "What is normal blood pressure?",
      "How to manage stress effectively?",
      "What are the benefits of regular checkups?",
      "How to maintain good mental health?"
    ];
  }

  // Quick health tips
  getHealthTips() {
    return [
      "💧 Stay hydrated - aim for 8 glasses of water daily",
      "🚶‍♀️ Take regular breaks to move and stretch",
      "😴 Prioritize 7-9 hours of quality sleep",
      "🥗 Include fruits and vegetables in your meals",
      "🧘‍♀️ Practice stress management techniques",
      "🩺 Schedule regular health checkups",
      "🚭 Avoid smoking and limit alcohol",
      "🧼 Wash hands frequently to prevent illness"
    ];
  }
}

// Create singleton instance
const aiHealthAssistant = new AIHealthAssistant();

export default aiHealthAssistant;
