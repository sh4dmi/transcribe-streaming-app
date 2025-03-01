// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
ABOUT THIS NODE.JS EXAMPLE: This example works with the AWS SDK for JavaScript version 3 (v3),
which is available at https://github.com/aws/aws-sdk-js-v3.

Purpose:
index.js is part of a tutorial demonstrating how to:
- Transcribe speech in real-time using Amazon Transcribe
*/

// snippet-start:[transcribe.JavaScript.streaming.indexv3]
// Initialize global variables for element references
let recordButton = null;
let inputLanguageList = null;
let transcribedText = null;
let vocabList = null;
let geminiApiKeyInput = null;
let saveApiKeyButton = null;
let autoSummarizeCheckbox = null;
let summarizeNowButton = null;
let summarySection = null;
let summaryText = null;

// Global flag to check if DOM is initialized
let isDomInitialized = false;

// Timer for auto-summarization
let summarizationTimer = null;
const SUMMARIZATION_INTERVAL = 60000; // 60 seconds

// Initialize DOM-related functionality
function initializeDOM() {
  // Only initialize once
  if (isDomInitialized) return true;
  
  // Try to get references to DOM elements
  recordButton = document.getElementById("record");
  inputLanguageList = document.getElementById("inputLanguageList");
  transcribedText = document.getElementById("transcribedText");
  vocabList = document.getElementById("vocabList");
  geminiApiKeyInput = document.getElementById("geminiApiKey");
  saveApiKeyButton = document.getElementById("saveApiKey");
  autoSummarizeCheckbox = document.getElementById("autoSummarize");
  summarizeNowButton = document.getElementById("summarizeNow");
  summarySection = document.getElementById("summarySection");
  summaryText = document.getElementById("summaryText");
  
  // Check if all required elements were found
  if (!recordButton || !inputLanguageList || !transcribedText) {
    console.error("Not all required DOM elements found:", {
      recordButton: !!recordButton,
      inputLanguageList: !!inputLanguageList,
      transcribedText: !!transcribedText
    });
    return false;
  }
  
  // Set up language change handler to set RTL for Hebrew
  inputLanguageList.addEventListener('change', () => {
    const selectedLanguage = inputLanguageList.value;
    // Set RTL direction for Hebrew
    if (selectedLanguage === "he-IL") {
      transcribedText.style.direction = "rtl";
      transcribedText.style.textAlign = "right";
    } else {
      transcribedText.style.direction = "ltr";
      transcribedText.style.textAlign = "left";
    }
  });
  
  // Set initial direction based on selected language
  const selectedLanguage = inputLanguageList.value;
  if (selectedLanguage === "he-IL") {
    transcribedText.style.direction = "rtl";
    transcribedText.style.textAlign = "right";
  }
  
  // Initialize Gemini integration
  initializeGeminiIntegration();
  
  // Load custom vocabularies if available
  loadCustomVocabularies();
  
  // Set initialization flag
  isDomInitialized = true;
  return true;
}

// Initialize Gemini integration
async function initializeGeminiIntegration() {
  if (!saveApiKeyButton || !geminiApiKeyInput || !autoSummarizeCheckbox || !summarizeNowButton) {
    console.error("Gemini UI elements not found");
    return;
  }

  // Import Gemini client
  const { setGeminiApiKey, hasApiKey } = await import("./libs/geminiClient.js");
  
  // Try to load API key from localStorage
  const savedApiKey = localStorage.getItem('geminiApiKey');
  if (savedApiKey) {
    geminiApiKeyInput.value = savedApiKey;
    setGeminiApiKey(savedApiKey);
    console.log("Loaded saved Gemini API key");
  }
  
  // Set up event listeners for Gemini integration
  saveApiKeyButton.addEventListener('click', async () => {
    const apiKey = geminiApiKeyInput.value.trim();
    if (apiKey) {
      setGeminiApiKey(apiKey);
      localStorage.setItem('geminiApiKey', apiKey);
      alert("Gemini API key saved");
    } else {
      alert("Please enter a valid API key");
    }
  });
  
  // Set up summarize now button
  summarizeNowButton.addEventListener('click', async () => {
    await generateSummary();
  });
  
  // Set up auto-summarize checkbox
  autoSummarizeCheckbox.addEventListener('change', () => {
    if (autoSummarizeCheckbox.checked) {
      // Start auto-summarization
      startAutoSummarization();
    } else {
      // Stop auto-summarization
      stopAutoSummarization();
    }
  });
  
  // Load auto-summarize setting from localStorage
  const autoSummarize = localStorage.getItem('autoSummarize') === 'true';
  autoSummarizeCheckbox.checked = autoSummarize;
  
  // Start auto-summarization if enabled
  if (autoSummarize) {
    startAutoSummarization();
  }
}

