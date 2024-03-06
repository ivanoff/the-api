const template = `const getRandomInt = (max: number) => Math.floor(Math.random() * Math.floor(max));
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
                result = await fetch(\`\${this.url}/\${endpoint}\`, {
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

        if (!noToken && response?.status === 403) {
            const a = await this.handle403();
            if (a) response = await this.request(endpoint, options, noToken);
        }

        return response;
    }

    async get<T>(endpoint: string, noToken?: boolean): Promise<T> {
        const response = await this.fetchWithToken(endpoint, undefined, noToken);
        return response?.json();
    }

    async post<T>(endpoint: string, data: any, noToken?: boolean): Promise<T> {
        const response = await this.fetchWithToken(
            endpoint,
            {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
            },
            noToken
        );
        return response?.json();
    }

    async put<T>(endpoint: string, data: any): Promise<T> {
        const response = await this.fetchWithToken(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response?.json();
    }

    async patch<T>(endpoint: string, data: any): Promise<T> {
        const response = await this.fetchWithToken(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
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

    private async handle403(): Promise<boolean> {
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

        for (const key of Object.keys(params) as (keyof UserType)[]) {
            if (query[\`\${key}\`]) {
                params.append(key, query[\`\${key}\`]?.toString() || '');
            }
        }

        return params.toString();
    }

    async login(body: UserLoginType): Promise<UserLoginResultType> {
        const res = await this.post<UserLoginResultType>('login', body, true);

        this.token = res?.token;
        this.refreshToken = res?.refresh;

        this.onTokenUpdate(this.token);

        return res;
    }

    async createUser(body: UserLoginType): Promise<UserLoginResultType> {
        const res = await this.post<UserLoginResultType>('register', body, true);

        this.token = res?.token;
        this.refreshToken = res?.refresh;

        return res;
    }

:methods:
}

:types:
`;

