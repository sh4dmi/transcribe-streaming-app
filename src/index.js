// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
ABOUT THIS NODE.JS EXAMPLE: This handles the audience view for the conference transcription app.
*/

// TranscriptionStore: Single source of truth for transcription data
// First check if it already exists in the window object
if (typeof window.TranscriptionStore === 'undefined') {
  window.TranscriptionStore = {
    // Current raw transcription text
    _rawTranscriptionText: '',
    
    // Processed transcriptions by speaker
    _speakerTranscriptions: {},
    
    // Get raw transcription text
    getRawTranscription() {
      // Always sync with localStorage first
      this._rawTranscriptionText = localStorage.getItem("transcriptionText") || '';
      return this._rawTranscriptionText;
    },
    
    // Get speaker transcriptions
    getSpeakerTranscriptions() {
      return this._speakerTranscriptions;
    },
    
    // Load speaker transcriptions from localStorage
    loadSpeakerTranscriptions() {
      const savedTranscriptions = localStorage.getItem("speakerTranscriptions");
      if (savedTranscriptions) {
        this._speakerTranscriptions = JSON.parse(savedTranscriptions);
      }
      return this._speakerTranscriptions;
    },
    
    // Save speaker transcriptions to localStorage
    saveSpeakerTranscriptions() {
      localStorage.setItem("speakerTranscriptions", JSON.stringify(this._speakerTranscriptions));
    },
    
    // Update transcription for a specific speaker
    updateSpeakerTranscription(speakerId, text) {
      if (!speakerId) return false;
      
      // Initialize array for this speaker if it doesn't exist
      if (!this._speakerTranscriptions[speakerId]) {
        this._speakerTranscriptions[speakerId] = [];
      }
      
      // Get the last text entry for this speaker
      const lastEntry = this._speakerTranscriptions[speakerId].length > 0 
        ? this._speakerTranscriptions[speakerId][this._speakerTranscriptions[speakerId].length - 1]
        : null;
      
      // Only add new text if it's different from the last entry
      if (!lastEntry || text !== lastEntry.text) {
        // Add timestamp and text
        this._speakerTranscriptions[speakerId].push({
          timestamp: new Date().toISOString(),
          text: text
        });
        
        // Save to localStorage
        this.saveSpeakerTranscriptions();
        return true;
      }
      
      return false;
    }
  };
}

// Use the global TranscriptionStore
const TranscriptionStore = window.TranscriptionStore;

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
  // Check for recording status changes every 2 seconds
  statusSyncInterval = setInterval(syncRecordingStatus, 2000);
  
  // Check for transcription updates frequently (500ms)
  transcriptionSyncInterval = setInterval(syncTranscription, 500);
  
  // Check for speaker changes every 3 seconds
  speakerSyncInterval = setInterval(syncSpeakerInfo, 3000);
  
  // Check for summary updates every 5 seconds
  summarySyncInterval = setInterval(syncSummary, 5000);
}