// Function to generate summary using Gemini
async function generateSummary() {
  if (!transcribedText || !summarySection || !summaryText) {
    console.error("Required elements for summarization not found");
    return;
  }
  
  const transcription = transcribedText.innerText.trim();
  if (!transcription) {
    alert("אין טקסט לסכם"); // "No text to summarize" in Hebrew
    return;
  }
  
  try {
    // Show loading indicator
    summarySection.style.display = "block";
    summaryText.innerText = "מעבד..."; // "Processing..." in Hebrew
    
    // Import Gemini client and generate summary
    const { generateSummary, hasApiKey } = await import("./libs/geminiClient.js");
    
    if (!hasApiKey()) {
      summaryText.innerText = "נא להזין מפתח API של Gemini כדי להשתמש בתכונת הסיכום."; // "Please enter Gemini API key to use summary feature" in Hebrew
      return;
    }
    
    const summary = await generateSummary(transcription);
    summaryText.innerText = summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    summaryText.innerText = `שגיאה בעת יצירת סיכום: ${error.message}`; // "Error generating summary" in Hebrew
  }
}

// Start auto-summarization
function startAutoSummarization() {
  if (summarizationTimer) {
    clearInterval(summarizationTimer);
  }
  
  // Save setting to localStorage
  localStorage.setItem('autoSummarize', 'true');
  
  // Set up timer for auto-summarization
  summarizationTimer = setInterval(async () => {
    await generateSummary();
  }, SUMMARIZATION_INTERVAL);
  
  console.log("Auto-summarization started");
}

// Stop auto-summarization
function stopAutoSummarization() {
  if (summarizationTimer) {
    clearInterval(summarizationTimer);
    summarizationTimer = null;
  }
  
  // Save setting to localStorage
  localStorage.setItem('autoSummarize', 'false');
  
  console.log("Auto-summarization stopped");
}

// Load custom vocabularies from AWS Transcribe
async function loadCustomVocabularies() {
  if (!vocabList) return;
  
  try {
    // We'll use the Transcribe client to fetch custom vocabularies
    const { listCustomVocabularies } = await import("./libs/transcribeClient.js");
    const vocabularies = await listCustomVocabularies();
    
    if (vocabularies && vocabularies.length > 0) {
      // Clear existing options except the first one
      while (vocabList.options.length > 1) {
        vocabList.remove(1);
      }
      
      // Add the vocabularies to the dropdown
      vocabularies.forEach(vocab => {
        const option = document.createElement('option');
        option.value = vocab.VocabularyName;
        option.text = `${vocab.VocabularyName} (${vocab.LanguageCode})`;
        vocabList.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error fetching custom vocabularies:", error);
  }
}

// Expose functions to window object before DOM is loaded, but with safety checks
window.onRecordPress = () => {
  if (!initializeDOM()) {
    console.error("Cannot record: DOM not initialized");
    return;
  }
  
  if (recordButton.getAttribute("class") === "recordInactive") {
    startRecording();
  } else {
    stopRecording();
  }
};

window.clearTranscription = () => {
  // Always check if transcribedText exists
  if (initializeDOM() && transcribedText) {
    transcribedText.innerHTML = "";
    
    // Also clear summary if it exists
    if (summaryText) {
      summaryText.innerHTML = "";
    }
    
    // Hide summary section
    if (summarySection) {
      summarySection.style.display = "none";
    }
  }
};

// Internal functions
const startRecording = async () => {
  // Always verify DOM is initialized
  if (!initializeDOM()) return;
  
  // Always verify transcribedText exists before clearing
  if (transcribedText) {
    transcribedText.innerHTML = "";
  }
  
  // Hide summary section
  if (summarySection) {
    summarySection.style.display = "none";
  }
  
  const selectedLanguage = inputLanguageList.value;
  if (selectedLanguage === "nan") {
    alert("Please select a language");
    return;
  }
  
  // Get selected vocabulary if any
  const selectedVocabulary = vocabList ? vocabList.value : "";
  
  inputLanguageList.disabled = true;
  if (vocabList) vocabList.disabled = true;
  recordButton.setAttribute("class", "recordActive");
  
  try {
    const { startRecording } = await import("./libs/transcribeClient.js");
    await startRecording(selectedLanguage, onTranscriptionDataReceived, selectedVocabulary);
  } catch (error) {
    alert(`An error occurred while recording: ${error.message}`);
    await stopRecording();
  }
};

const onTranscriptionDataReceived = (data) => {
  // Always check if element exists
  if (initializeDOM() && transcribedText) {
    transcribedText.insertAdjacentHTML("beforeend", data);
  }
};

const stopRecording = async () => {
  // Always verify DOM is initialized
  if (!initializeDOM()) return;
  
  inputLanguageList.disabled = false;
  if (vocabList) vocabList.disabled = false;
  recordButton.setAttribute("class", "recordInactive");
  
  try {
    const { stopRecording } = await import("./libs/transcribeClient.js");
    stopRecording();
    
    // Generate summary if there's text
    if (transcribedText && transcribedText.innerText.trim()) {
      await generateSummary();
    }
  } catch (error) {
    console.error("Error stopping recording:", error);
  }
};

// Try to initialize when the script runs
initializeDOM();

// Also try to initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeDOM);
// snippet-end:[transcribe.JavaScript.streaming.indexv3]
