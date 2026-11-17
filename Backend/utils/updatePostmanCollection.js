const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'postman_collection.json');
const collection = JSON.parse(fs.readFileSync(file, 'utf8'));

// Check if Field Mappings folder already exists
const existingIdx = collection.item.findIndex((i) => i.name === 'Field Mappings');

const fieldMappingsFolder = {
  name: 'Field Mappings',
  description: 'APIs for creating, reading, updating, validating, and deleting dataset field mapping configurations stored in MongoDB',
  item: [
    {
      name: 'Create Field Mapping',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 201", function () {',
              '    pm.response.to.have.status(201);',
              '});',
              'pm.test("Mapping created successfully with ID", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    pm.expect(jsonData.mapping).to.have.property("mappingId");',
              '    pm.environment.set("mappingId", jsonData.mapping.mappingId);',
              '    pm.environment.set("datasetId", jsonData.mapping.datasetId);',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              datasetId: '{{datasetId}}',
              name: 'Alpha Sales Field Mapping',
              description: 'Field mapping from alpha sales source columns to standard target schema',
              fieldMappings: [
                {
                  sourceField: 'product',
                  targetField: 'product_name',
                  targetType: 'string',
                  transformation: 'trim',
                  isRequired: true
                },
                {
                  sourceField: 'price',
                  targetField: 'unit_price',
                  targetType: 'number',
                  transformation: 'to_number',
                  isRequired: true
                },
                {
                  sourceField: 'category',
                  targetField: 'category_code',
                  targetType: 'string',
                  transformation: 'uppercase',
                  defaultValue: 'GENERAL'
                }
              ],
              targetRole: {
                target: 'unit_price',
                id: 'id',
                numerical: ['price'],
                categorical: ['product', 'category']
              }
            },
            null,
            2
          )
        },
        url: {
          raw: 'http://localhost:5001/api/mappings',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings']
        }
      },
      response: []
    },
    {
      name: 'Get Field Mapping by Dataset ID',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              'pm.test("Mapping returned for dataset", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    pm.expect(jsonData.mapping).to.be.an("object");',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'GET',
        header: [
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        url: {
          raw: 'http://localhost:5001/api/mappings/:datasetId',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings', ':datasetId'],
          variable: [
            {
              key: 'datasetId',
              value: '{{datasetId}}'
            }
          ]
        }
      },
      response: []
    },
    {
      name: 'Update Field Mapping',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              'pm.test("Mapping updated successfully", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    pm.expect(jsonData.mapping.name).to.include("Updated");',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'PUT',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              name: 'Alpha Sales Field Mapping - Updated',
              description: 'Updated field mapping configurations with custom types and transformations',
              fieldMappings: [
                {
                  sourceField: 'product',
                  targetField: 'product_title',
                  targetType: 'string',
                  transformation: 'trim',
                  isRequired: true
                },
                {
                  sourceField: 'price',
                  targetField: 'final_price',
                  targetType: 'number',
                  transformation: 'to_number',
                  isRequired: true
                },
                {
                  sourceField: 'id',
                  targetField: 'sku_id',
                  targetType: 'string',
                  transformation: 'trim',
                  isRequired: true
                }
              ],
              targetRole: {
                target: 'final_price',
                id: 'id',
                numerical: ['price'],
                categorical: ['product']
              }
            },
            null,
            2
          )
        },
        url: {
          raw: 'http://localhost:5001/api/mappings/:datasetId',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings', ':datasetId'],
          variable: [
            {
              key: 'datasetId',
              value: '{{datasetId}}'
            }
          ]
        }
      },
      response: []
    },
    {
      name: 'List All Field Mappings',
      request: {
        method: 'GET',
        header: [
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        url: {
          raw: 'http://localhost:5001/api/mappings?page=1&limit=10',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '10' }
          ]
        }
      },
      response: []
    },
    {
      name: 'Negative Test - Source Column Not in Dataset (400)',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 400 Bad Request", function () {',
              '    pm.response.to.have.status(400);',
              '});',
              'pm.test("Error specifies non-existent column", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(false);',
              '    pm.expect(jsonData.message).to.include("does not exist");',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              datasetId: '{{datasetId}}',
              fieldMappings: [
                {
                  sourceField: 'non_existent_column_xyz',
                  targetField: 'some_target'
                }
              ]
            },
            null,
            2
          )
        },
        url: {
          raw: 'http://localhost:5001/api/mappings',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings']
        }
      },
      response: []
    },
    {
      name: 'Negative Test - Duplicate Source Fields (400)',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 400 Bad Request", function () {',
              '    pm.response.to.have.status(400);',
              '});',
              'pm.test("Error flags duplicate source fields", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(false);',
              '    pm.expect(jsonData.message).to.include("Duplicate source field");',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              datasetId: '{{datasetId}}',
              fieldMappings: [
                { sourceField: 'product', targetField: 'name_one' },
                { sourceField: 'product', targetField: 'name_two' }
              ]
            },
            null,
            2
          )
        },
        url: {
          raw: 'http://localhost:5001/api/mappings',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings']
        }
      },
      response: []
    },
    {
      name: 'Negative Test - Duplicate Target Fields (400)',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 400 Bad Request", function () {',
              '    pm.response.to.have.status(400);',
              '});',
              'pm.test("Error flags duplicate target fields", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(false);',
              '    pm.expect(jsonData.message).to.include("Duplicate target field");',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              datasetId: '{{datasetId}}',
              fieldMappings: [
                { sourceField: 'product', targetField: 'common_name' },
                { sourceField: 'price', targetField: 'common_name' }
              ]
            },
            null,
            2
          )
        },
        url: {
          raw: 'http://localhost:5001/api/mappings',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings']
        }
      },
      response: []
    },
    {
      name: 'Negative Test - Non-Existent Dataset ID (404)',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 404 Not Found", function () {',
              '    pm.response.to.have.status(404);',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              datasetId: 'invalid-dataset-id-00000000-0000',
              fieldMappings: [
                { sourceField: 'col1', targetField: 'col_target' }
              ]
            },
            null,
            2
          )
        },
        url: {
          raw: 'http://localhost:5001/api/mappings',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings']
        }
      },
      response: []
    },
    {
      name: 'Delete Field Mapping',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200 OK", function () {',
              '    pm.response.to.have.status(200);',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'DELETE',
        header: [
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        url: {
          raw: 'http://localhost:5001/api/mappings/:datasetId',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'mappings', ':datasetId'],
          variable: [
            {
              key: 'datasetId',
              value: '{{datasetId}}'
            }
          ]
        }
      },
      response: []
    }
  ]
};

if (existingIdx !== -1) {
  collection.item[existingIdx] = fieldMappingsFolder;
} else {
  collection.item.push(fieldMappingsFolder);
}

fs.writeFileSync(file, JSON.stringify(collection, null, 2), 'utf8');
console.log('Successfully updated postman_collection.json with Field Mappings collection!');
