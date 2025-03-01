// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
ABOUT THIS FILE: This file handles the integration with Google Gemini API
for summarizing transcriptions in Hebrew.
*/

// Store API key - in production, use environment variables or secure storage
let geminiApiKey = "";

/**
 * Set the Gemini API key
 * @param {string} apiKey - The Gemini API key
 */
export const setGeminiApiKey = (apiKey) => {
  geminiApiKey = apiKey;
};

/**
 * Check if Gemini API key is set
 * @returns {boolean} - Whether the API key is set
 */
export const hasApiKey = () => {
  return !!geminiApiKey && geminiApiKey.trim() !== "";
};

/**
 * Generate a summary of the transcription using Google Gemini
 * @param {string} transcription - The text to summarize
 * @returns {Promise<string>} - The summary
 */
export const generateSummary = async (transcription) => {
  if (!hasApiKey()) {
    throw new Error("Gemini API key is not set");
  }

  if (!transcription || transcription.trim() === "") {
    return "אין מספיק טקסט לסיכום."; // "Not enough text to summarize" in Hebrew
  }

  try {
    const prompt = `תפקידך לסכם את הטקסט הבא בצורה תמציתית, ברורה ומאורגנת בעברית.
הסיכום צריך להיות קצר ותכליתי, ולכלול את הנקודות העיקריות בלבד.
עליך לעבד את המידע ולהבין את ההקשר המלא, אף אם הטקסט המקורי מכיל שגיאות הקלדה או אי-דיוקים.

הטקסט לסיכום:
${transcription}

אנא כתוב את הסיכום בפורמט הבא:
נקודות עיקריות:
- נקודה 1
- נקודה 2
וכו'

חשוב: החזר רק את הסיכום עצמו, ללא הקדמות או הערות נוספות.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini API error:", data.error);
      return `שגיאה בעת יצירת סיכום: ${data.error.message}`;
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error summarizing with Gemini:", error);
    return `שגיאה בעת יצירת סיכום: ${error.message}`;
  }
}; 