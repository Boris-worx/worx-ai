import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Database, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { getApicurioConfig } from "../lib/apicurio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
  url?: string;
  status?: number;
  headers?: Record<string, string>;
  data?: any;
  category?: 'apicurio' | 'bfs' | 'info';
}

export function ApicurioConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [apicurioResults, setApicurioResults] = useState<TestResult[]>([]);
  const [bfsResults, setBfsResults] = useState<TestResult[]>([]);
  
  const config = getApicurioConfig();
  const APICURIO_BASE = config.baseUrl;
  const APICURIO_API = config.apiUrl;
  const BFS_API = "https://dp-eastus-poc-txservices-apis.azurewebsites.net/1.0";

  const testApicurio = async () => {
    const testResults: TestResult[] = [];

    // Test 0: Apicurio Configuration
    testResults.push({
      success: true,
      message: "Apicurio Configuration",
      details: `Base URL: ${APICURIO_BASE}\nAPI URL: ${APICURIO_API}\nGroups: ${config.groups.join(', ')}`,
      category: 'info',
    });

    // Test 1: Try to fetch artifact list from bfs.online group
    try {
      const listUrl = `${APICURIO_API}/groups/bfs.online/artifacts?limit=10`;
      testResults.push({
        success: true,
        message: "Attempting to fetch artifacts list",
        url: listUrl,
        category: 'apicurio',
      });

      const listResponse = await fetch(listUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      listResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (listResponse.ok) {
        const data = await listResponse.json();
        testResults.push({
          success: true,
          message: "✅ Successfully fetched artifacts list",
          details: `Status: ${listResponse.status}\nArtifacts count: ${data.count || 0}`,
          status: listResponse.status,
          headers: responseHeaders,
          data: data,
          category: 'apicurio',
        });
      } else {
        testResults.push({
          success: false,
          message: "❌ Error fetching artifacts list",
          details: `Status: ${listResponse.status} ${listResponse.statusText}`,
          status: listResponse.status,
          headers: responseHeaders,
          category: 'apicurio',
        });
      }
    } catch (error: any) {
      testResults.push({
        success: false,
        message: "❌ CORS or network error when fetching list",
        details: error.message || String(error),
        category: 'apicurio',
      });
    }

    // Test 2: Try to fetch artifact content with branch=latest
    try {
      const contentUrl = `${APICURIO_API}/groups/bfs.online/artifacts/TxServices_Informix_loc.response/versions/branch=latest/content`;
      testResults.push({
        success: true,
        message: "Attempting to fetch artifact content (branch=latest)",
        url: contentUrl,
        category: 'apicurio',
      });

      const contentResponse = await fetch(contentUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      contentResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (contentResponse.ok) {
        const data = await contentResponse.json();
        testResults.push({
          success: true,
          message: "✅ Successfully fetched artifact content",
          details: `Status: ${contentResponse.status}\nSchema contains ${Object.keys(data).length} fields`,
          status: contentResponse.status,
          headers: responseHeaders,
          data: data,
          category: 'apicurio',
        });
      } else if (contentResponse.status === 404) {
        testResults.push({
          success: false,
          message: "❌ Artifact not found (404)",
          details: `Check the URL correctness and artifact availability in registry.\nURL: ${contentUrl}`,
          status: contentResponse.status,
          headers: responseHeaders,
          category: 'apicurio',
        });
      } else {
        testResults.push({
          success: false,
          message: "❌ Error fetching artifact content",
          details: `Status: ${contentResponse.status} ${contentResponse.statusText}`,
          status: contentResponse.status,
          headers: responseHeaders,
          category: 'apicurio',
        });
      }
    } catch (error: any) {
      testResults.push({
        success: false,
        message: "❌ CORS or network error when fetching content",
        details: error.message || String(error),
        category: 'apicurio',
      });
    }

    return testResults;
  };

  const testBFS = async () => {
    const testResults: TestResult[] = [];

    // Test 0: BFS API Configuration
    testResults.push({
      success: true,
      message: "BFS API Configuration",
      details: `Base URL: ${BFS_API}\nTest Endpoint: /txns?TxnType=ReasonCode`,
      category: 'info',
    });

    // Test 1: Try to fetch transactions with TxnType=ReasonCode
    try {
      const txnUrl = `${BFS_API}/txns?TxnType=ReasonCode`;
      testResults.push({
        success: true,
        message: "Attempting to fetch transactions (TxnType=ReasonCode)",
        url: txnUrl,
        category: 'bfs',
      });

      const txnResponse = await fetch(txnUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-BFS-Auth": "your-auth-token-here",
        },
      });

      // Get response headers
      const responseHeaders: Record<string, string> = {};
      txnResponse.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (txnResponse.ok) {
        const data = await txnResponse.json();
        const dataLength = Array.isArray(data) ? data.length : (data.transactions?.length || 0);
        testResults.push({
          success: true,
          message: "✅ Successfully fetched BFS transactions",
          details: `Status: ${txnResponse.status}\nTransactions count: ${dataLength}`,
          status: txnResponse.status,
          headers: responseHeaders,
          data: data,
          category: 'bfs',
        });
      } else if (txnResponse.status === 401) {
        testResults.push({
          success: false,
          message: "❌ Authentication required (401)",
          details: `BFS API requires X-BFS-Auth header with valid token.\nStatus: ${txnResponse.status} ${txnResponse.statusText}`,
          status: txnResponse.status,
          headers: responseHeaders,
          category: 'bfs',
        });
      } else {
        const errorText = await txnResponse.text();
        testResults.push({
          success: false,
          message: "❌ Error fetching BFS transactions",
          details: `Status: ${txnResponse.status} ${txnResponse.statusText}\nResponse: ${errorText}`,
          status: txnResponse.status,
          headers: responseHeaders,
          category: 'bfs',
        });
      }
    } catch (error: any) {
      testResults.push({
        success: false,
        message: "❌ CORS or network error when fetching BFS data",
        details: error.message || String(error),
        category: 'bfs',
      });
    }

    return testResults;
  };

  const runTests = async () => {
    setTesting(true);
    
    // Run both tests in parallel
    const [apicurioTestResults, bfsTestResults] = await Promise.all([
      testApicurio(),
      testBFS(),
    ]);

    setApicurioResults(apicurioTestResults);
    setBfsResults(bfsTestResults);
    setTesting(false);
  };

  const getCorsFixInstructions = (results: TestResult[]) => {
    const hasCorsError = results.some(r => 
      !r.success && r.details?.toLowerCase().includes("cors")
    );

    if (!hasCorsError) return null;

    return (
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>How to Fix CORS Error</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p className="font-semibold">For Azure Container Apps (Apicurio):</p>
          <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
            <p># 1. Set CORS in Apicurio configuration</p>
            <p>QUARKUS_HTTP_CORS=true</p>
            <p>QUARKUS_HTTP_CORS_ORIGINS=http://localhost:5173,https://yourdomain.com</p>
            <p>QUARKUS_HTTP_CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS</p>
            <p>QUARKUS_HTTP_CORS_HEADERS=*</p>
            <br/>
            <p># 2. OR configure CORS at Azure Container App level</p>
            <p>az containerapp ingress cors enable \</p>
            <p>  --name apicurio-poc \</p>
            <p>  --resource-group your-resource-group \</p>
            <p>  --allowed-origins "http://localhost:5173" "https://yourdomain.com" \</p>
            <p>  --allowed-methods GET POST PUT DELETE OPTIONS \</p>
            <p>  --allowed-headers "*"</p>
          </div>
          
          <p className="font-semibold mt-3">For Azure Web Apps (BFS API):</p>
          <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
            <p>az webapp cors add \</p>
            <p>  --name dp-eastus-poc-txservices-apis \</p>
            <p>  --resource-group your-resource-group \</p>
            <p>  --allowed-origins "http://localhost:5173" "https://yourdomain.com"</p>
          </div>
          
          <p className="font-semibold mt-3">Check settings in Azure Portal:</p>
          <ol className="list-decimal ml-5 space-y-1 text-sm">
            <li>Open Azure Portal → Container Apps / Web Apps</li>
            <li>Find your service</li>
            <li>Go to Settings → CORS</li>
            <li>Ensure CORS is enabled and correct origins are specified</li>
          </ol>
        </AlertDescription>
      </Alert>
    );
  };

  const renderResults = (results: TestResult[], title: string) => {
    if (results.length === 0) return null;

    const hasErrors = results.some(r => !r.success);

    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {results.map((result, index) => (
            <div 
              key={index}
              className={`border rounded-lg p-4 ${
                result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{result.message}</p>
                  
                  {result.url && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">URL</Badge>
                      <p className="text-xs font-mono mt-1 break-all text-blue-600">
                        {result.url}
                      </p>
                    </div>
                  )}
                  
                  {result.status && (
                    <div className="mt-2">
                      <Badge 
                        variant={result.status === 200 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        HTTP {result.status}
                      </Badge>
                    </div>
                  )}
                  
                  {result.details && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                      {result.details}
                    </pre>
                  )}
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800 font-semibold">
                        📄 Show response data
                      </summary>
                      <pre className="mt-2 text-xs bg-slate-900 text-slate-100 p-3 rounded border overflow-x-auto max-h-96">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  
                  {result.headers && Object.keys(result.headers).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-slate-600 hover:text-slate-900">
                        Show response headers ({Object.keys(result.headers).length})
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(result.headers, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {getCorsFixInstructions(results)}

        {!hasErrors && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-600">All tests passed successfully!</AlertTitle>
            <AlertDescription>
              {title} is configured correctly and accessible from the browser.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              API Connection Diagnostics
            </CardTitle>
            <CardDescription className="mt-2">
              Test availability and configuration of Apicurio Registry and BFS API
            </CardDescription>
          </div>
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="ml-4"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="apicurio" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apicurio" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Apicurio Registry
              {apicurioResults.length > 0 && (
                apicurioResults.some(r => !r.success) ? (
                  <Badge variant="destructive" className="ml-2">Issues</Badge>
                ) : (
                  <Badge variant="default" className="ml-2 bg-green-600">OK</Badge>
                )
              )}
            </TabsTrigger>
            <TabsTrigger value="bfs" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              BFS API
              {bfsResults.length > 0 && (
                bfsResults.some(r => !r.success) ? (
                  <Badge variant="destructive" className="ml-2">Issues</Badge>
                ) : (
                  <Badge variant="default" className="ml-2 bg-green-600">OK</Badge>
                )
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="apicurio" className="mt-4">
            <div className="bg-slate-50 p-3 rounded-lg border text-sm mb-4">
              <p className="font-semibold mb-2">Apicurio Configuration:</p>
              <div className="font-mono text-xs space-y-1">
                <p><span className="text-slate-600">Base URL:</span> {APICURIO_BASE}</p>
                <p><span className="text-slate-600">API Version:</span> v3</p>
                <p><span className="text-slate-600">Groups:</span> bfs.online, paradigm.bidtools</p>
              </div>
            </div>
            
            {apicurioResults.length > 0 ? (
              renderResults(apicurioResults, "Apicurio Registry")
            ) : (
              <div className="text-center text-slate-500 py-8">
                Click "Run All Tests" to start testing Apicurio Registry connection
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bfs" className="mt-4">
            <div className="bg-slate-50 p-3 rounded-lg border text-sm mb-4">
              <p className="font-semibold mb-2">BFS API Configuration:</p>
              <div className="font-mono text-xs space-y-1">
                <p><span className="text-slate-600">Base URL:</span> {BFS_API}</p>
                <p><span className="text-slate-600">Test Endpoint:</span> /txns?TxnType=ReasonCode</p>
                <p><span className="text-slate-600">Auth:</span> X-BFS-Auth header required</p>
              </div>
            </div>
            
            {bfsResults.length > 0 ? (
              renderResults(bfsResults, "BFS API")
            ) : (
              <div className="text-center text-slate-500 py-8">
                Click "Run All Tests" to start testing BFS API connection
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
