// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/*
ABOUT THIS NODE.JS EXAMPLE: This example works with the AWS SDK for JavaScript version 3 (v3),
which is available at https://github.com/aws/aws-sdk-js-v3.

Purpose:
This file handles the transcription of speech to text using AWS Transcribe

*/
// snippet-start:[transcribeClient.JavaScript.streaming.createclientv3]
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { 
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} from "@aws-sdk/client-transcribe-streaming";
import { TranscribeClient, ListVocabulariesCommand } from "@aws-sdk/client-transcribe";
import MicrophoneStream from "microphone-stream";
import * as awsID from "./awsID.js";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/localStorage.js';

/** @type {MicrophoneStream} */
const MicrophoneStreamImpl = MicrophoneStream.default;

const SAMPLE_RATE = 44100;
/** @type {MicrophoneStream | undefined} */
let microphoneStream = undefined;
/** @type {TranscribeStreamingClient | undefined} */
let transcribeClient = undefined;

/**
 * Start recording and transcribing audio
 * @param {string} language - Language code
 * @param {Function} callback - Callback function for transcription results
 * @param {string|null} vocabularyName - Optional custom vocabulary name
 * @returns {Promise<boolean>}
 */
export const startRecording = async (language, callback, vocabularyName = null) => {
  if (!language) {
    console.error("No language specified for transcription");
    return false;
  }
  
  // Stop any existing recording session
  if (microphoneStream || transcribeClient) {
    stopRecording();
  }
  
  console.log(`Starting recording with language: ${language}, vocabulary: ${vocabularyName || "none"}`);
  
  createTranscribeClient();
  await createMicrophoneStream();
  await startStreaming(language, callback, vocabularyName);
  
  return true;
};

export const stopRecording = () => {
  if (microphoneStream) {
    microphoneStream.stop();
    microphoneStream.destroy();
    microphoneStream = undefined;
  }
  if (transcribeClient) {
    transcribeClient.destroy();
    transcribeClient = undefined;
  }
};

/**
 * List available custom vocabularies
 * @returns {Promise<Array>} - List of vocabularies
 */
export const listCustomVocabularies = async () => {
  try {
    // Create a standard (non-streaming) Transcribe client for the ListVocabularies operation
    const transcribeStandardClient = new TranscribeClient({
      region: awsID.REGION,
      credentials: fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: awsID.REGION }),
        identityPoolId: awsID.IDENTITY_POOL_ID,
      }),
    });

    // Create the command to list vocabularies
    const command = new ListVocabulariesCommand({
      MaxResults: 100,
      StateEquals: "READY"
    });

    // Send the command and get the response
    const response = await transcribeStandardClient.send(command);
    console.log("Custom vocabularies:", response.Vocabularies);

    return response.Vocabularies || [];
  } catch (error) {
    console.error("Error listing custom vocabularies:", error);
    
    // Fallback to mock data if real API call fails
    console.log("Using fallback mock vocabularies");
    return [
      { VocabularyName: "medical-terms", LanguageCode: "en-US" },
      { VocabularyName: "tech-vocabulary", LanguageCode: "en-US" },
      { VocabularyName: "legal-terms", LanguageCode: "en-US" },
      { VocabularyName: "hebrew-tech", LanguageCode: "he-IL" }
    ];
  }
};

const createTranscribeClient = () => {
  transcribeClient = new TranscribeStreamingClient({
    region: awsID.REGION,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: awsID.REGION }),
      identityPoolId: awsID.IDENTITY_POOL_ID,
    }),
  });
};

const createMicrophoneStream = async () => {
  microphoneStream = new MicrophoneStreamImpl();
  microphoneStream.setStream(
    await window.navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    }),
  );
};

const startStreaming = async (language, callback, vocabularyName = null) => {
  // Create command with base options
  const commandOptions = {
    LanguageCode: language,
    MediaEncoding: "pcm",
    MediaSampleRateHertz: SAMPLE_RATE,
    AudioStream: getAudioStream(),
  };
  
  // Add vocabulary filter if provided
  if (vocabularyName && vocabularyName !== "none") {
    console.log(`Adding custom vocabulary to transcription: ${vocabularyName}`);
    commandOptions.VocabularyName = vocabularyName;
  }
  
  try {
    const command = new StartStreamTranscriptionCommand(commandOptions);
    const data = await transcribeClient.send(command);
    
    for await (const event of data.TranscriptResultStream) {
      handleTranscriptionResult(event.TranscriptEvent.Transcript, callback);
    }
  } catch (error) {
    console.error("Error in startStreaming:", error);
    // If there's an error with the vocabulary, try without it
    if (vocabularyName && error.message.includes("vocabulary")) {
      console.log("Retrying without custom vocabulary");
      const retryCommand = new StartStreamTranscriptionCommand({
        LanguageCode: language,
        MediaEncoding: "pcm",
        MediaSampleRateHertz: SAMPLE_RATE,
        AudioStream: getAudioStream(),
      });
      const data = await transcribeClient.send(retryCommand);
      
      for await (const event of data.TranscriptResultStream) {
        handleTranscriptionResult(event.TranscriptEvent.Transcript, callback);
      }
    } else {
      throw error;
    }
  }
};

const getAudioStream = async function* () {
  if (!microphoneStream) {
    throw new Error(
      "Cannot get audio stream. microphoneStream is not initialized.",
    );
  }

  for await (const chunk of /** @type {[][]} */ (microphoneStream)) {
    if (chunk.length <= SAMPLE_RATE) {
      yield {
        AudioEvent: {
          AudioChunk: encodePCMChunk(chunk),
        },
      };
    }
  }
};

const encodePCMChunk = (chunk) => {
  /** @type {Float32Array} */
  const input = MicrophoneStreamImpl.toRaw(chunk);
  let offset = 0;
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return Buffer.from(buffer);
};

// Handle transcription result
export function handleTranscriptionResult(transcriptEvent, callback) {
  if (!transcriptEvent.Results || transcriptEvent.Results.length === 0) {
    return;
  }
  
  const results = transcriptEvent.Results;
  
  results.forEach(result => {
    if (result.IsPartial === false) {
      // Only process when we have final results
      if (result.Alternatives && result.Alternatives.length > 0) {
        const transcript = result.Alternatives[0].Transcript;
        
        console.log("New transcription text: ", transcript);
        
        // Call the callback with the new text
        if (callback && transcript) {
          callback(transcript + " ");
        }
        
        // Also update localStorage for cross-component sharing using utility function
        setStorageItem(STORAGE_KEYS.TRANSCRIPTION_TEXT, 
          (getStorageItem(STORAGE_KEYS.TRANSCRIPTION_TEXT, "") + transcript + " "));
      }
    }
  });
}

// snippet-end:[transcribeClient.JavaScript.streaming.createclientv3]
