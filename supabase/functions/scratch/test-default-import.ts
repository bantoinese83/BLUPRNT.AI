import GenAI from "npm:@google/generative-ai";

console.log("Default export type:", typeof GenAI);
if (GenAI) {
  console.log("Default export keys:", Object.keys(GenAI));
  if (GenAI.GoogleGenerativeAI) {
    console.log("Found GoogleGenerativeAI on default export.");
  }
}
