/**
 * Sequential Bulk Labeling Test
 * Run with: npx --yes deno run --allow-net --allow-read scratch/test-upload.ts
 */

const BASE_URL = "https://elucgaegaihkklnfoasm.supabase.co/functions/v1/upload-document";
const PROJECT_ID = "3d593360-20d2-47ae-9cd1-49be74e12d7f"; 
const AUTH_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImMwYTRkZmQ0LWIwN2EtNDFiNC1hMjIzLTFkZjE5YzI3MDU5YyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2VsdWNnYWVnYWloa2tsbmZvYXNtLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxNjRjY2UzOS1hNGFiLTQwMjEtOGFmOS0wYjg5ZDk2M2EwOWEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc2OTczNzQ1LCJpYXQiOjE3NzY5NzAxNDUsImVtYWlsIjoiYjJAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImIyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjE2NGNjZTM5LWE0YWItNDAyMS04YWY5LTBiODlkOTYzYTA5YSJ9LCJyb2xlIjoiYXV0aGVudGljYXV0ZWRDIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzc2OTcwMTQ1fV0sInNlc3Npb25faWQiOiI5MjY4MjhkNi02YTgyLTRjOWMtYWIxYS1mM2YxYWMyMGMzZGMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.qsAqEM5BX4DFrmmKCojfDoiSGBfX2ZhgiH2Zl1vALJuWYKHcUrBe2xr0NRiLgaPkURv1FumeEM4zLptycbOT-w";

const SAMPLE_DIR = "sample-docs";

async function runBulkTest() {
  console.log("🚀 Starting Sequential Labeling Test...");
  
  const files = [];
  for await (const dirEntry of Deno.readDir(SAMPLE_DIR)) {
    if (dirEntry.isFile && !dirEntry.name.startsWith(".")) {
      files.push(dirEntry.name);
    }
  }

  const results = [];

  for (const fileName of files) {
    console.log(`📄 Processing: ${fileName}...`);
    try {
      const fileData = await Deno.readFile(`${SAMPLE_DIR}/${fileName}`);
      const blob = new Blob([fileData], { type: fileName.endsWith(".pdf") ? "application/pdf" : "image/png" });

      const formData = new FormData();
      formData.append("project_id", PROJECT_ID);
      formData.append("file", blob, fileName);
      formData.append("document_type", "auto");

      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${AUTH_TOKEN}` },
        body: formData,
      });

      const status = response.status;
      const data = await response.json();
      const label = data.document_type || "unknown";

      results.push({ file: fileName, status, identified_as: label });
      console.log(status === 202 ? `   ✅ Identified as: ${label}` : `   ❌ Failed: ${data.error}`);
      
    } catch (e) {
      console.log(`   💥 Network/Parse Error: ${e.message}`);
    }
    
    // Tiny delay to breathe
    await new Promise(r => setTimeout(r, 1000));
  }

  console.table(results);
}

runBulkTest();
