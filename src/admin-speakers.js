// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * This is the JavaScript for the speaker management page.
 * It handles the functionality for adding, editing, and removing speakers.
 */

import { getStorageItem, setStorageItem, STORAGE_KEYS } from './utils/localStorage.js';

document.addEventListener("DOMContentLoaded", function() {
  // DOM Elements
  const speakersList = document.getElementById("speakersList");
  const addSpeakerBtn = document.getElementById("addSpeakerBtn");
  const speakerFormContainer = document.getElementById("speakerFormContainer");
  const speakerForm = document.getElementById("speakerForm");
  const speakerFormTitle = document.getElementById("speakerFormTitle");
  const speakerNameInput = document.getElementById("speakerName");
  const speakerRoleInput = document.getElementById("speakerRole");
  const speakerBioInput = document.getElementById("speakerBio");
  const speakerImageInput = document.getElementById("speakerImage");
  const speakerIdInput = document.getElementById("speakerId");
  const cancelSpeakerBtn = document.getElementById("cancelSpeakerBtn");
  const speakersStatusElement = document.getElementById("speakersStatus");

  // Internal state
  let speakers = [];
  let editMode = false;

  // Load speakers from localStorage
  function loadSpeakers() {
    speakers = getStorageItem(STORAGE_KEYS.SPEAKERS, []);
    updateSpeakersDisplay();
  }

  // Save speakers to localStorage
  function saveSpeakers() {
    setStorageItem(STORAGE_KEYS.SPEAKERS, speakers);
    
    // Update status count in main admin if it exists
    if (speakersStatusElement) {
      speakersStatusElement.textContent = speakers.length > 0 
        ? `${speakers.length} speaker${speakers.length > 1 ? 's' : ''}`
        : "No speakers added";
    }
  }

  // Update the speakers display
  function updateSpeakersDisplay() {
    speakersList.innerHTML = "";
    
    if (speakers.length === 0) {
      speakersList.innerHTML = '<div class="no-speakers-message">No speakers added yet. Click "Add New Speaker" to get started.</div>';
      return;
    }
    
    speakers.forEach(speaker => {
      const speakerElement = document.createElement("div");
      speakerElement.className = "speaker-item";
      
      // Create speaker initials for placeholder if no image
      const initials = speaker.name.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      
      speakerElement.innerHTML = `
        <div class="speaker-info">
          ${speaker.imageUrl ? `
            <div class="speaker-image">
              <img src="${speaker.imageUrl}" alt="${speaker.name}" onerror="this.parentNode.innerHTML='${initials}'">
            </div>
          ` : `
            <div class="speaker-image-placeholder">${initials}</div>
          `}
          <div class="speaker-details">
            <h3>${speaker.name}</h3>
            <div class="speaker-role">${speaker.role || 'No role specified'}</div>
            <p class="speaker-bio">${speaker.bio || 'No bio provided'}</p>
          </div>
        </div>
        <div class="speaker-actions">
          <button class="secondary-button edit-speaker-btn" data-id="${speaker.id}">Edit</button>
          <button class="button remove-speaker-btn" data-id="${speaker.id}">Remove</button>
        </div>
      `;
      
      speakersList.appendChild(speakerElement);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll(".edit-speaker-btn").forEach(button => {
      button.addEventListener("click", function() {
        const speakerId = this.dataset.id;
        editSpeaker(speakerId);
      });
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll(".remove-speaker-btn").forEach(button => {
      button.addEventListener("click", function() {
        const speakerId = this.dataset.id;
        if (confirm("Are you sure you want to remove this speaker?")) {
          removeSpeaker(speakerId);
        }
      });
    });
  }
  
  // Show the form to add a new speaker
  function showAddSpeakerForm() {
    editMode = false;
    speakerFormTitle.textContent = "Add New Speaker";
    speakerForm.reset();
    speakerIdInput.value = "";
    speakerFormContainer.style.display = "block";
    speakerNameInput.focus();
  }
  
  // Show the form to edit an existing speaker
  function editSpeaker(speakerId) {
    const speaker = speakers.find(s => s.id === speakerId);
    if (!speaker) return;
    
    editMode = true;
    speakerFormTitle.textContent = "Edit Speaker";
    speakerNameInput.value = speaker.name;
    speakerRoleInput.value = speaker.role || "";
    speakerBioInput.value = speaker.bio || "";
    speakerImageInput.value = speaker.imageUrl || "";
    speakerIdInput.value = speaker.id;
    
    speakerFormContainer.style.display = "block";
    speakerNameInput.focus();
  }
  
  // Remove a speaker
  function removeSpeaker(speakerId) {
    speakers = speakers.filter(s => s.id !== speakerId);
    saveSpeakers();
    updateSpeakersDisplay();
  }
  
  // Handle form submit
  function handleFormSubmit(e) {
    e.preventDefault();
    
    const name = speakerNameInput.value.trim();
    const role = speakerRoleInput.value.trim();
    const bio = speakerBioInput.value.trim();
    const imageUrl = speakerImageInput.value.trim();
    
    if (!name) {
      alert("Speaker name is required.");
      return;
    }
    
    if (editMode) {
      // Update existing speaker
      const speakerId = speakerIdInput.value;
      const speakerIndex = speakers.findIndex(s => s.id === speakerId);
      
      if (speakerIndex !== -1) {
        speakers[speakerIndex] = {
          ...speakers[speakerIndex],
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
    
    saveSpeakers();
    updateSpeakersDisplay();
    
    // Hide the form
    speakerFormContainer.style.display = "none";
  }
  
  // Set up event listeners
  addSpeakerBtn.addEventListener("click", showAddSpeakerForm);
  speakerForm.addEventListener("submit", handleFormSubmit);
  cancelSpeakerBtn.addEventListener("click", function() {
    speakerFormContainer.style.display = "none";
  });
  
  // Initialize
  loadSpeakers();
}); 