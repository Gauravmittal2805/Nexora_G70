/**
 * Mapping Validator Utility
 * Validates Source-to-Target dataset field mappings against dataset schema and constraints.
 */

/**
 * Validates source-to-target field mappings
 * 
 * @param {Array<Object>} fieldMappings - Array of mapping objects: { id, targetField, sourceField, targetType, required, transformation, defaultValue }
 * @param {Array<Object>} sourceColumns - Array of dataset source columns: { name, type, dataType, nullCount, sampleValues }
 * @param {Object} [options] - Additional validation options
 * @returns {Object} { isValid: boolean, errors: Array<Object>, warnings: Array<Object>, stats: Object }
 */
function validateFieldMappings(fieldMappings = [], sourceColumns = [], options = {}) {
  const errors = [];
  const warnings = [];

  const sourceColMap = new Map();
  sourceColumns.forEach(c => {
    const name = c.name || c;
    sourceColMap.set(String(name).toLowerCase(), c);
  });

  const sourceColNames = new Set(sourceColumns.map(c => String(c.name || c)));
  const targetFieldCounts = new Map();
  const sourceFieldUsage = new Map();

  let mappedCount = 0;
  let unmappedCount = 0;
  let requiredUnmappedCount = 0;
  let typeMismatchCount = 0;

  if (!Array.isArray(fieldMappings) || fieldMappings.length === 0) {
    errors.push({
      field: '_general',
      message: 'No field mappings defined. At least one target field mapping is required.',
      type: 'error',
      code: 'EMPTY_MAPPINGS'
    });
  }

  (fieldMappings || []).forEach((mapping, index) => {
    const rawTarget = mapping.targetField;
    const targetField = rawTarget ? String(rawTarget).trim() : '';
    const sourceField = mapping.sourceField ? String(mapping.sourceField).trim() : '';
    const targetType = (mapping.targetType || 'String').toLowerCase();
    const isRequired = Boolean(mapping.required);
    const transformation = (mapping.transformation || 'none').toLowerCase();

    // 1. Target Field Name Checks
    if (!targetField) {
      errors.push({
        field: `mapping_${index}`,
        index,
        message: `Target field name at row #${index + 1} cannot be empty.`,
        type: 'error',
        code: 'EMPTY_TARGET_NAME'
      });
      return;
    }

    // Valid identifier check (alphanumeric, underscores, hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(targetField)) {
      warnings.push({
        field: targetField,
        index,
        message: `Target field "${targetField}" contains special characters or spaces. Recommended format: snake_case or camelCase.`,
        type: 'warning',
        code: 'INVALID_CHARACTERS'
      });
    }

    // Duplicate target field name check
    const lowerTarget = targetField.toLowerCase();
    const currentCount = targetFieldCounts.get(lowerTarget) || 0;
    targetFieldCounts.set(lowerTarget, currentCount + 1);

    if (currentCount > 0) {
      errors.push({
        field: targetField,
        index,
        message: `Duplicate target field name "${targetField}". Target field names must be unique.`,
        type: 'error',
        code: 'DUPLICATE_TARGET_FIELD'
      });
    }

    // 2. Source Field Existence & Mapping Checks
    if (sourceField) {
      mappedCount++;

      // Check if source column actually exists in dataset
      if (!sourceColNames.has(sourceField) && !sourceColMap.has(sourceField.toLowerCase())) {
        errors.push({
          field: targetField,
          sourceField,
          index,
          message: `Source column "${sourceField}" mapped to "${targetField}" does not exist in dataset.`,
          type: 'error',
          code: 'SOURCE_NOT_FOUND'
        });
      } else {
        // Track duplicate source column assignments
        const lowerSource = sourceField.toLowerCase();
        if (!sourceFieldUsage.has(lowerSource)) {
          sourceFieldUsage.set(lowerSource, []);
        }
        sourceFieldUsage.get(lowerSource).push(targetField);

        // 3. Type Compatibility Verification
        const sourceCol = sourceColMap.get(lowerSource);
        if (sourceCol) {
          const rawSourceType = (sourceCol.type || sourceCol.dataType || 'string').toLowerCase();
          const isNumericTarget = targetType === 'number' || targetType === 'float' || targetType === 'integer';
          const isBooleanTarget = targetType === 'boolean';
          const isDateTarget = targetType === 'date' || targetType === 'datetime';

          const isNumericSource = rawSourceType === 'number' || rawSourceType === 'float' || rawSourceType === 'integer';
          const isBooleanSource = rawSourceType === 'boolean';
          const isDateSource = rawSourceType === 'date' || rawSourceType === 'datetime';

          // String mapped to Numeric target without conversion
          if (isNumericTarget && !isNumericSource && transformation !== 'to_number') {
            typeMismatchCount++;
            warnings.push({
              field: targetField,
              sourceField,
              index,
              message: `Type conversion warning: Source column "${sourceField}" (${sourceCol.type || sourceCol.dataType}) mapped to numeric target "${targetField}" (${mapping.targetType}). Apply "Cast to Number" transformation to prevent parsing errors.`,
              type: 'warning',
              code: 'TYPE_MISMATCH_NUMERIC'
            });
          }

          // String mapped to Boolean target without conversion
          if (isBooleanTarget && !isBooleanSource && transformation !== 'to_boolean') {
            typeMismatchCount++;
            warnings.push({
              field: targetField,
              sourceField,
              index,
              message: `Type conversion warning: Source column "${sourceField}" (${sourceCol.type || sourceCol.dataType}) mapped to boolean target "${targetField}". Apply "Cast to Boolean" transformation.`,
              type: 'warning',
              code: 'TYPE_MISMATCH_BOOLEAN'
            });
          }

          // Check if nulls exist in required field without default value
          const nullCount = sourceCol.nullCount || sourceCol.missingCount || 0;
          if (isRequired && nullCount > 0 && (mapping.defaultValue === undefined || mapping.defaultValue === null || mapping.defaultValue === '')) {
            warnings.push({
              field: targetField,
              sourceField,
              index,
              message: `Source column "${sourceField}" has ${nullCount} missing/null values, but target field "${targetField}" is marked Required. Consider configuring a Default Value or "Remove Empty Cells" transformation.`,
              type: 'warning',
              code: 'NULLABLE_REQUIRED_FIELD'
            });
          }
        }
      }
    } else {
      unmappedCount++;
      // Check required target fields
      if (isRequired) {
        requiredUnmappedCount++;
        errors.push({
          field: targetField,
          index,
          message: `Required target field "${targetField}" is not mapped to any source column.`,
          type: 'error',
          code: 'REQUIRED_FIELD_UNMAPPED'
        });
      }
    }
  });

  // Check duplicate source mappings
  sourceFieldUsage.forEach((targets, src) => {
    if (targets.length > 1) {
      warnings.push({
        field: targets[0],
        sourceField: src,
        message: `Source column "${src}" is mapped to multiple target fields: ${targets.map(t => `"${t}"`).join(', ')}. Ensure this 1-to-many projection is intended.`,
        type: 'warning',
        code: 'DUPLICATE_SOURCE_MAPPING'
      });
    }
  });

  // Calculate unmapped source columns
  const mappedSourceColNames = new Set(
    (fieldMappings || [])
      .filter(m => m.sourceField)
      .map(m => String(m.sourceField).toLowerCase())
  );

  const unmappedSourceColumns = sourceColumns
    .filter(c => !mappedSourceColNames.has(String(c.name || c).toLowerCase()))
    .map(c => c.name || c);

  if (unmappedSourceColumns.length > 0 && !options.suppressUnmappedSourceNotice) {
    warnings.push({
      field: '_dataset',
      message: `${unmappedSourceColumns.length} source dataset column(s) are unmapped: ${unmappedSourceColumns.slice(0, 5).join(', ')}${unmappedSourceColumns.length > 5 ? '...' : ''}. They will be excluded from downstream models unless mapped.`,
      type: 'info',
      code: 'UNMAPPED_SOURCE_COLUMNS',
      columns: unmappedSourceColumns
    });
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    stats: {
      totalSourceColumns: sourceColumns.length,
      totalTargetFields: fieldMappings.length,
      mappedFields: mappedCount,
      unmappedFields: unmappedCount,
      requiredUnmapped: requiredUnmappedCount,
      typeMismatches: typeMismatchCount,
      unmappedSourceColumnsCount: unmappedSourceColumns.length
    }
  };
}

module.exports = {
  validateFieldMappings
};
