// FULLY DYNAMIC GUIDEWIRE PAYLOAD - Replace hardcoded logic

const buildDynamicGuidwirePayload = (entitiesBySection, modifiedValues) => {
  const payload = {};
  
  // Process each section and entity dynamically
  Object.entries(entitiesBySection).forEach(([sectionName, entities]) => {
    entities.forEach((entity, index) => {
      const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
      
      // Use modified value if exists, otherwise use extracted value
      const finalValue = modifiedValues[entityKey] || entity.entity_value;
      
      // Map entity type to Guidewire field name
      const entityType = entity.entity_type.toLowerCase().replace(/\s+/g, '_');
      
      // Dynamic field mapping
      let guidewireField = entityType;
      if (entityType.includes('claim') && entityType.includes('number')) {
        guidewireField = 'ClaimNumber';
      }
      
      // Only add if value exists
      if (finalValue && finalValue.trim()) {
        payload[guidewireField] = finalValue;
        console.log(`✅ ${guidewireField}: ${finalValue} ${modifiedValues[entityKey] ? '(MODIFIED)' : '(EXTRACTED)'}`);
      }
    });
  });
  
  return payload;
};

// EXAMPLE:
// Extracted entities from document processing
const extractedEntities = {
  "CLAIM DETAILS": [
    { entity_type: "claim_number", entity_value: "CL999888" },
    { entity_type: "employee_name", entity_value: "John Smith" }
  ],
  "EMPLOYEE INFO": [
    { entity_type: "date_of_birth", entity_value: "01/01/1990" }
  ]
};

// User modifications
const userChanges = {
  "CLAIM_DETAILS_1": "Hardy Wilson",  // Changed name
  "EMPLOYEE_INFO_0": "01/15/1985"     // Changed birth date
};

// Result - 100% dynamic
const dynamicPayload = buildDynamicGuidwirePayload(extractedEntities, userChanges);

console.log('DYNAMIC PAYLOAD:', dynamicPayload);
// Output:
// {
//   "ClaimNumber": "CL999888",        // From extraction
//   "employee_name": "Hardy Wilson",   // From user modification  
//   "date_of_birth": "01/15/1985"     // From user modification
// }
