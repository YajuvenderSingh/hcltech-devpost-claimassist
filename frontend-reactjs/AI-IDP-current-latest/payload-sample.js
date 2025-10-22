// SAMPLE: How nmm_update_guidewire_lambda payload is built

// 1. EXTRACTED ENTITIES (from document)
const entitiesBySection = {
  "CLAIM DETAILS": [
    { entity_type: "CLAIM_NUMBER", entity_value: "CL123456", confidence: 0.95 },
    { entity_type: "EMPLOYEE_NAME", entity_value: "John Smith", confidence: 0.90 }
  ],
  "EMPLOYEE INFO": [
    { entity_type: "EMPLOYEE_FIRST_NAME", entity_value: "John", confidence: 0.92 },
    { entity_type: "EMPLOYEE_LAST_NAME", entity_value: "Smith", confidence: 0.88 },
    { entity_type: "DATE_OF_BIRTH", entity_value: "01/15/1985", confidence: 0.87 }
  ]
};

// 2. MODIFIED VALUES (user edits)
const modifiedValues = {
  "CLAIM_DETAILS_0": "CL999888",  // User changed claim number
  "EMPLOYEE_INFO_2": "01/15/1990"  // User changed birth date
};

// 3. PAYLOAD CONSTRUCTION LOGIC
function buildGuidwirePayload(entitiesBySection, modifiedValues, selectedDocId) {
  const guidwirePayload = {};
  let entityCount = 0;
  
  Object.entries(entitiesBySection).forEach(([sectionName, entities]) => {
    entities.forEach((entity, index) => {
      // Check for modified value first
      const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
      const currentValue = modifiedValues[entityKey] || entity.entity_value;
      
      // Map entity type to Guidwire field
      const entityType = entity.entity_type.toLowerCase();
      let fieldKey = '';
      
      if (entityType.includes('claim') && (entityType.includes('number') || entityType.includes('id'))) {
        fieldKey = 'ClaimNumber';
      } else if (entityType.includes('employee_name') || entityType === 'employee name') {
        fieldKey = 'employee_name';
      } else if (entityType.includes('employee_first_name') || entityType === 'employee first name') {
        fieldKey = 'employee_first_name';
      } else if (entityType.includes('employee_last_name') || entityType === 'employee last name') {
        fieldKey = 'employee_last_name';
      } else if (entityType.includes('date_of_birth') || entityType === 'date of birth') {
        fieldKey = 'date_of_birth';
      } else {
        fieldKey = entity.entity_type.toLowerCase().replace(/\s+/g, '_');
      }
      
      if (fieldKey && currentValue) {
        guidwirePayload[fieldKey] = currentValue;
        entityCount++;
        console.log(`${fieldKey} = ${currentValue} ${modifiedValues[entityKey] ? '(MODIFIED)' : '(ORIGINAL)'}`);
      }
    });
  });
  
  return guidwirePayload;
}

// 4. SAMPLE OUTPUT
const samplePayload = buildGuidwirePayload(entitiesBySection, modifiedValues, 'DOC123456789');

console.log('=== SAMPLE GUIDWIRE PAYLOAD ===');
console.log(JSON.stringify(samplePayload, null, 2));

/* 
EXPECTED OUTPUT:
{
  "ClaimNumber": "CL999888",           // MODIFIED (was CL123456)
  "employee_name": "John Smith",       // ORIGINAL
  "employee_first_name": "John",       // ORIGINAL  
  "employee_last_name": "Smith",       // ORIGINAL
  "date_of_birth": "01/15/1990"       // MODIFIED (was 01/15/1985)
}
*/
