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

// Conference details elements
let adminConferenceName = null;
let adminConferenceDate = null;
let adminConferenceLocation = null;
let adminConferenceAttendees = null;
let adminConferenceAbout = null;
let adminConferenceVenue = null;
let saveConferenceDetailsBtn = null;

// Global settings
let isRecording = false;
let isEditingSpeaker = false;
let currentEditingSpeakerId = null;
let summarizationTimer = null;

// Speakers data
let speakers = [];

// DOM elements - add new Q&A elements
let questionsList = null;
let questionAnswerContainer = null;
let currentQuestion = null;
let questionAnswer = null;
let submitAnswerBtn = null;
let skipQuestionBtn = null;

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
  
  // Conference details elements
  adminConferenceName = document.getElementById("adminConferenceName");
  adminConferenceDate = document.getElementById("adminConferenceDate");
  adminConferenceLocation = document.getElementById("adminConferenceLocation");
  adminConferenceAttendees = document.getElementById("adminConferenceAttendees");
  adminConferenceAbout = document.getElementById("adminConferenceAbout");
  adminConferenceVenue = document.getElementById("adminConferenceVenue");
  saveConferenceDetailsBtn = document.getElementById("saveConferenceDetailsBtn");
  
  // Q&A elements
  questionsList = document.getElementById("questionsList");
  questionAnswerContainer = document.getElementById("questionAnswerContainer");
  currentQuestion = document.getElementById("currentQuestion");
  questionAnswer = document.getElementById("questionAnswer");
  submitAnswerBtn = document.getElementById("submitAnswerBtn");
  skipQuestionBtn = document.getElementById("skipQuestionBtn");
  
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
  
  // Conference details
  if (saveConferenceDetailsBtn) {
    saveConferenceDetailsBtn.addEventListener("click", saveConferenceDetails);
  }
  
  // Language selection
  adminLanguageList.addEventListener("change", onLanguageChange);
  
  // Active speaker
  activeSpeaker.addEventListener("change", onActiveSpeakerChange);
  
  // Gemini API key
  adminSaveApiKey.addEventListener("click", saveGeminiApiKey);
  
  // Auto-summarization
  adminAutoSummarize.addEventListener("change", toggleAutoSummarize);
  
  // Q&A event listeners
  if (submitAnswerBtn) {
    submitAnswerBtn.addEventListener("click", submitAnswer);
  }
  
  if (skipQuestionBtn) {
    skipQuestionBtn.addEventListener("click", skipQuestion);
  }
  
  // Poll for new questions
  setInterval(checkForNewQuestions, 3000);
}

// Load saved data
function loadSavedData() {
  // Load saved speakers
  const savedSpeakers = localStorage.getItem("conferenceSpeakers");
  if (savedSpeakers) {
    speakers = JSON.parse(savedSpeakers);
    renderSpeakersList();
    updateActiveSpeakerDropdown();
  }
  
  // Load saved language
  const savedLanguage = localStorage.getItem("currentLanguage");
  if (savedLanguage && adminLanguageList) {
    adminLanguageList.value = savedLanguage;
  }
  
  // Load Gemini API key
  const savedApiKey = localStorage.getItem("geminiApiKey");
  if (savedApiKey && adminGeminiApiKey) {
    adminGeminiApiKey.value = savedApiKey;
    geminiClient.setGeminiApiKey(savedApiKey);
  }
  
  // Load auto-summarize setting
  const autoSummarize = localStorage.getItem("autoSummarize") === "true";
  if (adminAutoSummarize) {
    adminAutoSummarize.checked = autoSummarize;
  }
  
  // Load saved interval
  const savedInterval = localStorage.getItem("summarizeInterval");
  if (savedInterval && autoSummarizeInterval) {
    autoSummarizeInterval.value = savedInterval;
  }
  
  // Load saved conference details
  const savedConferenceName = localStorage.getItem("conferenceName");
  if (savedConferenceName && adminConferenceName) {
    adminConferenceName.value = savedConferenceName;
  }
  
  const savedConferenceDate = localStorage.getItem("conferenceDate");
  if (savedConferenceDate && adminConferenceDate) {
    adminConferenceDate.value = savedConferenceDate;
  }
  
  const savedConferenceLocation = localStorage.getItem("conferenceLocation");
  if (savedConferenceLocation && adminConferenceLocation) {
    adminConferenceLocation.value = savedConferenceLocation;
  }
  
  const savedConferenceAttendees = localStorage.getItem("conferenceAttendees");
  if (savedConferenceAttendees && adminConferenceAttendees) {
    adminConferenceAttendees.value = savedConferenceAttendees;
  }
  
  const savedConferenceAbout = localStorage.getItem("conferenceAbout");
  if (savedConferenceAbout && adminConferenceAbout) {
    adminConferenceAbout.value = savedConferenceAbout;
  }
  
  const savedConferenceVenue = localStorage.getItem("conferenceVenue");
  if (savedConferenceVenue && adminConferenceVenue) {
    adminConferenceVenue.value = savedConferenceVenue;
  }
  
  // Load vocabularies
  loadCustomVocabularies();
  
  // Check for questions
  checkForNewQuestions();
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

// Check for new audience questions
function checkForNewQuestions() {
  // Get questions from localStorage
  const questions = JSON.parse(localStorage.getItem('conferenceQuestions') || '[]');
  
  // Only update if there are questions
  if (questions.length > 0) {
    renderQuestionsList(questions);
  } else {
    if (questionsList) {
      questionsList.innerHTML = '<div class="no-questions-message">No questions yet.</div>';
    }
  }
}

// Render the questions list
function renderQuestionsList(questions) {
  if (!questionsList) return;
  
  // Clear previous list
  questionsList.innerHTML = '';
  
  // Sort: unanswered first, then by timestamp (newest first)
  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.answered !== b.answered) {
      return a.answered ? 1 : -1; // Unanswered first
    }
    return new Date(b.timestamp) - new Date(a.timestamp); // Newest first
  });
  
  if (sortedQuestions.length === 0) {
    questionsList.innerHTML = '<div class="no-questions-message">No questions yet.</div>';
    return;
  }
  
  // Create question items
  sortedQuestions.forEach(question => {
    const questionItem = document.createElement('div');
    questionItem.className = `question-item ${question.answered ? 'answered' : 'pending'}`;
    questionItem.setAttribute('data-id', question.id);
    
    const date = new Date(question.timestamp);
    const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Get speaker name if available
    let speakerName = "Not specified";
    if (question.speakerId) {
      const speakers = JSON.parse(localStorage.getItem('conferenceSpeakers') || '[]');
      const speaker = speakers.find(s => s.id === question.speakerId);
      if (speaker) {
        speakerName = speaker.name;
      }
    }
    
    questionItem.innerHTML = `
      <div class="question-metadata">
        <span class="question-time">${timeString}</span>
        <span class="question-status ${question.answered ? 'status-answered' : 'status-pending'}">
          ${question.answered ? 'Answered' : 'Pending'}
        </span>
      </div>
      <div class="question-text">${question.text}</div>
      <div class="question-speaker">To: ${speakerName}</div>
      ${question.answer ? `<div class="question-answer">${question.answer}</div>` : ''}
      ${!question.answered ? `<button class="answer-button action-button">Answer</button>` : ''}
    `;
    
    // Add event listener to answer button
    const answerButton = questionItem.querySelector('.answer-button');
    if (answerButton) {
      answerButton.addEventListener('click', () => {
        showAnswerForm(question);
      });
    }
    
    questionsList.appendChild(questionItem);
  });
}

