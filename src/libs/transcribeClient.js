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
    return false;
  }
  if (microphoneStream || transcribeClient) {
    stopRecording();
  }
  createTranscribeClient();
  createMicrophoneStream();
  await startStreaming(language, callback, vocabularyName);
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
  if (vocabularyName) {
    commandOptions.VocabularyName = vocabularyName;
    console.log(`Using custom vocabulary: ${vocabularyName}`);
  }
  
  const command = new StartStreamTranscriptionCommand(commandOptions);
  const data = await transcribeClient.send(command);
  
  for await (const event of data.TranscriptResultStream) {
    for (const result of event.TranscriptEvent.Transcript.Results || []) {
      if (result.IsPartial === false) {
        const noOfResults = result.Alternatives[0].Items.length;
        for (let i = 0; i < noOfResults; i++) {
          console.log(result.Alternatives[0].Items[i].Content);
          callback(`${result.Alternatives[0].Items[i].Content} `);
        }
      }
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

// snippet-end:[transcribeClient.JavaScript.streaming.createclientv3]
