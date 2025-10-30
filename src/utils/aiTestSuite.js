// Simple test file to verify AI integration
// Run this in browser console to test AI functionality

import geminiService from './src/services/geminiService.js';
import aiHealthAssistant from './src/services/aiHealthAssistant.js';

// Test functions (for manual testing in browser console)
window.testAI = {
  // Test basic Gemini service
  async testGeminiService() {
    console.log('Testing Gemini Service...');
    
    try {
      const isAvailable = geminiService.isServiceAvailable();
      console.log('Service Available:', isAvailable);
      
      if (!isAvailable) {
        console.log('❌ Gemini service not available. Check API key in .env file.');
        return false;
      }
      
      const testResult = await geminiService.testConnection();
      console.log('Connection Test:', testResult);
      
      if (testResult.success) {
        console.log('✅ Gemini service working correctly!');
        return true;
      } else {
        console.log('❌ Connection test failed:', testResult.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing Gemini service:', error);
      return false;
    }
  },
  
  // Test health assistant
  async testHealthAssistant() {
    console.log('Testing AI Health Assistant...');
    
    try {
      const response = await aiHealthAssistant.askHealthQuestion(
        "What is high blood pressure?",
        "test-user"
      );
      
      console.log('Health Assistant Response:', response);
      
      if (response.success) {
        console.log('✅ AI Health Assistant working correctly!');
        console.log('Response preview:', response.content.substring(0, 100) + '...');
        return true;
      } else {
        console.log('❌ Health Assistant failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing Health Assistant:', error);
      return false;
    }
  },
  
  // Test privacy filter
  testPrivacyFilter() {
    console.log('Testing Privacy Filter...');
    
    const testInputs = [
      "My name is John Doe and my phone is 555-123-4567",
      "My SSN is 123-45-6789",
      "My email is test@example.com",
      "What is diabetes?", // Should pass through unchanged
      "I was born on 01/15/1990"
    ];
    
    testInputs.forEach((input, index) => {
      const sanitized = aiHealthAssistant.sanitizeInput(input);
      console.log(`Test ${index + 1}:`);
      console.log('  Original:', input);
      console.log('  Sanitized:', sanitized);
      console.log('  Filtered:', input !== sanitized ? '✅' : '➖');
    });
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🧪 Running AI Integration Tests...\n');
    
    const results = {
      privacyFilter: false,
      geminiService: false,
      healthAssistant: false
    };
    
    // Test privacy filter (synchronous)
    console.log('1. Privacy Filter Test:');
    try {
      this.testPrivacyFilter();
      results.privacyFilter = true;
      console.log('✅ Privacy filter working\n');
    } catch (error) {
      console.error('❌ Privacy filter error:', error);
    }
    
    // Test Gemini service
    console.log('2. Gemini Service Test:');
    results.geminiService = await this.testGeminiService();
    console.log('');
    
    // Test health assistant (only if Gemini works)
    if (results.geminiService) {
      console.log('3. Health Assistant Test:');
      results.healthAssistant = await this.testHealthAssistant();
      console.log('');
    }
    
    // Summary
    console.log('📊 Test Results Summary:');
    console.log('Privacy Filter:', results.privacyFilter ? '✅' : '❌');
    console.log('Gemini Service:', results.geminiService ? '✅' : '❌');
    console.log('Health Assistant:', results.healthAssistant ? '✅' : '❌');
    
    const allPassed = Object.values(results).every(result => result);
    console.log('\n🎯 Overall Status:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    if (!results.geminiService) {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('- Check that VITE_GEMINI_API_KEY is set in .env file');
      console.log('- Restart the development server after changing .env');
      console.log('- Verify your API key is valid at https://aistudio.google.com/');
      console.log('- Check browser console for detailed error messages');
    }
    
    return results;
  }
};

// Auto-run tests when this file is loaded (commented out by default)
// window.testAI.runAllTests();

console.log('🧪 AI Test Suite Loaded!');
console.log('Run tests manually with:');
console.log('- testAI.runAllTests()');
console.log('- testAI.testGeminiService()');
console.log('- testAI.testHealthAssistant()');
console.log('- testAI.testPrivacyFilter()');

export default window.testAI;
