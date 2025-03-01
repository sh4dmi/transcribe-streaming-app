// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
ABOUT THIS NODE.JS EXAMPLE: This handles the admin interface for the conference transcription app.
*/

// Import dependencies
import * as transcribeClient from "./libs/transcribeClient.js";
import * as geminiClient from "./libs/geminiClient.js";

// Initialize global variables
let adminRecord = null;
let adminPause = null;
let adminClear = null;
let adminLanguageList = null;
let adminVocabList = null;
let adminGeminiApiKey = null;
let adminSaveApiKey = null;
let adminAutoSummarize = null;
let autoSummarizeInterval = null;
let activeSpeaker = null;
let adminTranscribedText = null;
let speakersList = null;
let addSpeakerBtn = null;
let speakerFormContainer = null;
let speakerForm = null;
let cancelSpeakerBtn = null;

// Global settings
let isRecording = false;
let isEditingSpeaker = false;
let currentEditingSpeakerId = null;
let summarizationTimer = null;

// Speakers data
let speakers = [];

// Initialize DOM elements
function initializeDOM() {
  // Get references to DOM elements
  adminRecord = document.getElementById("adminRecord");
  adminPause = document.getElementById("adminPause");
  adminClear = document.getElementById("adminClear");
  adminLanguageList = document.getElementById("adminLanguageList");
  adminVocabList = document.getElementById("adminVocabList");
  adminGeminiApiKey = document.getElementById("adminGeminiApiKey");
  adminSaveApiKey = document.getElementById("adminSaveApiKey");
  adminAutoSummarize = document.getElementById("adminAutoSummarize");
  autoSummarizeInterval = document.getElementById("autoSummarizeInterval");
  activeSpeaker = document.getElementById("activeSpeaker");
  adminTranscribedText = document.getElementById("adminTranscribedText");
  speakersList = document.getElementById("speakersList");
  addSpeakerBtn = document.getElementById("addSpeakerBtn");
  speakerFormContainer = document.getElementById("speakerFormContainer");
  speakerForm = document.getElementById("speakerForm");
  cancelSpeakerBtn = document.getElementById("cancelSpeakerBtn");
  
  // Check if all required elements were found
  if (!adminRecord || !adminLanguageList || !adminTranscribedText) {
    console.error("Not all required DOM elements found");
    return false;
  }
  
  return true;
}

// Initialize event listeners
function initializeEventListeners() {
  // Recording controls
  adminRecord.addEventListener("click", toggleRecording);
  adminPause.addEventListener("click", pauseRecording);
  adminClear.addEventListener("click", clearTranscription);
  
  // Speaker management
  addSpeakerBtn.addEventListener("click", showAddSpeakerForm);
  cancelSpeakerBtn.addEventListener("click", hideSpeakerForm);
  speakerForm.addEventListener("submit", saveSpeaker);
  
  // Gemini settings
  adminSaveApiKey.addEventListener("click", saveGeminiApiKey);
  adminAutoSummarize.addEventListener("change", toggleAutoSummarize);
  
  // Language settings
  adminLanguageList.addEventListener("change", onLanguageChange);
  
  // Active speaker selection
  activeSpeaker.addEventListener("change", onActiveSpeakerChange);
}

// Load saved data
function loadSavedData() {
  // Load speakers from localStorage
  const savedSpeakers = localStorage.getItem("conferenceSpeakers");
  if (savedSpeakers) {
    speakers = JSON.parse(savedSpeakers);
    renderSpeakersList();
    updateActiveSpeakerDropdown();
  }
  
  // Load Gemini API key
  const savedApiKey = localStorage.getItem("geminiApiKey");
  if (savedApiKey) {
    adminGeminiApiKey.value = savedApiKey;
    geminiClient.setGeminiApiKey(savedApiKey);
  }
  
  // Load auto-summarize settings
  const autoSummarize = localStorage.getItem("autoSummarize") === "true";
  adminAutoSummarize.checked = autoSummarize;
  
  const interval = localStorage.getItem("summarizeInterval");
  if (interval) {
    autoSummarizeInterval.value = interval;
  }
  
  // Load language setting
  const savedLanguage = localStorage.getItem("transcribeLanguage");
  if (savedLanguage) {
    adminLanguageList.value = savedLanguage;
  }
  
  // Load vocabularies
  loadCustomVocabularies();
}

