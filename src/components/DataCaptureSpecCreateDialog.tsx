import { useState, useEffect, useRef } from "react";
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
  getApicurioArtifact,
  processSchema,
  extractArtifactName,
  getArtifactDisplayName,
  getGroupDisplayName,
  ApicurioArtifact,
} from "../lib/apicurio";

interface DataCaptureSpecCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDataSource: DataSource | null;
  activeTenantId: string;
  onSuccess: () => void;
  apicurioArtifacts: ApicurioArtifact[];
  isLoadingArtifacts: boolean;
  onRefreshArtifacts: () => void;
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
  apicurioArtifacts,
  isLoadingArtifacts,
  onRefreshArtifacts,
}: DataCaptureSpecCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArtifact, setSelectedArtifact] =
    useState<string>("");
  const [templateSearchOpen, setTemplateSearchOpen] = useState(false);
  
  // Track previous isOpen value to detect opening transition
  const prevIsOpen = useRef(false);

  const [formData, setFormData] = useState({
    dataCaptureSpecName: "",
    containerName: "",
    tenantId: "",
    dataSourceId: "",
    isActive: true,
    version: 1,
    profile: "data-capture",
    sourcePrimaryKeyField: "",
    sourcePrimaryKeyFields: [] as string[], // Added for composite keys
    partitionKeyField: "",
    partitionKeyValue: "",
    allowedFilters: [] as string[], // Changed from allowedFiltersText to array
    requiredFields: [] as string[],
    containerSchemaText: "",
  });

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

      console.log("=".repeat(80));
      console.log("🚀 LOADING APICURIO TEMPLATE");
      console.log("=".repeat(80));
      console.log("📋 Artifact Info:");
      console.log("  - artifactId:", artifact.artifactId);
      console.log("  - groupId:", artifact.groupId);
      console.log("  - artifactType:", artifact.artifactType);
      console.log("  - version:", artifact.version);
      console.log("  - displayName:", displayName);
      console.log("-".repeat(80));

      // Fetch the schema from Apicurio
      const schema = await getApicurioArtifact(
        artifact.groupId,
        artifact.artifactId,
        artifact.version, // Pass version (e.g., "1.0.0" for CDC artifacts, undefined for others)
      );

      console.log("📥 Raw schema from Apicurio (first 1000 chars):");
      console.log(JSON.stringify(schema, null, 2).substring(0, 1000));
      console.log("-".repeat(80));

      // Process schema - handle both JSON Schema and AVRO formats
      const jsonSchema = processSchema(
        schema,
        artifact.artifactType,
      );

      console.log("🔄 Processed jsonSchema:");
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
          console.log("🔍 Extracting sourcePrimaryKeyField from schema...");
          
          // Navigate to metaData.sources.items.properties.sourcePrimaryKeyField
          const metaData =
            schema.properties?.Txn?.properties?.metaData ||
            schema.properties?.metaData;
          
          console.log("🔍 metaData found:", !!metaData);
          if (!metaData) return null;

          const sources = metaData.properties?.sources;
          console.log("🔍 sources found:", !!sources);
          if (!sources || !sources.items) return null;

          const sourcePrimaryKeyField =
            sources.items.properties?.sourcePrimaryKeyField;
          console.log("🔍 sourcePrimaryKeyField found:", !!sourcePrimaryKeyField);
          console.log("🔍 sourcePrimaryKeyField structure:", JSON.stringify(sourcePrimaryKeyField, null, 2));
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

      const extractSourcePrimaryKeyFields = (
        schema: any,
      ): string[] => {
        try {
          // Navigate to metaData.sources.items.properties.sourcePrimaryKeyFields
          const metaData =
            schema.properties?.Txn?.properties?.metaData ||
            schema.properties?.metaData;
          if (!metaData) return [];

          const sources = metaData.properties?.sources;
          if (!sources || !sources.items) return [];

          const sourcePrimaryKeyFields =
            sources.items.properties?.sourcePrimaryKeyFields;
          if (!sourcePrimaryKeyFields) return [];

          // Check if it has enum values
          if (sourcePrimaryKeyFields.items?.enum) {
            console.log(
              "✅ Found sourcePrimaryKeyFields.items.enum:",
              sourcePrimaryKeyFields.items.enum,
            );
            return sourcePrimaryKeyFields.items.enum;
          }

          return [];
        } catch (error) {
          console.error(
            "Error extracting sourcePrimaryKeyFields:",
            error,
          );
          return [];
        }
      };

      let extractedPrimaryKeyField =
        extractSourcePrimaryKeyField(jsonSchema);
      let extractedPrimaryKeyFields =
        extractSourcePrimaryKeyFields(jsonSchema);
      
      // ✅ IMPORTANT: Convert extracted primary key fields to camelCase (first letter lowercase)
      // Schemas may have PascalCase field names (e.g., QuoteComponentTypeId)
      // But Cosmos DB requires camelCase (e.g., quoteComponentTypeId)
      if (extractedPrimaryKeyField) {
        extractedPrimaryKeyField = 
          extractedPrimaryKeyField.charAt(0).toLowerCase() + 
          extractedPrimaryKeyField.slice(1);
      }
      
      if (extractedPrimaryKeyFields.length > 0) {
        extractedPrimaryKeyFields = extractedPrimaryKeyFields.map(field => 
          field.charAt(0).toLowerCase() + field.slice(1)
        );
      }
      
      console.log(
        "🔍 Extracted sourcePrimaryKeyField (camelCase):",
        extractedPrimaryKeyField,
      );
      console.log(
        "🔍 Extracted sourcePrimaryKeyFields (camelCase):",
        extractedPrimaryKeyFields,
      );

      // Extract name from artifact (e.g., "TxServices_QuoteComponentTypes" -> "QuoteComponentTypes")
      let specName = extractArtifactName(artifactId)
        .replace(/^TxServices_SQLServer_/, "")
        .replace(/^TxServices_Informix_/, "")
        .replace(/\\.response$/, "")
        .replace(/\\.request$/, "");

      console.log("🔧 Processing artifact name:");
      console.log("  - artifactId:", artifactId);
      console.log("  - groupId:", artifact.groupId);
      console.log("  - specName (after initial processing):", specName);

      // Detect template type by groupId
      const isBidTools = artifact.groupId === "paradigm.bidtools2";
      const isBfsOnline = artifact.groupId === "bfs.online";

      // For BidTools templates (paradigm.bidtools2 group), remove TxServices_ prefix
      if (isBidTools) {
        const beforeTrim = specName;
        specName = specName.replace(/^TxServices_/, "");
        console.log("  - BidTools detected - removing TxServices_ prefix");
        console.log("    Before:", beforeTrim);
        console.log("    After:", specName);
      }

      // Process names based on template type
      let specNameSingular: string;
      let containerName: string;

      if (isBfsOnline) {
        // BFS Online: specName is already processed (e.g., "inv", "stcode", "loc1")
        // Examples: 
        //   - inv.response → inv (Spec Name: inv, Container Name: invs)
        //   - TxServices_Informix_stcode.response → stcode (Spec Name: stcode, Container Name: stcodes)
        //   - loc1.response → loc1 (Spec Name: loc1, Container Name: loc1s)
        
        // Spec Name: use as-is (inv, stcode, loc1)
        specNameSingular = specName;
        
        // Container Name: add 's' to make plural (inv -> invs, stcode -> stcodes, loc1 -> loc1s)
        containerName = specName + "s";
        
        console.log("  - BFS Online detected - keeping spec name as-is, adding 's' for container");
      } else {
        // BidTools and other templates: assume plural in artifact name
        // Spec Name: singular form (QuoteComponentTypes -> QuoteComponentType)
        specNameSingular = specName;
        if (specNameSingular.endsWith("s")) {
          specNameSingular = specNameSingular.slice(0, -1);
        }

        // Container Name: keep plural form as-is from artifact (QuoteComponentTypes)
        containerName = specName;
        
        console.log("  - BidTools/Other template - converting to singular/plural");
      }

      console.log("📝 Final names:");
      console.log("  - Spec Name (singular):", specNameSingular);
      console.log("  - Container Name (plural):", containerName);

      // Generate Primary Key Field: QuoteComponentType -> quoteComponentTypeId (camelCase for Cosmos DB)
      // Convert first letter to lowercase for camelCase format
      const primaryKeyField =
        specNameSingular.charAt(0).toLowerCase() +
        specNameSingular.slice(1) +
        "Id";
      
      console.log("  - Primary Key Field:", primaryKeyField);

      // Get all property names for allowed filters
      // IMPORTANT: Property names from Apicurio come in PascalCase (e.g., QuoteDetailId, QuoteId)
      // We must preserve them exactly as they come from the schema for containerSchema properties
      let propertyNames: string[] = [];

      console.log("🔍 Extracting allowed filters...");
      console.log("🔍 jsonSchema.properties:", Object.keys(jsonSchema.properties || {}));
      console.log("🔍 jsonSchema.properties?.Txn exists:", !!jsonSchema.properties?.Txn);
      if (jsonSchema.properties?.Txn) {
        console.log("🔍 jsonSchema.properties.Txn.properties:", Object.keys(jsonSchema.properties.Txn.properties || {}));
      }

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

      // Filter out system fields to get allowed filters
      const systemFields = [
        "id",
        "partitionKey",
        "createTime",
        "updateTime",
        "metaData",
        "TxnType",
        "Txn",
      ];
      
      console.log("🔍 Property names before filtering:", propertyNames);
      console.log("🔍 System fields to filter out:", systemFields);
      
      const allowedFiltersArray = propertyNames.filter(
        (name) => !systemFields.includes(name)
      );

      console.log(
        "📦 Allowed filters (after filtering):",
        allowedFiltersArray,
      );
      console.log(
        "📦 Required fields from jsonSchema:",
        jsonSchema.required,
      );

      // Build proper containerSchema structure according to the correct template
      let schemaProperties: any = {};
      
      // Extract properties from schema (nested or flat)
      let extractedProperties: any = {};
      if (jsonSchema.properties?.Txn?.properties) {
        // Nested structure - use Txn.properties
        extractedProperties = { ...jsonSchema.properties.Txn.properties };
      } else if (jsonSchema.properties) {
        // Flat structure - use top-level properties
        extractedProperties = { ...jsonSchema.properties };
      }

      // Remove system fields from extracted properties
      delete extractedProperties.id;
      delete extractedProperties.partitionKey;
      delete extractedProperties.metaData;
      delete extractedProperties.createTime;
      delete extractedProperties.updateTime;
      delete extractedProperties.TxnType;
      delete extractedProperties.Txn;

      // Build required fields list: ONLY sourcePrimaryKeyField(s) in camelCase
      // Required Fields must always match sourcePrimaryKeyField (no "id" prefix)
      const requiredFieldsList: string[] = [];
      
      console.log("📝 Building required fields list:");
      console.log("  - extractedPrimaryKeyFields:", extractedPrimaryKeyFields);
      console.log("  - extractedPrimaryKeyField:", extractedPrimaryKeyField);
      console.log("  - primaryKeyField (generated):", primaryKeyField);
      
      if (extractedPrimaryKeyFields.length > 0) {
        // Composite key: use all fields from schema
        requiredFieldsList.push(...extractedPrimaryKeyFields);
        console.log("  ✅ Using composite keys from schema");
      } else if (extractedPrimaryKeyField) {
        // Single key from schema
        requiredFieldsList.push(extractedPrimaryKeyField);
        console.log("  ✅ Using single key from schema");
      } else if (primaryKeyField) {
        // No keys in schema at all - use generated primaryKeyField
        requiredFieldsList.push(primaryKeyField);
        console.log("  ✅ Using generated key (no keys in schema)");
      }

      console.log(
        "📦 Final required fields:",
        requiredFieldsList,
      );

      // Build containerSchema with proper structure and order
      const containerSchema = {
        schemaVersion: artifact.version || "1",
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Document ID. developer/integrator sets it from webapp. Source primary key value in case of one source or combination, also mapped to id if needed"
          },
          partitionKey: {
            type: "string",
            description: "container partition key. developer/integrator sets it from webapp. For data landing in common area empty"
          },
          ...extractedProperties, // Add extracted schema properties
          metaData: {
            type: "object",
            properties: {
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceDatabase: {
                      type: "string"
                    },
                    sourceTable: {
                      type: "string"
                    },
                    sourcePrimaryKeyField: {
                      type: "string"
                    },
                    sourcePrimaryKeyFields: {
                      type: "array",
                      items: {
                        type: "string"
                      }
                    },
                    sourceCreateTime: {
                      type: ["string", "null"],
                      format: "date-time"
                    },
                    sourceUpdateTime: {
                      type: ["string", "null"],
                      format: "date-time"
                    },
                    sourceEtag: {
                      type: ["string", "null"]
                    }
                  }
                }
              }
            }
          },
          createTime: {
            type: ["string", "null"],
            format: "date-time",
            description: "populated by txservices"
          },
          updateTime: {
            type: ["string", "null"],
            format: "date-time",
            description: "populated by txservices"
          }
        },
        required: requiredFieldsList,
        unevaluatedProperties: true
      };

      // Auto-populate form - CLEAR OLD DATA FIRST
      console.log("🎯 Setting formData from template:");
      console.log("  ├─ sourcePrimaryKeyField:", extractedPrimaryKeyFields.length > 0 ? null : (extractedPrimaryKeyField || primaryKeyField));
      console.log("  ├─ sourcePrimaryKeyFields:", extractedPrimaryKeyFields.length > 0 ? extractedPrimaryKeyFields : []);
      console.log("  └─ requiredFields:", requiredFieldsList);
      
      setFormData((prev) => ({
        ...prev,
        dataCaptureSpecName: specNameSingular,
        containerName: containerName,
        sourcePrimaryKeyField:
          extractedPrimaryKeyFields.length > 0 ? null : (extractedPrimaryKeyField || primaryKeyField),
        sourcePrimaryKeyFields: extractedPrimaryKeyFields.length > 0 ? extractedPrimaryKeyFields : [],
        partitionKeyField: "id",
        allowedFilters: allowedFiltersArray, // Use array directly instead of string split
        requiredFields: requiredFieldsList, // ONLY sourcePrimaryKeyField(s) in camelCase - always matches primary key
        containerSchemaText: JSON.stringify(
          containerSchema,
          null,
          2,
        ),
      }));

      toast.success(
        `Template \"${displayName}\" loaded successfully!`,
      );
    } catch (error: any) {
      console.error("Failed to load Apicurio template:", error);
      // Error will be shown to user - no fallback to mock data
      toast.error(`Failed to load template: ${error.message}`);
    }
  };

  // Pre-fill tenantId, dataSourceId, and load IRC template automatically
  // IMPORTANT: Only reset form when dialog is OPENING (transition from closed to open)
  // This prevents losing data when selectedDataSource or activeTenantId changes while dialog is open
  useEffect(() => {
    const isOpening = isOpen && !prevIsOpen.current;
    
    if (isOpening && selectedDataSource) {
      console.log("🔄 Dialog opening - initializing form", new Date().toISOString());
      
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
        sourcePrimaryKeyFields: [],
        partitionKeyField: "",
        partitionKeyValue: "",
        allowedFilters: [], // Empty by default - user should select from available fields
        requiredFields: [],
        containerSchemaText: "",
      }));
    }
    
    // Update ref for next render
    prevIsOpen.current = isOpen;
  }, [isOpen, selectedDataSource, activeTenantId]); // Safe to include all deps now

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
        sourcePrimaryKeyFields: [],
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

    // At least one of sourcePrimaryKeyField or sourcePrimaryKeyFields must be set
    if (!formData.sourcePrimaryKeyField && (!formData.sourcePrimaryKeyFields || formData.sourcePrimaryKeyFields.length === 0)) {
      toast.error("Source Primary Key Field or Source Primary Key Fields is required");
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
      console.log("📋 FormData before creating payload:");
      console.log("  sourcePrimaryKeyField:", formData.sourcePrimaryKeyField, `(type: ${typeof formData.sourcePrimaryKeyField})`);
      console.log("  sourcePrimaryKeyFields:", formData.sourcePrimaryKeyFields, `(isArray: ${Array.isArray(formData.sourcePrimaryKeyFields)}, length: ${formData.sourcePrimaryKeyFields?.length || 0})`);

      // ✅ Convert sourcePrimaryKeyField and sourcePrimaryKeyFields to camelCase
      const sourcePrimaryKeyFieldCamelCase = formData.sourcePrimaryKeyField 
        ? formData.sourcePrimaryKeyField.charAt(0).toLowerCase() + formData.sourcePrimaryKeyField.slice(1)
        : null;
      
      const sourcePrimaryKeyFieldsCamelCase = (formData.sourcePrimaryKeyFields && formData.sourcePrimaryKeyFields.length > 0)
        ? formData.sourcePrimaryKeyFields.map(field => 
            field.charAt(0).toLowerCase() + field.slice(1)
          )
        : null;

      console.log("🔄 Converting to camelCase:");
      console.log("  sourcePrimaryKeyField:", formData.sourcePrimaryKeyField, "→", sourcePrimaryKeyFieldCamelCase);
      console.log("  sourcePrimaryKeyFields:", formData.sourcePrimaryKeyFields, "→", sourcePrimaryKeyFieldsCamelCase);

      const payload = {
        dataCaptureSpecName: formData.dataCaptureSpecName,
        containerName: formData.containerName,
        tenantId: formData.tenantId,
        dataSourceId: formData.dataSourceId,
        isActive: formData.isActive,
        version: formData.version,
        profile: formData.profile,
        sourcePrimaryKeyField: sourcePrimaryKeyFieldCamelCase,
        sourcePrimaryKeyFields: sourcePrimaryKeyFieldsCamelCase,
        partitionKeyField: formData.partitionKeyField,
        partitionKeyValue: formData.partitionKeyValue,
        allowedFilters: allowedFiltersCamelCase,
        requiredFields: requiredFieldsCamelCase,
        containerSchema: containerSchema,
      };

      console.log("📤 Creating Data Capture Spec payload:", payload);
      console.log("  ├─ sourcePrimaryKeyField:", payload.sourcePrimaryKeyField, `(type: ${typeof payload.sourcePrimaryKeyField})`);
      console.log("  └─ sourcePrimaryKeyFields:", payload.sourcePrimaryKeyFields, `(type: ${typeof payload.sourcePrimaryKeyFields}, length: ${payload.sourcePrimaryKeyFields?.length || 0})`);

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

                              // Sort groups: paradigm.bidtools2 first, then bfs.online, then others
                              const groupOrder = ["paradigm.bidtools2", "bfs.online"];
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
                                  heading={getGroupDisplayName(groupId)}
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
                        onRefreshArtifacts();
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
                  {/* Source Primary Key Fields - Two columns */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Single Primary Key Field */}
                    <div className="space-y-1">
                      <Label
                        htmlFor="sourcePrimaryKeyField"
                        className="text-xs"
                      >
                        Source Primary Key Field
                      </Label>
                      <Input
                        id="sourcePrimaryKeyField"
                        value={formData.sourcePrimaryKeyField || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sourcePrimaryKeyField:
                              e.target.value || null,
                          })
                        }
                        placeholder="e.g., quoteComponentTypeId"
                        className="h-8 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Use camelCase (first letter lowercase)
                      </p>
                    </div>

                    {/* Composite Primary Key Fields */}
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Source Primary Key Fields (Composite)
                      </Label>
                      <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[32px] bg-white">
                        {(formData.sourcePrimaryKeyFields || []).map((field, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs h-5 px-2"
                          >
                            {field}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  sourcePrimaryKeyFields:
                                    (formData.sourcePrimaryKeyFields || []).filter(
                                      (_, i) => i !== idx,
                                    ),
                                })
                              }
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                        {(!formData.sourcePrimaryKeyFields || formData.sourcePrimaryKeyFields.length === 0) && (
                          <span className="text-xs text-muted-foreground">
                            
                          </span>
                        )}
                      </div>
                      
                    </div>
                  </div>

                  {/* Partition Field + Partition Value in 2 columns */}
                  <div className="grid grid-cols-2 gap-2.5">
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