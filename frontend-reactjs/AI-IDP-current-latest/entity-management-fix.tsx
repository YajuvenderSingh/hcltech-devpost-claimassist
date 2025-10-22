// ENTITY MANAGEMENT FIX - Add to ContentExtraction.tsx

// 1. Add delete state
const [deletedEntities, setDeletedEntities] = useState<Set<string>>(new Set());

// 2. Add delete handler
const handleDeleteEntity = (sectionName: string, entityIndex: number) => {
  const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${entityIndex}`;
  
  setDeletedEntities(prev => new Set([...prev, entityKey]));
  
  // Remove from modified values if exists
  setModifiedValues(prev => {
    const updated = { ...prev };
    delete updated[entityKey];
    return updated;
  });
  
  showMessage('success', '🗑️ Entity deleted permanently');
};

// 3. Filter out deleted entities when rendering
const getFilteredEntities = (sectionName: string, entities: any[]) => {
  return entities.filter((_, index) => {
    const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
    return !deletedEntities.has(entityKey);
  });
};

// 4. Single Edit/Delete Button Component
const EntityActions = ({ sectionName, entityIndex, currentValue, isEditing }) => {
  const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${entityIndex}`;
  
  if (isEditing) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => setEditingEntity(null)}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
          title="Save"
        >
          ✓
        </button>
        <button
          onClick={() => {
            setEditingEntity(null);
            setModifiedValues(prev => {
              const updated = { ...prev };
              delete updated[entityKey];
              return updated;
            });
          }}
          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
          title="Cancel"
        >
          ✕
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex gap-1">
      <button
        onClick={() => handleEditEntity(sectionName, entityIndex, currentValue)}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
        title="Edit"
      >
        ✏️
      </button>
      <button
        onClick={() => handleDeleteEntity(sectionName, entityIndex)}
        className="p-1 text-red-600 hover:bg-red-50 rounded"
        title="Delete"
      >
        🗑️
      </button>
    </div>
  );
};

// 5. Updated Entity Rendering (replace existing entity display)
{Object.entries(entitiesBySection).map(([sectionName, entities]) => {
  const filteredEntities = getFilteredEntities(sectionName, entities);
  
  if (filteredEntities.length === 0) return null;
  
  return (
    <div key={sectionName} className="mb-4">
      <h4 className="font-medium text-gray-800 mb-2">{sectionName}</h4>
      {filteredEntities.map((entity, index) => {
        const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
        const isEditing = editingEntity === entityKey;
        const currentValue = modifiedValues[entityKey] || entity.entity_value;
        
        return (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
            <div className="flex-1">
              <span className="text-sm font-medium">{entity.entity_type}:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={currentValue}
                  onChange={(e) => setModifiedValues(prev => ({
                    ...prev,
                    [entityKey]: e.target.value
                  }))}
                  className="ml-2 px-2 py-1 border rounded text-sm"
                  autoFocus
                />
              ) : (
                <span className="ml-2 text-sm">{currentValue}</span>
              )}
            </div>
            <EntityActions 
              sectionName={sectionName}
              entityIndex={index}
              currentValue={currentValue}
              isEditing={isEditing}
            />
          </div>
        );
      })}
    </div>
  );
})}

// 6. Update Guidewire payload to exclude deleted entities
const buildGuidwirePayload = () => {
  const payload = {};
  
  Object.entries(entitiesBySection).forEach(([sectionName, entities]) => {
    entities.forEach((entity, index) => {
      const entityKey = `${sectionName.replace(/\s+/g, '_').toUpperCase()}_${index}`;
      
      // Skip deleted entities
      if (deletedEntities.has(entityKey)) return;
      
      const value = modifiedValues[entityKey] || entity.entity_value;
      if (value) {
        payload[entity.entity_type.toLowerCase()] = value;
      }
    });
  });
  
  return payload;
};
