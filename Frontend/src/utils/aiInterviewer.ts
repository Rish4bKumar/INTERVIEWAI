interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIInterviewer {
  private conversationHistory: Message[] = [];
  private jobField: string;

  constructor(jobField: string) {
    this.jobField = jobField;
    // Initialize with system message
    this.conversationHistory.push({
      role: 'system',
      content: `You are an experienced ${jobField} interviewer conducting a professional job interview. 
Your role is to:
1. Ask relevant, thoughtful questions about the candidate's experience, skills, and fit for the role
2. Follow up on their answers with deeper questions
3. Keep questions concise (2-3 sentences max)
4. Be professional but friendly
5. Ask one question at a time
6. After 5-7 questions, wrap up the interview professionally

Start by greeting the candidate and asking your first question about their background.`
    });
  }

  async getNextQuestion(userResponse?: string): Promise<string> {
    if (userResponse) {
      this.conversationHistory.push({
        role: 'user',
        content: userResponse
      });
    }

    try {
      // Use backend endpoint (more secure - API key stays on server)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:5000';
      const apiUrl = `${backendUrl}/interview-question`;
      
      console.log('Calling backend for interview question...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.conversationHistory,
          jobField: this.jobField
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: `;
        try {
          const error = await response.json();
          errorMessage += error.error || error.message || 'Failed to get AI response';
        } catch {
          errorMessage += await response.text() || 'Unknown error';
        }
        console.error('Backend API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const assistantMessage = data.message;

      if (!assistantMessage) {
        throw new Error('AI returned empty response');
      }

      const trimmedMessage = assistantMessage.trim();

      this.conversationHistory.push({
        role: 'assistant',
        content: trimmedMessage
      });

      return trimmedMessage;
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      // Re-throw with more context
      if (error.message) {
        throw error;
      }
      throw new Error(`Failed to get AI interview question: ${error.message || 'Unknown error'}`);
    }
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  getQuestionCount() {
    return this.conversationHistory.filter(msg => msg.role === 'assistant').length;
  }
}
