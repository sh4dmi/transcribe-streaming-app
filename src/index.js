// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
ABOUT THIS NODE.JS EXAMPLE: This handles the audience view for the conference transcription app.
*/

// Initialize global variables
let connectionStatus = null;
let speakerImage = null;
let speakerName = null;
let speakerRole = null;
let speakerBio = null;
let currentLanguage = null;
let transcribedText = null;
let summarySection = null;
let summaryText = null;
let summaryTimestamp = null;
let conferenceName = null;

// Sync polling intervals
let transcriptionSyncInterval = null;
let statusSyncInterval = null;
let speakerSyncInterval = null;
let summarySyncInterval = null;

// Cached speaker data
let speakersCache = [];

// Initialize DOM elements
function initializeDOM() {
  // Get references to DOM elements
  connectionStatus = document.getElementById("connectionStatus");
  speakerImage = document.getElementById("speakerImage");
  speakerName = document.getElementById("speakerName");
  speakerRole = document.getElementById("speakerRole");
  speakerBio = document.getElementById("speakerBio");
  currentLanguage = document.getElementById("currentLanguage");
  transcribedText = document.getElementById("transcribedText");
  summarySection = document.getElementById("summarySection");
  summaryText = document.getElementById("summaryText");
  summaryTimestamp = document.getElementById("summaryTimestamp");
  conferenceName = document.getElementById("conferenceName");
  
  // Check if all required elements were found
  if (!connectionStatus || !transcribedText || !summaryText) {
    console.error("Not all required DOM elements found");
    return false;
  }
  
  return true;
}

// Start sync intervals to check for updates from admin
function startSyncIntervals() {
  // Check recording status every 2 seconds
  statusSyncInterval = setInterval(syncRecordingStatus, 2000);
  
  // Check for transcription updates frequently (500ms)
  transcriptionSyncInterval = setInterval(syncTranscription, 500);
  
  // Check for speaker updates every 3 seconds
  speakerSyncInterval = setInterval(syncSpeakerInfo, 3000);
  
  // Check for summary updates every 5 seconds
  summarySyncInterval = setInterval(syncSummary, 5000);
}

// Sync recording status from admin
function syncRecordingStatus() {
  const isRecording = localStorage.getItem("isRecording") === "true";
  
  if (isRecording) {
    connectionStatus.textContent = "Live";
    connectionStatus.classList.add("connected");
  } else {
    connectionStatus.textContent = "Waiting for session...";
    connectionStatus.classList.remove("connected");
  }
  
  // Sync language if available
  const language = localStorage.getItem("currentLanguage");
  if (language && currentLanguage) {
    const languageDisplay = language === "he-IL" ? "Hebrew" : 
                          language === "en-US" ? "English (US)" : 
                          language;
    currentLanguage.textContent = languageDisplay;
    
    // Set RTL direction for Hebrew
    if (language === "he-IL") {
      transcribedText.style.direction = "rtl";
      transcribedText.style.textAlign = "right";
    } else {
      transcribedText.style.direction = "ltr";
      transcribedText.style.textAlign = "left";
    }
  }
}

// Sync transcription from admin
function syncTranscription() {
  const text = localStorage.getItem("transcriptionText");
  if (text && transcribedText.innerHTML !== text) {
    transcribedText.innerHTML = text;
    
    // Auto-scroll to bottom
    transcribedText.scrollTop = transcribedText.scrollHeight;
  }
}

// Load speaker data
function loadSpeakerData() {
  const savedSpeakers = localStorage.getItem("conferenceSpeakers");
  if (savedSpeakers) {
    speakersCache = JSON.parse(savedSpeakers);
  }
}

// Sync current speaker info
function syncSpeakerInfo() {
  // Load speakers if not already loaded
  if (speakersCache.length === 0) {
    loadSpeakerData();
  }
  
  const currentSpeakerId = localStorage.getItem("currentSpeakerId");
  if (currentSpeakerId && speakersCache.length > 0) {
    const speaker = speakersCache.find(s => s.id === currentSpeakerId);
    if (speaker) {
      // Update speaker display
      speakerName.textContent = speaker.name;
      speakerRole.textContent = speaker.role || "";
      speakerBio.textContent = speaker.bio || "";
      speakerImage.src = speaker.imageUrl || "./placeholder-speaker.png";
      speakerImage.alt = speaker.name;
    }
  }
}

// Sync summary
function syncSummary() {
  const summary = localStorage.getItem("summaryText");
  const timestamp = localStorage.getItem("summaryTimestamp");
  
  if (summary && summary.trim() !== "") {
    summarySection.style.display = "block";
    
    if (summaryText.innerHTML !== summary) {
      summaryText.innerHTML = summary;
    }
    
    if (timestamp) {
      const date = new Date(timestamp);
      summaryTimestamp.textContent = `Last updated: ${date.toLocaleTimeString()}`;
    }
  }
}

// Set conference name
function setConferenceName() {
  const name = localStorage.getItem("conferenceName") || "Live Conference";
  conferenceName.textContent = name;
  
  // Also set document title
  document.title = `${name} - Audience View`;
}

// App initialization
function initializeApp() {
  if (!initializeDOM()) {
    console.error("Failed to initialize DOM elements");
    return;
  }
  
  loadSpeakerData();
  startSyncIntervals();
  setConferenceName();
  
  // Initial syncs
  syncRecordingStatus();
  syncSpeakerInfo();
  syncSummary();
  
  console.log("Audience view initialized");
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