// Show the form to answer a specific question
function showAnswerForm(question) {
  if (!questionAnswerContainer || !currentQuestion || !questionAnswer) return;
  
  // Display the container
  questionAnswerContainer.style.display = 'block';
  
  // Show question details
  const date = new Date(question.timestamp);
  const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  currentQuestion.innerHTML = `
    <div class="question-time">${timeString}</div>
    <div class="question-text-large">${question.text}</div>
  `;
  
  // Store the question ID for later
  questionAnswerContainer.setAttribute('data-question-id', question.id);
  
  // Clear previous answer
  questionAnswer.value = '';
  
  // Scroll to the form
  questionAnswerContainer.scrollIntoView({ behavior: 'smooth' });
}

// Submit an answer to a question
function submitAnswer() {
  if (!questionAnswerContainer || !questionAnswer) return;
  
  const questionId = questionAnswerContainer.getAttribute('data-question-id');
  const answer = questionAnswer.value.trim();
  
  if (!questionId || !answer) {
    alert('Please provide an answer');
    return;
  }
  
  // Get current questions
  const questions = JSON.parse(localStorage.getItem('conferenceQuestions') || '[]');
  
  // Find and update the specific question
  const updatedQuestions = questions.map(q => {
    if (q.id === questionId) {
      return {
        ...q,
        answer: answer,
        answered: true,
        answeredAt: new Date().toISOString()
      };
    }
    return q;
  });
  
  // Save back to localStorage
  localStorage.setItem('conferenceQuestions', JSON.stringify(updatedQuestions));
  
  // Hide the form
  questionAnswerContainer.style.display = 'none';
  
  // Refresh questions list
  checkForNewQuestions();
}

// Skip a question (mark as answered without providing an answer)
function skipQuestion() {
  if (!questionAnswerContainer) return;
  
  const questionId = questionAnswerContainer.getAttribute('data-question-id');
  
  if (!questionId) return;
  
  // Get current questions
  const questions = JSON.parse(localStorage.getItem('conferenceQuestions') || '[]');
  
  // Find and update the specific question
  const updatedQuestions = questions.map(q => {
    if (q.id === questionId) {
      return {
        ...q,
        answer: "Question skipped by moderator",
        answered: true,
        answeredAt: new Date().toISOString()
      };
    }
    return q;
  });
  
  // Save back to localStorage
  localStorage.setItem('conferenceQuestions', JSON.stringify(updatedQuestions));
  
  // Hide the form
  questionAnswerContainer.style.display = 'none';
  
  // Refresh questions list
  checkForNewQuestions();
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

// Save conference details
function saveConferenceDetails() {
  // Get values from form
  const name = adminConferenceName.value.trim();
  const date = adminConferenceDate.value.trim();
  const location = adminConferenceLocation.value.trim();
  const attendees = adminConferenceAttendees.value.trim();
  const about = adminConferenceAbout.value.trim();
  const venue = adminConferenceVenue.value.trim();
  
  // Validate name (only required field)
  if (!name) {
    alert("שם הכנס הוא שדה חובה");
    return;
  }
  
  // Store values in localStorage
  localStorage.setItem("conferenceName", name);
  localStorage.setItem("conferenceDate", date);
  localStorage.setItem("conferenceLocation", location);
  localStorage.setItem("conferenceAttendees", attendees);
  localStorage.setItem("conferenceAbout", about);
  localStorage.setItem("conferenceVenue", venue);
  
  // Show confirmation
  alert("פרטי הכנס נשמרו בהצלחה");
} 