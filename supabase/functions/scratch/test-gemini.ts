import { GoogleGenerativeAI } from "npm:@google/generative-ai";

console.log("Type of GoogleGenerativeAI:", typeof GoogleGenerativeAI);
console.log("GoogleGenerativeAI keys:", Object.keys(GoogleGenerativeAI || {}));

try {
  const genAI = new GoogleGenerativeAI("test");
  console.log("genAI keys:", Object.keys(genAI || {}));
  console.log("getGenerativeModel exists:", typeof genAI.getGenerativeModel);
} catch (e) {
  console.error("Error initializing:", e.message);
}
