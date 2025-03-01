// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
ABOUT THIS NODE.JS EXAMPLE: This handles the audience view for the conference transcription app.
*/

import { getStorageItem, setStorageItem, addQuestion, STORAGE_KEYS } from './utils/localStorage.js';
import { formatTime, formatTimestamp, highlightKeywords } from './utils/formatters.js';

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
let conferenceDate = null;
let speakersGallery = null;
let liveIndicator = null;
let scrollToLatestBtn = null;
let transcriptSearch = null;
let searchButton = null;
let copyButton = null;
let exportButton = null;
let emailButton = null;
let contrastModeBtn = null;
let fontSizeIncreaseBtn = null;
let questionInput = null;
let submitQuestionBtn = null;

// Sync polling intervals
let transcriptionSyncInterval = null;
let statusSyncInterval = null;
let speakerSyncInterval = null;
let summarySyncInterval = null;

// Cached speaker data
let speakersCache = [];

// Cached transcriptions by speaker
let speakerTranscriptions = {};

// Important keywords to highlight
const IMPORTANT_KEYWORDS = [
  "משימות",
  "דדליין",
  "תקציב",
  "החלטה",
  "סיכום",
  "משימה",
  "מסקנה",
  "להמשיך",
  "יעד"
];

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
  conferenceDate = document.getElementById("conferenceDate");
  speakersGallery = document.getElementById("speakersGallery");
  liveIndicator = document.getElementById("liveIndicator");
  scrollToLatestBtn = document.getElementById("scrollToLatest");
  transcriptSearch = document.getElementById("transcriptSearch");
  searchButton = document.getElementById("searchButton");
  copyButton = document.getElementById("copyButton");
  exportButton = document.getElementById("exportButton");
  emailButton = document.getElementById("emailButton");
  contrastModeBtn = document.getElementById("contrastMode");
  fontSizeIncreaseBtn = document.getElementById("fontSizeIncrease");
  questionInput = document.getElementById("questionInput");
  submitQuestionBtn = document.getElementById("submitQuestionBtn");
  
  // Check if all required elements were found
  if (!connectionStatus || !transcribedText || !summaryText) {
    console.error("Not all required DOM elements found");
    return false;
  }
  
  return true;
}

// Initialize event listeners
function initializeEventListeners() {
  if (scrollToLatestBtn) {
    scrollToLatestBtn.addEventListener("click", scrollToLatest);
  }
  
  if (searchButton && transcriptSearch) {
    searchButton.addEventListener("click", searchTranscript);
    transcriptSearch.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        searchTranscript();
      }
    });
  }
  
  if (copyButton) {
    copyButton.addEventListener("click", copySummary);
  }
  
  if (exportButton) {
    exportButton.addEventListener("click", exportAsPDF);
  }
  
  if (emailButton) {
    emailButton.addEventListener("click", sendByEmail);
  }
  
  if (contrastModeBtn) {
    contrastModeBtn.addEventListener("click", toggleContrastMode);
  }
  
  if (fontSizeIncreaseBtn) {
    fontSizeIncreaseBtn.addEventListener("click", increaseFontSize);
  }
  
  // Add click events to speaker gallery (will be populated dynamically)
  if (speakersGallery) {
    speakersGallery.addEventListener("click", function(e) {
      const speakerCard = e.target.closest(".gallery-speaker-card");
      if (speakerCard) {
        filterBySpeaker(speakerCard.getAttribute("data-speaker-id"));
      }
    });
  }
  
  // Add Q&A functionality
  if (submitQuestionBtn && questionInput) {
    submitQuestionBtn.addEventListener("click", submitQuestion);
    questionInput.addEventListener("keyup", function(event) {
      if (event.key === "Enter") {
        submitQuestion();
      }
    });
  }
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
  const isRecording = getStorageItem(STORAGE_KEYS.IS_RECORDING, "false") === "true";
  
  if (isRecording) {
    connectionStatus.textContent = "שידור חי";
    connectionStatus.classList.add("connected");
    if (liveIndicator) {
      liveIndicator.style.display = "block";
    }
  } else {
    connectionStatus.textContent = "ממתין להתחלה...";
    connectionStatus.classList.remove("connected");
    if (liveIndicator) {
      liveIndicator.style.display = "none";
    }
  }
  
  // Sync language if available
  const language = getStorageItem(STORAGE_KEYS.CURRENT_LANGUAGE, "");
  if (language && currentLanguage) {
    const languageDisplay = language === "he-IL" ? "עברית" : 
                          language === "en-US" ? "אנגלית (ארה״ב)" : 
                          language;
    currentLanguage.textContent = languageDisplay;
    
    // Set RTL direction for Hebrew
    if (language === "he-IL") {
      document.body.classList.add("rtl-content");
      transcribedText.style.direction = "rtl";
      transcribedText.style.textAlign = "right";
      summaryText.style.direction = "rtl";
      summaryText.style.textAlign = "right";
    } else {
      document.body.classList.remove("rtl-content");
      transcribedText.style.direction = "ltr";
      transcribedText.style.textAlign = "left";
      summaryText.style.direction = "ltr";
      summaryText.style.textAlign = "left";
    }
  }
}

