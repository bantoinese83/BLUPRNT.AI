/**
 * Test script for the upload-document Edge Function.
 * Run with: deno run --allow-net --allow-read scratch/test-upload.ts
 */

// Live Project URL
const BASE_URL = "https://elucgaegaihkklnfoasm.supabase.co/functions/v1/upload-document";

// Replace these with valid values to test against the live environment
const PROJECT_ID = "3d593360-20d2-47ae-9cd1-49be74e12d7f"; 
const AUTH_TOKEN = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImMwYTRkZmQ0LWIwN2EtNDFiNC1hMjIzLTFkZjE5YzI3MDU5YyIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2VsdWNnYWVnYWloa2tsbmZvYXNtLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIxNjRjY2UzOS1hNGFiLTQwMjEtOGFmOS0wYjg5ZDk2M2EwOWEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc2OTczNzQ1LCJpYXQiOjE3NzY5NzAxNDUsImVtYWlsIjoiYjJAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6ImIyQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjE2NGNjZTM5LWE0YWItNDAyMS04YWY5LTBiODlkOTYzYTA5YSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzc2OTcwMTQ1fV0sInNlc3Npb25faWQiOiI5MjY4MjhkNi02YTgyLTRjOWMtYWIxYS1mM2YxYWMyMGMzZGMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.qsAqEM5BX4DFrmmKCojfDoiSGBfX2ZhgiH2Zl1vALJuWYKHcUrBe2xr0NRiLgaPkURv1FumeEM4zLptycbOT-w";

const FILE_PATH = "sample-docs/sample_maintenance_log.png";

async function testUpload() {
  console.log("🚀 Testing upload-document function...");
  console.log(`🔗 Target: ${BASE_URL}`);

  try {
    const fileData = await Deno.readFile(FILE_PATH);
    const blob = new Blob([fileData], { type: "image/png" });

    const formData = new FormData();
    formData.append("project_id", PROJECT_ID);
    formData.append("file", blob, "sample_log.png");
    formData.append("document_type", "invoice");
    formData.append("vendor_hint", "Test Maintenance Pro");

    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AUTH_TOKEN}`,
      },
      body: formData,
    });

    const status = response.status;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    console.log(`\nStatus: ${status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (status >= 200 && status < 300) {
      console.log("\n✅ Upload successful!");
    } else {
      console.log("\n❌ Upload failed. Check Supabase logs for [upload-document] errors.");
    }
  } catch (error) {
    console.error("\n💥 Request error:", error);
    console.log("\nTIP: Make sure you are running this from the project root.");
  }
}

testUpload();
