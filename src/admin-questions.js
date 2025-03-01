// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * This is the JavaScript for the audience questions management page.
 * It handles the functionality for viewing, filtering, and answering audience questions.
 */

import { 
  getStorageItem, 
  setStorageItem, 
  getQuestions, 
  answerQuestion, 
  STORAGE_KEYS 
} from './utils/localStorage.js';

document.addEventListener("DOMContentLoaded", function() {
  // DOM Elements
  const questionsList = document.getElementById("questionsList");
  const filterButtons = document.querySelectorAll(".filter-button");
  const questionAnswerContainer = document.getElementById("questionAnswerContainer");
  const currentQuestionDisplay = document.getElementById("currentQuestion");
  const questionAnswerInput = document.getElementById("questionAnswer");
  const submitAnswerBtn = document.getElementById("submitAnswerBtn");
  const skipQuestionBtn = document.getElementById("skipQuestionBtn");
  const questionsStatusElement = document.getElementById("questionsStatus");

  // Internal state
  let questions = [];
  let currentFilter = "all";
  let currentQuestionId = null;
  
  // Load questions from localStorage
  function loadQuestions() {
    questions = getQuestions();
    updateQuestionsDisplay();
  }
  
  // Save questions to localStorage
  function saveQuestions() {
    setStorageItem(STORAGE_KEYS.CONFERENCE_QUESTIONS, questions);
    
    // Update status count in main admin if it exists
    if (questionsStatusElement) {
      const pendingCount = questions.filter(q => !q.answered).length;
      questionsStatusElement.textContent = `${pendingCount} pending`;
    }
  }
  
  // Filter questions based on current filter
  function getFilteredQuestions() {
    switch (currentFilter) {
      case "pending":
        return questions.filter(q => !q.answered);
      case "answered":
        return questions.filter(q => q.answered);
      case "all":
      default:
        return questions;
    }
  }
  
  // Update the questions display based on current filter
  function updateQuestionsDisplay() {
    const filteredQuestions = getFilteredQuestions();
    
    questionsList.innerHTML = "";
    
    if (filteredQuestions.length === 0) {
      questionsList.innerHTML = `<div class="no-questions-message">No ${currentFilter === "all" ? "" : currentFilter} questions found.</div>`;
      return;
    }
    
    // Sort questions: pending first, then by timestamp (newest first)
    filteredQuestions.sort((a, b) => {
      // Pending questions first
      if (a.answered && !b.answered) return 1;
      if (!a.answered && b.answered) return -1;
      
      // Then by timestamp (newest first)
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });
    
    filteredQuestions.forEach(question => {
      const questionElement = document.createElement("div");
      questionElement.className = `question-item ${question.answered ? "answered" : "pending"}`;
      questionElement.dataset.id = question.id;
      
      // Format timestamp
      const questionDate = new Date(question.timestamp);
      const formattedDate = questionDate.toLocaleString();
      
      questionElement.innerHTML = `
        <div class="question-header">
          <span class="question-status">${question.answered ? "Answered" : "Pending"}</span>
          <span class="question-time">${formattedDate}</span>
        </div>
        <div class="question-content">
          <p class="question-text">${question.text}</p>
          ${question.answered ? `
            <div class="question-answer">
              <h4>Answer:</h4>
              <p>${question.answer}</p>
            </div>
          ` : `
            <button class="answer-question-btn" data-id="${question.id}">Answer</button>
          `}
        </div>
      `;
      
      questionsList.appendChild(questionElement);
    });
    
    // Add event listeners to answer buttons
    document.querySelectorAll(".answer-question-btn").forEach(button => {
      button.addEventListener("click", function() {
        const questionId = this.dataset.id;
        showAnswerForm(questionId);
      });
    });
  }
  
  // Show the answer form for a specific question
  function showAnswerForm(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    currentQuestionId = questionId;
    
    // Display the question in the answer form
    currentQuestionDisplay.innerHTML = `
      <h4>Question:</h4>
      <p>${question.text}</p>
    `;
    
    // Clear previous answer
    questionAnswerInput.value = "";
    
    // Show the answer form
    questionAnswerContainer.style.display = "block";
    
    // Focus the answer input
    questionAnswerInput.focus();
  }
  
  // Submit an answer for the current question
  function submitAnswer() {
    const answer = questionAnswerInput.value.trim();
    
    if (!answer) {
      alert("Please enter an answer before submitting.");
      return;
    }
    
    const questionIndex = questions.findIndex(q => q.id === currentQuestionId);
    if (questionIndex !== -1) {
      // Use the utility function to answer the question
      answerQuestion(currentQuestionId, answer);
      
      // Update local state
      questions[questionIndex].answered = true;
      questions[questionIndex].answer = answer;
      questions[questionIndex].answeredAt = new Date().toISOString();
      
      updateQuestionsDisplay();
      
      // Hide the answer form
      questionAnswerContainer.style.display = "none";
      currentQuestionId = null;
    }
  }
  
  // Skip the current question (hide the answer form)
  function skipQuestion() {
    questionAnswerContainer.style.display = "none";
    currentQuestionId = null;
  }
  
  // Set up event listeners
  filterButtons.forEach(button => {
    button.addEventListener("click", function() {
      // Update active filter
      filterButtons.forEach(btn => btn.classList.remove("active"));
      this.classList.add("active");
      
      currentFilter = this.dataset.filter;
      updateQuestionsDisplay();
    });
  });
  
  submitAnswerBtn.addEventListener("click", submitAnswer);
  skipQuestionBtn.addEventListener("click", skipQuestion);
  
  // Set up polling to check for new questions
  function pollForNewQuestions() {
    const latestQuestions = getQuestions();
    
    // Check if there are new questions by comparing length and latest question
    if (latestQuestions.length !== questions.length || 
        (latestQuestions.length > 0 && questions.length > 0 && 
         latestQuestions[latestQuestions.length - 1].id !== questions[questions.length - 1].id)) {
      questions = latestQuestions;
      updateQuestionsDisplay();
    }
  }
  
  // Poll every 5 seconds
  setInterval(pollForNewQuestions, 5000);
  
  // Initialize
  loadQuestions();
}); 