// Load speaker transcriptions from localStorage
function loadSpeakerTranscriptions() {
  speakerTranscriptions = getStorageItem(STORAGE_KEYS.SPEAKER_TRANSCRIPTIONS, {});
}

// Save speaker transcriptions to localStorage
function saveSpeakerTranscriptions() {
  localStorage.setItem("speakerTranscriptions", JSON.stringify(speakerTranscriptions));
}

// Sync transcription from admin
function syncTranscription() {
  const text = getStorageItem(STORAGE_KEYS.TRANSCRIPTION_TEXT, "");
  const currentSpeakerId = getStorageItem(STORAGE_KEYS.CURRENT_SPEAKER_ID, "");
  
  if (text && text.trim() !== "" && currentSpeakerId) {
    // Update the speaker's transcription
    if (!speakerTranscriptions[currentSpeakerId]) {
      speakerTranscriptions[currentSpeakerId] = [];
    }
    
    // Get the last text entry for this speaker
    const lastEntry = speakerTranscriptions[currentSpeakerId].length > 0 
      ? speakerTranscriptions[currentSpeakerId][speakerTranscriptions[currentSpeakerId].length - 1]
      : null;
    
    // Only add new text if it's different from the last entry
    if (!lastEntry || text !== lastEntry.text) {
      // Add timestamp and text
      speakerTranscriptions[currentSpeakerId].push({
        timestamp: new Date().toISOString(),
        text: text
      });
      
      // Save to localStorage
      setStorageItem(STORAGE_KEYS.SPEAKER_TRANSCRIPTIONS, speakerTranscriptions);
    }
    
    // Process all transcriptions for display
    const formattedText = processAllTranscriptions();
    transcribedText.innerHTML = formattedText;
    
    // Auto-scroll to bottom if not manually scrolled up
    if (!isManuallyScrolled) {
      scrollToLatest();
    }
  }
}

