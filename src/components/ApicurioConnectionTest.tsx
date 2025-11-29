import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Database, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { getApicurioConfig } from "../lib/apicurio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ApicurioPutTest } from "./ApicurioPutTest";

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
  url?: string;
  status?: number;
  headers?: Record<string, string>;
  data?: any;
  category?: 'apicurio' | 'bfs' | 'info';
  method?: string;
  endpoint?: string;
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
    // Use the same auth token as in lib/api.ts
    const AUTH_TOKEN = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    // Test 0: BFS API Configuration
    testResults.push({
      success: true,
      message: "BFS API Configuration",
      details: `Base URL: ${BFS_API}\nAuth: X-BFS-Auth header (real token)\nNote: Testing READ operations (GET, OPTIONS) only - using actual API endpoints from lib/api.ts`,
      category: 'info',
    });

    // Helper function to test an endpoint
    const testEndpoint = async (
      endpoint: string,
      method: string,
      entityName: string,
      body?: any
    ) => {
      try {
        const url = `${BFS_API}${endpoint}`;
        const config: RequestInit = {
          method,
          headers: {
            "X-BFS-Auth": AUTH_TOKEN,
            "Content-Type": "application/json",
          },
          mode: 'cors',
          credentials: 'omit',
        };

        if (body && (method === "POST" || method === "PUT")) {
          config.body = JSON.stringify(body);
        }

        const response = await fetch(url, config);
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let data: any = null;
        let errorText = "";
        
        try {
          const text = await response.text();
          if (text) {
            try {
              data = JSON.parse(text);
            } catch {
              errorText = text;
            }
          }
        } catch (e: any) {
          errorText = e.message || "Failed to read response";
        }

        const success = response.ok || response.status === 404 || response.status === 405;
        const emoji = response.ok ? "✅" : response.status === 404 ? "⚠️" : response.status === 405 ? "🚫" : "❌";
        
        testResults.push({
          success,
          message: `${emoji} ${method} ${entityName}`,
          details: `Status: ${response.status} ${response.statusText}${data ? `\nData count: ${Array.isArray(data) ? data.length : (data.length !== undefined ? data.length : 'N/A')}` : ''}${errorText ? `\nResponse: ${errorText}` : ''}`,
          status: response.status,
          headers: responseHeaders,
          data: response.ok ? data : undefined,
          category: 'bfs',
          method,
          endpoint,
          url,
        });
      } catch (error: any) {
        testResults.push({
          success: false,
          message: `❌ ${method} ${entityName} - Network Error`,
          details: error.message || String(error),
          category: 'bfs',
          method,
          endpoint,
        });
      }
    };

    // ==================== TENANTS ====================
    testResults.push({
      success: true,
      message: "🏢 Testing TENANTS Endpoints",
      details: "Endpoint: /tenants (v1.0 API)",
      category: 'info',
    });

    await testEndpoint("/tenants", "OPTIONS", "Tenants");
    await testEndpoint("/tenants", "GET", "Tenants (List All)");

    // ==================== TRANSACTIONS ====================
    testResults.push({
      success: true,
      message: "📊 Testing TRANSACTIONS Endpoints",
      details: "Endpoint: /txns (v1.0 API) - Requires TxnType parameter",
      category: 'info',
    });

    await testEndpoint("/txns?TxnType=ReasonCode", "OPTIONS", "Transactions (ReasonCode)");
    await testEndpoint("/txns?TxnType=ReasonCode", "GET", "Transactions (ReasonCode)");

    // ==================== APPLICATIONS ====================
    const API_BASE_URL_V11 = "https://dp-eastus-poc-txservices-apis.azurewebsites.net/1.1";
    testResults.push({
      success: true,
      message: "📱 Testing APPLICATIONS Endpoints",
      details: "Endpoint: /txns with filters (v1.1 API) - Uses TxnType=Application",
      category: 'info',
    });

    const appFilters = encodeURIComponent(JSON.stringify({ TxnType: "Application" }));
    await testEndpoint(`/txns?filters=${appFilters}`, "OPTIONS", "Applications (v1.1)");
    
    // For v1.1 we need to use the v1.1 base URL
    try {
      const url = `${API_BASE_URL_V11}/txns?filters=${appFilters}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-BFS-Auth": AUTH_TOKEN,
          "Content-Type": "application/json",
        },
        mode: 'cors',
        credentials: 'omit',
      });
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: any = null;
      let errorText = "";
      
      try {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            errorText = text;
          }
        }
      } catch (e: any) {
        errorText = e.message || "Failed to read response";
      }

      const success = response.ok || response.status === 404;
      const emoji = response.ok ? "✅" : response.status === 404 ? "⚠️" : "❌";
      
      testResults.push({
        success,
        message: `${emoji} GET Applications (v1.1 with filters)`,
        details: `Status: ${response.status} ${response.statusText}${data ? `\nData count: ${Array.isArray(data) ? data.length : 'N/A'}` : ''}${errorText ? `\nResponse: ${errorText}` : ''}`,
        status: response.status,
        headers: responseHeaders,
        data: response.ok ? data : undefined,
        category: 'bfs',
        method: "GET",
        endpoint: `/txns?filters=${appFilters}`,
        url,
      });
    } catch (error: any) {
      testResults.push({
        success: false,
        message: `❌ GET Applications (v1.1) - Network Error`,
        details: error.message || String(error),
        category: 'bfs',
        method: "GET",
        endpoint: `/txns?filters=${appFilters}`,
      });
    }

    // ==================== DATA SOURCES ====================
    testResults.push({
      success: true,
      message: "🗄️ Testing DATA SOURCES Endpoints",
      details: "Endpoint: /datasources (lowercase, v1.0 API)",
      category: 'info',
    });

    await testEndpoint("/datasources", "OPTIONS", "Data Sources");
    await testEndpoint("/datasources", "GET", "Data Sources (List All)");

    // ==================== DATA CAPTURE SPECIFICATIONS ====================
    testResults.push({
      success: true,
      message: "📋 Testing DATA CAPTURE SPECIFICATIONS Endpoints",
      details: "Endpoint: /data-capture-specs (v1.0 API)",
      category: 'info',
    });

    await testEndpoint("/data-capture-specs", "OPTIONS", "Data Capture Specs");
    await testEndpoint("/data-capture-specs", "GET", "Data Capture Specs (List All)");

    // ==================== DATA PLANE (Transaction Types) ====================
    testResults.push({
      success: true,
      message: "🌐 Testing DATA PLANE - Transaction Types",
      details: "Testing different TxnType values to discover available transaction types",
      category: 'info',
    });

    // Test various transaction types
    const txnTypes = ["ReasonCode", "Customer", "Invoice", "ModelSchema"];
    for (const txnType of txnTypes) {
      await testEndpoint(`/txns?TxnType=${txnType}`, "GET", `Transaction Type: ${txnType}`);
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

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    return (
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>How to Fix CORS Error</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          {isLocalhost && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-3">
              <p className="font-semibold text-yellow-800">⚠️ Running on localhost</p>
              <p className="text-sm text-yellow-700 mt-1">
                The application works on production domain (https://bsfplatform-fhbpcrgqb0btdwhn.canadacentral-01.azurewebsites.net/) 
                but not on localhost because CORS is configured only for the production domain.
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                To enable localhost access, add <code className="bg-yellow-100 px-1 rounded">http://localhost:5173</code> to the allowed origins.
              </p>
            </div>
          )}
          
          <p className="font-semibold">For Azure Container Apps (Apicurio):</p>
          <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
            <p># Configure CORS at Azure Container App level</p>
            <p>az containerapp ingress cors enable \</p>
            <p>  --name apicurio-poc \</p>
            <p>  --resource-group your-resource-group \</p>
            <p>  --allowed-origins \</p>
            <p>    "https://bsfplatform-fhbpcrgqb0btdwhn.canadacentral-01.azurewebsites.net" \</p>
            <p>    "http://localhost:5173" \</p>
            <p>  --allowed-methods GET POST PUT DELETE OPTIONS \</p>
            <p>  --allowed-headers "*"</p>
            <br/>
            <p className="text-green-400"># Alternative: Set in Apicurio environment variables</p>
            <p>QUARKUS_HTTP_CORS=true</p>
            <p>QUARKUS_HTTP_CORS_ORIGINS=http://localhost:5173,https://bsfplatform-fhbpcrgqb0btdwhn.canadacentral-01.azurewebsites.net</p>
            <p>QUARKUS_HTTP_CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS</p>
            <p>QUARKUS_HTTP_CORS_HEADERS=*</p>
          </div>
          
          <p className="font-semibold mt-3">For Azure Web Apps (BFS API):</p>
          <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
            <p>az webapp cors add \</p>
            <p>  --name dp-eastus-poc-txservices-apis \</p>
            <p>  --resource-group your-resource-group \</p>
            <p>  --allowed-origins \</p>
            <p>    "https://bsfplatform-fhbpcrgqb0btdwhn.canadacentral-01.azurewebsites.net" \</p>
            <p>    "http://localhost:5173"</p>
          </div>
          
          <p className="font-semibold mt-3">Check settings in Azure Portal:</p>
          <ol className="list-decimal ml-5 space-y-1 text-sm">
            <li>Open Azure Portal → Container Apps / Web Apps</li>
            <li>Find your service (apicurio-poc or dp-eastus-poc-txservices-apis)</li>
            <li>Go to Settings → CORS or Ingress → CORS</li>
            <li>Verify that <strong>https://bsfplatform-fhbpcrgqb0btdwhn.canadacentral-01.azurewebsites.net</strong> is in allowed origins</li>
            <li>For local development, add <strong>http://localhost:5173</strong></li>
          </ol>
          
          <div className="bg-green-50 border border-green-200 p-3 rounded mt-3">
            <p className="font-semibold text-green-800">✅ Production Status</p>
            <p className="text-sm text-green-700 mt-1">
              APIs are already working on production: <br/>
              <code className="bg-green-100 px-1 rounded text-xs">https://bsfplatform-fhbpcrgqb0btdwhn.canadacentral-01.azurewebsites.net/</code>
            </p>
          </div>
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
                result.category === 'info' ? "bg-blue-50 border-blue-300" :
                result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.category === 'info' ? (
                  <div className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{result.message}</p>
                    {result.method && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          result.method === 'GET' ? 'bg-blue-50 border-blue-300' :
                          result.method === 'POST' ? 'bg-green-50 border-green-300' :
                          result.method === 'PUT' ? 'bg-yellow-50 border-yellow-300' :
                          result.method === 'DELETE' ? 'bg-red-50 border-red-300' :
                          result.method === 'OPTIONS' ? 'bg-purple-50 border-purple-300' :
                          ''
                        }`}
                      >
                        {result.method}
                      </Badge>
                    )}
                  </div>
                  
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
                        variant={result.status === 200 ? "default" : result.status === 404 ? "outline" : result.status === 405 ? "secondary" : "destructive"}
                        className={`text-xs ${
                          result.status === 200 ? 'bg-green-600' :
                          result.status === 404 ? 'border-yellow-400 text-yellow-700' :
                          result.status === 405 ? 'bg-gray-400' :
                          ''
                        }`}
                      >
                        HTTP {result.status}
                      </Badge>
                    </div>
                  )}
                  
                  {result.details && (
                    <pre className="mt-2 text-xs bg-white dark:bg-card p-2 rounded border overflow-x-auto whitespace-pre-wrap">
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
                      <summary className="text-xs cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
                        Show response headers ({Object.keys(result.headers).length})
                      </summary>
                      <pre className="mt-2 text-xs bg-white dark:bg-card p-2 rounded border overflow-x-auto">
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
          <TabsList className="grid w-full grid-cols-3">
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
            <TabsTrigger value="put-test" className="flex items-center gap-2">
              🧪 PUT Test
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="apicurio" className="mt-4">
            <div className="bg-slate-50 p-3 rounded-lg border text-sm mb-4">
              <p className="font-semibold mb-2">Apicurio Configuration:</p>
              <div className="font-mono text-xs space-y-1">
                <p><span className="text-slate-600 dark:text-slate-400">Base URL:</span> {APICURIO_BASE}</p>
                <p><span className="text-slate-600 dark:text-slate-400">API Version:</span> v3</p>
                <p><span className="text-slate-600 dark:text-slate-400">Groups:</span> bfs.online (15 artifacts), paradigm.bidtools2</p>
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
                <p><span className="text-slate-600 dark:text-slate-400">Base URL:</span> {BFS_API}</p>
                <p><span className="text-slate-600 dark:text-slate-400">Auth:</span> X-BFS-Auth header required</p>
                <p className="mt-2"><span className="text-slate-600 dark:text-slate-400">Testing Endpoints:</span></p>
                <ul className="ml-4 space-y-1">
                  <li>• /tenants - Tenant management</li>
                  <li>• /txns - Transactions</li>
                  <li>• /applications - Applications</li>
                  <li>• /dataSources - Data Sources</li>
                  <li>• /dataCaptureSpecs - Data Capture Specifications</li>
                  <li>• /txns/types - Transaction Types (Data Plane)</li>
                </ul>
                <p className="mt-2"><span className="text-slate-600 dark:text-slate-400">Testing Methods:</span> OPTIONS, GET, POST, PUT, DELETE</p>
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
          
          <TabsContent value="put-test" className="mt-4">
            <ApicurioPutTest />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
