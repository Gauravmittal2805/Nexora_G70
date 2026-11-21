const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, '..', 'postman_collection.json');
const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// 1. Enrich Auth requests (Login & Register) with test scripts to set {{jwt_token}}
const authFolder = collection.item.find((i) => i.name === 'Auth');
if (authFolder && authFolder.item) {
  const loginReq = authFolder.item.find((i) => i.name === 'Login User');
  if (loginReq) {
    loginReq.event = [
      {
        listen: 'test',
        script: {
          exec: [
            'pm.test("Status code is 200 OK", function () {',
            '    pm.response.to.have.status(200);',
            '});',
            'pm.test("JWT token received and saved to environment", function () {',
            '    var jsonData = pm.response.json();',
            '    pm.expect(jsonData.success).to.eql(true);',
            '    pm.expect(jsonData).to.have.property("token");',
            '    pm.environment.set("jwt_token", jsonData.token);',
            '});'
          ],
          type: 'text/javascript'
        }
      }
    ];
  }

  const registerReq = authFolder.item.find((i) => i.name === 'Register User');
  if (registerReq) {
    registerReq.event = [
      {
        listen: 'test',
        script: {
          exec: [
            'pm.test("Status code is 201 Created or 200 OK", function () {',
            '    pm.expect(pm.response.code).to.be.oneOf([200, 201]);',
            '});',
            'pm.test("JWT token saved to environment", function () {',
            '    var jsonData = pm.response.json();',
            '    if (jsonData.token) {',
            '        pm.environment.set("jwt_token", jsonData.token);',
            '    }',
            '});'
          ],
          type: 'text/javascript'
        }
      }
    ];
  }
}

