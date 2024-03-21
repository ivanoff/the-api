const template = `import fs from 'fs/promises';
const getRandomInt = (max: number) => Math.floor(Math.random() * Math.floor(max));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ApiClient {
    public token: string | undefined;
    private readonly url: string;
    private refreshToken: string | undefined;
    private readonly onTokenUpdate: any;
    private readonly onTokenError: any;

    constructor({ url, token, refreshToken, onTokenUpdate, onTokenError }: ConstructorType) {
        this.url = url;
        this.token = token;
        this.refreshToken = refreshToken;
        this.onTokenUpdate = onTokenUpdate || (() => {});
        this.onTokenError = onTokenError || (() => {});
    }

    private async request(
        endpoint: string,
        options?: RequestInit,
        noToken?: boolean
    ): Promise<Response | undefined> {
        let result;
        for (let i = 1; i < 5; i++) {
            try {
                result = await fetch(\`\${this.url}/\${endpoint.replace(/\\/+/, '')}\`, {
                    ...options,
                    headers: {
                        ...(options?.headers || {}),
                        ...(!noToken && this.token && { Authorization: \`Bearer \${this.token}\` }),
                    },
                });

                if (!result) throw new Error('No Result');

                break;
            } catch (err) {
                const ms = 1000 * i + getRandomInt(1000);
                console.log(\`sleep \${ms / 1000}s\`);
                await sleep(ms);
            }
        }

        return result;
    }

    private async fetchWithToken(
        endpoint: string,
        options?: RequestInit,
        noToken?: boolean
    ): Promise<Response | undefined> {
        let response = await this.request(endpoint, options, noToken);

        if (!noToken && response?.status === 401) {
            const a = await this.handle401();
            if (a) response = await this.request(endpoint, options, noToken);
        }

        return response;
    }

    async get<T>(endpoint: string, noToken?: boolean): Promise<T> {
        const response = await this.fetchWithToken(endpoint, undefined, noToken);
        return response?.json();
    }

    async post<T>(endpoint: string, data?: any, noToken?: boolean): Promise<T> {
        const response = await this.fetchWithToken(
            endpoint,
            {
                method: 'POST',
                body: JSON.stringify(data || {}),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            noToken
        );
        return response?.json();
    }

    async postFormdata<T>(endpoint: string, data?: any, fileFieldNames?: string[]): Promise<T> {
      const formData = new FormData();
      for (const [key, v] of Object.entries(data)) {
          for (const val of [].concat(v as any)) {
              if (fileFieldNames?.includes(key)) {
                  if (typeof val === 'string') {
                      const content = await fs.readFile(val);
                      const blob = new Blob([new Uint8Array(content)]);
                      formData.append(key, blob, val);
                  } else {
                      formData.append(key, val);
                  }
              } else {
                  formData.append(key, val);
              }
          }
      }

      const response = await this.fetchWithToken(endpoint, {
          method: 'POST',
          body: formData,
      });

      return response?.json();
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        const response = await this.fetchWithToken(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data || {}),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response?.json();
    }

    async putFormdata<T>(endpoint: string, data?: any, fileFieldNames?: string[]): Promise<T> {
      const formData = new FormData();
      for (const [key, v] of Object.entries(data)) {
          for (const val of [].concat(v as any)) {
              if (fileFieldNames?.includes(key)) {
                  if (typeof val === 'string') {
                      const content = await fs.readFile(val);
                      const blob = new Blob([new Uint8Array(content)]);
                      formData.append(key, blob, val);
                  } else {
                      formData.append(key, val);
                  }
              } else {
                  formData.append(key, val);
              }
          }
      }

      const response = await this.fetchWithToken(endpoint, {
          method: 'PUT',
          body: formData,
      });

      return response?.json();
    }

    async patch<T>(endpoint: string, data? : any): Promise<T> {
        const response = await this.fetchWithToken(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data || {}),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response?.json();
    }

    async delete<T>(endpoint: string): Promise<T> {
        const response = await this.fetchWithToken(endpoint, {
            method: 'DELETE',
        });
        return response?.json();
    }

    private async handle401(): Promise<boolean> {
        const response = await this.request(
            'login',
            {
                method: 'POST',
                body: JSON.stringify({ refresh: this.refreshToken }),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            true
        );
        if (response?.status !== 200) {
            await this.onTokenError();
            return false;
        }
        const { token } = await response?.json();
        this.token = token;
        this.onTokenUpdate(this.token);

        return true;
    }

    handleQueryString(query: any) {
        const params = new URLSearchParams();

        for (const key of Object.keys(query) as (keyof UserType)[]) {
            if (query[\`\${key}\`]) {
                params.append(key, query[\`\${key}\`]?.toString() || '');
            }
        }

        return params.toString();
    }

    async login(body: UserLoginType): Promise<UserLoginResultType> {
        const res = await this.post<UserLoginResultType>('/login', body, true);

        this.token = res?.token;
        this.refreshToken = res?.refresh;

        this.onTokenUpdate(this.token);

        return res;
    }

    async createUser(body: UserLoginType): Promise<UserLoginResultType> {
        const res = await this.post<UserLoginResultType>('/register', body, true);

        this.token = res?.token;
        this.refreshToken = res?.refresh;

        return res;
    }

:methods:}

export type ConstructorType = {
    url: string;
    token?: string;
    refreshToken?: string;
    onTokenUpdate?: any;
    onTokenError?: any;
};

export type ResultType<T> = {
    total: number;
    data: T[];
};

export type MetadataType = {
    _page?: number;
    _limit?: number;
    _sort?: string[];
    _fields?: string[];
    _search?: string;
};

export type UserType = {
    name?: string;
};

export type UserLoginType = {
    login?: string;
    email?: string;
    password: string;
    isInit?: string;
};

export type UserLoginResultType = {
    id: number;
    login: string;
    statuses: string[];
    token: string;
    firstName?: string;
    secondName?: string;
    email: string;
    refresh: string;
};

export type ImagePostType = string | File | Blob;

export type ImageGetType = {
  id: string;
  timeCreated: string;
  timeUpdated: string;
  name: string;
  path: string;
  type?: string;
  group: string;
  sizeName?: string;
  userId?: number;
};
:types:
export type StatusesBodyType = any;

export type StatusesResponseType = any;

export type Tree2ResponseType = any;
`;

