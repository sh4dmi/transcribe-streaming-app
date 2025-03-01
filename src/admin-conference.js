// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * This is the JavaScript for the conference details management page.
 * It handles the functionality for editing conference information and schedule.
 */

document.addEventListener("DOMContentLoaded", function() {
  // DOM Elements
  const conferenceForm = document.getElementById("conferenceForm");
  const conferenceNameInput = document.getElementById("conferenceName");
  const conferenceDateInput = document.getElementById("conferenceDate");
  const conferenceLocationInput = document.getElementById("conferenceLocation");
  const conferenceAttendeesInput = document.getElementById("conferenceAttendees");
  const conferenceAboutInput = document.getElementById("conferenceAbout");
  const conferenceVenueInput = document.getElementById("conferenceVenue");
  const scheduleItemsContainer = document.getElementById("scheduleItems");
  const addScheduleItemBtn = document.getElementById("addScheduleItemBtn");
  const addScheduleDayBtn = document.getElementById("addScheduleDayBtn");
  const saveConferenceBtn = document.getElementById("saveConferenceBtn");
  
  // Conference data
  let conferenceData = {
    name: "",
    date: "",
    location: "",
    attendees: "",
    about: "",
    venue: "",
    schedule: []
  };
  
  // Load saved conference data
  function loadConferenceData() {
    const savedData = localStorage.getItem("conferenceDetails");
    if (savedData) {
      conferenceData = JSON.parse(savedData);
      
      // Fill form with saved data
      conferenceNameInput.value = conferenceData.name || "";
      conferenceDateInput.value = conferenceData.date || "";
      conferenceLocationInput.value = conferenceData.location || "";
      conferenceAttendeesInput.value = conferenceData.attendees || "";
      conferenceAboutInput.value = conferenceData.about || "";
      conferenceVenueInput.value = conferenceData.venue || "";
      
      // Render schedule
      renderSchedule();
    }
  }
  
  // Save conference data
  function saveConferenceData() {
    // Get form values
    conferenceData.name = conferenceNameInput.value.trim();
    conferenceData.date = conferenceDateInput.value.trim();
    conferenceData.location = conferenceLocationInput.value.trim();
    conferenceData.attendees = conferenceAttendeesInput.value.trim();
    conferenceData.about = conferenceAboutInput.value.trim();
    conferenceData.venue = conferenceVenueInput.value.trim();
    
    // Get schedule data from form
    conferenceData.schedule = [];
    
    // Process each schedule day
    document.querySelectorAll('.schedule-day').forEach((dayEl, dayIndex) => {
      const dayTitle = dayEl.querySelector('.day-title').value;
      const items = [];
      
      // Process each schedule item in this day
      dayEl.querySelectorAll('.schedule-item-row').forEach(itemRow => {
        const time = itemRow.querySelector('.item-time').value.trim();
        const title = itemRow.querySelector('.item-title').value.trim();
        const speaker = itemRow.querySelector('.item-speaker').value.trim();
        const description = itemRow.querySelector('.item-description').value.trim();
        const type = itemRow.querySelector('.item-type').value;
        
        if (time || title) {
          items.push({ time, title, speaker, description, type });
        }
      });
      
      if (dayTitle || items.length > 0) {
        conferenceData.schedule.push({
          day: dayTitle,
          items: items
        });
      }
    });
    
    // Save to localStorage
    localStorage.setItem("conferenceDetails", JSON.stringify(conferenceData));
    alert("Conference details saved successfully!");
  }
  
  // Render schedule items
  function renderSchedule() {
    scheduleItemsContainer.innerHTML = '';
    
    // If no schedule exists yet, create an empty day
    if (!conferenceData.schedule || conferenceData.schedule.length === 0) {
      addScheduleDay();
      return;
    }
    
    // Render each day and its items
    conferenceData.schedule.forEach((day, dayIndex) => {
      const dayElement = createScheduleDayElement(dayIndex, day.day);
      scheduleItemsContainer.appendChild(dayElement);
      
      // Render each item for this day
      day.items.forEach((item, itemIndex) => {
        const itemElement = createScheduleItemElement(itemIndex, item);
        dayElement.querySelector('.day-items').appendChild(itemElement);
      });
      
      // Add an "Add item" button for this day
      const addItemBtn = document.createElement('button');
      addItemBtn.type = 'button';
      addItemBtn.className = 'secondary-button add-item-btn';
      addItemBtn.textContent = 'Add Session to Day';
      addItemBtn.dataset.day = dayIndex;
      addItemBtn.addEventListener('click', function() {
        const dayItemsContainer = this.parentElement.querySelector('.day-items');
        const newItemIndex = dayItemsContainer.querySelectorAll('.schedule-item-row').length;
        const newItem = createScheduleItemElement(newItemIndex);
        dayItemsContainer.appendChild(newItem);
      });
      
      dayElement.appendChild(addItemBtn);
    });
  }
  
  // Create a new schedule day element
  function createScheduleDayElement(dayIndex, dayTitle = '') {
    const dayElement = document.createElement('div');
    dayElement.className = 'schedule-day';
    dayElement.dataset.day = dayIndex;
    
    dayElement.innerHTML = `
      <div class="day-header">
        <input type="text" class="day-title" placeholder="Day Title (e.g., Day 1: Opening)" value="${dayTitle}">
        <button type="button" class="remove-day-btn" data-day="${dayIndex}">Remove Day</button>
      </div>
      <div class="day-items"></div>
    `;
    
    // Add remove day button event listener
    dayElement.querySelector('.remove-day-btn').addEventListener('click', function() {
      if (confirm('Are you sure you want to remove this day and all its sessions?')) {
        dayElement.remove();
      }
    });
    
    return dayElement;
  }
  
  // Create a new schedule item element
  function createScheduleItemElement(itemIndex, item = {}) {
    const itemElement = document.createElement('div');
    itemElement.className = 'schedule-item-row';
    itemElement.dataset.item = itemIndex;
    
    itemElement.innerHTML = `
      <div class="schedule-item-content">
        <div class="form-group">
          <label>Time:</label>
          <input type="text" class="item-time" placeholder="e.g., 9:00 - 10:30" value="${item.time || ''}">
        </div>
        <div class="form-group">
          <label>Title:</label>
          <input type="text" class="item-title" placeholder="Session Title" value="${item.title || ''}">
        </div>
        <div class="form-group">
          <label>Speaker:</label>
          <input type="text" class="item-speaker" placeholder="Speaker Name" value="${item.speaker || ''}">
        </div>
        <div class="form-group">
          <label>Description:</label>
          <textarea class="item-description" rows="2" placeholder="Brief description">${item.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Type:</label>
          <select class="item-type">
            <option value="presentation" ${item.type === 'presentation' ? 'selected' : ''}>Presentation</option>
            <option value="panel" ${item.type === 'panel' ? 'selected' : ''}>Panel</option>
            <option value="workshop" ${item.type === 'workshop' ? 'selected' : ''}>Workshop</option>
            <option value="break" ${item.type === 'break' ? 'selected' : ''}>Break</option>
          </select>
        </div>
      </div>
      <button type="button" class="remove-item-btn">Remove</button>
    `;
    
    // Add remove item event listener
    itemElement.querySelector('.remove-item-btn').addEventListener('click', function() {
      itemElement.remove();
    });
    
    return itemElement;
  }
  
  // Add a new schedule day
  function addScheduleDay() {
    const dayIndex = document.querySelectorAll('.schedule-day').length;
    const newDay = createScheduleDayElement(dayIndex);
    
    // Add a first item to this day
    const firstItem = createScheduleItemElement(0);
    newDay.querySelector('.day-items').appendChild(firstItem);
    
    // Add an "Add item" button
    const addItemBtn = document.createElement('button');
    addItemBtn.type = 'button';
    addItemBtn.className = 'secondary-button add-item-btn';
    addItemBtn.textContent = 'Add Session to Day';
    addItemBtn.dataset.day = dayIndex;
    addItemBtn.addEventListener('click', function() {
      const dayItemsContainer = this.parentElement.querySelector('.day-items');
      const newItemIndex = dayItemsContainer.querySelectorAll('.schedule-item-row').length;
      const newItem = createScheduleItemElement(newItemIndex);
      dayItemsContainer.appendChild(newItem);
    });
    
    newDay.appendChild(addItemBtn);
    scheduleItemsContainer.appendChild(newDay);
  }
  
  // Event listeners
  saveConferenceBtn.addEventListener("click", saveConferenceData);
  addScheduleDayBtn.addEventListener("click", addScheduleDay);
  
  // Initialize
  loadConferenceData();
}); 