// 2. Build full Datasets folder with tests for listing, details, metadata, and deletion
const datasetsFolder = {
  name: 'Datasets',
  description: 'APIs for dataset upload, logged-in user listing, detail retrieval with metadata, preview, and deletion',
  item: [
    {
      name: 'Upload Dataset (CSV/JSON)',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 201 Created", function () {',
              '    pm.response.to.have.status(201);',
              '});',
              'pm.test("Dataset uploaded successfully with metadata", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    var ds = jsonData.dataset || jsonData.data;',
              '    pm.expect(ds).to.be.an("object");',
              '    pm.expect(ds.datasetId).to.be.a("string");',
              '    pm.environment.set("datasetId", ds.datasetId);',
              '    // Validate metadata fields',
              '    pm.expect(ds).to.have.property("fileName");',
              '    pm.expect(ds).to.have.property("fileSize");',
              '    pm.expect(ds).to.have.property("uploadDate");',
              '    pm.expect(ds).to.have.property("fileType");',
              '    pm.expect(ds).to.have.property("metadata");',
              '    pm.expect(ds.metadata).to.have.property("rowCount");',
              '    pm.expect(ds.metadata).to.have.property("columnCount");',
              '});'
            ],
            type: 'text/javascript'
          }
        }
      ],
      request: {
        method: 'POST',
        header: [
          { key: 'Authorization', value: 'Bearer {{jwt_token}}' }
        ],
        body: {
          mode: 'formdata',
          formdata: [
            { key: 'file', type: 'file', src: '' },
            { key: 'name', value: 'Customer Churn Analysis', type: 'text' },
            { key: 'description', value: 'Historical customer metrics and churn indicators', type: 'text' },
            { key: 'tags', value: 'customers, churn, analytics', type: 'text' }
          ]
        },
        url: {
          raw: 'http://localhost:5001/api/datasets/upload',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'datasets', 'upload']
        }
      },
      response: []
    },
    {
      name: 'List Datasets of Logged-In User',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200 OK", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              'pm.test("Returns user datasets array and pagination", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    pm.expect(jsonData.datasets).to.be.an("array");',
              '    pm.expect(jsonData).to.have.property("totalCount");',
              '    pm.expect(jsonData).to.have.property("pagination");',
              '    if (jsonData.datasets.length > 0) {',
              '        var first = jsonData.datasets[0];',
              '        pm.expect(first).to.have.property("fileName");',
              '        pm.expect(first).to.have.property("fileSize");',
              '        pm.expect(first).to.have.property("uploadDate");',
              '        pm.expect(first).to.have.property("fileType");',
              '        pm.expect(first).to.have.property("metadata");',
              '        if (!pm.environment.get("datasetId")) {',
              '            pm.environment.set("datasetId", first.datasetId);',
              '        }',
              '    }',
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
          raw: 'http://localhost:5001/api/datasets?page=1&limit=10&sortBy=createdAt&sortOrder=desc',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'datasets'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '10' },
            { key: 'sortBy', value: 'createdAt' },
            { key: 'sortOrder', value: 'desc' }
          ]
        }
      },
      response: []
    },
    {
      name: 'List Datasets (Dedicated Route /api/datasets/my)',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200 OK", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              'pm.test("Returns logged-in user datasets with metadata", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    pm.expect(jsonData.datasets).to.be.an("array");',
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
          raw: 'http://localhost:5001/api/datasets/my',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'datasets', 'my']
        }
      },
      response: []
    },
    {
      name: 'Get Dataset Details by ID',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200 OK", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              'pm.test("Dataset details returned with all required metadata", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    var ds = jsonData.dataset || jsonData.data;',
              '    pm.expect(ds).to.be.an("object");',
              '    // 1. Filename metadata',
              '    pm.expect(ds.fileName || ds.filename).to.be.a("string");',
              '    // 2. File size metadata',
              '    pm.expect(ds.fileSize).to.be.a("number");',
              '    // 3. Upload date metadata',
              '    pm.expect(ds.uploadDate || ds.uploadedAt || ds.createdAt).to.be.a("string");',
              '    // 4. File type metadata',
              '    pm.expect(ds.fileType).to.be.oneOf(["csv", "json", "jsonl"]);',
              '    pm.expect(ds.format).to.be.a("string");',
              '    // 5. Nested metadata object with row & column counts',
              '    pm.expect(ds.metadata).to.be.an("object");',
              '    pm.expect(ds.metadata.rowCount).to.be.at.least(0);',
              '    pm.expect(ds.metadata.columnCount).to.be.at.least(0);',
              '    pm.expect(ds.columns).to.be.an("array");',
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
          raw: 'http://localhost:5001/api/datasets/{{datasetId}}',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'datasets', '{{datasetId}}']
        }
      },
      response: []
    },
    {
      name: 'Get Dataset Preview',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200 OK", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              'pm.test("Returns preview records and pagination", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    pm.expect(jsonData.rows).to.be.an("array");',
              '    pm.expect(jsonData.columns).to.be.an("array");',
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
          raw: 'http://localhost:5001/api/datasets/{{datasetId}}/preview?limit=20',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'datasets', '{{datasetId}}', 'preview'],
          query: [
            { key: 'limit', value: '20' }
          ]
        }
      },
      response: []
    },
    {
      name: 'Get Dataset Profile',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200 OK", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              'pm.test("Returns dataset profile metrics", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    pm.expect(jsonData.columns).to.be.an("array");',
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
          raw: 'http://localhost:5001/api/datasets/{{datasetId}}/profile',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'datasets', '{{datasetId}}', 'profile']
        }
      },
      response: []
    },
    {
      name: 'Delete Dataset by ID',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200 OK", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              'pm.test("Dataset deleted successfully", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(true);',
              '    pm.expect(jsonData.message).to.include("deleted");',
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
          raw: 'http://localhost:5001/api/datasets/{{datasetId}}',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'datasets', '{{datasetId}}']
        }
      },
      response: []
    },
    {
      name: 'Verify Deleted Dataset Returns 404',
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 404 Not Found", function () {',
              '    pm.response.to.have.status(404);',
              '});',
              'pm.test("Dataset is successfully gone", function () {',
              '    var jsonData = pm.response.json();',
              '    pm.expect(jsonData.success).to.eql(false);',
              '    pm.expect(jsonData.message).to.include("not found");',
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
          raw: 'http://localhost:5001/api/datasets/{{datasetId}}',
          protocol: 'http',
          host: ['localhost'],
          port: '5001',
          path: ['api', 'datasets', '{{datasetId}}']
        }
      },
      response: []
    }
  ]
};

// Replace or add Datasets folder in collection
const datasetFolderIdx = collection.item.findIndex((i) => i.name === 'Datasets');
if (datasetFolderIdx !== -1) {
  collection.item[datasetFolderIdx] = datasetsFolder;
} else {
  collection.item.push(datasetsFolder);
}

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log('✅ postman_collection.json updated successfully with full Datasets tests & metadata verification!');
