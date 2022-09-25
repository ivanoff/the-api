"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateType(type = '') {
    let result = type;
    if (type.match(/^jsonb?$/))
        result = 'object';
    if (type === null || type === void 0 ? void 0 : type.match(/^text|character varying|timestamp with time zone$/))
        result = 'string';
    return result;
}
exports.default = ({ flow, options, tablesInfo, }) => {
    const tablesInfoAdditional = {};
    const { version: v = '0.0.1', title = 'API', host = '127.0.0.1:7788', basePath, } = options;
    const routeErrors = flow.reduce((acc, item) => (Object.assign(Object.assign({}, acc), item.errors)), {});
    const swagger = flow.reduce((acc, item) => acc.concat(item.swagger), [])
        .filter(Boolean)
        .reduce((acc, cur) => {
        for (const [key, val] of Object.entries(cur)) {
            // acc[`${key}`] = acc[`${key}`] ? { ...acc[`${key}`], ...val } : val;
            acc[`${key}`] = acc[`${key}`] ? Object.assign(Object.assign({}, acc[`${key}`]), { val }) : val;
        }
        return acc;
    }, {});
    const bp = basePath ? `basePath: ${basePath}\n` : '';
    const header = `swagger: "2.0"\ninfo:\n  version: "${v}"\n  title: "${title}"\nhost: "${host}"\n${bp}schemes:\n- https\n- http\nsecurityDefinitions:\n  UserToken:\n    type: apiKey\n    in: header\n    name: Authorization\n  RootToken:\n    type: apiKey\n    in: header\n    name: Authorization\n`;
    let paths = 'paths:\n';
    for (const aa of Object.entries(swagger)) {
        const [po, r] = aa;
        const p = po.replace(/:([^/]+)/g, '{$1}');
        const pathParameters = [].concat(p.matchAll(/\{(.*?)\}/g)).map((item) => item[1]).filter(Boolean);
        paths += `  ${p}:\n`;
        for (const bb of Object.entries(r)) {
            const [r1, r2] = bb;
            const hasFileType = Object.values((r2 === null || r2 === void 0 ? void 0 : r2.schema) || {}).some((type) => type === 'file' || type.data_type === 'file');
            paths += `    ${r1}:\n`;
            if (r2.tag)
                paths += `      tags:\n      - "${r2.tag}"\n`;
            const summary = r2.summary || typeof r2.access === 'string' ? r2.access : '';
            paths += `      summary: "${summary}"\n      description: ""\n`;
            if (r2.tokenRequired || r2.ownerRequired)
                paths += '      security:\n        - UserToken: []\n';
            if (r2.rootRequired)
                paths += '      security:\n        - RootToken: []\n';
            const consumesType = hasFileType ? 'multipart/form-data' : r1.match(/get|delete/) && 'application/json';
            if (consumesType)
                paths += `      consumes:\n      - "${consumesType}"\n`;
            paths += '      produces:\n      - "application/json"\n';
            if (r2.schema || r2.required || r2.queryParameters || pathParameters.length) {
                paths += '      parameters:\n';
                for (const fieldName of (r2.required || [])) {
                    paths += `      - name: "${fieldName}"\n        in: "body"\n        type: "string"\n        required: true\n`;
                }
                for (const [fieldName, data] of (Object.entries(r2.queryParameters || {}))) {
                    const type = updateType(typeof data === 'string' ? data : data.type);
                    if (type === 'object')
                        continue;
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
                    }
                    else {
                        const nnn = typeof r2.schema === 'string' ? r2.schema : `${p}_${r1}`.replace(/[/{}]/g, '_');
                        paths += `      - in: "body"\n        name: "body"\n        required: false\n        schema:\n          $ref: "#/definitions/${nnn}"\n`;
                        if (typeof r2.schema !== 'string')
                            tablesInfoAdditional[`${nnn}`] = r2.schema;
                    }
                }
            }
            paths += '      responses:\n        "200":\n          description: "Ok"\n';
            if (r2.currentSchema && p !== 'delete') {
                paths += '          schema:\n';
                if (p === 'get' && !pathParameters.length)
                    paths += '            type: "array"\n';
                paths += '            items:\n';
                paths += `              $ref: "#/definitions/${r2.currentSchema}"\n`;
            }
            for (const resp of (r2.responses || [])) {
                if (!routeErrors[`${resp}`])
                    continue;
                const { status, description } = routeErrors[`${resp}`];
                paths += `        "${status}":\n          description: "${description}"\n`;
            }
        }
    }
    let definitions = `definitions:\n`;
    for (const [tableName, t] of Object.entries(Object.assign(Object.assign({}, tablesInfo), tablesInfoAdditional))) {
        if (tableName.match(/^knex_/))
            continue;
        definitions += `  ${tableName}:\n    type: "object"\n    properties:\n`;
        for (const [field, opt] of Object.entries(t)) {
            definitions += `      ${field}:\n`;
            if (field === 'file') {
                definitions += `        type: array\n        items:\n          type: string\n          format: binary\n`;
                continue;
            }
            const o = (typeof opt === 'string') ? { data_type: opt } : opt;
            definitions += o.references ? `        $ref: "#/definitions/${o.references.foreign_table_name}"\n` : `        type: "${updateType(o.data_type)}"\n`;
        }
    }
    return `${header}\n${paths}\n${definitions}`;
};
