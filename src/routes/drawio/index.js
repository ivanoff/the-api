module.exports = (api) => api.router().tag('system').get('/drawio', (ctx) => {
  const { hideConnections = [], hideTables = [] } = ctx.query;
  const tables = Object.keys(api.tablesInfo)
    .filter((item) => ![].concat(hideTables).includes(item));

  let maxCount = 0;
  let tableKey = 1;
  const tablesId = {};
  for (const table of tables) {
    tablesId[`${table}`] = tableKey++;
    const columns = Object.keys(api.tablesInfo[`${table}`]);
    if (columns.length > maxCount) maxCount = columns.length;
  }

  const l = [];
  for (let i = 0; i < maxCount; i++) l.push(`n${i}`);
  const labels = `# labels: {"label1" : "<b>%name%</b><hr>%${l.join('%<br>%')}%"}`;
  const header = `id,name,${l.join(',')},refs,labeltype`;

  const body = [];
  for (const table of tables) {
    const columns = Object.keys(api.tablesInfo[`${table}`]);
    if (!columns[`${maxCount - 1}`]) columns[`${maxCount - 1}`] = '';

    const refs = columns.map((column) => api.tablesInfo[`${table}`][`${column}`]?.references)
      .filter(Boolean)
      .map(({ foreign_table_schema: tSchema, foreign_table_name: tName }) => `${tSchema}.${tName}`)
      .filter((item) => ![].concat(hideConnections).includes(item))
      .map((item) => tablesId[`${item}`]);

    const id = tablesId[`${table}`];
    body.push(`${id},${table},${columns.join(',')},"${refs.join(',')}",label1`);
  }

  ctx.body = `## **********************************************************
## the-api Draw.io DB schema
## **********************************************************
## Configuration
## **********************************************************
${labels}
# labelname: labeltype
# style:whiteSpace=wrap;html=1;rounded=1;fillColor=#ffffff;strokeColor=#000000;
# namespace: csvimport-
# connect: {"from": "refs", "to": "id", "style": "curved=1; fontSize=11;"}
# width: auto
# height: auto
# padding: 5
# ignore: id,refs
# link: url
# nodespacing: 60
# levelspacing: 60
# edgespacing: 40
# layout: auto
## **********************************************************
## CSV Data
## **********************************************************
${header}
${body.join('\n')}
`;
});