// Process all transcriptions for all speakers
function processAllTranscriptions() {
  // Combine all speaker transcriptions in chronological order
  const allEntries = [];
  
  // For each speaker, add their entries with speaker info
  Object.keys(speakerTranscriptions).forEach(speakerId => {
    const speaker = speakersCache.find(s => s.id === speakerId);
    const speakerName = speaker ? speaker.name : "דובר";
    
    speakerTranscriptions[speakerId].forEach(entry => {
      allEntries.push({
        speakerId,
        speakerName,
        timestamp: new Date(entry.timestamp),
        text: entry.text
      });
    });
  });
  
  // Sort by timestamp
  allEntries.sort((a, b) => a.timestamp - b.timestamp);
  
  // Convert to HTML
  let processedHTML = "";
  
  allEntries.forEach(entry => {
    // Assign speaker a color class
    const colorClass = `speaker-color-${(entry.speakerId.charCodeAt(0) % 5) + 1 || 1}`;
    
    // Highlight important keywords
    let highlightedText = entry.text;
    IMPORTANT_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<span class="highlight-keyword">${keyword}</span>`);
    });
    
    // Format with speaker name and timestamp
    const timeString = entry.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    processedHTML += `
      <div class="transcript-entry" data-speaker-id="${entry.speakerId}">
        <div class="transcript-speaker ${colorClass}">${entry.speakerName}</div>
        <div class="transcript-text">
          <span class="transcript-timestamp">${timeString}</span>
          ${highlightedText}
        </div>
      </div>
    `;
  });
  
  return processedHTML;
}

// Variable to track if user has manually scrolled up
let isManuallyScrolled = false;

// Scroll to latest transcript content
function scrollToLatest() {
  if (transcribedText) {
    transcribedText.scrollTop = transcribedText.scrollHeight;
    isManuallyScrolled = false;
  }
}

// Load speaker data
function loadSpeakerData() {
  speakersCache = getStorageItem(STORAGE_KEYS.SPEAKERS, []);
  if (speakersCache.length > 0) {
    renderSpeakersGallery();
  }
}

// Render speakers gallery
function renderSpeakersGallery() {
  if (!speakersGallery || speakersCache.length === 0) return;
  
  speakersGallery.innerHTML = "";
  
  speakersCache.forEach((speaker, index) => {
    const colorClass = `speaker-color-${(index % 5) + 1}`;
    
    const speakerCard = document.createElement("div");
    speakerCard.className = "gallery-speaker-card";
    speakerCard.setAttribute("data-speaker-id", speaker.id);
    
    speakerCard.innerHTML = `
      <div class="gallery-speaker-image">
        <img src="${speaker.imageUrl || './placeholder-speaker.png'}" alt="${speaker.name}">
      </div>
      <div class="gallery-speaker-info">
        <div class="gallery-speaker-name ${colorClass}">${speaker.name}</div>
        <div class="gallery-speaker-role">${speaker.role || ''}</div>
      </div>
    `;
    
    speakersGallery.appendChild(speakerCard);
  });
}

// Sync speaker info
function syncSpeakerInfo() {
  // Load speakers if not already loaded
  if (speakersCache.length === 0) {
    loadSpeakerData();
  }
  
  const currentSpeakerId = getStorageItem(STORAGE_KEYS.CURRENT_SPEAKER_ID, "");
  if (currentSpeakerId && speakersCache.length > 0) {
    const speaker = speakersCache.find(s => s.id === currentSpeakerId);
    if (speaker) {
      // Update speaker display
      speakerName.textContent = speaker.name;
      speakerRole.textContent = speaker.role || "";
      speakerBio.textContent = speaker.bio || "";
      speakerImage.src = speaker.imageUrl || "./placeholder-speaker.png";
      speakerImage.alt = speaker.name;
      
      // Highlight the active speaker in the gallery
      if (speakersGallery) {
        const speakerCards = speakersGallery.querySelectorAll(".gallery-speaker-card");
        speakerCards.forEach(card => {
          if (card.getAttribute("data-speaker-id") === currentSpeakerId) {
            card.classList.add("active");
          } else {
            card.classList.remove("active");
          }
        });
      }
    }
  }
}

// Sync summary
function syncSummary() {
  const summary = getStorageItem(STORAGE_KEYS.SUMMARY_TEXT, "");
  const timestamp = getStorageItem(STORAGE_KEYS.SUMMARY_TIMESTAMP, "");
  
  if (summary && summary.trim() !== "") {
    summarySection.style.display = "block";
    
    if (summaryText.innerHTML !== summary) {
      summaryText.innerHTML = summary;
    }
    
    if (timestamp) {
      const date = new Date(timestamp);
      summaryTimestamp.textContent = `עודכן לאחרונה: ${date.toLocaleTimeString()}`;
    }
  }
}

// Set conference details
function setConferenceDetails() {
  const conferenceDetails = getStorageItem(STORAGE_KEYS.CONFERENCE_DETAILS, {});
  const name = conferenceDetails.name || "כנס תמלול חי";
  conferenceName.textContent = name;
  
  // Set conference date
  let dateString;
  if (conferenceDetails.date) {
    dateString = conferenceDetails.date;
  } else {
    // Use today's date as fallback
    const today = new Date();
    dateString = today.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (conferenceDate) {
    conferenceDate.textContent = dateString;
  }
  
  // Also set document title
  document.title = `${name} - תצוגת קהל`;
}

// Search functionality
function searchTranscript() {
  if (!transcriptSearch || !transcribedText) return;
  
  const searchTerm = transcriptSearch.value.trim();
  if (searchTerm === "") return;
  
  // Remove previous highlights
  const previousHighlights = transcribedText.querySelectorAll('.search-highlight');
  previousHighlights.forEach(highlight => {
    const text = highlight.textContent;
    highlight.replaceWith(text);
  });
  
  if (searchTerm.length < 2) return; // Require at least 2 characters
  
  // Create a text node of the transcript to search
  const textContent = transcribedText.innerHTML;
  
  // Highlight the search term
  const highlightedContent = textContent.replace(
    new RegExp(escapeRegExp(searchTerm), 'gi'),
    match => `<span class="search-highlight" style="background-color: yellow; font-weight: bold;">${match}</span>`
  );
  
  transcribedText.innerHTML = highlightedContent;
  
  // Find the first occurrence and scroll to it
  const firstHighlight = transcribedText.querySelector('.search-highlight');
  if (firstHighlight) {
    firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Helper function to escape special characters in string for RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Filter transcript by speaker
function filterBySpeaker(speakerId) {
  if (!transcribedText) return;
  
  // If no speaker ID or "all" is selected, show all entries
  if (!speakerId || speakerId === "all") {
    const entries = transcribedText.querySelectorAll('.transcript-entry');
    entries.forEach(entry => {
      entry.style.display = 'block';
    });
    return;
  }
  
  // Hide entries from other speakers
  const entries = transcribedText.querySelectorAll('.transcript-entry');
  entries.forEach(entry => {
    if (entry.getAttribute('data-speaker-id') === speakerId) {
      entry.style.display = 'block';
    } else {
      entry.style.display = 'none';
    }
  });
}

// Copy summary to clipboard
function copySummary() {
  if (!summaryText) return;
  
  const text = summaryText.textContent;
  navigator.clipboard.writeText(text)
    .then(() => {
      // Show feedback
      const originalText = copyButton.textContent;
      copyButton.textContent = "הועתק ✓";
      setTimeout(() => {
        copyButton.textContent = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      alert('לא ניתן להעתיק את הטקסט. נסה שוב.');
    });
}

// Export as PDF (placeholder)
function exportAsPDF() {
  alert('ייצוא ל-PDF יתווסף בהמשך');
  
  // In a real implementation, we would use a library like jsPDF
  // to create and download a PDF with the summary content
}

// Send by email (placeholder)
function sendByEmail() {
  const summaryContent = summaryText ? summaryText.textContent : '';
  const subject = encodeURIComponent("סיכום כנס: " + (conferenceName ? conferenceName.textContent : ''));
  const body = encodeURIComponent(summaryContent);
  
  window.open(`mailto:?subject=${subject}&body=${body}`);
}

// Toggle high contrast mode
function toggleContrastMode() {
  document.body.classList.toggle('high-contrast');
  
  // Save preference
  setStorageItem(STORAGE_KEYS.HIGH_CONTRAST, document.body.classList.contains('high-contrast').toString());
}

// Increase font size
function increaseFontSize() {
  const currentSize = parseInt(getComputedStyle(document.body).fontSize);
  document.body.style.fontSize = (currentSize + 2) + 'px';
  
  // Update button text
  if (currentSize >= 20) {
    fontSizeIncreaseBtn.textContent = "איפוס גודל טקסט";
    fontSizeIncreaseBtn.addEventListener('click', resetFontSize, { once: true });
  }
}

// Reset font size
function resetFontSize() {
  document.body.style.fontSize = '';
  
  // Reset button text and function
  fontSizeIncreaseBtn.textContent = "הגדל טקסט";
  fontSizeIncreaseBtn.removeEventListener('click', resetFontSize);
  fontSizeIncreaseBtn.addEventListener('click', increaseFontSize);
}

// Check for stored preferences
function loadUserPreferences() {
  // High contrast preference
  const highContrast = getStorageItem(STORAGE_KEYS.HIGH_CONTRAST, "false") === "true";
  if (highContrast) {
    document.body.classList.add('high-contrast');
  }
}

// Track manual scrolling
function setupScrollTracking() {
  if (transcribedText) {
    transcribedText.addEventListener('scroll', function() {
      // If user has scrolled up more than 100px from the bottom
      const isNearBottom = transcribedText.scrollHeight - transcribedText.scrollTop - transcribedText.clientHeight < 100;
      isManuallyScrolled = !isNearBottom;
    });
  }
}

// Submit a question to a speaker
function submitQuestion() {
  if (!questionInput) return;
  
  const questionText = questionInput.value.trim();
  if (!questionText) {
    alert("אנא הזן את שאלתך");
    return;
  }
  
  // Get current speaker ID if available
  const speakerId = getStorageItem(STORAGE_KEYS.CURRENT_SPEAKER_ID);
  
  // Use the utility function to add a question
  addQuestion(questionText, speakerId);
  
  // Clear the input
  questionInput.value = '';
  
  // Show confirmation
  alert("השאלה נשלחה בהצלחה");
}

// App initialization
function initializeApp() {
  if (!initializeDOM()) {
    console.error("Failed to initialize DOM elements");
    return;
  }
  
  initializeEventListeners();
  loadSpeakerData();
  loadSpeakerTranscriptions();
  startSyncIntervals();
  setConferenceDetails();
  loadUserPreferences();
  setupScrollTracking();
  
  // Initial syncs
  syncRecordingStatus();
  syncSpeakerInfo();
  syncSummary();
  
  console.log("Audience view initialized");
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
