# Changelog

## [19.4.1] (2023-06-25)

* Add the `/drawio` endpoint to retrieve a `CSV` file that can be imported into draw.io.

## [19.3.1] (2023-06-25)

* Move the connection to the database flow to the `constructor`.
* Add `api.initRoutes(flow)` to initialize any routes flow before starting the server.
* The `flow` parameter can now be a `function` that takes the `api` object as a parameter.
* Add the `api.startServer()` method.