// Sync recording status from admin
function syncRecordingStatus() {
  const isRecording = localStorage.getItem("isRecording") === "true";
  
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
  const language = localStorage.getItem("currentLanguage");
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

// Sync transcription from admin
function syncTranscription() {
  // Get the raw transcription from TranscriptionStore instead of directly from localStorage
  const text = TranscriptionStore.getRawTranscription();
  const currentSpeakerId = localStorage.getItem("currentSpeakerId");
  
  // Display the transcription text even if there's no current speaker ID
  if (text && text.trim() !== "") {
    // If we have a current speaker, update their transcription cache
    if (currentSpeakerId) {
      // Update the speaker's transcription in TranscriptionStore
      if (!TranscriptionStore.updateSpeakerTranscription(currentSpeakerId, text)) {
        console.warn("Failed to update transcription for current speaker");
      }
    }
    
    // Always update the display regardless of whether we have a speaker ID
    // Process all transcriptions for display
    const formattedText = processAllTranscriptions();
    
    // If there's no formatted text from the speakers but we have direct transcription text,
    // display that directly
    if ((!formattedText || formattedText.trim() === "") && text) {
      transcribedText.innerHTML = `<div class="transcript-entry">
        <div class="transcript-text">${text}</div>
      </div>`;
    } else {
      transcribedText.innerHTML = formattedText;
    }
    
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
  
  // Check if there are any speaker transcriptions
  if (Object.keys(TranscriptionStore.getSpeakerTranscriptions()).length === 0) {
    // If no speaker transcriptions exist, check for direct transcription text
    const directText = TranscriptionStore.getRawTranscription();
    if (directText && directText.trim() !== "") {
      return `<div class="transcript-entry">
        <div class="transcript-text">${directText}</div>
      </div>`;
    }
    return ""; // Return empty string if no transcription exists
  }
  
  // For each speaker, add their entries with speaker info
  Object.keys(TranscriptionStore.getSpeakerTranscriptions()).forEach(speakerId => {
    const speaker = speakersCache.find(s => s.id === speakerId);
    const speakerName = speaker ? speaker.name : "דובר";
    
    TranscriptionStore.getSpeakerTranscriptions()[speakerId].forEach(entry => {
      allEntries.push({
        speakerId,
        speakerName,
        timestamp: new Date(entry.timestamp),
        text: entry.text
      });
    });
  });
  
  // If no entries, return empty string
  if (allEntries.length === 0) {
    return "";
  }
  
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
  const savedSpeakers = localStorage.getItem("conferenceSpeakers");
  if (savedSpeakers) {
    speakersCache = JSON.parse(savedSpeakers);
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
  const summary = localStorage.getItem("summaryText");
  const timestamp = localStorage.getItem("summaryTimestamp");
  
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
  const name = localStorage.getItem("conferenceName") || "כנס תמלול חי";
  conferenceName.textContent = name;
  
  // Set conference date (today's date for demo)
  const today = new Date();
  const dateString = today.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
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
  localStorage.setItem('highContrast', document.body.classList.contains('high-contrast'));
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

// Submit question from audience member
function submitQuestion() {
  if (!questionInput) return;
  
  const questionText = questionInput.value.trim();
  if (!questionText) {
    alert("אנא הזן שאלה לפני השליחה");
    return;
  }
  
  // Get current speaker ID if available
  const currentSpeakerId = localStorage.getItem("currentSpeakerId");
  
  // Create question object
  const question = {
    id: `q-${Date.now()}`,
    text: questionText,
    timestamp: new Date().toISOString(),
    speakerId: currentSpeakerId || null,
    answered: false
  };
  
  // Get existing questions or create empty array
  const existingQuestions = JSON.parse(localStorage.getItem("conferenceQuestions") || "[]");
  
  // Add new question
  existingQuestions.push(question);
  
  // Save back to localStorage
  localStorage.setItem("conferenceQuestions", JSON.stringify(existingQuestions));
  
  // Clear input
  questionInput.value = "";
  
  // Show confirmation
  alert("שאלתך נשלחה בהצלחה ותועבר למנחים");
}

// Check for stored preferences
function loadUserPreferences() {
  // High contrast preference
  const highContrast = localStorage.getItem('highContrast') === 'true';
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

// App initialization
function initializeApp() {
  if (!initializeDOM()) {
    console.error("Failed to initialize DOM elements");
    return;
  }
  
  // Initialize the TranscriptionStore first
  TranscriptionStore.loadSpeakerTranscriptions();
  
  initializeEventListeners();
  loadSpeakerData();
  startSyncIntervals();
  setConferenceDetails();
  loadUserPreferences();
  setupScrollTracking();
  
  // Initial syncs
  syncRecordingStatus();
  syncSpeakerInfo();
  syncTranscription(); // Do an initial sync of transcription
  syncSummary();
  
  console.log("Audience view initialized");
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
