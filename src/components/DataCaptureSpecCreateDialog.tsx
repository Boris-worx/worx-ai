import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Check,
  ChevronsUpDown,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { DataSource, createDataCaptureSpec } from "../lib/api";
import {
  searchApicurioArtifacts,
  getApicurioArtifact,
  processSchema,
  extractArtifactName,
  getArtifactDisplayName,
  clearArtifactsCache,
  ApicurioArtifact,
} from "../lib/apicurio";

interface DataCaptureSpecCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDataSource: DataSource | null;
  activeTenantId: string;
  onSuccess: () => void;
}

// Helper to get data source ID (handle both field name variations)
const getDataSourceId = (ds: DataSource) =>
  ds.DatasourceId || ds.DataSourceId || "";
const getDataSourceName = (ds: DataSource) =>
  ds.DatasourceName || ds.DataSourceName || "";

// Helper to convert PascalCase to camelCase
const toCamelCase = (str: string): string => {
  // Don't convert special fields that should stay as-is
  if (
    [
      "id",
      "partitionKey",
      "metaData",
      "createTime",
      "updateTime",
    ].includes(str)
  ) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.slice(1);
};

// Helper to convert all property names in schema to camelCase
const convertSchemaPropertiesToCamelCase = (
  schema: any,
): any => {
  if (!schema || typeof schema !== "object") return schema;

  if (
    schema.properties &&
    typeof schema.properties === "object"
  ) {
    const newProperties: any = {};
    const oldToNewMapping: Record<string, string> = {};

    // Convert property names to camelCase
    for (const [key, value] of Object.entries(
      schema.properties,
    )) {
      const newKey = toCamelCase(key);
      newProperties[newKey] = value;
      oldToNewMapping[key] = newKey;
    }

    // Update required fields to use camelCase names
    let newRequired = schema.required;
    if (Array.isArray(schema.required)) {
      newRequired = schema.required.map(
        (field: string) =>
          oldToNewMapping[field] || toCamelCase(field),
      );
    }

    return {
      ...schema,
      properties: newProperties,
      required: newRequired,
    };
  }

  return schema;
};

