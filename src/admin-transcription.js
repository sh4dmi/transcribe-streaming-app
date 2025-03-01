// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * This is the JavaScript for the transcription controls page.
 * It handles the functionality for language selection, active speaker, and recording controls.
 */

import {
  stopRecording,
  startRecording,
  listCustomVocabularies
} from "./libs/transcribeClient.js";

import { 
  getStorageItem, 
  setStorageItem, 
  getTranscriptions, 
  clearTranscriptions, 
  setActiveSpeaker, 
  setRecordingStatus, 
  getSpeakers, 
  STORAGE_KEYS 
} from './utils/localStorage.js';

import { formatTimestamp } from './utils/formatters.js';

document.addEventListener("DOMContentLoaded", function() {
  // DOM Elements
  const languageList = document.getElementById("adminLanguageList");
  const vocabList = document.getElementById("adminVocabList");
  const geminiApiKey = document.getElementById("adminGeminiApiKey");
  const autoSummarizeInterval = document.getElementById("autoSummarizeInterval");
  const autoSummarize = document.getElementById("adminAutoSummarize");
  const activeSpeaker = document.getElementById("activeSpeaker");
  const recordButton = document.getElementById("adminRecord");
  const pauseButton = document.getElementById("adminPause");
  const clearButton = document.getElementById("adminClear");
  const transcribedText = document.getElementById("adminTranscribedText");
  const saveApiKeyBtn = document.getElementById("adminSaveApiKey");
  
  // Internal state
  let isRecording = false;
  let currentLanguage = "";
  let currentVocab = "";
  let speakers = [];
  let speakerTranscriptions = {};
  let availableVocabularies = [];
  
  // Load custom vocabularies
  async function loadCustomVocabularies() {
    try {
      console.log("Loading custom vocabularies...");
      // Add a loading option while fetching
      vocabList.innerHTML = '<option value="">Loading vocabularies...</option>';
      
      // Fetch vocabularies from AWS Transcribe
      availableVocabularies = await listCustomVocabularies();
      console.log("Loaded vocabularies:", availableVocabularies);
      
      // Clear existing options and add default "None" option
      vocabList.innerHTML = '<option value="">None (No custom vocabulary)</option>';
      
      // Add vocabularies to dropdown
      if (availableVocabularies && availableVocabularies.length > 0) {
        availableVocabularies.forEach(vocab => {
          const option = document.createElement("option");
          option.value = vocab.VocabularyName;
          option.textContent = `${vocab.VocabularyName} (${vocab.LanguageCode})`;
          vocabList.appendChild(option);
        });
        
        // Enable the dropdown
        vocabList.disabled = false;
      } else {
        // Add a disabled placeholder option if no vocabularies are available
        const option = document.createElement("option");
        option.disabled = true;
        option.textContent = "No custom vocabularies available";
        vocabList.appendChild(option);
      }
      
      // Set the value if there's a saved selection
      const savedVocab = getStorageItem(STORAGE_KEYS.SELECTED_VOCAB, "");
      if (savedVocab && vocabList.querySelector(`option[value="${savedVocab}"]`)) {
        vocabList.value = savedVocab;
        currentVocab = savedVocab;
        console.log("Selected vocabulary:", currentVocab);
      }
    } catch (error) {
      console.error("Error loading custom vocabularies:", error);
      // Add a disabled error option
      vocabList.innerHTML = '';
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "None (No custom vocabulary)";
      vocabList.appendChild(defaultOption);
      
      const errorOption = document.createElement("option");
      errorOption.disabled = true;
      errorOption.textContent = "Error loading vocabularies";
      vocabList.appendChild(errorOption);
    }
  }
  
  // Load saved data
  function loadSavedData() {
    // Load speakers
    speakers = getSpeakers();
    if (speakers.length > 0) {
      populateSpeakerList();
    }
    
    // Load language selection
    const savedLanguage = getStorageItem(STORAGE_KEYS.CURRENT_LANGUAGE, "");
    if (savedLanguage) {
      if (languageList.querySelector(`option[value="${savedLanguage}"]`)) {
        languageList.value = savedLanguage;
        currentLanguage = savedLanguage;
      }
    }
    
    // Load custom vocabularies
    loadCustomVocabularies();
    
    // Load Gemini API Key
    const savedApiKey = getStorageItem(STORAGE_KEYS.GEMINI_API_KEY, "");
    if (savedApiKey) {
      geminiApiKey.value = savedApiKey;
    }
    
    // Load auto-summarize settings
    const savedAutoSummarize = getStorageItem(STORAGE_KEYS.AUTO_SUMMARIZE, "false");
    autoSummarize.checked = savedAutoSummarize === "true";
    
    const savedInterval = getStorageItem(STORAGE_KEYS.AUTO_SUMMARIZE_INTERVAL, "");
    if (savedInterval) {
      autoSummarizeInterval.value = savedInterval;
    }
    
    // Load speaker transcriptions
    speakerTranscriptions = getTranscriptions();
    
    // Load active speaker
    const savedActiveSpeaker = getStorageItem(STORAGE_KEYS.ACTIVE_SPEAKER, "");
    if (savedActiveSpeaker && speakers.find(s => s.id === savedActiveSpeaker)) {
      activeSpeaker.value = savedActiveSpeaker;
      updateTranscriptionDisplay();
    }
    
    // Check if recording is in progress
    const recordingStatus = getStorageItem(STORAGE_KEYS.IS_RECORDING, "false");
    isRecording = recordingStatus === "true";
    updateRecordingUI();
  }
  
  // Populate speaker dropdown
  function populateSpeakerList() {
    // Clear existing options except the first one
    while (activeSpeaker.options.length > 1) {
      activeSpeaker.remove(1);
    }
    
    // Add speakers to dropdown
    speakers.forEach(speaker => {
      const option = document.createElement("option");
      option.value = speaker.id;
      option.textContent = speaker.name;
      activeSpeaker.appendChild(option);
    });
  }
  
  // Update transcription display for the current speaker
  function updateTranscriptionDisplay() {
    const currentSpeakerId = activeSpeaker.value;
    if (!currentSpeakerId) {
      transcribedText.innerHTML = "<p class='no-speaker-message'>Select a speaker to see transcription.</p>";
      return;
    }
    
    const speakerTranscription = speakerTranscriptions[currentSpeakerId] || [];
    
    if (speakerTranscription.length === 0) {
      transcribedText.innerHTML = "<p class='no-transcription-message'>No transcription yet for this speaker.</p>";
      return;
    }
    
    // Display transcription entries
    transcribedText.innerHTML = "";
    speakerTranscription.forEach(entry => {
      const entryElement = document.createElement("div");
      entryElement.className = "transcription-entry";
      entryElement.innerHTML = `
        <span class="transcript-timestamp">${formatTimestamp(entry.timestamp)}</span>
        <span class="transcript-text">${entry.text}</span>
      `;
      transcribedText.appendChild(entryElement);
    });
    
    // Scroll to bottom
    transcribedText.scrollTop = transcribedText.scrollHeight;
  }
  
  // Update recording UI based on state
  function updateRecordingUI() {
    if (isRecording) {
      recordButton.textContent = "◉ Stop Recording";
      recordButton.className = "recordActive";
      pauseButton.disabled = false;
    } else {
      recordButton.textContent = "◉ Start Recording";
      recordButton.className = "recordInactive";
      pauseButton.disabled = true;
    }
  }
  
  // Clear transcription for the current speaker
  function clearTranscription() {
    const currentSpeakerId = activeSpeaker.value;
    if (!currentSpeakerId) {
      alert("Please select a speaker first.");
      return;
    }
    
    if (confirm("Are you sure you want to clear the transcription for this speaker?")) {
      // Use the utility function to clear transcriptions
      clearTranscriptions(currentSpeakerId);
      
      // Update local cache
      if (speakerTranscriptions[currentSpeakerId]) {
        speakerTranscriptions[currentSpeakerId] = [];
      }
      
      updateTranscriptionDisplay();
    }
  }
  
  // Function to sync transcription from the AWS service
  function syncTranscription(text) {
    console.log("New transcription:", text);
    
    const currentSpeakerId = activeSpeaker.value;
    if (!currentSpeakerId || !text) return;
    
    // Get current transcription for the speaker
    if (!speakerTranscriptions[currentSpeakerId]) {
      speakerTranscriptions[currentSpeakerId] = [];
    }
    
    const speakerTranscription = speakerTranscriptions[currentSpeakerId];
    
    // Only add new text if it's different from the last entry
    const lastEntry = speakerTranscription.length > 0 ? speakerTranscription[speakerTranscription.length - 1] : null;
    if (!lastEntry || lastEntry.text !== text) {
      speakerTranscription.push({
        timestamp: new Date().toISOString(),
        text: text
      });
      
      // Save using the utility function
      setStorageItem(STORAGE_KEYS.SPEAKER_TRANSCRIPTIONS, speakerTranscriptions);
      updateTranscriptionDisplay();
    }
  }
  
  // Toggle recording
  function toggleRecording() {
    const currentSpeakerId = activeSpeaker.value;
    
    if (!isRecording) {
      if (!currentLanguage || currentLanguage === "nan") {
        alert("Please select a language before starting recording.");
        return;
      }
      
      if (!currentSpeakerId) {
        alert("Please select an active speaker before starting recording.");
        return;
      }
      
      console.log(`Starting recording with language: ${currentLanguage}, vocabulary: ${currentVocab || "none"}`);
      
      // Start recording with the selected vocabulary if any
      startRecording(currentLanguage, syncTranscription, currentVocab)
        .then(success => {
          if (success) {
            // Update UI and state
            isRecording = true;
            updateRecordingUI();
            
            // Save active speaker and recording state using utility functions
            setActiveSpeaker(currentSpeakerId);
            setRecordingStatus(true);
            setStorageItem(STORAGE_KEYS.CURRENT_SPEAKER_ID, currentSpeakerId);
          } else {
            alert("Failed to start recording. Please check console for details.");
          }
        })
        .catch(error => {
          console.error("Error starting recording:", error);
          alert("Failed to start recording: " + error.message);
        });
      
    } else {
      // Stop recording
      try {
        stopRecording();
        
        // Update UI and state
        isRecording = false;
        updateRecordingUI();
        
        // Update recording state
        setRecordingStatus(false);
      } catch (error) {
        console.error("Error stopping recording:", error);
        alert("Failed to stop recording: " + error.message);
      }
    }
  }
  
  // Event Listeners
  languageList.addEventListener("change", function() {
    currentLanguage = this.value;
    setStorageItem(STORAGE_KEYS.CURRENT_LANGUAGE, currentLanguage);
  });
  
  vocabList.addEventListener("change", function() {
    currentVocab = this.value;
    console.log("Selected vocabulary:", currentVocab);
    setStorageItem(STORAGE_KEYS.SELECTED_VOCAB, currentVocab);
  });
  
  saveApiKeyBtn.addEventListener("click", function() {
    const apiKey = geminiApiKey.value.trim();
    setStorageItem(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
    alert("API key saved successfully!");
  });
  
  autoSummarize.addEventListener("change", function() {
    setStorageItem(STORAGE_KEYS.AUTO_SUMMARIZE, this.checked.toString());
  });
  
  autoSummarizeInterval.addEventListener("change", function() {
    setStorageItem(STORAGE_KEYS.AUTO_SUMMARIZE_INTERVAL, this.value);
  });
  
  activeSpeaker.addEventListener("change", function() {
    const selectedSpeakerId = this.value;
    if (selectedSpeakerId) {
      setActiveSpeaker(selectedSpeakerId);
      updateTranscriptionDisplay();
    }
  });
  
  recordButton.addEventListener("click", toggleRecording);
  
  clearButton.addEventListener("click", clearTranscription);
  
  // Initialize the page
  loadSavedData();
}); 