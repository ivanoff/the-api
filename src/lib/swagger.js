function updateType(type = '') {
  let result = type;
  if (type.match(/^jsonb?$/)) result = 'object';
  if (type.match(/^uuid?$/)) result = 'string';
  if (type?.match(/^text|character varying|timestamp with time zone$/)) result = 'string';
  return result;
}

module.exports = ({
  flow, options, tablesInfo: ti,
}) => {
  const tablesInfoAdditional = {};
  const tablesInfo = { ...ti };
  const {
    version: v = '0.0.1', title = 'API', host = '127.0.0.1:7788', basePath,
  } = options;

  const routeErrors = flow.reduce((acc, item) => ({ ...acc, ...item.errors }), {});

  const swagger = flow.reduce((acc, item) => acc.concat(item.swagger), [])
    .filter(Boolean)
    .reduce((acc, cur) => {
      for (const [key, val] of Object.entries(cur)) {
        acc[`${key}`] = acc[`${key}`] ? { ...acc[`${key}`], ...val } : val;
      }
      return acc;
    }, {});

  const bp = basePath ? `basePath: ${basePath}\n` : '';
  const header = `swagger: "2.0"\ninfo:\n  version: "${v}"\n  title: "${title}"\nhost: "${host}"\n${bp}schemes:\n- https\n- http\nsecurityDefinitions:\n  UserToken:\n    type: apiKey\n    in: header\n    name: Authorization\n  RootToken:\n    type: apiKey\n    in: header\n    name: Authorization\n`;

  let paths = 'paths:\n';

  for (const [po, r] of Object.entries(swagger)) {
    const p = po.replace(/:([^/]+)/g, '{$1}');
    const pathParameters = [...p.matchAll(/\{(.*?)\}/g)].map((item) => item[1]).filter(Boolean);

    paths += `  ${p}:\n`;
    for (const [r1, r2 = {}] of Object.entries(r)) {
      if (r2.currentTableName) {
        tablesInfo[`${r2.currentTableName}`] = { ...tablesInfo[`${r2.currentTableName}`], ...r2.joinFields };
      }

      const hasFileType = Object.values(r2?.schema || {}).some((type) => type === 'file' || type.data_type === 'file');

      paths += `    ${r1}:\n`;
      if (r2.tag) paths += `      tags:\n      - "${r2.tag}"\n`;
      const summary = r2.summary || (typeof r2.access === 'string' ? r2.access : '');
      paths += `      summary: "${summary}"\n      description: ""\n`;
      if (r2.tokenRequired || r2.ownerRequired || r2.rootRequired) {
        paths += '      security:\n';
        if (r2.rootRequired) paths += `        - RootToken: []\n`;
        if (r2.tokenRequired || r2.ownerRequired) paths += '        - UserToken: []\n';
      }

      const consumesType = hasFileType ? 'multipart/form-data' : r1.match(/get|delete/) && 'application/json';
      if (consumesType) paths += `      consumes:\n      - "${consumesType}"\n`;

      paths += '      produces:\n      - "application/json"\n';

      if (r2.schema || r2.required || r2.queryParameters || pathParameters.length) {
        paths += '      parameters:\n';
        for (const fieldName of (r2.required || [])) {
          paths += `      - name: "${fieldName}"\n        in: "body"\n        type: "string"\n        required: true\n`;
        }
        for (const [fieldName, data] of (Object.entries(r2.queryParameters || {}))) {
          const type = updateType(typeof data === 'string' ? data : data.type);
          if (type === 'object') continue;
          const example = data.example ? `        description: "Example: ${data.example}"\n` : '';
          paths += `      - name: "${fieldName}"\n        in: "query"\n        type: "${type}"\n${example}`;
        }
        for (const fieldName of pathParameters) {
          paths += `      - name: "${fieldName}"\n        in: "path"\n        type: "string"\n        required: true\n`;
        }
        if (r2.schema) {
          if (hasFileType) {
            for (const [fieldName, data] of (Object.entries(r2.schema))) {
              const type = typeof data === 'string' ? data : data.data_type;
              const required = data.is_nullable === 'NO' ? 'true' : 'false';

              paths += `      - in: formData\n        name: ${fieldName}\n        type: ${updateType(type)}\n        required: ${required}\n`;
            }
          } else {
            const nnn = typeof r2.schema === 'string' ? r2.schema : `${p}_${r1}`.replace(/[/{}]/g, '_');
            paths += `      - in: "body"\n        name: "body"\n        required: false\n        schema:\n          $ref: "#/definitions/${nnn}"\n`;
            if (typeof r2.schema !== 'string') tablesInfoAdditional[`${nnn}`] = r2.schema;
          }
        }
      }
      paths += '      responses:\n        "200":\n          description: "Ok"\n';
      if (r2.currentTableName && p !== 'delete') {
        paths += '          schema:\n';
        if (p === 'get' && !pathParameters.length) paths += '            type: "array"\n';
        paths += '            items:\n';
        paths += `              $ref: "#/definitions/${r2.currentTableName}"\n`;
      }
      const uniqueStatuses = { 200: true };
      for (const resp of (r2.responses || [])) {
        if (!routeErrors[`${resp}`]) continue;
        const { status, description } = routeErrors[`${resp}`];
        if (uniqueStatuses[`${status}`]) continue;
        uniqueStatuses[`${status}`] = true;
        paths += `        "${status}":\n          description: "${description}"\n`;
      }
    }
  }

  let definitions = `definitions:\n`;
  for (const [tableName, t] of Object.entries({ ...tablesInfo, ...tablesInfoAdditional })) {
    if (tableName.match(/^public\.knex_/)) continue;

    definitions += `  ${tableName}:\n    type: "object"\n    properties:\n`;

    for (const [field, opt] of Object.entries({ ...t, ...tablesInfo[`${tableName}`] })) {
      definitions += `      ${field}:\n`;

      if (field === 'file') {
        definitions += `        type: array\n        items:\n          type: string\n          format: binary\n`;
        continue;
      }

      const o = (typeof opt === 'string') ? { data_type: opt } : opt;
      definitions += `        type: "${updateType(o.data_type)}"\n`;
    }
  }

  return `${header}\n${paths}\n${definitions}`;
};
