// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
ABOUT THIS NODE.JS EXAMPLE: This handles the conference details page.
*/

// DOM Elements
let conferenceName = null;
let conferenceDate = null;
let conferenceAbout = null;
let metaDate = null;
let metaLocation = null;
let metaAttendees = null;
let scheduleDate = null;
let scheduleList = null;
let speakersList = null;
let venueDetails = null;
let venueMap = null;
let contrastModeBtn = null;
let fontSizeIncreaseBtn = null;

// Mock conference data (would be loaded from server in a real app)
const conferenceData = {
  name: "כנס העתיד של טכנולוגיות AI",
  about: `כנס העתיד של טכנולוגיות AI הוא הכנס המוביל בישראל בתחום האינטליגנציה המלאכותית. במהלך הכנס, יציגו מומחים מובילים מהארץ והעולם את החידושים והמגמות האחרונות בתחום, ויתקיימו פאנלים בנושאים מגוונים כגון בינה מלאכותית אתית, יישומי AI בתעשייה, ועוד.<br><br>השנה הכנס יתמקד במיוחד בהשפעת ה-AI על חיינו היומיומיים, ובאפשרויות החדשות שטכנולוגיות כמו תמלול בזמן אמת מביאות לשוק העסקי והצרכני.`,
  date: "21-22 בדצמבר, 2024",
  location: "מרכז הכנסים, תל אביב",
  attendees: "כ-800 משתתפים",
  schedule: [
    {
      day: "יום ראשון, 21 בדצמבר",
      items: [
        {
          time: "08:30 - 09:30",
          title: "התכנסות והרשמה",
          speaker: "",
          description: "קבלת פנים, קפה ומאפים",
          type: "break"
        },
        {
          time: "09:30 - 10:15",
          title: "הרצאת פתיחה: העתיד של AI בעסקים",
          speaker: "פרופ' דניאל כהן",
          description: "סקירה של טכנולוגיות AI מתקדמות והשפעתן על עולם העסקים בעשור הקרוב",
          type: "presentation"
        },
        {
          time: "10:15 - 11:00",
          title: "מערכות תמלול אוטומטיות - המהפכה השקטה",
          speaker: "ד\"ר מיכל לוי",
          description: "כיצד מערכות תמלול משנות את אופן הניהול של פגישות, כנסים ואירועים",
          type: "presentation"
        },
        {
          time: "11:00 - 11:30",
          title: "הפסקת קפה",
          speaker: "",
          description: "",
          type: "break"
        },
        {
          time: "11:30 - 12:30",
          title: "פאנל: אתגרי אבטחה ופרטיות בעידן ה-AI",
          speaker: "בהשתתפות מומחי אבטחת מידע מובילים",
          description: "דיון על האתגרים והפתרונות בתחום אבטחת המידע והפרטיות בעידן השימוש הגובר ב-AI",
          type: "panel"
        },
        {
          time: "12:30 - 13:30",
          title: "ארוחת צהריים",
          speaker: "",
          description: "",
          type: "break"
        },
        {
          time: "13:30 - 14:15",
          title: "יישומי תמלול וסיכום אוטומטי במערכת הבריאות",
          speaker: "ד\"ר שרה ישראלי",
          description: "כיצד מערכות AI לתמלול וסיכום משפרות את השירות הרפואי ומצילות זמן יקר לרופאים",
          type: "presentation"
        },
        {
          time: "14:15 - 15:00",
          title: "בניית אסטרטגיית AI לארגון",
          speaker: "יוסי לוינסון, מנכ\"ל חברת AI Solutions",
          description: "מדריך מעשי לבניית אסטרטגיית AI אפקטיבית בארגונים",
          type: "presentation"
        },
        {
          time: "15:00 - 15:30",
          title: "הפסקת קפה",
          speaker: "",
          description: "",
          type: "break"
        },
        {
          time: "15:30 - 16:30",
          title: "דמו: פתרונות תמלול חדשניים",
          speaker: "צוות פיתוח AWS",
          description: "הדגמה חיה של פתרונות תמלול מתקדמים ויכולות סיכום אוטומטי",
          type: "presentation"
        },
        {
          time: "16:30 - 17:30",
          title: "שאלות ותשובות וסיכום היום הראשון",
          speaker: "מנחי הכנס",
          description: "",
          type: "panel"
        }
      ]
    },
    {
      day: "יום שני, 22 בדצמבר",
      items: [
        {
          time: "09:00 - 09:30",
          title: "התכנסות - קפה ומאפים",
          speaker: "",
          description: "",
          type: "break"
        },
        {
          time: "09:30 - 10:15",
          title: "הרצאת אורח: AI ורב-לשוניות",
          speaker: "ג'ון דייוויס, חוקר ב-Google",
          description: "איך מערכות AI מתמודדות עם אתגרי השפה והתרגום הגלובליים",
          type: "presentation"
        },
        {
          time: "10:15 - 11:15",
          title: "סדנה: יישום מערכות תמלול בארגון",
          speaker: "רונית שמואלי, יועצת IT",
          description: "סדנה מעשית על הטמעת מערכות תמלול וניתוח שיחות בארגונים",
          type: "presentation"
        },
        {
          time: "11:15 - 11:45",
          title: "הפסקת קפה",
          speaker: "",
          description: "",
          type: "break"
        },
        {
          time: "11:45 - 12:30",
          title: "תמלול ונגישות: הנגשת תוכן לאנשים עם מוגבלויות",
          speaker: "תמר גולדשטיין, מנהלת עמותת הנגישות",
          description: "כיצד טכנולוגיות תמלול מסייעות בהנגשת תוכן ומידע",
          type: "presentation"
        },
        {
          time: "12:30 - 13:30",
          title: "ארוחת צהריים",
          speaker: "",
          description: "",
          type: "break"
        },
        {
          time: "13:30 - 14:30",
          title: "פאנל: עתיד העבודה בעידן ה-AI",
          speaker: "בהשתתפות מומחים מתחום משאבי אנוש וטכנולוגיה",
          description: "דיון על השפעת ה-AI על עולם העבודה והכישורים הנדרשים",
          type: "panel"
        },
        {
          time: "14:30 - 15:15",
          title: "מקרי בוחן: הצלחות בהטמעת מערכות תמלול",
          speaker: "אבי כהן, מנהל פרויקטים",
          description: "סיפורי הצלחה של ארגונים שהטמיעו מערכות תמלול ואנליטיקה",
          type: "presentation"
        },
        {
          time: "15:15 - 15:45",
          title: "הפסקת קפה",
          speaker: "",
          description: "",
          type: "break"
        },
        {
          time: "15:45 - 16:30",
          title: "מבט לעתיד: טרנדים וחידושים בתחום התמלול והבנת שפה",
          speaker: "נטע שפירא, אנליסטית טכנולוגית",
          description: "סקירה של הטכנולוגיות העתידיות בתחום התמלול והבנת שפה טבעית",
          type: "presentation"
        },
        {
          time: "16:30 - 17:30",
          title: "שאלות ותשובות וסיכום הכנס",
          speaker: "מנחי הכנס",
          description: "סיכום הכנס, מסקנות ומבט לעתיד",
          type: "panel"
        }
      ]
    }
  ],
  venue: {
    name: "מרכז הכנסים, תל אביב",
    address: "רחוב הירקון 123, תל אביב",
    info: `מרכז הכנסים תל אביב הוא מתחם מודרני המותאם לאירוח כנסים בינלאומיים. המתחם כולל אולמות הרצאה מרווחים, מערכות סאונד מתקדמות, ואינטרנט אלחוטי מהיר.<br><br>
    <strong>הוראות הגעה:</strong><br>
    <strong>בתחבורה ציבורית:</strong> קווי אוטובוס 5, 72, 86 מגיעים ישירות למרכז.<br>
    <strong>ברכב פרטי:</strong> חניון מרכז הכנסים עומד לרשות המשתתפים (בתשלום).<br>
    <strong>רכבת:</strong> תחנת רכבת השלום במרחק 10 דקות הליכה.`,
    mapUrl: "./placeholder-map.png" // In a real app, this would be a real map image or Google Maps embed
  }
};

