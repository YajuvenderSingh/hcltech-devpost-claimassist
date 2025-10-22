import React from 'react';
import { Edit2 } from 'lucide-react';

interface Entity {
  entity_type: string;
  entity_value: any; // Changed from string to any to handle objects
  confidence: number | string; // Allow both number and string
}

interface EntityListProps {
  entities: Entity[];
  selectedDocId: string | null;
  entitiesBySection: any;
  editingEntity: string | null;
  modifiedValues: any;
  onEditEntity: (section: string, index: number, value: string) => void;
  onValueChange: (entityKey: string, value: string) => void;
  onStopEditing: () => void;
  currentSectionName?: string; // Add this prop
}

const EntityList: React.FC<EntityListProps> = ({
  entities,
  selectedDocId,
  entitiesBySection,
  editingEntity,
  modifiedValues,
  onEditEntity,
  onValueChange,
  onStopEditing,
  currentSectionName
}) => {
  // Use the actual section name, not selectedDocId
  const currentSection = currentSectionName || Object.keys(entitiesBySection)[0] || 'UNKNOWN';

  // Define which entity types are editable - ALLOW ALL
  const isEditableEntityType = (entityType: string): boolean => {
    // Allow editing of ALL entity types
    return true;
  };

  return (
    <div className="h-full overflow-y-auto"> {/* Changed from flex-1 to h-full */}
      <div className="p-3 space-y-1.5">
        {entities.map((entity, index) => {
          const entityKey = `${currentSection}_${index}`;
          
          console.log(`🔍 EntityList DEBUG: entity ${index}:`, {
            entityType: entity.entity_type,
            entityValue: entity.entity_value,
            entityKey: entityKey,
            currentSection: currentSection,
            isModified: !!modifiedValues[entityKey]
          });
          
          // Handle object values properly - extract just the value
          let displayValue: string = '';
          if (typeof entity.entity_value === 'object' && entity.entity_value !== null) {
            // Check for current_value first (for modified entities)
            if (entity.entity_value.current_value) {
              displayValue = String(entity.entity_value.current_value);
            } else if (entity.entity_value.value) {
              displayValue = String(entity.entity_value.value);
            } else if (Array.isArray(entity.entity_value)) {
              displayValue = (entity.entity_value as any[]).map((item: any) => 
                typeof item === 'object' ? (item.value || JSON.stringify(item)) : String(item)
              ).join(', ');
            } else {
              displayValue = JSON.stringify(entity.entity_value);
            }
          } else {
            displayValue = String(entity.entity_value || '');
          }
          
          // Parse confidence properly
          let confidenceValue = 0;
          if (typeof entity.confidence === 'string') {
            // Handle "100%" format
            const numericValue = parseFloat((entity.confidence as string).replace('%', ''));
            confidenceValue = numericValue > 1 ? numericValue / 100 : numericValue;
          } else if (typeof entity.confidence === 'number') {
            confidenceValue = entity.confidence > 1 ? entity.confidence / 100 : entity.confidence;
          }
          
          const currentValue = modifiedValues[entityKey] || displayValue;
          
          return (
            <div key={index} className="group flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-0">
              {/* Entity Type - Fixed width */}
              <div className="w-32 flex-shrink-0">
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded block text-center whitespace-nowrap overflow-hidden text-ellipsis" title={entity.entity_type}>
                  {entity.entity_type}
                </span>
              </div>

              {/* Value - Flexible width with overflow handling */}
              <div className="flex-1 min-w-0 px-1">
                {editingEntity === entityKey && isEditableEntityType(entity.entity_type) ? (
                  <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => {
                      console.log('🔄 Entity value changed:', entityKey, '=', e.target.value);
                      onValueChange(entityKey, e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        onStopEditing();
                      }
                    }}
                    className="w-full text-xs text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 text-center min-w-0"
                    autoFocus
                  />
                ) : (
                  <div 
                    className={`text-xs text-gray-900 py-1 text-center truncate min-w-0 ${
                      isEditableEntityType(entity.entity_type) 
                        ? 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 rounded px-1' 
                        : 'cursor-default'
                    }`}
                    onClick={() => {
                      if (isEditableEntityType(entity.entity_type)) {
                        console.log('🖱️ Entity clicked for edit:', {
                          entityType: entity.entity_type,
                          currentSection: currentSection,
                          index: index,
                          displayValue: displayValue,
                          entityKey: entityKey
                        });
                        onEditEntity(currentSection, index, displayValue);
                      }
                    }}
                    title={isEditableEntityType(entity.entity_type) ? `${currentValue} (Click to edit)` : currentValue}
                  >
                    {currentValue}
                    {isEditableEntityType(entity.entity_type) && (
                      <span className="ml-1 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
                    )}
                  </div>
                )}
              </div>

              {/* Confidence Score - Fixed width */}
              <div className="w-16 flex-shrink-0 flex items-center gap-1">
                <div className="flex-1 relative">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        confidenceValue >= 0.95 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                        confidenceValue >= 0.85 ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                        confidenceValue >= 0.75 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                        confidenceValue >= 0.65 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                        confidenceValue >= 0.50 ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                        'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${(confidenceValue * 100)}%` }}
                    />
                  </div>
                  {confidenceValue >= 0.9 && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className={`text-xs font-bold min-w-[20px] text-center ${
                  confidenceValue >= 0.95 ? 'text-emerald-600' :
                  confidenceValue >= 0.85 ? 'text-green-600' :
                  confidenceValue >= 0.75 ? 'text-blue-600' :
                  confidenceValue >= 0.65 ? 'text-yellow-600' :
                  confidenceValue >= 0.50 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {Math.round(confidenceValue * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EntityList;