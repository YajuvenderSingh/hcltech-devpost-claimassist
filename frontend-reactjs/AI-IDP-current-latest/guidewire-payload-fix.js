// CORRECTED GUIDEWIRE PAYLOAD BUILDER

function buildGuidwirePayload(entitiesBySection, modifiedValues) {
  const payload = {};
  
  Object.entries(entitiesBySection).forEach(([sectionName, entities]) => {
    entities.forEach((entity, index) => {
      // Check for user modifications first
      const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
      const value = modifiedValues[entityKey] || entity.entity_value;
      
      // Map to Guidewire fields
      const fieldMap = {
        'claim_number': 'ClaimNumber',
        'employee_name': 'employee_name', 
        'employee_first_name': 'employee_first_name',
        'employee_last_name': 'employee_last_name',
        'date_of_birth': 'date_of_birth',
        'date_of_injury': 'date_of_injury',
        'nature_of_injury': 'nature_of_injury',
        'part_of_body': 'part_of_body'
      };
      
      const entityType = entity.entity_type.toLowerCase();
      const guidwireField = fieldMap[entityType] || entityType;
      
      if (value) {
        payload[guidwireField] = value;
      }
    });
  });
  
  return payload;
}

// EXAMPLE USAGE:
const entities = {
  "EMPLOYEE INFO": [
    { entity_type: "employee_name", entity_value: "John Smith" },
    { entity_type: "date_of_birth", entity_value: "01/01/1990" }
  ]
};

const userEdits = {
  "EMPLOYEE_INFO_0": "Jane Doe"  // User changed name
};

const result = buildGuidwirePayload(entities, userEdits);
console.log(result);
// Output: { "employee_name": "Jane Doe", "date_of_birth": "01/01/1990" }
