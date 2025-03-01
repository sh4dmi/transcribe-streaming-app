// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import webpack from "webpack";
import path from "node:path";

import { dirnameFromMetaUrl } from "@aws-doc-sdk-examples/lib/utils/util-fs.js";

const __dirname = dirnameFromMetaUrl(import.meta.url);

export default {
  mode: "development",
  entry: {
    index: "./src/index.js",
    admin: "./src/admin.js",
    conference: "./src/conference.js",
    "admin-speakers": "./src/admin-speakers.js",
    "admin-conference": "./src/admin-conference.js",
    "admin-transcription": "./src/admin-transcription.js",
    "admin-questions": "./src/admin-questions.js",
  },
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "[name].bundle.js",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    hot: true,
    open: true,
    port: 80,
    historyApiFallback: true,
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
