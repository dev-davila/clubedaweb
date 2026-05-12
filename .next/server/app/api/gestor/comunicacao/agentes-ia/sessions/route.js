"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/gestor/comunicacao/agentes-ia/sessions/route";
exports.ids = ["app/api/gestor/comunicacao/agentes-ia/sessions/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute&page=%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute.ts&appDir=%2FUsers%2Fdavilasolutions%2FProjects%2Fwork%2Fdavila%2Fclubedaweb%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fdavilasolutions%2FProjects%2Fwork%2Fdavila%2Fclubedaweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute&page=%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute.ts&appDir=%2FUsers%2Fdavilasolutions%2FProjects%2Fwork%2Fdavila%2Fclubedaweb%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fdavilasolutions%2FProjects%2Fwork%2Fdavila%2Fclubedaweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_davilasolutions_Projects_work_davila_clubedaweb_app_api_gestor_comunicacao_agentes_ia_sessions_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/gestor/comunicacao/agentes-ia/sessions/route.ts */ \"(rsc)/./app/api/gestor/comunicacao/agentes-ia/sessions/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/gestor/comunicacao/agentes-ia/sessions/route\",\n        pathname: \"/api/gestor/comunicacao/agentes-ia/sessions\",\n        filename: \"route\",\n        bundlePath: \"app/api/gestor/comunicacao/agentes-ia/sessions/route\"\n    },\n    resolvedPagePath: \"/Users/davilasolutions/Projects/work/davila/clubedaweb/app/api/gestor/comunicacao/agentes-ia/sessions/route.ts\",\n    nextConfigOutput,\n    userland: _Users_davilasolutions_Projects_work_davila_clubedaweb_app_api_gestor_comunicacao_agentes_ia_sessions_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/gestor/comunicacao/agentes-ia/sessions/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZnZXN0b3IlMkZjb211bmljYWNhbyUyRmFnZW50ZXMtaWElMkZzZXNzaW9ucyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGZ2VzdG9yJTJGY29tdW5pY2FjYW8lMkZhZ2VudGVzLWlhJTJGc2Vzc2lvbnMlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZnZXN0b3IlMkZjb211bmljYWNhbyUyRmFnZW50ZXMtaWElMkZzZXNzaW9ucyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmRhdmlsYXNvbHV0aW9ucyUyRlByb2plY3RzJTJGd29yayUyRmRhdmlsYSUyRmNsdWJlZGF3ZWIlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGZGF2aWxhc29sdXRpb25zJTJGUHJvamVjdHMlMkZ3b3JrJTJGZGF2aWxhJTJGY2x1YmVkYXdlYiZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDOEQ7QUFDM0k7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hcHAvP2YzODUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiL1VzZXJzL2RhdmlsYXNvbHV0aW9ucy9Qcm9qZWN0cy93b3JrL2RhdmlsYS9jbHViZWRhd2ViL2FwcC9hcGkvZ2VzdG9yL2NvbXVuaWNhY2FvL2FnZW50ZXMtaWEvc2Vzc2lvbnMvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2dlc3Rvci9jb211bmljYWNhby9hZ2VudGVzLWlhL3Nlc3Npb25zL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvZ2VzdG9yL2NvbXVuaWNhY2FvL2FnZW50ZXMtaWEvc2Vzc2lvbnNcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2dlc3Rvci9jb211bmljYWNhby9hZ2VudGVzLWlhL3Nlc3Npb25zL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL2RhdmlsYXNvbHV0aW9ucy9Qcm9qZWN0cy93b3JrL2RhdmlsYS9jbHViZWRhd2ViL2FwcC9hcGkvZ2VzdG9yL2NvbXVuaWNhY2FvL2FnZW50ZXMtaWEvc2Vzc2lvbnMvcm91dGUudHNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2dlc3Rvci9jb211bmljYWNhby9hZ2VudGVzLWlhL3Nlc3Npb25zL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute&page=%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute.ts&appDir=%2FUsers%2Fdavilasolutions%2FProjects%2Fwork%2Fdavila%2Fclubedaweb%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fdavilasolutions%2FProjects%2Fwork%2Fdavila%2Fclubedaweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/gestor/comunicacao/agentes-ia/sessions/route.ts":
/*!*****************************************************************!*\
  !*** ./app/api/gestor/comunicacao/agentes-ia/sessions/route.ts ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET),\n/* harmony export */   dynamic: () => (/* binding */ dynamic)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_auth_options__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/auth-options */ \"(rsc)/./lib/auth-options.ts\");\n/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/db */ \"(rsc)/./lib/db.ts\");\nconst dynamic = \"force-dynamic\";\n\n\n\n\n// GET - List sessions with filters\nasync function GET(request) {\n    const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth_options__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n    if (!session?.user?.id) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Unauthorized\"\n        }, {\n            status: 401\n        });\n    }\n    const { searchParams } = new URL(request.url);\n    const status = searchParams.get(\"status\");\n    const department = searchParams.get(\"department\");\n    const instanceId = searchParams.get(\"instanceId\");\n    const search = searchParams.get(\"search\");\n    const page = parseInt(searchParams.get(\"page\") || \"1\");\n    const limit = parseInt(searchParams.get(\"limit\") || \"30\");\n    const where = {\n        ownerId: session.user.id\n    };\n    if (status) where.status = status;\n    if (department) where.department = department;\n    if (instanceId) where.instanceId = instanceId;\n    if (search) {\n        where.OR = [\n            {\n                phone: {\n                    contains: search\n                }\n            },\n            {\n                metadata: {\n                    contains: search\n                }\n            }\n        ];\n    }\n    const [sessions, total] = await Promise.all([\n        _lib_db__WEBPACK_IMPORTED_MODULE_3__.prisma.aiSession.findMany({\n            where,\n            orderBy: {\n                updatedAt: \"desc\"\n            },\n            take: limit,\n            skip: (page - 1) * limit,\n            include: {\n                instance: {\n                    select: {\n                        instanceName: true,\n                        phoneNumber: true\n                    }\n                },\n                agentConfig: {\n                    select: {\n                        name: true\n                    }\n                },\n                assignedUser: {\n                    select: {\n                        name: true,\n                        email: true\n                    }\n                },\n                _count: {\n                    select: {\n                        messages: true\n                    }\n                }\n            }\n        }),\n        _lib_db__WEBPACK_IMPORTED_MODULE_3__.prisma.aiSession.count({\n            where\n        })\n    ]);\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        sessions,\n        total,\n        page,\n        limit\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2dlc3Rvci9jb211bmljYWNhby9hZ2VudGVzLWlhL3Nlc3Npb25zL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBTyxNQUFNQSxVQUFVLGdCQUFnQjtBQUNpQjtBQUNYO0FBQ0k7QUFDZjtBQUVsQyxtQ0FBbUM7QUFDNUIsZUFBZUssSUFBSUMsT0FBb0I7SUFDNUMsTUFBTUMsVUFBVSxNQUFNTCwyREFBZ0JBLENBQUNDLDBEQUFXQTtJQUNsRCxJQUFJLENBQUNJLFNBQVNDLE1BQU1DLElBQUk7UUFDdEIsT0FBT1IscURBQVlBLENBQUNTLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQWUsR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDcEU7SUFFQSxNQUFNLEVBQUVDLFlBQVksRUFBRSxHQUFHLElBQUlDLElBQUlSLFFBQVFTLEdBQUc7SUFDNUMsTUFBTUgsU0FBU0MsYUFBYUcsR0FBRyxDQUFDO0lBQ2hDLE1BQU1DLGFBQWFKLGFBQWFHLEdBQUcsQ0FBQztJQUNwQyxNQUFNRSxhQUFhTCxhQUFhRyxHQUFHLENBQUM7SUFDcEMsTUFBTUcsU0FBU04sYUFBYUcsR0FBRyxDQUFDO0lBQ2hDLE1BQU1JLE9BQU9DLFNBQVNSLGFBQWFHLEdBQUcsQ0FBQyxXQUFXO0lBQ2xELE1BQU1NLFFBQVFELFNBQVNSLGFBQWFHLEdBQUcsQ0FBQyxZQUFZO0lBRXBELE1BQU1PLFFBQWE7UUFBRUMsU0FBU2pCLFFBQVFDLElBQUksQ0FBQ0MsRUFBRTtJQUFDO0lBQzlDLElBQUlHLFFBQVFXLE1BQU1YLE1BQU0sR0FBR0E7SUFDM0IsSUFBSUssWUFBWU0sTUFBTU4sVUFBVSxHQUFHQTtJQUNuQyxJQUFJQyxZQUFZSyxNQUFNTCxVQUFVLEdBQUdBO0lBQ25DLElBQUlDLFFBQVE7UUFDVkksTUFBTUUsRUFBRSxHQUFHO1lBQ1Q7Z0JBQUVDLE9BQU87b0JBQUVDLFVBQVVSO2dCQUFPO1lBQUU7WUFDOUI7Z0JBQUVTLFVBQVU7b0JBQUVELFVBQVVSO2dCQUFPO1lBQUU7U0FDbEM7SUFDSDtJQUVBLE1BQU0sQ0FBQ1UsVUFBVUMsTUFBTSxHQUFHLE1BQU1DLFFBQVFDLEdBQUcsQ0FBQztRQUMxQzVCLDJDQUFNQSxDQUFDNkIsU0FBUyxDQUFDQyxRQUFRLENBQUM7WUFDeEJYO1lBQ0FZLFNBQVM7Z0JBQUVDLFdBQVc7WUFBTztZQUM3QkMsTUFBTWY7WUFDTmdCLE1BQU0sQ0FBQ2xCLE9BQU8sS0FBS0U7WUFDbkJpQixTQUFTO2dCQUNQQyxVQUFVO29CQUFFQyxRQUFRO3dCQUFFQyxjQUFjO3dCQUFNQyxhQUFhO29CQUFLO2dCQUFFO2dCQUM5REMsYUFBYTtvQkFBRUgsUUFBUTt3QkFBRUksTUFBTTtvQkFBSztnQkFBRTtnQkFDdENDLGNBQWM7b0JBQUVMLFFBQVE7d0JBQUVJLE1BQU07d0JBQU1FLE9BQU87b0JBQUs7Z0JBQUU7Z0JBQ3BEQyxRQUFRO29CQUFFUCxRQUFRO3dCQUFFUSxVQUFVO29CQUFLO2dCQUFFO1lBQ3ZDO1FBQ0Y7UUFDQTdDLDJDQUFNQSxDQUFDNkIsU0FBUyxDQUFDaUIsS0FBSyxDQUFDO1lBQUUzQjtRQUFNO0tBQ2hDO0lBRUQsT0FBT3RCLHFEQUFZQSxDQUFDUyxJQUFJLENBQUM7UUFBRW1CO1FBQVVDO1FBQU9WO1FBQU1FO0lBQU07QUFDMUQiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hcHAvLi9hcHAvYXBpL2dlc3Rvci9jb211bmljYWNhby9hZ2VudGVzLWlhL3Nlc3Npb25zL3JvdXRlLnRzPzJkZDUiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGR5bmFtaWMgPSBcImZvcmNlLWR5bmFtaWNcIjtcbmltcG9ydCB7IE5leHRSZXF1ZXN0LCBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcbmltcG9ydCB7IGdldFNlcnZlclNlc3Npb24gfSBmcm9tIFwibmV4dC1hdXRoXCI7XG5pbXBvcnQgeyBhdXRoT3B0aW9ucyB9IGZyb20gXCJAL2xpYi9hdXRoLW9wdGlvbnNcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9kYlwiO1xuXG4vLyBHRVQgLSBMaXN0IHNlc3Npb25zIHdpdGggZmlsdGVyc1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0OiBOZXh0UmVxdWVzdCkge1xuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgZ2V0U2VydmVyU2Vzc2lvbihhdXRoT3B0aW9ucyk7XG4gIGlmICghc2Vzc2lvbj8udXNlcj8uaWQpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogXCJVbmF1dGhvcml6ZWRcIiB9LCB7IHN0YXR1czogNDAxIH0pO1xuICB9XG5cbiAgY29uc3QgeyBzZWFyY2hQYXJhbXMgfSA9IG5ldyBVUkwocmVxdWVzdC51cmwpO1xuICBjb25zdCBzdGF0dXMgPSBzZWFyY2hQYXJhbXMuZ2V0KFwic3RhdHVzXCIpO1xuICBjb25zdCBkZXBhcnRtZW50ID0gc2VhcmNoUGFyYW1zLmdldChcImRlcGFydG1lbnRcIik7XG4gIGNvbnN0IGluc3RhbmNlSWQgPSBzZWFyY2hQYXJhbXMuZ2V0KFwiaW5zdGFuY2VJZFwiKTtcbiAgY29uc3Qgc2VhcmNoID0gc2VhcmNoUGFyYW1zLmdldChcInNlYXJjaFwiKTtcbiAgY29uc3QgcGFnZSA9IHBhcnNlSW50KHNlYXJjaFBhcmFtcy5nZXQoXCJwYWdlXCIpIHx8IFwiMVwiKTtcbiAgY29uc3QgbGltaXQgPSBwYXJzZUludChzZWFyY2hQYXJhbXMuZ2V0KFwibGltaXRcIikgfHwgXCIzMFwiKTtcblxuICBjb25zdCB3aGVyZTogYW55ID0geyBvd25lcklkOiBzZXNzaW9uLnVzZXIuaWQgfTtcbiAgaWYgKHN0YXR1cykgd2hlcmUuc3RhdHVzID0gc3RhdHVzO1xuICBpZiAoZGVwYXJ0bWVudCkgd2hlcmUuZGVwYXJ0bWVudCA9IGRlcGFydG1lbnQ7XG4gIGlmIChpbnN0YW5jZUlkKSB3aGVyZS5pbnN0YW5jZUlkID0gaW5zdGFuY2VJZDtcbiAgaWYgKHNlYXJjaCkge1xuICAgIHdoZXJlLk9SID0gW1xuICAgICAgeyBwaG9uZTogeyBjb250YWluczogc2VhcmNoIH0gfSxcbiAgICAgIHsgbWV0YWRhdGE6IHsgY29udGFpbnM6IHNlYXJjaCB9IH0sXG4gICAgXTtcbiAgfVxuXG4gIGNvbnN0IFtzZXNzaW9ucywgdG90YWxdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgIHByaXNtYS5haVNlc3Npb24uZmluZE1hbnkoe1xuICAgICAgd2hlcmUsXG4gICAgICBvcmRlckJ5OiB7IHVwZGF0ZWRBdDogXCJkZXNjXCIgfSxcbiAgICAgIHRha2U6IGxpbWl0LFxuICAgICAgc2tpcDogKHBhZ2UgLSAxKSAqIGxpbWl0LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBpbnN0YW5jZTogeyBzZWxlY3Q6IHsgaW5zdGFuY2VOYW1lOiB0cnVlLCBwaG9uZU51bWJlcjogdHJ1ZSB9IH0sXG4gICAgICAgIGFnZW50Q29uZmlnOiB7IHNlbGVjdDogeyBuYW1lOiB0cnVlIH0gfSxcbiAgICAgICAgYXNzaWduZWRVc2VyOiB7IHNlbGVjdDogeyBuYW1lOiB0cnVlLCBlbWFpbDogdHJ1ZSB9IH0sXG4gICAgICAgIF9jb3VudDogeyBzZWxlY3Q6IHsgbWVzc2FnZXM6IHRydWUgfSB9LFxuICAgICAgfSxcbiAgICB9KSxcbiAgICBwcmlzbWEuYWlTZXNzaW9uLmNvdW50KHsgd2hlcmUgfSksXG4gIF0pO1xuXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHNlc3Npb25zLCB0b3RhbCwgcGFnZSwgbGltaXQgfSk7XG59XG4iXSwibmFtZXMiOlsiZHluYW1pYyIsIk5leHRSZXNwb25zZSIsImdldFNlcnZlclNlc3Npb24iLCJhdXRoT3B0aW9ucyIsInByaXNtYSIsIkdFVCIsInJlcXVlc3QiLCJzZXNzaW9uIiwidXNlciIsImlkIiwianNvbiIsImVycm9yIiwic3RhdHVzIiwic2VhcmNoUGFyYW1zIiwiVVJMIiwidXJsIiwiZ2V0IiwiZGVwYXJ0bWVudCIsImluc3RhbmNlSWQiLCJzZWFyY2giLCJwYWdlIiwicGFyc2VJbnQiLCJsaW1pdCIsIndoZXJlIiwib3duZXJJZCIsIk9SIiwicGhvbmUiLCJjb250YWlucyIsIm1ldGFkYXRhIiwic2Vzc2lvbnMiLCJ0b3RhbCIsIlByb21pc2UiLCJhbGwiLCJhaVNlc3Npb24iLCJmaW5kTWFueSIsIm9yZGVyQnkiLCJ1cGRhdGVkQXQiLCJ0YWtlIiwic2tpcCIsImluY2x1ZGUiLCJpbnN0YW5jZSIsInNlbGVjdCIsImluc3RhbmNlTmFtZSIsInBob25lTnVtYmVyIiwiYWdlbnRDb25maWciLCJuYW1lIiwiYXNzaWduZWRVc2VyIiwiZW1haWwiLCJfY291bnQiLCJtZXNzYWdlcyIsImNvdW50Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./app/api/gestor/comunicacao/agentes-ia/sessions/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/auth-options.ts":
/*!*****************************!*\
  !*** ./lib/auth-options.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @next-auth/prisma-adapter */ \"(rsc)/./node_modules/@next-auth/prisma-adapter/dist/index.js\");\n/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/db */ \"(rsc)/./lib/db.ts\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_3__);\n\n\n\n\nconst authOptions = {\n    adapter: (0,_next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_1__.PrismaAdapter)(_lib_db__WEBPACK_IMPORTED_MODULE_2__.prisma),\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    return null;\n                }\n                const user = await _lib_db__WEBPACK_IMPORTED_MODULE_2__.prisma.user.findUnique({\n                    where: {\n                        email: credentials.email\n                    }\n                });\n                if (!user) {\n                    return null;\n                }\n                const isValid = await bcryptjs__WEBPACK_IMPORTED_MODULE_3___default().compare(credentials.password, user.password);\n                if (!isValid) {\n                    return null;\n                }\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: user.name,\n                    role: user.role\n                };\n            }\n        })\n    ],\n    session: {\n        strategy: \"jwt\"\n    },\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.role = user.role;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session?.user) {\n                session.user.role = token.role;\n                session.user.id = token.sub;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/gestor/login\"\n    }\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYXV0aC1vcHRpb25zLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNrRTtBQUNSO0FBQ3hCO0FBQ0o7QUFFdkIsTUFBTUksY0FBK0I7SUFDMUNDLFNBQVNKLHdFQUFhQSxDQUFDQywyQ0FBTUE7SUFDN0JJLFdBQVc7UUFDVE4sMkVBQW1CQSxDQUFDO1lBQ2xCTyxNQUFNO1lBQ05DLGFBQWE7Z0JBQ1hDLE9BQU87b0JBQUVDLE9BQU87b0JBQVNDLE1BQU07Z0JBQVE7Z0JBQ3ZDQyxVQUFVO29CQUFFRixPQUFPO29CQUFZQyxNQUFNO2dCQUFXO1lBQ2xEO1lBQ0EsTUFBTUUsV0FBVUwsV0FBVztnQkFDekIsSUFBSSxDQUFDQSxhQUFhQyxTQUFTLENBQUNELGFBQWFJLFVBQVU7b0JBQ2pELE9BQU87Z0JBQ1Q7Z0JBQ0EsTUFBTUUsT0FBTyxNQUFNWiwyQ0FBTUEsQ0FBQ1ksSUFBSSxDQUFDQyxVQUFVLENBQUM7b0JBQ3hDQyxPQUFPO3dCQUFFUCxPQUFPRCxZQUFZQyxLQUFLO29CQUFDO2dCQUNwQztnQkFDQSxJQUFJLENBQUNLLE1BQU07b0JBQ1QsT0FBTztnQkFDVDtnQkFDQSxNQUFNRyxVQUFVLE1BQU1kLHVEQUFjLENBQUNLLFlBQVlJLFFBQVEsRUFBRUUsS0FBS0YsUUFBUTtnQkFDeEUsSUFBSSxDQUFDSyxTQUFTO29CQUNaLE9BQU87Z0JBQ1Q7Z0JBQ0EsT0FBTztvQkFDTEUsSUFBSUwsS0FBS0ssRUFBRTtvQkFDWFYsT0FBT0ssS0FBS0wsS0FBSztvQkFDakJGLE1BQU1PLEtBQUtQLElBQUk7b0JBQ2ZhLE1BQU1OLEtBQUtNLElBQUk7Z0JBQ2pCO1lBQ0Y7UUFDRjtLQUNEO0lBQ0RDLFNBQVM7UUFDUEMsVUFBVTtJQUNaO0lBQ0FDLFdBQVc7UUFDVCxNQUFNQyxLQUFJLEVBQUVDLEtBQUssRUFBRVgsSUFBSSxFQUFFO1lBQ3ZCLElBQUlBLE1BQU07Z0JBQ1JXLE1BQU1MLElBQUksR0FBRyxLQUFjQSxJQUFJO1lBQ2pDO1lBQ0EsT0FBT0s7UUFDVDtRQUNBLE1BQU1KLFNBQVEsRUFBRUEsT0FBTyxFQUFFSSxLQUFLLEVBQUU7WUFDOUIsSUFBSUosU0FBU1AsTUFBTTtnQkFDaEJPLFFBQVFQLElBQUksQ0FBU00sSUFBSSxHQUFHSyxNQUFNTCxJQUFJO2dCQUN0Q0MsUUFBUVAsSUFBSSxDQUFTSyxFQUFFLEdBQUdNLE1BQU1DLEdBQUc7WUFDdEM7WUFDQSxPQUFPTDtRQUNUO0lBQ0Y7SUFDQU0sT0FBTztRQUNMQyxRQUFRO0lBQ1Y7QUFDRixFQUFFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYXBwLy4vbGliL2F1dGgtb3B0aW9ucy50cz9hYTcxIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRBdXRoT3B0aW9ucyB9IGZyb20gXCJuZXh0LWF1dGhcIjtcbmltcG9ydCBDcmVkZW50aWFsc1Byb3ZpZGVyIGZyb20gXCJuZXh0LWF1dGgvcHJvdmlkZXJzL2NyZWRlbnRpYWxzXCI7XG5pbXBvcnQgeyBQcmlzbWFBZGFwdGVyIH0gZnJvbSBcIkBuZXh0LWF1dGgvcHJpc21hLWFkYXB0ZXJcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9kYlwiO1xuaW1wb3J0IGJjcnlwdCBmcm9tIFwiYmNyeXB0anNcIjtcblxuZXhwb3J0IGNvbnN0IGF1dGhPcHRpb25zOiBOZXh0QXV0aE9wdGlvbnMgPSB7XG4gIGFkYXB0ZXI6IFByaXNtYUFkYXB0ZXIocHJpc21hKSxcbiAgcHJvdmlkZXJzOiBbXG4gICAgQ3JlZGVudGlhbHNQcm92aWRlcih7XG4gICAgICBuYW1lOiBcImNyZWRlbnRpYWxzXCIsXG4gICAgICBjcmVkZW50aWFsczoge1xuICAgICAgICBlbWFpbDogeyBsYWJlbDogXCJFbWFpbFwiLCB0eXBlOiBcImVtYWlsXCIgfSxcbiAgICAgICAgcGFzc3dvcmQ6IHsgbGFiZWw6IFwiUGFzc3dvcmRcIiwgdHlwZTogXCJwYXNzd29yZFwiIH1cbiAgICAgIH0sXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgaWYgKCFjcmVkZW50aWFscz8uZW1haWwgfHwgIWNyZWRlbnRpYWxzPy5wYXNzd29yZCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgICAgICB3aGVyZTogeyBlbWFpbDogY3JlZGVudGlhbHMuZW1haWwgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaXNWYWxpZCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKGNyZWRlbnRpYWxzLnBhc3N3b3JkLCB1c2VyLnBhc3N3b3JkKTtcbiAgICAgICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZDogdXNlci5pZCxcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICBuYW1lOiB1c2VyLm5hbWUsXG4gICAgICAgICAgcm9sZTogdXNlci5yb2xlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSlcbiAgXSxcbiAgc2Vzc2lvbjoge1xuICAgIHN0cmF0ZWd5OiBcImp3dFwiXG4gIH0sXG4gIGNhbGxiYWNrczoge1xuICAgIGFzeW5jIGp3dCh7IHRva2VuLCB1c2VyIH0pIHtcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIHRva2VuLnJvbGUgPSAodXNlciBhcyBhbnkpLnJvbGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfSxcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xuICAgICAgaWYgKHNlc3Npb24/LnVzZXIpIHtcbiAgICAgICAgKHNlc3Npb24udXNlciBhcyBhbnkpLnJvbGUgPSB0b2tlbi5yb2xlO1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkuaWQgPSB0b2tlbi5zdWI7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2Vzc2lvbjtcbiAgICB9XG4gIH0sXG4gIHBhZ2VzOiB7XG4gICAgc2lnbkluOiBcIi9nZXN0b3IvbG9naW5cIlxuICB9XG59O1xuIl0sIm5hbWVzIjpbIkNyZWRlbnRpYWxzUHJvdmlkZXIiLCJQcmlzbWFBZGFwdGVyIiwicHJpc21hIiwiYmNyeXB0IiwiYXV0aE9wdGlvbnMiLCJhZGFwdGVyIiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsInVzZXIiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJpc1ZhbGlkIiwiY29tcGFyZSIsImlkIiwicm9sZSIsInNlc3Npb24iLCJzdHJhdGVneSIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwic3ViIiwicGFnZXMiLCJzaWduSW4iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/auth-options.ts\n");