module.exports = ({ flow }) => {
  const methodNames = {
    post: 'add',
    put: 'update',
  };

  const getName = (method, path) => {
    const a = path.split('/').filter(Boolean)
      .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
      .map((str) => str.replace(/_+(.)/g, (l) => l.replace(/_+/, '').toUpperCase()))
      .map((str) => str.replace(/:+(.)/g, (l) => l.toUpperCase()));

    const firstName = method === 'get' ? a[0] : a[0].replace(/s$/, '');

    if (a.length === 1) return firstName;
    if (a.length === 2 && a[1].match(/^:/)) return firstName + a[1].replace(/^:(.*)/, 'By$1');
    if (a.length === 2) return `${a[1]}In${a[0]}`;
    if (a.length === 3 && a[1].match(/^:/)) return `${a[2]}By${firstName}${a[1].replace(/^:/, '')}`;
    if (a.length === 3 && a[2].match(/^:/)) return `${a[1]}By${a[2].replace(/^:/, '')}In${a[0]}`;
    if (a.length === 4 && a[1].match(/^:/) && a[3].match(/^:/)) return `${a[2]}By${a[3].replace(/^:/, '')}In${a[0]}By${a[1].replace(/^:/, '')}`;

    return path;
  };

  let apiClientMethodNamesAll = {};
  const types = {};
  const methodTypes = {};

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
          queryParameters,
          schema = {},
          forbiddenFieldsToAdd = [],
          additionalFields,
        } = params || {};
        const functionName = apiClientMethodNamesAll?.[`${method} ${path}`] || (methodNames[`${method}`] || method) + getName(method, path);
        console.log(functionName, '<<', method, path);

        const schemaShort = Object.keys(schema).reduce((acc, key) => { if (forbiddenFieldsToAdd.includes(key)) return acc; acc[`${key}`] = schema[`${key}`].data_type; return acc; }, {});
        console.log({
          queryParameters, schemaShort, forbiddenFieldsToAdd, additionalFields,
        });

        const a = path.split('/').filter(Boolean)
          .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
          .map((str) => str.replace(/_+(.)/g, (l) => l.replace(/_+/, '').toUpperCase()))
          .map((str) => str.replace(/:+(.)/g, (l) => l.toUpperCase()));

        if (!methodTypes[`${functionName}`]) methodTypes[`${functionName}`] = { method, path };

        if (a.length === 1) {
          types[`${a[0]}QueryType`] = queryParameters;
          methodTypes[`${functionName}`].query = `${a[0]}QueryType`;

          types[`${a[0]}ResponseType`] = { ...types[`${a[0]}ResponseType`], ...schemaShort };
          methodTypes[`${functionName}`].response = `${a[0]}ResponseType`;

          if (['post', 'put', 'patch'].includes(method)) {
            types[`${a[0]}BodyType`] = { ...types[`${a[0]}BodyType`], ...schemaShort };
            methodTypes[`${functionName}`].body = `${a[0]}BodyType`;
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
        }

        if (a.length === 2 && a[1].match(/^:/)) {
          methodTypes[`${functionName}`].response = `${a[0]}ResponseType`;

          if (['post', 'put', 'patch'].includes(method)) {
            methodTypes[`${functionName}`].body = `${a[0]}BodyType`;
          }
        }

        if (a.length === 3 && !a[1].match(/^:/) && a[2].match(/^:/)) {
          methodTypes[`${functionName}`].response = `${a[1]}ResponseType`;

          if (['post', 'put', 'patch'].includes(method)) {
            methodTypes[`${functionName}`].body = `${a[1]}BodyType`;
          }
        }

        if (a.length === 4 && !a[2].match(/^:/) && a[3].match(/^:/)) {
          methodTypes[`${functionName}`].response = `${a[2]}ResponseType`;

          if (['post', 'put', 'patch'].includes(method)) {
            methodTypes[`${functionName}`].body = `${a[2]}BodyType`;
          }
        }

        const paramsType = a.filter((item) => item.match(/^:/)).reduce((acc, cur) => ({ ...acc, [`${cur.replaceAll(':', '')}`]: 'integer | string' }), {});
        if (Object.keys(paramsType).length) {
          types[`${a[0]}ParamsType`] = paramsType;
          methodTypes[`${functionName}`].params = `${a[0]}ParamsType`;
        }
      }
    }
  }

  console.log(methodTypes);
  // console.log(types)

  const updateTypes = ([key, typeOrigin]) => {
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
    };
    let type = typesMatch[`${typeOrigin}`];
    if (!type) type = typesMatch[`${typeOrigin?.type}`];
    if (!type) type = 'string | number | boolean';

    return `${key}?: ${type};`;
  };

  let typesStr = '';
  for (const [name, data] of Object.entries(types || {})) {
    const dataStr = Object.entries(data || {}).map(updateTypes).map((item) => `  ${item}`).join('\n');
    if (dataStr) {
      typesStr += `
export type ${name} = {
${dataStr}
};    
`;
    }
  }

  let methodsStr = '';
  for (const [name, data] of Object.entries(methodTypes || {})) {
    const {
      method: m, path: p2, params: prms, query: q, response: r, body: b,
    } = data || {};
    let p = p2;

    if (prms) p = p.replace(/:(.)/g, (l) => l.toUpperCase()).replace(/:([^/]+)/g, `\${params.$1}`);

    const resultType = m !== 'get' ? r : `ResultType<${r}>`;

    const params = [];
    const hasQuery = m === 'get' && q;
    if (prms) params.push(`params: ${prms}`);
    if (hasQuery) params.push(`query: ${q}`);
    if (b) params.push(`body: ${b}`);

    const queryProcess = !hasQuery ? '' : 'const queryString = this.handleQueryString(query)\n        ';
    const endpoint = !hasQuery ? prms ? `\`${p}\`` : `'${p}'` : `queryString ? \`${p}?\${queryString}\` : '${p}'`;

    methodsStr += `
  async ${name}(${params.join(', ')}): Promise<${resultType}> {
      ${queryProcess}return this.${m}<${resultType}>(${endpoint});
  }
    `;
  }

  // console.log(typesStr);
  // console.log(methodsStr);

  return template.replace(':methods:', methodsStr).replace(':types:', typesStr);
};
