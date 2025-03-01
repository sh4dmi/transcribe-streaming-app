// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Utility module for localStorage operations.
 * This centralizes all localStorage access to ensure consistent key usage.
 */

// Constants for localStorage keys
export const STORAGE_KEYS = {
  CONFERENCE_DETAILS: 'conferenceDetails',
  SPEAKERS: 'speakers',
  ACTIVE_SPEAKER: 'activeSpeaker',
  SPEAKER_TRANSCRIPTIONS: 'speakerTranscriptions',
  CONFERENCE_QUESTIONS: 'conferenceQuestions',
  IS_RECORDING: 'isRecording',
  CURRENT_LANGUAGE: 'selectedLanguage',
  SELECTED_VOCAB: 'selectedVocab',
  TRANSCRIPTION_TEXT: 'transcriptionText',
  CURRENT_SPEAKER_ID: 'currentSpeakerId',
  GEMINI_API_KEY: 'geminiApiKey',
  AUTO_SUMMARIZE: 'autoSummarize',
  AUTO_SUMMARIZE_INTERVAL: 'autoSummarizeInterval',
  HIGH_CONTRAST: 'highContrast',
  SUMMARY_TEXT: 'summaryText',
  SUMMARY_TIMESTAMP: 'summaryTimestamp'
};

/**
 * Get data from localStorage with proper parsing
 * 
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Parsed data or default value
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    // Try to parse as JSON
    try {
      return JSON.parse(item);
    } catch (e) {
      // If not valid JSON, return as string
      return item;
    }
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Save data to localStorage with proper stringification
 * 
 * @param {string} key - The localStorage key
 * @param {any} value - The value to store
 * @returns {boolean} Success status
 */
export function setStorageItem(key, value) {
  try {
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, valueToStore);
    return true;
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
    return false;
  }
}

/**
 * Remove a key from localStorage
 * 
 * @param {string} key - The localStorage key to remove
 */
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
}

/**
 * Get conference details
 * 
 * @returns {Object} Conference details
 */
export function getConferenceDetails() {
  return getStorageItem(STORAGE_KEYS.CONFERENCE_DETAILS, {
    name: '',
    date: '',
    location: '',
    attendees: '',
    about: '',
    venue: '',
    schedule: []
  });
}

/**
 * Save conference details
 * 
 * @param {Object} details - Conference details object
 * @returns {boolean} Success status
 */
export function saveConferenceDetails(details) {
  return setStorageItem(STORAGE_KEYS.CONFERENCE_DETAILS, details);
}

/**
 * Get speakers
 * 
 * @returns {Array} Speakers array
 */
export function getSpeakers() {
  return getStorageItem(STORAGE_KEYS.SPEAKERS, []);
}

/**
 * Save speakers
 * 
 * @param {Array} speakers - Speakers array
 * @returns {boolean} Success status
 */
export function saveSpeakers(speakers) {
  return setStorageItem(STORAGE_KEYS.SPEAKERS, speakers);
}

/**
 * Get questions
 * 
 * @param {boolean} pendingOnly - Get only pending questions
 * @returns {Array} Questions array
 */
export function getQuestions(pendingOnly = false) {
  const questions = getStorageItem(STORAGE_KEYS.CONFERENCE_QUESTIONS, []);
  return pendingOnly ? questions.filter(q => !q.answered) : questions;
}

/**
 * Add a new question
 * 
 * @param {string} text - Question text
 * @param {string} speakerId - Speaker ID if available
 * @returns {Object} The new question object
 */
export function addQuestion(text, speakerId = null) {
  const newQuestion = {
    id: `q-${Date.now()}`,
    text: text,
    timestamp: new Date().toISOString(),
    speakerId: speakerId,
    answered: false,
    answer: null,
    answeredAt: null
  };
  
  const questions = getQuestions();
  questions.push(newQuestion);
  setStorageItem(STORAGE_KEYS.CONFERENCE_QUESTIONS, questions);
  
  return newQuestion;
}

/**
 * Answer a question
 * 
 * @param {string} questionId - Question ID
 * @param {string} answer - Answer text
 * @returns {boolean} Success status
 */
export function answerQuestion(questionId, answer) {
  const questions = getQuestions();
  const questionIndex = questions.findIndex(q => q.id === questionId);
  
  if (questionIndex === -1) return false;
  
  questions[questionIndex].answered = true;
  questions[questionIndex].answer = answer;
  questions[questionIndex].answeredAt = new Date().toISOString();
  
  return setStorageItem(STORAGE_KEYS.CONFERENCE_QUESTIONS, questions);
}

/**
 * Delete a question
 * 
 * @param {string} questionId - Question ID
 * @returns {boolean} Success status
 */
export function deleteQuestion(questionId) {
  const questions = getQuestions();
  const filteredQuestions = questions.filter(q => q.id !== questionId);
  
  return setStorageItem(STORAGE_KEYS.CONFERENCE_QUESTIONS, filteredQuestions);
}

/**
 * Get transcriptions for all speakers or a specific speaker
 * 
 * @param {string} speakerId - Optional speaker ID
 * @returns {Object|Array} Speaker transcriptions
 */
export function getTranscriptions(speakerId = null) {
  const transcriptions = getStorageItem(STORAGE_KEYS.SPEAKER_TRANSCRIPTIONS, {});
  
  if (speakerId) {
    return transcriptions[speakerId] || [];
  }
  
  return transcriptions;
}

/**
 * Add a transcription entry for a speaker
 * 
 * @param {string} speakerId - Speaker ID
 * @param {string} text - Transcription text
 * @returns {Object} The new transcription entry
 */
export function addTranscription(speakerId, text) {
  if (!speakerId || !text) return null;
  
  const transcriptions = getTranscriptions();
  
  if (!transcriptions[speakerId]) {
    transcriptions[speakerId] = [];
  }
  
  const newEntry = {
    timestamp: new Date().toISOString(),
    text: text
  };
  
  transcriptions[speakerId].push(newEntry);
  setStorageItem(STORAGE_KEYS.SPEAKER_TRANSCRIPTIONS, transcriptions);
  
  return newEntry;
}

/**
 * Clear transcriptions for a specific speaker
 * 
 * @param {string} speakerId - Speaker ID
 * @returns {boolean} Success status
 */
export function clearTranscriptions(speakerId) {
  if (!speakerId) return false;
  
  const transcriptions = getTranscriptions();
  
  if (transcriptions[speakerId]) {
    transcriptions[speakerId] = [];
    return setStorageItem(STORAGE_KEYS.SPEAKER_TRANSCRIPTIONS, transcriptions);
  }
  
  return true;
}

/**
 * Set active speaker
 * 
 * @param {string} speakerId - Speaker ID
 * @returns {boolean} Success status
 */
export function setActiveSpeaker(speakerId) {
  return setStorageItem(STORAGE_KEYS.ACTIVE_SPEAKER, speakerId);
}

/**
 * Set recording status
 * 
 * @param {boolean} isRecording - Recording status
 * @returns {boolean} Success status
 */
export function setRecordingStatus(isRecording) {
  return setStorageItem(STORAGE_KEYS.IS_RECORDING, isRecording.toString());
}

/**
 * Update summary
 * 
 * @param {string} summaryText - Summary text
 * @returns {boolean} Success status
 */
export function updateSummary(summaryText) {
  const success1 = setStorageItem(STORAGE_KEYS.SUMMARY_TEXT, summaryText);
  const success2 = setStorageItem(STORAGE_KEYS.SUMMARY_TIMESTAMP, new Date().toISOString());
  return success1 && success2;
} 