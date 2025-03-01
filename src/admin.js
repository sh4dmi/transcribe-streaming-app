// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * This is the JavaScript for the main admin dashboard page.
 * It displays system status and provides navigation to specialized admin pages.
 */

import { getStorageItem, STORAGE_KEYS } from './utils/localStorage.js';

document.addEventListener("DOMContentLoaded", function() {
  // DOM Elements
  const conferenceStatus = document.getElementById("conferenceStatus");
  const speakersStatus = document.getElementById("speakersStatus");
  const transcriptionStatus = document.getElementById("transcriptionStatus");
  const questionsStatus = document.getElementById("questionsStatus");
  
  // Function to update dashboard status
  function updateDashboardStatus() {
    // Update conference status
    const conferenceDetails = getStorageItem(STORAGE_KEYS.CONFERENCE_DETAILS);
    if (conferenceDetails) {
      conferenceStatus.textContent = conferenceDetails.name || "Configured";
    } else {
      conferenceStatus.textContent = "Not configured";
    }
    
    // Update speakers status
    const speakers = getStorageItem(STORAGE_KEYS.SPEAKERS, []);
    if (speakers.length > 0) {
      speakersStatus.textContent = `${speakers.length} speaker${speakers.length === 1 ? '' : 's'} added`;
    } else {
      speakersStatus.textContent = "No speakers added";
    }
    
    // Update transcription status
    const activeSpeaker = getStorageItem(STORAGE_KEYS.ACTIVE_SPEAKER);
    const speakerTranscriptions = getStorageItem(STORAGE_KEYS.SPEAKER_TRANSCRIPTIONS, {});
    
    if (activeSpeaker && speakerTranscriptions) {
      if (speakerTranscriptions[activeSpeaker] && speakerTranscriptions[activeSpeaker].length > 0) {
        transcriptionStatus.textContent = "Transcription in progress";
      } else {
        transcriptionStatus.textContent = "Ready to record";
      }
    } else {
      transcriptionStatus.textContent = "Not configured";
    }
    
    // Update questions status
    const questions = getStorageItem(STORAGE_KEYS.CONFERENCE_QUESTIONS, []);
    const pendingCount = questions.filter(q => !q.answered).length;
    questionsStatus.textContent = `${pendingCount} pending`;
  }
  
  // Poll for status updates every 5 seconds
  setInterval(updateDashboardStatus, 5000);
  
  // Initialize
  updateDashboardStatus();
}); 