// Initialize DOM elements
function initializeDOM() {
  conferenceName = document.getElementById("conferenceName");
  conferenceDate = document.getElementById("conferenceDate");
  conferenceAbout = document.getElementById("conferenceAbout");
  metaDate = document.getElementById("metaDate");
  metaLocation = document.getElementById("metaLocation");
  metaAttendees = document.getElementById("metaAttendees");
  scheduleDate = document.getElementById("scheduleDate");
  scheduleList = document.getElementById("scheduleList");
  speakersList = document.getElementById("speakersList");
  venueDetails = document.getElementById("venueDetails");
  venueMap = document.getElementById("venueMap");
  contrastModeBtn = document.getElementById("contrastMode");
  fontSizeIncreaseBtn = document.getElementById("fontSizeIncrease");
  
  if (!conferenceName || !scheduleList || !speakersList) {
    console.error("Failed to initialize DOM elements");
    return false;
  }
  
  return true;
}

// Initialize event listeners
function initializeEventListeners() {
  // Schedule filter buttons
  const filterButtons = document.querySelectorAll('.filter-button');
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      // Update active state
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filter schedule items
      filterScheduleItems(filter);
    });
  });
  
  // Accessibility controls
  if (contrastModeBtn) {
    contrastModeBtn.addEventListener('click', toggleContrastMode);
  }
  
  if (fontSizeIncreaseBtn) {
    fontSizeIncreaseBtn.addEventListener('click', increaseFontSize);
  }
}

