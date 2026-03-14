import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Processing resume file:', file.name, file.type);

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File is too large. Please upload a file smaller than 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text from file
    let fileText = await file.text();
    
    // Truncate text if too long to avoid token limits (keep first ~50K characters)
    // This ensures we stay within AI model token limits while analyzing key resume sections
    const maxTextLength = 50000;
    if (fileText.length > maxTextLength) {
      console.log(`Resume text truncated from ${fileText.length} to ${maxTextLength} characters`);
      fileText = fileText.substring(0, maxTextLength) + '\n\n[Resume truncated for analysis]';
    }
    
    const AI_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    console.log('Sending resume to AI for analysis');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          model: 'grok/llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an expert ATS (Applicant Tracking System) resume analyzer and senior career coach with 15+ years of experience in recruitment and HR.

Your task is to analyze resumes with professional accuracy and provide actionable feedback. You must evaluate:
1. Overall presentation and formatting
2. Content quality and relevance
3. ATS compatibility (keywords, formatting, structure)
4. Strengths and weaknesses
5. Specific improvement suggestions

CRITICAL: You MUST respond with ONLY a valid JSON object, no other text before or after. Use this exact structure:
{
  "overallScore": <number between 0-100>,
  "strengths": [<array of 3-5 specific strengths>],
  "improvements": [<array of 3-5 specific actionable improvements>],
  "keywordAnalysis": {
    "present": [<array of 5-10 important keywords found>],
    "missing": [<array of 3-7 keywords that should be added>]
  },
  "atsScore": <number between 0-100 based on ATS compatibility>,
  "detailedFeedback": "<2-3 paragraph comprehensive analysis>"
}

Scoring criteria:
- Overall Score: Based on content quality, presentation, experience relevance, and completeness
- ATS Score: Based on keyword optimization, formatting compatibility, section organization, and file structure

Be honest but constructive. Provide specific, actionable feedback.`
          },
          {
            role: 'user',
            content: `Analyze this resume and provide detailed scoring and feedback:\n\n${fileText}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('Empty AI response received');
      console.error('Full API response:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: 'Received empty response from AI. Please try again.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('AI analysis received, length:', aiResponse.length);

    // Parse the JSON response from AI
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       aiResponse.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      analysis = JSON.parse(jsonStr.trim());
      
      // Validate the response structure
      if (!analysis.overallScore || !analysis.atsScore || !analysis.strengths || !analysis.improvements) {
        throw new Error('Invalid response structure - missing required fields');
      }
      
      console.log('Analysis parsed successfully:', {
        overallScore: analysis.overallScore,
        atsScore: analysis.atsScore,
        strengthsCount: analysis.strengths?.length,
        improvementsCount: analysis.improvements?.length
      });
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw AI response (first 500 chars):', aiResponse.substring(0, 500));
      
      // Return error to user
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI analysis. The response format was unexpected. Please try again.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in resume-analyzer function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