module.exports = ({ flow }) => {
  const methodNames = {
    post: 'add',
    put: 'update',
  };

  const getName = (method, path) => {
    const a = path.split('/').filter(Boolean)
      .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
      .map((str) => str.replace(/[_-]+(.)/g, (l) => l.replace(/[_-]+/, '').toUpperCase()))
      .map((str) => str.replace(/:+(.)/g, (l) => l.toUpperCase().replace(':', 'By')));

    const pluralName = method === 'get' ? a[0] : a[0].replace(/s$/, '');

    if (a.length === 1) return pluralName;
    if (a.length === 2 && a[1].match(/^By/)) return pluralName + a[1];
    if (a.length === 2) return `${a[1]}In${a[0]}`;
    if (a.length === 3 && a[1].match(/^By/)) return `${a[2]}For${pluralName}${a[1].replace(/^:/, '')}`;
    if (a.length === 3 && a[2].match(/^By/)) return `${a[1]}${a[2]}In${a[0]}`;
    if (a.length >= 4 && a[1].match(/^By/) && a[3].match(/^By/)) return `${a[2]}${a[3]}In${a[0]}${a[1]}`;
    return a.join('');
  };

  let apiClientMethodNamesAll = {};
  const types = {};
  const methodTypes = {};
  const requiredFields = {};
  const summaries = {};

  for (const { swagger } of flow) {
    for (const val of Object.values(swagger || {})) {
      for (const params of Object.values(val || {})) {
        const { apiClientMethodNames } = params || {};
        apiClientMethodNamesAll = { ...apiClientMethodNamesAll, ...apiClientMethodNames };
      }
    }
  }

  for (const { swagger } of flow) {
    for (const [path, val] of Object.entries(swagger || {})) {
      for (const [method, params] of Object.entries(val || {})) {
        const {
          summary,
          queryParameters,
          schema = {},
          required,
          forbiddenFieldsToAdd = [],
          additionalFields,
        } = params || {};
        const functionName = apiClientMethodNamesAll?.[`${method} ${path}`] || (methodNames[`${method}`] || method) + getName(method, path);
        // console.log(functionName, '<<', method, path);

        summaries[`${functionName}`] = summary;

        const schemaShort = Object.keys(schema).reduce((acc, key) => { if (forbiddenFieldsToAdd.includes(key)) return acc; acc[`${key}`] = schema[`${key}`].data_type || schema[`${key}`]; return acc; }, {});

        // console.log({
        //   queryParameters, schemaShort, forbiddenFieldsToAdd, additionalFields,
        // });

        const a = path.split('/').filter(Boolean)
          .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
          .map((str) => str.replace(/[_-]+(.)/g, (l) => l.replace(/[_-]+/, '').toUpperCase()))
          .map((str) => str.replace(/^(\d)/g, 'n$1'));
          // .map((str) => str.replace(/:+(.)/g, (l) => l.toUpperCase()));

        if (!methodTypes[`${functionName}`]) methodTypes[`${functionName}`] = { method, path };

        if (additionalFields) {
          for (const [afName, afValue] of Object.entries(additionalFields)) {
            schemaShort[`${afName}`] = afValue === 'image' ? 'ImagePostType' : afValue;
            if (['post', 'put', 'patch'].includes(method) && afValue?.match(/^(images?|files?)$/)) {
              if (!methodTypes[`${functionName}`].fileFieldNames) methodTypes[`${functionName}`].fileFieldNames = [];
              methodTypes[`${functionName}`].fileFieldNames.push(afName);
            }
          }
        }

        if (a.length === 1) {
          types[`${a[0]}QueryType`] = queryParameters;
          methodTypes[`${functionName}`].query = `${a[0]}QueryType`;

          types[`${a[0]}ResponseType`] = { ...types[`${a[0]}ResponseType`], ...schemaShort };
          methodTypes[`${functionName}`].response = `${a[0]}ResponseType`;

          if (['post', 'put', 'patch'].includes(method)) {
            types[`${a[0]}BodyType`] = { ...types[`${a[0]}BodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[0]}BodyType`;
          }

          if (method === 'post') {
            requiredFields[`${a[0]}PostBodyType`] = [].concat(requiredFields[`${a[0]}PostBodyType`], required).filter(Boolean);
            types[`${a[0]}PostBodyType`] = { ...types[`${a[0]}PostBodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[0]}PostBodyType`;
          }
        }

        if (a.length === 2 && !a[1].match(/^:/)) {
          types[`${a[1]}QueryType`] = queryParameters;
          methodTypes[`${functionName}`].query = `${a[1]}QueryType`;

          types[`${a[1]}ResponseType`] = { ...types[`${a[1]}ResponseType`], ...schemaShort };
          methodTypes[`${functionName}`].response = `${a[1]}ResponseType`;

          if (['post', 'put', 'patch'].includes(method)) {
            types[`${a[1]}BodyType`] = { ...types[`${a[1]}BodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[1]}BodyType`;
          }

          if (method === 'post') {
            requiredFields[`${a[1]}PostBodyType`] = [].concat(requiredFields[`${a[1]}PostBodyType`], required).filter(Boolean);
            types[`${a[1]}PostBodyType`] = { ...types[`${a[1]}PostBodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[1]}PostBodyType`;
          }
        }

        if (a.length === 3 && !a[2].match(/^:/)) {
          types[`${a[2]}QueryType`] = queryParameters;
          methodTypes[`${functionName}`].query = `${a[2]}QueryType`;

          types[`${a[2]}ResponseType`] = { ...types[`${a[2]}ResponseType`], ...schemaShort };
          methodTypes[`${functionName}`].response = `${a[2]}ResponseType`;

          if (['post', 'put', 'patch'].includes(method)) {
            types[`${a[2]}BodyType`] = { ...types[`${a[2]}BodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[2]}BodyType`;
          }

          if (method === 'post') {
            requiredFields[`${a[2]}PostBodyType`] = [].concat(requiredFields[`${a[2]}PostBodyType`], required).filter(Boolean);
            types[`${a[2]}PostBodyType`] = { ...types[`${a[2]}PostBodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[2]}PostBodyType`;
          }
        }

        if (a.length === 2 && a[1].match(/^:/)) {
          methodTypes[`${functionName}`].response = `${a[0]}ResponseType`;

          if (['put', 'patch'].includes(method)) {
            types[`${a[0]}BodyType`] = { ...types[`${a[0]}BodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[0]}BodyType`;
          }

          if (method === 'post') {
            types[`${a[0]}PostBodyType`] = { ...types[`${a[0]}PostBodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[0]}PostBodyType`;
          }
        }

        if (a.length === 3 && !a[1].match(/^:/) && a[2].match(/^:/)) {
          methodTypes[`${functionName}`].response = `${a[1]}ResponseType`;

          if (['put', 'patch'].includes(method)) {
            types[`${a[1]}BodyType`] = { ...types[`${a[1]}BodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[1]}BodyType`;
          }

          if (method === 'post') {
            types[`${a[1]}PostBodyType`] = { ...types[`${a[1]}PostBodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[1]}PostBodyType`;
          }
        }

        if (a.length === 4 && !a[2].match(/^:/) && a[3].match(/^:/)) {
          methodTypes[`${functionName}`].response = `${a[2]}ResponseType`;

          if (['put', 'patch'].includes(method)) {
            types[`${a[2]}BodyType`] = { ...types[`${a[2]}BodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[2]}BodyType`;
          }

          if (method === 'post') {
            types[`${a[2]}PostBodyType`] = { ...types[`${a[2]}PostBodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[2]}PostBodyType`;
          }
        }

        const paramsType = a.filter((item) => item.match(/^:/)).reduce((acc, cur) => ({ ...acc, [`${cur.replaceAll(':', '')}`]: 'integer | string' }), {});
        if (Object.keys(paramsType).length) {
          types[`${a[0]}ParamsType`] = { ...types[`${a[0]}ParamsType`], ...paramsType };
          methodTypes[`${functionName}`].params = `${a[0]}ParamsType`;
        }
      }
    }
  }

  // console.log(methodTypes);
  // console.log(types)

  const updateTypes = (name) => ([key, typeOrigin]) => {
    const typesMatch = {
      integer: 'number',
      real: 'number',
      string: 'string',
      text: 'string',
      'character varying': 'string',
      boolean: 'boolean',
      jsonb: 'object',
      'timestamp with time zone': 'string',
      ARRAY: '(string | number)[]',
      ImagePostType: 'ImagePostType',
      images: 'ImageGetType[]',
    };
    let type = typesMatch[`${typeOrigin}`];
    if (!type) type = typesMatch[`${typeOrigin?.type}`];
    if (!type) type = 'string | number | boolean';
    const opt = requiredFields[`${name}`]?.includes(key) ? '' : '?';
    return `${key}${opt}: ${type};`;
  };

  let typesStr = '';
  for (const [name, data] of Object.entries(types || {})) {
    const dataStr = Object.entries(data || {}).map(updateTypes(name)).map((item) => `    ${item}`).join('\n');
    if (dataStr) {
      typesStr += `
export type ${name} = {
${dataStr}
};
`;
    } else {
      typesStr += `
export type ${name} = any;
`;
    }
  }

  let methodsStr = '';
  for (const [name, data] of Object.entries(methodTypes || {})) {
    const {
      method: m, path: p2, params: prms, query: q, response: r, body: b, fileFieldNames,
    } = data || {};

    if (!['get', 'post', 'put', 'patch', 'delete'].includes(m)) continue;

    let p = p2;

    if (prms) {
      p = p.replace(/_(.)/g, (l) => l.replace('_', '').toUpperCase())
        // .replace(/:(.)/g, (l) => l.toUpperCase())
        .replace(/^(\d)/g, 'n$1')
        .replace(/:([^/]+)/g, `\${params.$1}`);
    }

    const resultType = m !== 'get' ? r : `ResultType<${r}>`;

    const params = [];
    const hasQuery = m === 'get' && q;
    if (prms) params.push(`params: ${prms}`);
    if (hasQuery) params.push(`query: ${q}`);
    if (b) params.push(`body: ${b}`);

    const queryProcess = !hasQuery ? '' : 'const queryString = this.handleQueryString(query);\n        ';
    let bodyParams = ['post', 'put', 'patch'].includes(m) && b ? ', body' : '';
    if (fileFieldNames) bodyParams += `, [${fileFieldNames.map((k) => `'${k}'`).join(', ')}]`;
    const pQuery = hasQuery ? `${p}?\${queryString}` : p;
    const pQuoted = pQuery.match(/\$\{/) ? `\`${pQuery}\`` : `'${pQuery}'`;
    const pQuoted2 = p.match(/\$\{/) ? `\`${p}\`` : `'${p}'`;
    const endpoint = hasQuery ? `queryString ? ${pQuoted} : ${pQuoted2}` : pQuoted2;
    const comment = summaries[`${name}`] ? `\n    /***\n     * ${summaries[`${name}`]}\n     */` : '';

    methodsStr += `${comment}
    async ${name}(${params.join(', ')}): Promise<${resultType}> {
        ${queryProcess}return this.${m}${fileFieldNames ? 'Formdata' : ''}<${resultType}>(${endpoint}${bodyParams});
    }
`;
  }

  // console.log(typesStr);
  // console.log(methodsStr);

  return template.replace(':methods:', methodsStr).replace(':types:', typesStr);
};