// Load conference data
function loadConferenceData() {
  // Get stored conference details from localStorage
  const storedConfName = localStorage.getItem("conferenceName");
  const storedConfDate = localStorage.getItem("conferenceDate");
  const storedConfLocation = localStorage.getItem("conferenceLocation");
  const storedConfAttendees = localStorage.getItem("conferenceAttendees");
  const storedConfAbout = localStorage.getItem("conferenceAbout");
  const storedConfVenue = localStorage.getItem("conferenceVenue");
  
  // Use stored values or fallback to mock data
  const name = storedConfName || conferenceData.name;
  const date = storedConfDate || conferenceData.date;
  const location = storedConfLocation || conferenceData.location;
  const attendees = storedConfAttendees || conferenceData.attendees;
  const about = storedConfAbout || conferenceData.about;
  
  // Set page title and header
  document.title = `${name} - פרטי הכנס`;
  
  // Set main conference details
  conferenceName.textContent = name;
  conferenceDate.textContent = date;
  conferenceAbout.innerHTML = about;
  
  // Set meta info
  metaDate.textContent = date;
  metaLocation.textContent = location;
  metaAttendees.textContent = attendees;
  
  // Render schedule (starting with day 1)
  if (conferenceData.schedule.length > 0) {
    scheduleDate.textContent = conferenceData.schedule[0].day;
    renderSchedule(0);
  }
  
  // Load speakers (from localStorage if available)
  loadSpeakers();
  
  // Set venue details
  if (storedConfVenue) {
    venueDetails.innerHTML = storedConfVenue;
  } else {
    venueDetails.innerHTML = conferenceData.venue.info;
  }
  
  venueMap.src = conferenceData.venue.mapUrl;
  venueMap.alt = `מפת ${location}`;
}

