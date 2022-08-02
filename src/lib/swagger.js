function updateType(type = '') {
  let result = type;
  if (type.match(/^jsonb?$/)) result = 'object';
  if (type?.match(/^text|character varying|timestamp with time zone$/)) result = 'string';
  return result;
}

module.exports = ({
  flow, options, tablesInfo, basePath,
}) => {
  const tablesInfoAdditional = {};
  const { version: v = '0.0.1', title = 'API', host = '127.0.0.1:7788' } = options;

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
  const header = `swagger: "2.0"\ninfo:\n  version: "${v}"\n  title: "${title}"\nhost: "${host}"\n${bp}schemes:\n- http\n- https\nsecurityDefinitions:\n  UserToken:\n    type: apiKey\n    in: header\n    name: Authorization\n  RootToken:\n    type: apiKey\n    in: header\n    name: Authorization\n`;

  let paths = 'paths:\n';

  for (const [po, r] of Object.entries(swagger)) {
    const p = po.replace(/:([^/]+)/g, '{$1}');
    const pathParameters = [...p.matchAll(/\{(.*?)\}/g)].map((item) => item[1]).filter(Boolean);

    paths += `  ${p}:\n`;
    for (const [r1, r2 = {}] of Object.entries(r)) {
      paths += `    ${r1}:\n`;
      if (r2.tag) paths += `      tags:\n      - "${r2.tag}"\n`;
      paths += `      summary: "${r2.summary || ''}"\n      description: ""\n`;
      if (r2.tokenRequired) paths += '      security:\n        - UserToken: []\n';
      if (r2.rootRequired) paths += '      security:\n        - RootToken: []\n';
      if (!r1.match(/get|delete/)) paths += '      consumes:\n      - "application/json"\n';
      paths += '      produces:\n      - "application/json"\n';
      if (r2.schema || r2.required || r2.queryParameters || pathParameters.length) {
        paths += '      parameters:\n';
        for (const fieldName of (r2.required || [])) {
          paths += `      - name: "${fieldName}"\n        in: "body"\n        type: "string"\n        required: true\n`;
        }
        for (const [fieldName, data] of (Object.entries(r2.queryParameters || {}))) {
          const type = typeof data === 'string' ? data : data.type;
          const example = data.example ? `        description: "Example: ${data.example}"\n` : '';
          paths += `      - name: "${fieldName}"\n        in: "query"\n        type: "${updateType(type)}"\n${example}`;
        }
        for (const fieldName of pathParameters) {
          paths += `      - name: "${fieldName}"\n        in: "path"\n        type: "string"\n        required: true\n`;
        }
        if (r2.schema) {
          const nnn = typeof r2.schema === 'string' ? r2.schema : `${p}_${r1}`.replace(/[/{}]/g, '_');
          paths += `      - in: "body"\n        name: "body"\n        required: true\n        schema:\n          $ref: "#/definitions/${nnn}"\n`;
          if (typeof r2.schema !== 'string') tablesInfoAdditional[`${nnn}`] = r2.schema;
        }
      }
      paths += '      responses:\n        "200":\n          description: "Ok"\n';
      if (r2.currentSchema && p !== 'delete') {
        paths += '          schema:\n';
        if (p === 'get' && !pathParameters.length) paths += '            type: "array"\n';
        paths += '            items:\n';
        paths += `              $ref: "#/definitions/${r2.currentSchema}"\n`;
      }
      for (const resp of (r2.responses || [])) {
        if (!routeErrors[`${resp}`]) continue;
        const { status, description } = routeErrors[`${resp}`];
        paths += `        "${status}":\n          description: "${description}"\n`;
      }
    }
  }

  let definitions = `definitions:\n`;
  for (const [tableName, t] of Object.entries({ ...tablesInfo, ...tablesInfoAdditional })) {
    if (tableName.match(/^knex_/)) continue;

    definitions += `  ${tableName}:\n    type: "object"\n    properties:\n`;
    for (const [field, opt] of Object.entries(t)) {
      definitions += `      ${field}:\n`;
      const o = (typeof opt === 'string') ? { data_type: opt } : opt;
      definitions += o.references ? `        $ref: "#/definitions/${o.references.foreign_table_name}"\n` : `        type: "${updateType(o.data_type)}"\n`;
    }
  }

  return `${header}\n${paths}\n${definitions}`;
};