/***/ }),

/***/ "(rsc)/./lib/db.ts":
/*!*******************!*\
  !*** ./lib/db.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\n// Lazy initialization - only create PrismaClient when first accessed\nfunction getPrismaClient() {\n    if (!globalForPrisma.prisma) {\n        // Append connection_limit to DATABASE_URL if not already present\n        const url = process.env.DATABASE_URL || \"\";\n        if (url && !url.includes(\"connection_limit=\")) {\n            const separator = url.includes(\"?\") ? \"&\" : \"?\";\n            process.env.DATABASE_URL = `${url}${separator}connection_limit=5`;\n        }\n        globalForPrisma.prisma = new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\n    }\n    return globalForPrisma.prisma;\n}\n// Export a proxy that lazily initializes PrismaClient on first access\nconst prisma = new Proxy({}, {\n    get (_target, prop) {\n        const client = getPrismaClient();\n        const value = client[prop];\n        if (typeof value === \"function\") {\n            return value.bind(client);\n        }\n        return value;\n    }\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZGIudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTZDO0FBRTdDLE1BQU1DLGtCQUFrQkM7QUFJeEIscUVBQXFFO0FBQ3JFLFNBQVNDO0lBQ1AsSUFBSSxDQUFDRixnQkFBZ0JHLE1BQU0sRUFBRTtRQUMzQixpRUFBaUU7UUFDakUsTUFBTUMsTUFBTUMsUUFBUUMsR0FBRyxDQUFDQyxZQUFZLElBQUk7UUFDeEMsSUFBSUgsT0FBTyxDQUFDQSxJQUFJSSxRQUFRLENBQUMsc0JBQXNCO1lBQzdDLE1BQU1DLFlBQVlMLElBQUlJLFFBQVEsQ0FBQyxPQUFPLE1BQU07WUFDNUNILFFBQVFDLEdBQUcsQ0FBQ0MsWUFBWSxHQUFHLENBQUMsRUFBRUgsSUFBSSxFQUFFSyxVQUFVLGtCQUFrQixDQUFDO1FBQ25FO1FBQ0FULGdCQUFnQkcsTUFBTSxHQUFHLElBQUlKLHdEQUFZQTtJQUMzQztJQUNBLE9BQU9DLGdCQUFnQkcsTUFBTTtBQUMvQjtBQUVBLHNFQUFzRTtBQUMvRCxNQUFNQSxTQUFTLElBQUlPLE1BQU0sQ0FBQyxHQUFtQjtJQUNsREMsS0FBSUMsT0FBTyxFQUFFQyxJQUF3QjtRQUNuQyxNQUFNQyxTQUFTWjtRQUNmLE1BQU1hLFFBQVFELE1BQU0sQ0FBQ0QsS0FBSztRQUMxQixJQUFJLE9BQU9FLFVBQVUsWUFBWTtZQUMvQixPQUFPQSxNQUFNQyxJQUFJLENBQUNGO1FBQ3BCO1FBQ0EsT0FBT0M7SUFDVDtBQUNGLEdBQUUiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9hcHAvLi9saWIvZGIudHM/MWRmMCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCdcblxuY29uc3QgZ2xvYmFsRm9yUHJpc21hID0gZ2xvYmFsVGhpcyBhcyB1bmtub3duIGFzIHtcbiAgcHJpc21hOiBQcmlzbWFDbGllbnQgfCB1bmRlZmluZWRcbn1cblxuLy8gTGF6eSBpbml0aWFsaXphdGlvbiAtIG9ubHkgY3JlYXRlIFByaXNtYUNsaWVudCB3aGVuIGZpcnN0IGFjY2Vzc2VkXG5mdW5jdGlvbiBnZXRQcmlzbWFDbGllbnQoKTogUHJpc21hQ2xpZW50IHtcbiAgaWYgKCFnbG9iYWxGb3JQcmlzbWEucHJpc21hKSB7XG4gICAgLy8gQXBwZW5kIGNvbm5lY3Rpb25fbGltaXQgdG8gREFUQUJBU0VfVVJMIGlmIG5vdCBhbHJlYWR5IHByZXNlbnRcbiAgICBjb25zdCB1cmwgPSBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwgfHwgJydcbiAgICBpZiAodXJsICYmICF1cmwuaW5jbHVkZXMoJ2Nvbm5lY3Rpb25fbGltaXQ9JykpIHtcbiAgICAgIGNvbnN0IHNlcGFyYXRvciA9IHVybC5pbmNsdWRlcygnPycpID8gJyYnIDogJz8nXG4gICAgICBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkwgPSBgJHt1cmx9JHtzZXBhcmF0b3J9Y29ubmVjdGlvbl9saW1pdD01YFxuICAgIH1cbiAgICBnbG9iYWxGb3JQcmlzbWEucHJpc21hID0gbmV3IFByaXNtYUNsaWVudCgpXG4gIH1cbiAgcmV0dXJuIGdsb2JhbEZvclByaXNtYS5wcmlzbWFcbn1cblxuLy8gRXhwb3J0IGEgcHJveHkgdGhhdCBsYXppbHkgaW5pdGlhbGl6ZXMgUHJpc21hQ2xpZW50IG9uIGZpcnN0IGFjY2Vzc1xuZXhwb3J0IGNvbnN0IHByaXNtYSA9IG5ldyBQcm94eSh7fSBhcyBQcmlzbWFDbGllbnQsIHtcbiAgZ2V0KF90YXJnZXQsIHByb3A6IGtleW9mIFByaXNtYUNsaWVudCkge1xuICAgIGNvbnN0IGNsaWVudCA9IGdldFByaXNtYUNsaWVudCgpXG4gICAgY29uc3QgdmFsdWUgPSBjbGllbnRbcHJvcF1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdmFsdWUuYmluZChjbGllbnQpXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG59KVxuIl0sIm5hbWVzIjpbIlByaXNtYUNsaWVudCIsImdsb2JhbEZvclByaXNtYSIsImdsb2JhbFRoaXMiLCJnZXRQcmlzbWFDbGllbnQiLCJwcmlzbWEiLCJ1cmwiLCJwcm9jZXNzIiwiZW52IiwiREFUQUJBU0VfVVJMIiwiaW5jbHVkZXMiLCJzZXBhcmF0b3IiLCJQcm94eSIsImdldCIsIl90YXJnZXQiLCJwcm9wIiwiY2xpZW50IiwidmFsdWUiLCJiaW5kIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/db.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/object-hash","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/@next-auth","vendor-chunks/preact-render-to-string","vendor-chunks/oidc-token-hash","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute&page=%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgestor%2Fcomunicacao%2Fagentes-ia%2Fsessions%2Froute.ts&appDir=%2FUsers%2Fdavilasolutions%2FProjects%2Fwork%2Fdavila%2Fclubedaweb%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fdavilasolutions%2FProjects%2Fwork%2Fdavila%2Fclubedaweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();