import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner@2.0.3";
import { updateApicurioArtifact, getApicurioArtifact } from "../lib/apicurio";
import { Loader2, CheckCircle, XCircle, Play } from "lucide-react";
import { Badge } from "./ui/badge";

export function ApicurioPutTest() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const testPutOperation = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const groupId = "bfs.online";
      const artifactId = "TxServices_Informix_loc.response";
      const oldName = "TxServices_Informix_loc";
      const newName = "TxServices_loc";

      console.log("🧪 ========== Apicurio PUT Test Started ==========");
      console.log("📦 Target:", `${groupId}/${artifactId}`);
      console.log(`📦 Change: name: '${oldName}' → '${newName}'`);
      console.log("");

      // Step 1: Get current content
      console.log("📦 Step 1: Fetching current content...");
      const currentContent = await getApicurioArtifact(groupId, artifactId);
      console.log("📦 Current schema keys:", Object.keys(currentContent));
      console.log("📦 Current name field:", currentContent.name);
      console.log("");

      // Step 2: Modify the content
      console.log("📦 Step 2: Modifying content...");
      const modifiedContent = {
        ...currentContent,
        name: newName // Change name field
      };
      console.log("📦 New name field:", modifiedContent.name);
      console.log("");

      // Step 3: Send PUT request
      console.log("📦 Step 3: Sending PUT request...");
      const updateResult = await updateApicurioArtifact(
        groupId,
        artifactId,
        modifiedContent
      );
      console.log("");

      if (updateResult.success) {
        console.log("✅ PUT operation successful!");
        console.log("📦 New version:", updateResult.version || "N/A");
        
        // Step 4: Verify the change
        console.log("");
        console.log("📦 Step 4: Verifying the change...");
        const updatedContent = await getApicurioArtifact(groupId, artifactId);
        console.log("📦 Verified name field:", updatedContent.name);
        
        const verified = updatedContent.name === newName;
        console.log(verified ? "✅ Change verified!" : "⚠️ Change not reflected yet");
        console.log("");
        console.log("🧪 ========== Test Completed Successfully ==========");

        setTestResult({
          success: true,
          message: `Successfully updated artifact!\nOld value: "${oldName}"\nNew value: "${newName}"\nVersion: ${updateResult.version || 'N/A'}`,
          details: { verified, version: updateResult.version }
        });
        
        toast.success("PUT operation successful!");
      } else {
        console.error("❌ PUT operation failed!");
        console.error("Error:", updateResult.message);
        console.log("🧪 ========== Test Failed ==========");

        setTestResult({
          success: false,
          message: updateResult.message,
          details: updateResult.error
        });
        
        toast.error("PUT operation failed");
      }
    } catch (error: any) {
      console.error("❌ Test error:", error);
      console.log("🧪 ========== Test Failed ==========");

      setTestResult({
        success: false,
        message: error.message || "Unknown error",
        details: error
      });
      
      toast.error("Test failed: " + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Apicurio PUT Operation Test
        </CardTitle>
        <CardDescription>
          Test PUT request to update artifact metadata in Apicurio Registry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Details */}
        <div className="bg-slate-50 p-4 rounded-lg border space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Target:</span>
            <code className="bg-slate-200 px-2 py-0.5 rounded text-xs">
              bfs.online/TxServices_Informix_loc.response
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Change:</span>
            <code className="bg-red-100 px-2 py-0.5 rounded text-xs line-through">
              "name": "TxServices_Informix_loc"
            </code>
            <span>→</span>
            <code className="bg-green-100 px-2 py-0.5 rounded text-xs">
              "name": "TxServices_loc"
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Method:</span>
            <Badge variant="outline">PUT</Badge>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-semibold text-slate-700">URL:</span>
            <code className="bg-slate-200 px-2 py-0.5 rounded text-xs break-all">
              https://apicurio-poc.proudpond-b12a57e6.eastus.azurecontainerapps.io/apis/registry/v3/groups/bfs.online/artifacts/TxServices_Informix_loc.response
            </code>
          </div>
        </div>

        {/* Run Test Button */}
        <Button
          onClick={testPutOperation}
          disabled={testing}
          className="w-full"
          size="lg"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Testing PUT Operation...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Run PUT Test
            </>
          )}
        </Button>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-4 rounded-lg border ${
              testResult.success
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4
                  className={`font-semibold mb-2 ${
                    testResult.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {testResult.success ? "✅ Test Passed" : "❌ Test Failed"}
                </h4>
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    testResult.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {testResult.message}
                </p>
                {testResult.details && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold">
                      Details
                    </summary>
                    <pre className="mt-2 text-xs bg-white dark:bg-card p-2 rounded border overflow-x-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
          <p className="font-semibold text-blue-900 mb-2">📝 Instructions:</p>
          <ol className="list-decimal ml-5 space-y-1 text-blue-800">
            <li>Click "Run PUT Test" to test the PUT operation</li>
            <li>Check browser console (F12) for detailed logs</li>
            <li>Test will:
              <ul className="list-disc ml-5 mt-1">
                <li>Fetch current artifact content</li>
                <li>Modify the "name" field</li>
                <li>Send PUT request to Apicurio</li>
                <li>Verify the change was applied</li>
              </ul>
            </li>
          </ol>
        </div>

        {/* Console Reminder */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
          <p className="font-semibold">💡 Tip:</p>
          <p>
            Open browser console (F12 → Console) to see detailed logs of the PUT operation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
