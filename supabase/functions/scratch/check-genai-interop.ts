import * as GenAI from "npm:@google/generative-ai";

console.log("Namespace keys:", Object.keys(GenAI));
console.log("Default export:", GenAI.default ? "exists" : "missing");
if (GenAI.default) {
  console.log("Default export keys:", Object.keys(GenAI.default));
}

const GoogleGenerativeAI = GenAI.GoogleGenerativeAI || (GenAI.default && GenAI.default.GoogleGenerativeAI);

if (!GoogleGenerativeAI) {
  console.error("Could not find GoogleGenerativeAI class in module!");
} else {
  console.log("Found GoogleGenerativeAI class. Initializing...");
  try {
    const genAI = new GoogleGenerativeAI("test-key");
    console.log("Instance keys:", Object.keys(genAI));
    console.log("getGenerativeModel:", typeof genAI.getGenerativeModel);
  } catch (e) {
    console.error("Initialization error:", e.message);
  }
}