// Render schedule for a specific day
function renderSchedule(dayIndex) {
  if (!scheduleList || !conferenceData.schedule[dayIndex]) return;
  
  const day = conferenceData.schedule[dayIndex];
  scheduleDate.textContent = day.day;
  
  scheduleList.innerHTML = '';
  
  day.items.forEach(item => {
    const scheduleItem = document.createElement('div');
    scheduleItem.className = `schedule-item ${item.type}`;
    scheduleItem.setAttribute('data-type', item.type);
    
    // Add type indicator icon based on the type
    let typeIcon = '';
    switch(item.type) {
      case 'presentation':
        typeIcon = '<div class="item-type-icon presentation-icon">🎤</div>';
        break;
      case 'panel':
        typeIcon = '<div class="item-type-icon panel-icon">👥</div>';
        break;
      case 'break':
        typeIcon = '<div class="item-type-icon break-icon">☕</div>';
        break;
      default:
        typeIcon = '';
    }
    
    scheduleItem.innerHTML = `
      ${typeIcon}
      <div class="item-time">${item.time}</div>
      <div class="item-content">
        <h3 class="item-title">${item.title}</h3>
        ${item.speaker ? `<div class="item-speaker">${item.speaker}</div>` : ''}
        ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
      </div>
    `;
    
    scheduleList.appendChild(scheduleItem);
  });
}

// Filter schedule items by type
function filterScheduleItems(filter) {
  const items = scheduleList.querySelectorAll('.schedule-item');
  
  items.forEach(item => {
    if (filter === 'all' || item.getAttribute('data-type') === filter) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Load speakers from localStorage (if available) or use example data
function loadSpeakers() {
  const savedSpeakers = localStorage.getItem("conferenceSpeakers");
  let speakers = [];
  
  if (savedSpeakers) {
    speakers = JSON.parse(savedSpeakers);
  } else {
    // Example speakers if none in localStorage
    speakers = [
      { id: 'speaker1', name: 'פרופ\' דניאל כהן', role: 'מומחה AI', bio: 'חוקר בכיר בתחום הבינה המלאכותית', imageUrl: './placeholder-speaker.png' },
      { id: 'speaker2', name: 'ד"ר מיכל לוי', role: 'מומחית תמלול', bio: 'מובילה בתחום מערכות תמלול אוטומטיות', imageUrl: './placeholder-speaker.png' },
      { id: 'speaker3', name: 'יוסי לוינסון', role: 'מנכ"ל AI Solutions', bio: 'יועץ אסטרטגי בתחום ה-AI', imageUrl: './placeholder-speaker.png' }
    ];
  }
  
  renderSpeakers(speakers);
}

// Render speakers grid
function renderSpeakers(speakers) {
  if (!speakersList) return;
  
  speakersList.innerHTML = '';
  
  speakers.forEach((speaker, index) => {
    const colorClass = `speaker-color-${(index % 5) + 1}`;
    
    const speakerCard = document.createElement('div');
    speakerCard.className = 'speaker-card';
    
    speakerCard.innerHTML = `
      <div class="speaker-card-image">
        <img src="${speaker.imageUrl || './placeholder-speaker.png'}" alt="${speaker.name}">
      </div>
      <div class="speaker-card-info">
        <h3 class="speaker-card-name ${colorClass}">${speaker.name}</h3>
        <div class="speaker-card-role">${speaker.role || ''}</div>
        <p class="speaker-card-bio">${speaker.bio || ''}</p>
      </div>
    `;
    
    speakersList.appendChild(speakerCard);
  });
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

// Load user preferences (high contrast, etc)
function loadUserPreferences() {
  // High contrast preference
  const highContrast = localStorage.getItem('highContrast') === 'true';
  if (highContrast) {
    document.body.classList.add('high-contrast');
  }
}

// Initialize app
function initializeApp() {
  if (!initializeDOM()) {
    return;
  }
  
  initializeEventListeners();
  loadConferenceData();
  loadUserPreferences();
  
  console.log("Conference details page initialized");
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp); 