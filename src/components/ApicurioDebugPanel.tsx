import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { 
  searchApicurioArtifacts, 
  clearArtifactsCache, 
  type ApicurioArtifact 
} from "../lib/apicurio";
import { RefreshCw, Download, Eye } from "lucide-react";

export function ApicurioDebugPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [artifacts, setArtifacts] = useState<ApicurioArtifact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const loadArtifacts = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      // Clear cache first to force fresh load
      clearArtifactsCache();
      
      const result = await searchApicurioArtifacts();
      setArtifacts(result.artifacts);
      
      const endTime = Date.now();
      setLoadTime(endTime - startTime);
      
      console.log("🔍 Apicurio Debug - Loaded artifacts:", result.artifacts);
    } catch (error) {
      console.error("❌ Error loading artifacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    const dataStr = JSON.stringify(artifacts, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `apicurio-artifacts-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const groupedArtifacts = artifacts.reduce((acc, artifact) => {
    const group = artifact.groupId;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(artifact);
    return acc;
  }, {} as Record<string, ApicurioArtifact[]>);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          <Eye className="h-4 w-4 mr-2" />
          Apicurio Debug
        </Button>
      )}

      {isOpen && (
        <Card className="w-[800px] max-h-[600px] overflow-auto p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Apicurio Registry Debug Panel</h3>
            <div className="flex gap-2">
              <Button
                onClick={loadArtifacts}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
              {artifacts.length > 0 && (
                <Button
                  onClick={downloadJson}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              )}
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
          </div>

          {loadTime !== null && (
            <div className="mb-4 text-sm text-muted-foreground">
              ⏱️ Loaded in {loadTime}ms | Total: {artifacts.length} artifacts
            </div>
          )}

          {artifacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Click "Refresh" to load artifacts from Apicurio Registry</p>
              <p className="text-xs mt-2">
                URL: https://apicurio-poc.proudpond-b12a57e6.eastus.azurecontainerapps.io
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedArtifacts).map(([groupId, groupArtifacts]) => (
                <div key={groupId}>
                  <h4 className="font-semibold mb-3 text-sm">
                    📦 {groupId} ({groupArtifacts.length} artifacts)
                  </h4>
                  <div className="space-y-2">
                    {groupArtifacts.map((artifact, index) => (
                      <div
                        key={artifact.artifactId}
                        className="border rounded-lg p-3 text-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">
                              {index + 1}. {artifact.name || artifact.artifactId}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>
                                <span className="font-medium">ID:</span> {artifact.artifactId}
                              </div>
                              {artifact.description && (
                                <div>
                                  <span className="font-medium">Description:</span>{" "}
                                  {artifact.description}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Type:</span>{" "}
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                                  artifact.artifactType === "AVRO" 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-green-100 text-green-800"
                                }`}>
                                  {artifact.artifactType}
                                </span>
                              </div>
                              {artifact.version && (
                                <div>
                                  <span className="font-medium">Version:</span> {artifact.version}
                                </div>
                              )}
                              {artifact.createdOn && (
                                <div>
                                  <span className="font-medium">Created:</span>{" "}
                                  {new Date(artifact.createdOn).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
            <p>💡 Tip: Open browser console (F12) to see detailed API logs</p>
            <p className="mt-1">
              📋 Look for logs starting with "📦 Artifacts from [group]:" to see what was loaded
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