export function DataCaptureSpecCreateDialog({
  isOpen,
  onClose,
  selectedDataSource,
  activeTenantId,
  onSuccess,
}: DataCaptureSpecCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apicurioArtifacts, setApicurioArtifacts] = useState<
    ApicurioArtifact[]
  >([]);
  const [isLoadingArtifacts, setIsLoadingArtifacts] =
    useState(false);
  const [selectedArtifact, setSelectedArtifact] =
    useState<string>("");
  const [templateSearchOpen, setTemplateSearchOpen] = useState(false);

  const [formData, setFormData] = useState({
    dataCaptureSpecName: "",
    containerName: "",
    tenantId: "",
    dataSourceId: "",
    isActive: true,
    version: 1,
    profile: "data-capture",
    sourcePrimaryKeyField: "",
    partitionKeyField: "",
    partitionKeyValue: "",
    allowedFilters: [] as string[], // Changed from allowedFiltersText to array
    requiredFields: [] as string[],
    containerSchemaText: "",
  });

  // Load Apicurio artifacts when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadApicurioArtifacts();
    }
  }, [isOpen]);

  // Load available artifacts from Apicurio Registry
  const loadApicurioArtifacts = async () => {
    setIsLoadingArtifacts(true);
    try {
      const response = await searchApicurioArtifacts("Value");
      setApicurioArtifacts(response.artifacts);
      console.log(
        `✅ Loaded ${response.count} Apicurio artifacts`,
      );
      // Log each artifact for debugging
      response.artifacts.forEach((artifact, index) => {
        console.log(
          `  ${index + 1}. ${artifact.artifactId} (${artifact.artifactType})`,
        );
      });
    } catch (error) {
      console.error(
        "Failed to load Apicurio artifacts:",
        error,
      );
      // Don't show error toast - mock data will be used automatically on CORS error
      setApicurioArtifacts([]);
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  // Load selected Apicurio artifact and populate form
  const handleLoadApicurioTemplate = async (
    artifactId: string,
  ) => {
    if (!artifactId) return;

    try {
      const artifact = apicurioArtifacts.find(
        (a) => a.artifactId === artifactId,
      );
      if (!artifact) return;

      const displayName = getArtifactDisplayName(artifact);
      toast.info(`Loading template: ${displayName}...`);

      // Fetch the schema from Apicurio
      const schema = await getApicurioArtifact(
        artifact.groupId,
        artifact.artifactId,
        artifact.version, // Pass version (e.g., "1.0.0" for CDC artifacts, undefined for others)
      );

      // Process schema - handle both JSON Schema and AVRO formats
      const jsonSchema = processSchema(
        schema,
        artifact.artifactType,
      );

      console.log(
        "🔍 Full jsonSchema structure:",
        JSON.stringify(jsonSchema, null, 2),
      );
      console.log(
        "🔍 jsonSchema.properties:",
        jsonSchema.properties,
      );
      console.log(
        "🔍 jsonSchema.properties.Txn:",
        jsonSchema.properties?.Txn,
      );
      console.log(
        "🔍 jsonSchema.properties.Txn.properties:",
        jsonSchema.properties?.Txn?.properties,
      );

      // Extract sourcePrimaryKeyField from schema if it exists
      const extractSourcePrimaryKeyField = (
        schema: any,
      ): string | null => {
        try {
          // Navigate to metaData.sources.items.properties.sourcePrimaryKeyField
          const metaData =
            schema.properties?.Txn?.properties?.metaData ||
            schema.properties?.metaData;
          if (!metaData) return null;

          const sources = metaData.properties?.sources;
          if (!sources || !sources.items) return null;

          const sourcePrimaryKeyField =
            sources.items.properties?.sourcePrimaryKeyField;
          if (!sourcePrimaryKeyField) return null;

          // Check if it has a const value
          if (sourcePrimaryKeyField.const) {
            console.log(
              "✅ Found sourcePrimaryKeyField.const:",
              sourcePrimaryKeyField.const,
            );
            return sourcePrimaryKeyField.const;
          }

          return null;
        } catch (error) {
          console.error(
            "Error extracting sourcePrimaryKeyField:",
            error,
          );
          return null;
        }
      };

      const extractedPrimaryKeyField =
        extractSourcePrimaryKeyField(jsonSchema);
      console.log(
        "🔍 Extracted sourcePrimaryKeyField:",
        extractedPrimaryKeyField,
      );

      // Extract name for spec (e.g., "QuotePacks" -> "quotepack")
      let specName = extractArtifactName(artifactId)
        .replace(/^TxServices_SQLServer_/, "")
        .replace(/^TxServices_Informix_/, "")
        .replace(/\\.response$/, "")
        .replace(/\\.request$/, "");

      // Spec Name: singular form (QuotePacks -> QuotePack, ReasonCodes -> ReasonCode)
      let specNameSingular = specName;
      if (specNameSingular.endsWith("s")) {
        specNameSingular = specNameSingular.slice(0, -1);
      }

      // Container Name: plural form (QuotePack -> QuotePacks, ReasonCode -> ReasonCodes)
      // Add "s" to the end of singular spec name to create plural container name
      const containerName = specNameSingular + "s";

      // Generate Primary Key Field: WorkflowCustomer -> workflowCustomerId (camelCase for Cosmos DB)
      // Convert first letter to lowercase for camelCase format
      const primaryKeyField =
        specNameSingular.charAt(0).toLowerCase() +
        specNameSingular.slice(1) +
        "Id";

      // Get all property names for allowed filters
      // IMPORTANT: Property names from Apicurio come in PascalCase (e.g., QuoteDetailId, QuoteId)
      // We must preserve them exactly as they come from the schema for containerSchema properties
      let propertyNames: string[] = [];

      // Check if schema has nested structure (BFS Online schemas: TxnType + Txn.properties)
      if (jsonSchema.properties?.Txn?.properties) {
        // Nested structure - extract properties from Txn.properties
        propertyNames = Object.keys(
          jsonSchema.properties.Txn.properties || {},
        );
        console.log(
          "📦 Detected nested schema structure (BFS Online), extracting from Txn.properties:",
          propertyNames,
        );
      } else if (jsonSchema.properties) {
        // Flat structure - extract properties from top level
        propertyNames = Object.keys(
          jsonSchema.properties || {},
        );
        console.log(
          "📦 Flat schema structure, extracting from jsonSchema.properties:",
          propertyNames,
        );
      }

      const allowedFiltersArray = propertyNames.filter(
        (name) =>
          ![
            "id",
            "partitionKey",
            "createTime",
            "updateTime",
            "metaData",
            "TxnType",
            "Txn",
          ].includes(name),
      );

      console.log(
        "📦 Allowed filters (filtered):",
        allowedFiltersArray,
      );
      console.log(
        "📦 Required fields from jsonSchema:",
        jsonSchema.required,
      );

      // Auto-populate form - CLEAR OLD DATA FIRST
      setFormData((prev) => ({
        ...prev,
        dataCaptureSpecName: specNameSingular,
        containerName: containerName,
        sourcePrimaryKeyField:
          extractedPrimaryKeyField || primaryKeyField,
        partitionKeyField: "id",
        allowedFilters: allowedFiltersArray, // Use array directly instead of string split
        requiredFields: Array.isArray(jsonSchema.required)
          ? jsonSchema.required
          : ["id"],
        containerSchemaText: JSON.stringify(
          jsonSchema,
          null,
          2,
        ),
      }));

      toast.success(
        `Template \"${displayName}\" loaded successfully!`,
      );
    } catch (error: any) {
      console.error("Failed to load Apicurio template:", error);
      // Error is logged but user gets mock data automatically - no need to show error
      // The fallback logic in getApicurioArtifact will handle 403 and return mock schemas
    }
  };

  // Pre-fill tenantId, dataSourceId, and load IRC template automatically
  useEffect(() => {
    if (isOpen && selectedDataSource) {
      // IRC Template schema
      const ircContainerSchema = {
        schemaVersion: 1,
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "Document ID. developer/integrator sets it from webapp. Source primary key value in case of one source or combination, also mapped to id if needed",
          },
          partitionKey: {
            type: "string",
            description:
              "container partition key. developer/integrator sets it from webapp. For data landing in common area empty",
          },
          metaData: {
            type: "object",
            properties: {
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceDatabase: { type: "string" },
                    sourceTable: { type: "string" },
                    sourcePrimaryKeyField: { type: "string" },
                    sourceCreateTime: {
                      type: ["string", "null"],
                      format: "date-time",
                    },
                    sourceUpdateTime: {
                      type: ["string", "null"],
                      format: "date-time",
                    },
                    sourceEtag: { type: ["string", "null"] },
                  },
                },
              },
            },
          },
          createTime: {
            type: ["string", "null"],
            format: "date-time",
            description: "populated by txservices",
          },
          updateTime: {
            type: ["string", "null"],
            format: "date-time",
            description: "populated by txservices",
          },
        },
        required: ["id"],
        unevaluatedProperties: true,
      };

      setFormData((prev) => ({
        ...prev,
        tenantId: selectedDataSource.TenantId || activeTenantId,
        dataSourceId: getDataSourceId(selectedDataSource),
        dataCaptureSpecName: "",
        containerName: "",
        version: 1,
        isActive: true,
        profile: "data-capture",
        sourcePrimaryKeyField: "",
        partitionKeyField: "",
        partitionKeyValue: "",
        allowedFilters: [], // Empty by default - user should select from available fields
        requiredFields: [],
        containerSchemaText: "",
      }));
    }
  }, [isOpen, selectedDataSource, activeTenantId]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        dataCaptureSpecName: "",
        containerName: "",
        tenantId: "",
        dataSourceId: "",
        isActive: true,
        version: 1,
        profile: "data-capture",
        sourcePrimaryKeyField: "",
        partitionKeyField: "",
        partitionKeyValue: "",
        allowedFilters: [],
        requiredFields: [],
        containerSchemaText: "",
      });
      setSelectedArtifact("");
    }
  }, [isOpen]);

  // Extract available fields from schema for Required Fields checkboxes
  const extractAvailableFields = (): string[] => {
    if (!formData.containerSchemaText) return [];

    try {
      const schema = JSON.parse(formData.containerSchemaText);
      let fields: string[] = [];

      // JSON Schema format
      if (
        schema.properties &&
        typeof schema.properties === "object"
      ) {
        fields = Object.keys(schema.properties);
      }
      // AVRO format
      else if (Array.isArray(schema.fields)) {
        fields = schema.fields
          .filter((f: any) => f && f.name)
          .map((f: any) => f.name);
      }

      return fields;
    } catch (e) {
      console.error("Failed to parse schema:", e);
      return [];
    }
  };

  // Generate preview JSON payload
  const getPreviewPayload = () => {
    try {
      // Parse container schema
      let containerSchema;
      try {
        containerSchema = formData.containerSchemaText
          ? JSON.parse(formData.containerSchemaText)
          : {};
      } catch {
        containerSchema = "// Invalid JSON";
      }

      const payload = {
        dataCaptureSpecName: formData.dataCaptureSpecName || "",
        containerName: formData.containerName || "",
        tenantId: formData.tenantId || "",
        dataSourceId: formData.dataSourceId || "",
        isActive: formData.isActive,
        version: formData.version,
        profile: formData.profile,
        sourcePrimaryKeyField:
          formData.sourcePrimaryKeyField || "",
        partitionKeyField: formData.partitionKeyField || "",
        partitionKeyValue: formData.partitionKeyValue,
        allowedFilters: formData.allowedFilters,
        requiredFields: formData.requiredFields,
        containerSchema: containerSchema,
      };

      return JSON.stringify(payload, null, 2);
    } catch (e) {
      return "// Error generating preview";
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedDataSource) {
      toast.error("No data source selected");
      return;
    }

    // Validation
    if (!formData.dataCaptureSpecName.trim()) {
      toast.error(
        "Data Capture Specification Name is required",
      );
      return;
    }

    if (!formData.containerName.trim()) {
      toast.error("Container Name is required");
      return;
    }

    if (!formData.version || formData.version < 1) {
      toast.error("Version must be at least 1");
      return;
    }

    if (!formData.containerSchemaText.trim()) {
      toast.error("Container Schema is required");
      return;
    }

    if (formData.requiredFields.length === 0) {
      toast.error("Please select at least one Required Field");
      return;
    }

    if (!formData.sourcePrimaryKeyField.trim()) {
      toast.error("Source Primary Key Field is required");
      return;
    }

    if (!formData.partitionKeyField.trim()) {
      toast.error("Partition Key Field is required");
      return;
    }

    // Parse container schema
    let containerSchema;
    try {
      containerSchema = JSON.parse(
        formData.containerSchemaText,
      );
    } catch (error) {
      toast.error("Invalid JSON in Container Schema");
      return;
    }

    // Convert property names to camelCase
    containerSchema =
      convertSchemaPropertiesToCamelCase(containerSchema);

    // Convert allowedFilters and requiredFields to camelCase
    const allowedFiltersCamelCase =
      formData.allowedFilters.map(toCamelCase);
    const requiredFieldsCamelCase =
      formData.requiredFields.map(toCamelCase);

    console.log("📦 Converting to camelCase:");
    console.log(
      "  allowedFilters:",
      formData.allowedFilters,
      "→",
      allowedFiltersCamelCase,
    );
    console.log(
      "  requiredFields:",
      formData.requiredFields,
      "→",
      requiredFieldsCamelCase,
    );

    setIsSubmitting(true);
    try {
      const payload = {
        dataCaptureSpecName: formData.dataCaptureSpecName,
        containerName: formData.containerName,
        tenantId: formData.tenantId,
        dataSourceId: formData.dataSourceId,
        isActive: formData.isActive,
        version: formData.version,
        profile: formData.profile,
        sourcePrimaryKeyField: formData.sourcePrimaryKeyField,
        partitionKeyField: formData.partitionKeyField,
        partitionKeyValue: formData.partitionKeyValue,
        allowedFilters: allowedFiltersCamelCase,
        requiredFields: requiredFieldsCamelCase,
        containerSchema: containerSchema,
      };

      console.log("Creating Data Capture Spec:", payload);

      await createDataCaptureSpec(payload);

      toast.success(
        `Data Capture Specification "${formData.dataCaptureSpecName}" created successfully!`,
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to create spec:", error);

      // Check if this is a conflict error (spec already exists)
      if (error.isConflict) {
        // Show info notification instead of error
        toast.info(
          `Data Capture Specification "${formData.dataCaptureSpecName}" already exists in the database.`,
          { duration: 5000 },
        );
        onClose(); // Close dialog since spec exists
        return;
      }

      const errorMessage =
        error.message ||
        "Failed to create data capture specification";
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableFields = extractAvailableFields();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Create Data Capture Specification
          </DialogTitle>
          <DialogDescription>
            Define how data from{" "}
            {selectedDataSource
              ? getDataSourceName(selectedDataSource)
              : "data source"}{" "}
            should be captured into Cosmos DB.
          </DialogDescription>
        </DialogHeader>

        {/* Single column layout */}
        <div className="overflow-y-auto h-auto max-h-[60vh]">
          <div className="space-y-3 pb-4 pr-2">
            {/* Accordion for form sections */}
            <Accordion
              type="multiple"
              defaultValue={["basic", "keys", "required"]}
              className="w-full space-y-3"
            >
              {/* Basic Information */}
              <AccordionItem
                value="basic"
                className="bg-white rounded-[10px] border px-4 py-0"
              >
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  Basic Information
                </AccordionTrigger>
                <AccordionContent className="space-y-2.5 pt-2 pb-2">
                  {/* Apicurio Template Selector with Refresh button */}
                  <div className="flex gap-2">
                    <Popover open={templateSearchOpen} onOpenChange={setTemplateSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={templateSearchOpen}
                          className="h-8 text-xs justify-between flex-1"
                          disabled={isLoadingArtifacts}
                        >
                          {selectedArtifact
                            ? (() => {
                                const artifact = apicurioArtifacts.find(
                                  (a) => a.artifactId === selectedArtifact
                                );
                                return artifact
                                  ? getArtifactDisplayName(artifact)
                                  : "Select template...";
                              })()
                            : isLoadingArtifacts
                              ? "Loading templates..."
                              : "Select a Apicurio Template"}
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[600px] p-0" align="start">
                        <Command className="h-auto" shouldFilter={false}>
                          <CommandInput placeholder="Search templates..." className="h-8 text-xs" />
                          <CommandList className="max-h-none overflow-visible">
                            <div className="max-h-[300px] overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
                              <CommandEmpty>No templates found.</CommandEmpty>
                              {(() => {
                              // Group artifacts by groupId
                              const grouped = apicurioArtifacts.reduce(
                                (acc, artifact) => {
                                  const group = artifact.groupId || "other";
                                  if (!acc[group]) acc[group] = [];
                                  acc[group].push(artifact);
                                  return acc;
                                },
                                {} as Record<string, typeof apicurioArtifacts>,
                              );

                              // Sort groups: paradigm.bidtools first, then bfs.online, then others
                              const groupOrder = ["paradigm.bidtools", "bfs.online"];
                              const sortedGroups = Object.keys(grouped).sort((a, b) => {
                                const indexA = groupOrder.indexOf(a);
                                const indexB = groupOrder.indexOf(b);
                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                if (indexA !== -1) return -1;
                                if (indexB !== -1) return 1;
                                return a.localeCompare(b);
                              });

                              return sortedGroups.map((groupId) => (
                                <CommandGroup
                                  key={groupId}
                                  heading={
                                    groupId === "paradigm.bidtools"
                                      ? "Bid Tools Templates"
                                      : groupId === "bfs.online"
                                        ? "BFS Online Templates"
                                        : groupId
                                  }
                                >
                                  {grouped[groupId]
                                    .slice()
                                    .sort((a, b) => {
                                      const nameA = getArtifactDisplayName(a).toLowerCase();
                                      const nameB = getArtifactDisplayName(b).toLowerCase();
                                      return nameA.localeCompare(nameB);
                                    })
                                    .map((artifact) => (
                                      <CommandItem
                                        key={artifact.artifactId}
                                        value={getArtifactDisplayName(artifact)}
                                        onSelect={() => {
                                          setSelectedArtifact(artifact.artifactId);
                                          handleLoadApicurioTemplate(artifact.artifactId);
                                          setTemplateSearchOpen(false);
                                        }}
                                        className="text-xs pl-2"
                                      >
                                        {getArtifactDisplayName(artifact)}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              ));
                            })()}
                            </div>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() => {
                        clearArtifactsCache();
                        loadApicurioArtifacts();
                        toast.info(
                          "Refreshing templates from Apicurio Registry...",
                        );
                      }}
                      disabled={isLoadingArtifacts}
                      title="Refresh templates from Apicurio Registry"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Separator className="my-2" />

                  {/* Tenant ID + Data Source ID */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label
                        htmlFor="tenantId"
                        className="text-xs"
                      >
                        Tenant ID *
                      </Label>
                      <Input
                        id="tenantId"
                        value={formData.tenantId}
                        disabled
                        className="bg-muted h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="dataSourceId"
                        className="text-xs"
                      >
                        Data Source ID *
                      </Label>
                      <Input
                        id="dataSourceId"
                        value={formData.dataSourceId}
                        disabled
                        className="bg-muted h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Specification Name + Container Name */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label
                        htmlFor="specName"
                        className="text-xs"
                      >
                        Spec Name *
                      </Label>
                      <Input
                        id="specName"
                        placeholder=""
                        value={formData.dataCaptureSpecName}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            dataCaptureSpecName: e.target.value,
                          });
                        }}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="containerName"
                        className="text-xs"
                      >
                        Container Name *
                      </Label>
                      <Input
                        id="containerName"
                        placeholder=""
                        value={formData.containerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            containerName: e.target.value,
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Key Fields Configuration */}
              <AccordionItem
                value="keys"
                className="bg-white rounded-[10px] border px-4 py-0"
              >
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  Key Fields Configuration
                </AccordionTrigger>
                <AccordionContent className="space-y-2.5 pt-2 pb-2">
                  {/* Source Primary Key Field + Partition Field + Partition Value in 3 columns */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label
                        htmlFor="sourcePrimaryKeyField"
                        className="text-xs"
                      >
                        Source Primary Key Field *
                      </Label>
                      <Input
                        id="sourcePrimaryKeyField"
                        placeholder=""
                        value={formData.sourcePrimaryKeyField}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sourcePrimaryKeyField:
                              e.target.value,
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="partitionKeyField"
                        className="text-xs"
                      >
                        Partition Key Field *
                      </Label>
                      <Input
                        id="partitionKeyField"
                        placeholder=""
                        value={formData.partitionKeyField}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partitionKeyField: e.target.value,
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="partitionKeyValue"
                        className="text-xs"
                      >
                        Partition Key Value
                      </Label>
                      <Input
                        id="partitionKeyValue"
                        placeholder="Optional"
                        value={formData.partitionKeyValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partitionKeyValue: e.target.value,
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Allowed Filters - Multi-Select Dropdown */}
                  {availableFields.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Allowed Filters *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full h-auto min-h-[32px] justify-between text-xs font-normal bg-white hover:bg-white"
                          >
                            <div className="flex flex-wrap gap-1 flex-1">
                              {formData.allowedFilters
                                .length === 0 ? (
                                <span className="text-muted-foreground">
                                  Select filters...
                                </span>
                              ) : (
                                <>
                                  {formData.allowedFilters
                                    .slice(0, 3)
                                    .map((filter) => (
                                      <Badge
                                        key={filter}
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        {filter}
                                      </Badge>
                                    ))}
                                  {formData.allowedFilters
                                    .length > 3 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      +
                                      {formData.allowedFilters
                                        .length - 3}{" "}
                                      more
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[400px] p-0"
                          align="start"
                        >
                          <Command>
                            <CommandInput
                              placeholder="Search filters..."
                              className="h-8 text-xs"
                            />
                            <CommandList>
                              <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">
                                No filters found.
                              </CommandEmpty>
                              <CommandGroup>
                                {availableFields.map(
                                  (field) => {
                                    const isSelected =
                                      formData.allowedFilters.includes(
                                        field,
                                      );
                                    return (
                                      <CommandItem
                                        key={field}
                                        value={field}
                                        onSelect={() => {
                                          if (isSelected) {
                                            setFormData({
                                              ...formData,
                                              allowedFilters:
                                                formData.allowedFilters.filter(
                                                  (f) =>
                                                    f !== field,
                                                ),
                                            });
                                          } else {
                                            setFormData({
                                              ...formData,
                                              allowedFilters: [
                                                ...formData.allowedFilters,
                                                field,
                                              ],
                                            });
                                          }
                                        }}
                                        className="text-xs"
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                                                isSelected
                                                  ? "bg-primary border-primary"
                                                  : "border-input"
                                              }`}
                                            >
                                              {isSelected && (
                                                <Check className="h-3 w-3 text-primary-foreground" />
                                              )}
                                            </div>
                                            <span className="font-mono">
                                              {field}
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    );
                                  },
                                )}
                              </CommandGroup>
                            </CommandList>
                            <div className="border-t p-2 bg-muted/50">
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>
                                  {
                                    formData.allowedFilters
                                      .length
                                  }{" "}
                                  of {availableFields.length}{" "}
                                  selected
                                </span>
                                {formData.allowedFilters
                                  .length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData({
                                        ...formData,
                                        allowedFilters: [],
                                      });
                                    }}
                                  >
                                    Clear all
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Required Fields */}
              {availableFields.length > 0 && (
                <AccordionItem
                  value="required"
                  className="bg-white rounded-[10px] border px-4 py-0"
                >
                  <AccordionTrigger className="text-sm py-2 hover:no-underline">
                    Required Fields (
                    {formData.requiredFields.length} selected)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-2 pb-2">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Required Fields *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full h-auto min-h-[32px] justify-between text-xs font-normal bg-white hover:bg-white"
                          >
                            <div className="flex flex-wrap gap-1 flex-1">
                              {formData.requiredFields
                                .length === 0 ? (
                                <span className="text-muted-foreground">
                                  Select required fields...
                                </span>
                              ) : (
                                <>
                                  {formData.requiredFields
                                    .slice(0, 3)
                                    .map((field) => (
                                      <Badge
                                        key={field}
                                        variant="secondary"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        {field}
                                      </Badge>
                                    ))}
                                  {formData.requiredFields
                                    .length > 3 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      +
                                      {formData.requiredFields
                                        .length - 3}{" "}
                                      more
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[400px] p-0"
                          align="start"
                        >
                          <Command>
                            <CommandInput
                              placeholder="Search required fields..."
                              className="h-8 text-xs"
                            />
                            <CommandList>
                              <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">
                                No fields found.
                              </CommandEmpty>
                              <CommandGroup>
                                {availableFields.map(
                                  (field) => {
                                    const isSelected =
                                      formData.requiredFields.includes(
                                        field,
                                      );
                                    return (
                                      <CommandItem
                                        key={field}
                                        value={field}
                                        onSelect={() => {
                                          if (isSelected) {
                                            setFormData({
                                              ...formData,
                                              requiredFields:
                                                formData.requiredFields.filter(
                                                  (f) =>
                                                    f !== field,
                                                ),
                                            });
                                          } else {
                                            setFormData({
                                              ...formData,
                                              requiredFields: [
                                                ...formData.requiredFields,
                                                field,
                                              ],
                                            });
                                          }
                                        }}
                                        className="text-xs"
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                                                isSelected
                                                  ? "bg-primary border-primary"
                                                  : "border-input"
                                              }`}
                                            >
                                              {isSelected && (
                                                <Check className="h-3 w-3 text-primary-foreground" />
                                              )}
                                            </div>
                                            <span className="font-mono">
                                              {field}
                                            </span>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    );
                                  },
                                )}
                              </CommandGroup>
                            </CommandList>
                            <div className="border-t p-2 bg-muted/50">
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>
                                  {
                                    formData.requiredFields
                                      .length
                                  }{" "}
                                  of {availableFields.length}{" "}
                                  selected
                                </span>
                                {formData.requiredFields
                                  .length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData({
                                        ...formData,
                                        requiredFields: [],
                                      });
                                    }}
                                  >
                                    Clear all
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Additional Fields - Collapsed by default */}
              <AccordionItem
                value="additional"
                className="bg-white rounded-[10px] border px-4 py-0"
              >
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full p-[0px]">
                    <span>Additional Fields</span>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                    >
                      Optional
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2.5 pt-2 pb-2">
                  {/* Version + Profile + Is Active in 3 columns */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label
                        htmlFor="version"
                        className="text-xs"
                      >
                        Version *
                      </Label>
                      <Input
                        id="version"
                        type="number"
                        min="1"
                        value={formData.version}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            version:
                              parseInt(e.target.value) || 1,
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="profile"
                        className="text-xs"
                      >
                        Profile *
                      </Label>
                      <Input
                        id="profile"
                        value={formData.profile}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            profile: e.target.value,
                          })
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="isActive"
                        className="text-xs"
                      >
                        Is Active
                      </Label>
                      <div className="flex items-center space-x-2 h-8">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              isActive: checked,
                            })
                          }
                        />
                        <Label
                          htmlFor="isActive"
                          className="text-xs cursor-pointer"
                        >
                          {formData.isActive
                            ? "Active"
                            : "Inactive"}
                        </Label>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Container Schema - Collapsed by default */}
              <AccordionItem
                value="schema"
                className="bg-white rounded-[10px] border px-4 py-0"
              >
                <AccordionTrigger className="text-sm py-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full p-[0px]">
                    <span>Container Schema (JSON)</span>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                    >
                      JSON Schema
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2 pb-2">
                  <div className="border rounded-md overflow-hidden">
                    <textarea
                      className="w-full h-[300px] font-mono text-[11px] p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-muted/20"
                      value={formData.containerSchemaText}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          containerSchemaText: e.target.value,
                        })
                      }
                      placeholder="Load IRC template or Apicurio schema, or paste JSON schema here..."
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <DialogFooter className="mt-4 flex w-full items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating..."
              : "Create Specification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}