// Handle recording toggle
function toggleRecording() {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

// Start recording
async function startRecording() {
  const selectedLanguage = adminLanguageList.value;
  if (selectedLanguage === "nan") {
    alert("Please select a language");
    return;
  }
  
  // Save language preference
  localStorage.setItem("transcribeLanguage", selectedLanguage);
  
  // Get selected vocabulary if any
  const selectedVocabulary = adminVocabList ? adminVocabList.value : "";
  
  // Disable controls during recording
  adminLanguageList.disabled = true;
  if (adminVocabList) adminVocabList.disabled = true;
  adminRecord.textContent = "◉ Stop Recording";
  adminRecord.classList.remove("recordInactive");
  adminRecord.classList.add("recordActive");
  adminPause.disabled = false;
  
  // Clear previous transcription
  adminTranscribedText.innerHTML = "";
  
  // Share recording state with audience view
  localStorage.setItem("isRecording", "true");
  localStorage.setItem("transcriptionText", "");
  localStorage.setItem("currentLanguage", selectedLanguage);
  
  // Share active speaker info
  if (activeSpeaker.value) {
    localStorage.setItem("currentSpeakerId", activeSpeaker.value);
  }
  
  isRecording = true;
  
  try {
    await transcribeClient.startRecording(selectedLanguage, onTranscriptionDataReceived, selectedVocabulary);
  } catch (error) {
    alert(`An error occurred while recording: ${error.message}`);
    stopRecording();
  }
}

// Stop recording
async function stopRecording() {
  // Re-enable controls
  adminLanguageList.disabled = false;
  if (adminVocabList) adminVocabList.disabled = false;
  adminRecord.textContent = "◉ Start Recording";
  adminRecord.classList.remove("recordActive");
  adminRecord.classList.add("recordInactive");
  adminPause.disabled = true;
  
  // Share recording state with audience view
  localStorage.setItem("isRecording", "false");
  
  isRecording = false;
  
  try {
    transcribeClient.stopRecording();
    
    // Generate summary if enabled
    if (adminAutoSummarize.checked) {
      generateSummary();
    }
  } catch (error) {
    console.error("Error stopping recording:", error);
  }
}

// Pause recording (placeholder - AWS Transcribe doesn't support pause)
function pauseRecording() {
  alert("Pause functionality is not currently supported by AWS Transcribe streaming.");
}

// Clear transcription
function clearTranscription() {
  adminTranscribedText.innerHTML = "";
  localStorage.setItem("transcriptionText", "");
  localStorage.setItem("summaryText", "");
  localStorage.setItem("summaryTimestamp", "");
}

// Handle transcription data
function onTranscriptionDataReceived(data) {
  // Update admin view
  adminTranscribedText.insertAdjacentHTML("beforeend", data);
  
  // Share with audience view
  const currentText = localStorage.getItem("transcriptionText") || "";
  localStorage.setItem("transcriptionText", currentText + data);
}

// Load custom vocabularies
async function loadCustomVocabularies() {
  if (!adminVocabList) return;
  
  try {
    const vocabularies = await transcribeClient.listCustomVocabularies();
    
    if (vocabularies && vocabularies.length > 0) {
      // Clear existing options except the first one
      while (adminVocabList.options.length > 1) {
        adminVocabList.remove(1);
      }
      
      // Add the vocabularies to the dropdown
      vocabularies.forEach(vocab => {
        const option = document.createElement('option');
        option.value = vocab.VocabularyName;
        option.text = `${vocab.VocabularyName} (${vocab.LanguageCode})`;
        adminVocabList.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error fetching custom vocabularies:", error);
  }
}

// Generate summary using Gemini
async function generateSummary() {
  const transcription = adminTranscribedText.innerText.trim();
  if (!transcription) {
    return;
  }
  
  try {
    if (!geminiClient.hasApiKey()) {
      alert("Please set a Gemini API key to generate summaries");
      return;
    }
    
    const summary = await geminiClient.generateSummary(transcription);
    localStorage.setItem("summaryText", summary);
    localStorage.setItem("summaryTimestamp", new Date().toISOString());
  } catch (error) {
    console.error("Error generating summary:", error);
  }
}

// Start auto-summarization
function startAutoSummarization() {
  const interval = parseInt(autoSummarizeInterval.value, 10) || 60;
  localStorage.setItem("summarizeInterval", interval.toString());
  
  // Save setting to localStorage
  localStorage.setItem("autoSummarize", "true");
  
  if (summarizationTimer) {
    clearInterval(summarizationTimer);
  }
  
  // Set up timer for auto-summarization
  summarizationTimer = setInterval(generateSummary, interval * 1000);
  
  console.log(`Auto-summarization started (every ${interval} seconds)`);
}

// Stop auto-summarization
function stopAutoSummarization() {
  if (summarizationTimer) {
    clearInterval(summarizationTimer);
    summarizationTimer = null;
  }
  
  // Save setting to localStorage
  localStorage.setItem("autoSummarize", "false");
  
  console.log("Auto-summarization stopped");
}

// Toggle auto-summarization
function toggleAutoSummarize() {
  if (adminAutoSummarize.checked) {
    startAutoSummarization();
  } else {
    stopAutoSummarization();
  }
}

// Save Gemini API key
function saveGeminiApiKey() {
  const apiKey = adminGeminiApiKey.value.trim();
  if (apiKey) {
    geminiClient.setGeminiApiKey(apiKey);
    localStorage.setItem("geminiApiKey", apiKey);
    alert("Gemini API key saved");
  } else {
    alert("Please enter a valid API key");
  }
}

// Handle language change
function onLanguageChange() {
  const selectedLanguage = adminLanguageList.value;
  
  // Set RTL direction for Hebrew
  if (selectedLanguage === "he-IL") {
    adminTranscribedText.style.direction = "rtl";
    adminTranscribedText.style.textAlign = "right";
  } else {
    adminTranscribedText.style.direction = "ltr";
    adminTranscribedText.style.textAlign = "left";
  }
}

// Speaker Management Functions

// Show add speaker form
function showAddSpeakerForm() {
  currentEditingSpeakerId = null;
  isEditingSpeaker = true;
  
  // Clear the form
  speakerForm.reset();
  
  // Show the form
  speakerFormContainer.style.display = "block";
  addSpeakerBtn.disabled = true;
}

// Hide speaker form
function hideSpeakerForm() {
  speakerFormContainer.style.display = "none";
  addSpeakerBtn.disabled = false;
  isEditingSpeaker = false;
}

// Save speaker
function saveSpeaker(e) {
  e.preventDefault();
  
  const name = document.getElementById("speakerName").value.trim();
  const role = document.getElementById("speakerRole").value.trim();
  const bio = document.getElementById("speakerBio").value.trim();
  const imageUrl = document.getElementById("speakerImage").value.trim() || "./placeholder-speaker.png";
  
  if (!name) {
    alert("Speaker name is required");
    return;
  }
  
  if (currentEditingSpeakerId) {
    // Edit existing speaker
    const index = speakers.findIndex(s => s.id === currentEditingSpeakerId);
    if (index !== -1) {
      speakers[index] = {
        ...speakers[index],
        name,
        role,
        bio,
        imageUrl
      };
    }
  } else {
    // Add new speaker
    const newSpeaker = {
      id: `speaker-${Date.now()}`,
      name,
      role,
      bio,
      imageUrl
    };
    
    speakers.push(newSpeaker);
  }
  
  // Save to localStorage
  localStorage.setItem("conferenceSpeakers", JSON.stringify(speakers));
  
  // Update UI
  renderSpeakersList();
  updateActiveSpeakerDropdown();
  
  // Hide form
  hideSpeakerForm();
}

// Edit speaker
function editSpeaker(speakerId) {
  const speaker = speakers.find(s => s.id === speakerId);
  if (!speaker) return;
  
  // Set form values
  document.getElementById("speakerName").value = speaker.name;
  document.getElementById("speakerRole").value = speaker.role || "";
  document.getElementById("speakerBio").value = speaker.bio || "";
  document.getElementById("speakerImage").value = speaker.imageUrl || "";
  
  // Set current editing speaker
  currentEditingSpeakerId = speakerId;
  isEditingSpeaker = true;
  
  // Show form
  speakerFormContainer.style.display = "block";
  addSpeakerBtn.disabled = true;
}

// Delete speaker
function deleteSpeaker(speakerId) {
  if (!confirm("Are you sure you want to delete this speaker?")) return;
  
  // Remove speaker from array
  speakers = speakers.filter(s => s.id !== speakerId);
  
  // Save to localStorage
  localStorage.setItem("conferenceSpeakers", JSON.stringify(speakers));
  
  // Update UI
  renderSpeakersList();
  updateActiveSpeakerDropdown();
}

// Render speakers list
function renderSpeakersList() {
  if (!speakersList) return;
  
  speakersList.innerHTML = "";
  
  if (speakers.length === 0) {
    speakersList.innerHTML = "<p>No speakers added yet.</p>";
    return;
  }
  
  speakers.forEach(speaker => {
    const speakerItem = document.createElement("div");
    speakerItem.className = "speaker-item";
    speakerItem.innerHTML = `
      <div class="speaker-item-image">
        <img src="${speaker.imageUrl || './placeholder-speaker.png'}" alt="${speaker.name}">
      </div>
      <div class="speaker-item-details">
        <div class="speaker-item-name">${speaker.name}</div>
        <div class="speaker-item-role">${speaker.role || ''}</div>
      </div>
      <div class="speaker-item-actions">
        <button class="button edit-speaker" data-id="${speaker.id}">Edit</button>
        <button class="button delete-speaker" data-id="${speaker.id}">Delete</button>
      </div>
    `;
    
    speakersList.appendChild(speakerItem);
  });
  
  // Add event listeners to edit and delete buttons
  document.querySelectorAll(".edit-speaker").forEach(button => {
    button.addEventListener("click", () => editSpeaker(button.getAttribute("data-id")));
  });
  
  document.querySelectorAll(".delete-speaker").forEach(button => {
    button.addEventListener("click", () => deleteSpeaker(button.getAttribute("data-id")));
  });
}

// Update active speaker dropdown
function updateActiveSpeakerDropdown() {
  if (!activeSpeaker) return;
  
  // Save current selection
  const currentSelection = activeSpeaker.value;
  
  // Clear options except the first one
  while (activeSpeaker.options.length > 1) {
    activeSpeaker.remove(1);
  }
  
  // Add speakers to dropdown
  speakers.forEach(speaker => {
    const option = document.createElement('option');
    option.value = speaker.id;
    option.text = speaker.name;
    activeSpeaker.appendChild(option);
  });
  
  // Restore selection if possible
  if (currentSelection && speakers.some(s => s.id === currentSelection)) {
    activeSpeaker.value = currentSelection;
  }
}

// Handle active speaker change
function onActiveSpeakerChange() {
  const selectedSpeakerId = activeSpeaker.value;
  if (selectedSpeakerId) {
    // Share with audience view
    localStorage.setItem("currentSpeakerId", selectedSpeakerId);
  }
}

// App initialization
function initializeApp() {
  if (!initializeDOM()) {
    console.error("Failed to initialize DOM elements");
    return;
  }
  
  initializeEventListeners();
  loadSavedData();
  
  // Start auto-summarization if enabled
  if (adminAutoSummarize.checked) {
    startAutoSummarization();
  }
  
  console.log("Admin interface initialized");
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 