// EXAMPLE: When you change employee_name from "Juan D'Souza" to "name-1"

// 1. ORIGINAL ENTITIES (from your testing file)
const originalEntities = {
  "claim_details_section": {
    "employee_name": {"value": "Juan D'Souza", "confidence": "100%"}
  },
  "employee_information_section": {
    "employee_first_name": {"value": "Juan", "confidence": "100%"},
    "employee_last_name": {"value": "D'Souza", "confidence": "100%"}
  }
};

// 2. USER MODIFIES NAME
// When user edits employee_name to "name-1", it gets stored as:
const modifiedValues = {
  "CLAIM_DETAILS_SECTION_employee_name": "name-1"
};

// 3. PAYLOAD GENERATION LOGIC
function buildPayload(entities, modifiedValues) {
  const payload = {};
  
  // Process claim_details_section
  const originalName = entities.claim_details_section.employee_name.value; // "Juan D'Souza"
  const entityKey = "CLAIM_DETAILS_SECTION_employee_name";
  const currentValue = modifiedValues[entityKey] || originalName; // "name-1" (modified)
  
  payload.employee_name = currentValue;
  
  console.log(`employee_name = ${currentValue} ${modifiedValues[entityKey] ? '(MODIFIED)' : '(ORIGINAL)'}`);
  
  return payload;
}

// 4. RESULT PAYLOAD
const resultPayload = buildPayload(originalEntities, modifiedValues);

console.log('=== PAYLOAD WITH MODIFIED NAME ===');
console.log(JSON.stringify(resultPayload, null, 2));

/* OUTPUT:
{
  "employee_name": "name-1"  // MODIFIED value used instead of "Juan D'Souza"
}

Console log:
employee_name = name-1 (MODIFIED)
*/
