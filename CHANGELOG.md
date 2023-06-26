# Changelog

## [19.4.3] (2023-06-26)

* The new parameter `joinOnDemand` has been added to the definitions. It allows you to select which table to join using the _join parameter in queries. Here's an example of how to use it:
```javascript
joinOnDemand: [
  {
    table: 'lang',
    where: 'lang.key = table.description'
  }
]
```

In this example, the joinOnDemand parameter specifies that the lang table should be joined based on the condition `lang.key = table.description`.

To retrieve the result with the joined lang table, you can make a request like this: `GET /tables?_join=lang`

This request will perform the join operation and include the joined data from the lang table in the response.

## [19.4.2] (2023-06-26)

* add `encodeURIComponent` posibility to email templates. Example of usage: '{{{email}}}'

## [19.4.1] (2023-06-25)

* Add the `/drawio` endpoint to retrieve the database schema as a `CSV` file that can be imported into draw.io.

## [19.3.1] (2023-06-25)

* Move the connection to the database flow to the `constructor`.
* Add `api.initRoutes(flow)` to initialize any routes flow before starting the server.
* The `flow` parameter can now be a `function` that takes the `api` object as a parameter.
* Add the `api.startServer()` method.
