/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@arr/every/module.js":
/*!*******************************************!*\
  !*** ./node_modules/@arr/every/module.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(arr, cb) {
	var i=0, len=arr.length;

	for (; i < len; i++) {
		if (!cb(arr[i], i, arr)) {
			return false;
		}
	}

	return true;
}


/***/ }),

/***/ "./node_modules/@polka/url/index.js":
/*!******************************************!*\
  !*** ./node_modules/@polka/url/index.js ***!
  \******************************************/
/***/ ((module) => {

module.exports = function (req) {
	let url = req.url;
	if (url === void 0) return url;

	let obj = req._parsedUrl;
	if (obj && obj._raw === url) return obj;

	obj = {};
	obj.query = obj.search = null;
	obj.href = obj.path = obj.pathname = url;

	let idx = url.indexOf('?', 1);
	if (idx !== -1) {
		obj.search = url.substring(idx);
		obj.query = obj.search.substring(1);
		obj.pathname = url.substring(0, idx);
	}

	obj._raw = url;

	return (req._parsedUrl = obj);
}


/***/ }),

/***/ "./node_modules/polka/index.js":
/*!*************************************!*\
  !*** ./node_modules/polka/index.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const http = __webpack_require__(/*! http */ "http");
const Router = __webpack_require__(/*! trouter */ "./node_modules/trouter/index.js");
const { parse } = __webpack_require__(/*! querystring */ "querystring");
const parser = __webpack_require__(/*! @polka/url */ "./node_modules/@polka/url/index.js");

function lead(x) {
	return x.charCodeAt(0) === 47 ? x : ('/' + x);
}

function value(x) {
  let y = x.indexOf('/', 1);
  return y > 1 ? x.substring(0, y) : x;
}

function mutate(str, req) {
	req.url = req.url.substring(str.length) || '/';
	req.path = req.path.substring(str.length) || '/';
}

function onError(err, req, res, next) {
	let code = (res.statusCode = err.code || err.status || 500);
	res.end(err.length && err || err.message || http.STATUS_CODES[code]);
}

class Polka extends Router {
	constructor(opts={}) {
		super(opts);
		this.apps = {};
		this.wares = [];
		this.bwares = {};
		this.parse = parser;
		this.server = opts.server;
		this.handler = this.handler.bind(this);
		this.onError = opts.onError || onError; // catch-all handler
		this.onNoMatch = opts.onNoMatch || this.onError.bind(null, { code:404 });
	}

	add(method, pattern, ...fns) {
		let base = lead(value(pattern));
		if (this.apps[base] !== void 0) throw new Error(`Cannot mount ".${method.toLowerCase()}('${lead(pattern)}')" because a Polka application at ".use('${base}')" already exists! You should move this handler into your Polka application instead.`);
		return super.add(method, pattern, ...fns);
	}

	use(base, ...fns) {
		if (typeof base === 'function') {
			this.wares = this.wares.concat(base, fns);
		} else if (base === '/') {
			this.wares = this.wares.concat(fns);
		} else {
			base = lead(base);
			fns.forEach(fn => {
				if (fn instanceof Polka) {
					this.apps[base] = fn;
				} else {
					let arr = this.bwares[base] || [];
					arr.length > 0 || arr.push((r, _, nxt) => (mutate(base, r),nxt()));
					this.bwares[base] = arr.concat(fn);
				}
			});
		}
		return this; // chainable
	}

	listen() {
		(this.server = this.server || http.createServer()).on('request', this.handler);
		this.server.listen.apply(this.server, arguments);
		return this;
	}

	handler(req, res, info) {
		info = info || this.parse(req);
		let fns=[], arr=this.wares, obj=this.find(req.method, info.pathname);
		req.originalUrl = req.originalUrl || req.url;
		let base = value(req.path = info.pathname);
		if (this.bwares[base] !== void 0) {
			arr = arr.concat(this.bwares[base]);
		}
		if (obj) {
			fns = obj.handlers;
			req.params = obj.params;
		} else if (this.apps[base] !== void 0) {
			mutate(base, req); info.pathname=req.path; //=> updates
			fns.push(this.apps[base].handler.bind(null, req, res, info));
		} else if (fns.length === 0) {
			fns.push(this.onNoMatch);
		}
		// Grab addl values from `info`
		req.search = info.search;
		req.query = parse(info.query);
		// Exit if only a single function
		let i=0, len=arr.length, num=fns.length;
		if (len === i && num === 1) return fns[0](req, res);
		// Otherwise loop thru all middlware
		let next = err => err ? this.onError(err, req, res, next) : loop();
		let loop = _ => res.finished || (i < len) && arr[i++](req, res, next);
		arr = arr.concat(fns);
		len += num;
		loop(); // init
	}
}

module.exports = opts => new Polka(opts);


/***/ }),

/***/ "./node_modules/trouter/index.js":
/*!***************************************!*\
  !*** ./node_modules/trouter/index.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { exec, match, parse } = __webpack_require__(/*! matchit */ "./node_modules/matchit/lib/matchit.mjs");

class Trouter {
	constructor(opts) {
		this.opts = opts || {};
		this.routes = {};
		this.handlers = {};

		this.all = this.add.bind(this, '*');
		this.get = this.add.bind(this, 'GET');
		this.head = this.add.bind(this, 'HEAD');
		this.patch = this.add.bind(this, 'PATCH');
		this.options = this.add.bind(this, 'OPTIONS');
    this.connect = this.add.bind(this, 'CONNECT');
		this.delete = this.add.bind(this, 'DELETE');
    this.trace = this.add.bind(this, 'TRACE');
		this.post = this.add.bind(this, 'POST');
		this.put = this.add.bind(this, 'PUT');
	}

	add(method, pattern, ...fns) {
		// Save decoded pattern info
		if (this.routes[method] === void 0) this.routes[method]=[];
		this.routes[method].push(parse(pattern));
		// Save route handler(s)
		if (this.handlers[method] === void 0) this.handlers[method]={};
		this.handlers[method][pattern] = fns;
		// Allow chainable
		return this;
	}

	find(method, url) {
		let arr = match(url, this.routes[method] || []);
		if (arr.length === 0) {
			arr = match(url, this.routes[method='*'] || []);
			if (!arr.length) return false;
		}
		return {
			params: exec(url, arr),
			handlers: this.handlers[method][arr[0].old]
		};
	}
}

module.exports = Trouter;


/***/ }),

/***/ "./src/SidebarProvider.ts":
/*!********************************!*\
  !*** ./src/SidebarProvider.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SidebarProvider = void 0;
const vscode = __webpack_require__(/*! vscode */ "vscode");
const getNonce_1 = __webpack_require__(/*! ./getNonce */ "./src/getNonce.ts");
const constants_1 = __webpack_require__(/*! ./constants */ "./src/constants.ts");
const TokenManager_1 = __webpack_require__(/*! ./TokenManager */ "./src/TokenManager.ts");
const authenticate_1 = __webpack_require__(/*! ./authenticate */ "./src/authenticate.ts");
class SidebarProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "logout": {
                    TokenManager_1.TokenManager.setToken("");
                    break;
                }
                case "authenticate": {
                    (0, authenticate_1.authenticate)(() => {
                        webviewView.webview.postMessage({
                            type: 'token',
                            value: TokenManager_1.TokenManager.getToken()
                        });
                    });
                    break;
                }
                case "get-token": {
                    webviewView.webview.postMessage({
                        type: 'token',
                        value: TokenManager_1.TokenManager.getToken()
                    });
                    break;
                }
                case "onInfo": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });
    }
    revive(panel) {
        this._view = panel;
    }
    _getHtmlForWebview(webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js"));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css"));
        // Use a nonce to only allow a specific script to be run. 
        const nonce = (0, getNonce_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
                 -->
                <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <script nonce=${nonce}>
                    const tsvscode = acquireVsCodeApi();
					const apiBaseUrl = ${JSON.stringify(constants_1.apiBaseUrl)}
                </script>
			</head>
            <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>`;
    }
}
exports.SidebarProvider = SidebarProvider;


/***/ }),

/***/ "./src/TokenManager.ts":
/*!*****************************!*\
  !*** ./src/TokenManager.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokenManager = void 0;
const KEY = 'todosheettoken';
class TokenManager {
    static setToken(token) {
        return this.globalState.update(KEY, token);
    }
    static getToken() {
        return this.globalState.get(KEY);
    }
}
exports.TokenManager = TokenManager;


/***/ }),

/***/ "./src/authenticate.ts":
/*!*****************************!*\
  !*** ./src/authenticate.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.authenticate = void 0;
const vscode = __webpack_require__(/*! vscode */ "vscode");
const constants_1 = __webpack_require__(/*! ./constants */ "./src/constants.ts");
const polka = __webpack_require__(/*! polka */ "./node_modules/polka/index.js");
const TokenManager_1 = __webpack_require__(/*! ./TokenManager */ "./src/TokenManager.ts");
const authenticate = (fn) => {
    const app = polka();
    app.get(`/auth/:token`, async (req, res) => {
        const { token } = req.params;
        if (!token) {
            res.end("<h1>Something went wrong</h1>");
            return;
        }
        await TokenManager_1.TokenManager.setToken(token);
        fn();
        res.end("<h1>Auth was successful, you can close this now</h1>");
        app.server.close();
    });
    app.listen(54321, (err) => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
        }
        else {
            vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(`${constants_1.apiBaseUrl}/auth/github`));
        }
    });
};
exports.authenticate = authenticate;


/***/ }),

/***/ "./src/constants.ts":
/*!**************************!*\
  !*** ./src/constants.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// export const apiBaseUrl = 'http://localhost:3000'
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.apiBaseUrl = void 0;
exports.apiBaseUrl = 'https://todosheet.up.railway.app';


/***/ }),

/***/ "./src/getNonce.ts":
/*!*************************!*\
  !*** ./src/getNonce.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getNonce = void 0;
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;


/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("querystring");

/***/ }),

/***/ "./node_modules/matchit/lib/matchit.mjs":
/*!**********************************************!*\
  !*** ./node_modules/matchit/lib/matchit.mjs ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "exec": () => (/* binding */ exec),
/* harmony export */   "match": () => (/* binding */ match),
/* harmony export */   "parse": () => (/* binding */ parse)
/* harmony export */ });
/* harmony import */ var _arr_every__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @arr/every */ "./node_modules/@arr/every/module.js");




const SEP = '/';
// Types ~> static, param, any, optional
const STYPE=0, PTYPE=1, ATYPE=2, OTYPE=3;
// Char Codes ~> / : *
const SLASH=47, COLON=58, ASTER=42, QMARK=63;

function strip(str) {
	if (str === SEP) return str;
	(str.charCodeAt(0) === SLASH) && (str=str.substring(1));
	var len = str.length - 1;
	return str.charCodeAt(len) === SLASH ? str.substring(0, len) : str;
}

function split(str) {
	return (str=strip(str)) === SEP ? [SEP] : str.split(SEP);
}

function isMatch(arr, obj, idx) {
	idx = arr[idx];
	return (obj.val === idx && obj.type === STYPE) || (idx === SEP ? obj.type > PTYPE : obj.type !== STYPE && (idx || '').endsWith(obj.end));
}

function match(str, all) {
	var i=0, tmp, segs=split(str), len=segs.length, l;
	var fn = isMatch.bind(isMatch, segs);

	for (; i < all.length; i++) {
		tmp = all[i];
		if ((l=tmp.length) === len || (l < len && tmp[l-1].type === ATYPE) || (l > len && tmp[l-1].type === OTYPE)) {
			if ((0,_arr_every__WEBPACK_IMPORTED_MODULE_0__["default"])(tmp, fn)) return tmp;
		}
	}

	return [];
}

function parse(str) {
	if (str === SEP) {
		return [{ old:str, type:STYPE, val:str, end:'' }];
	}

	var c, x, t, sfx, nxt=strip(str), i=-1, j=0, len=nxt.length, out=[];

	while (++i < len) {
		c = nxt.charCodeAt(i);

		if (c === COLON) {
			j = i + 1; // begining of param
			t = PTYPE; // set type
			x = 0; // reset mark
			sfx = '';

			while (i < len && nxt.charCodeAt(i) !== SLASH) {
				c = nxt.charCodeAt(i);
				if (c === QMARK) {
					x=i; t=OTYPE;
				} else if (c === 46 && sfx.length === 0) {
					sfx = nxt.substring(x=i);
				}
				i++; // move on
			}

			out.push({
				old: str,
				type: t,
				val: nxt.substring(j, x||i),
				end: sfx
			});

			// shorten string & update pointers
			nxt=nxt.substring(i); len-=i; i=0;

			continue; // loop
		} else if (c === ASTER) {
			out.push({
				old: str,
				type: ATYPE,
				val: nxt.substring(i),
				end: ''
			});
			continue; // loop
		} else {
			j = i;
			while (i < len && nxt.charCodeAt(i) !== SLASH) {
				++i; // skip to next slash
			}
			out.push({
				old: str,
				type: STYPE,
				val: nxt.substring(j, i),
				end: ''
			});
			// shorten string & update pointers
			nxt=nxt.substring(i); len-=i; i=j=0;
		}
	}

	return out;
}

function exec(str, arr) {
	var i=0, x, y, segs=split(str), out={};
	for (; i < arr.length; i++) {
		x=segs[i]; y=arr[i];
		if (x === SEP) continue;
		if (x !== void 0 && y.type | 2 === OTYPE) {
			out[ y.val ] = x.replace(y.end, '');
		}
	}
	return out;
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
var exports = __webpack_exports__;
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(/*! vscode */ "vscode");
const SidebarProvider_1 = __webpack_require__(/*! ./SidebarProvider */ "./src/SidebarProvider.ts");
const TokenManager_1 = __webpack_require__(/*! ./TokenManager */ "./src/TokenManager.ts");
function activate(context) {
    TokenManager_1.TokenManager.globalState = context.globalState;
    const sidebarProvider = new SidebarProvider_1.SidebarProvider(context.extensionUri);
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    item.text = '$(squirrel) Add Todo';
    item.command = 'todosheet.addTodo';
    item.show();
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("todosheet-sidebar", sidebarProvider));
    context.subscriptions.push(vscode.commands.registerCommand("todosheet.addTodo", () => {
        const { activeTextEditor } = vscode.window;
        if (!activeTextEditor) {
            vscode.window.showInformationMessage("No active text editor");
            return;
        }
        const text = activeTextEditor.document.getText(activeTextEditor.selection);
        sidebarProvider._view?.webview.postMessage({
            type: "new-todo",
            value: text,
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand("todosheet.helloWorld", () => {
        vscode.window.showInformationMessage("token value: " + TokenManager_1.TokenManager.getToken());
        // HelloWorldPanel.createOrShow(context.extensionUri)
    }));
    // context.subscriptions.push(
    // 	vscode.commands.registerCommand("todosheet.authenticate", () => {
    // 		authenticate()
    // 	})
    // )
    context.subscriptions.push(vscode.commands.registerCommand("todosheet.refresh", async () => {
        // HelloWorldPanel.kill()
        // HelloWorldPanel.createOrShow(context.extensionUri)
        await vscode.commands.executeCommand("workbench.action.closeSidebar");
        await vscode.commands.executeCommand("workbench.view.extension.todosheet-sidebar-view");
        setTimeout(() => {
            vscode.commands.executeCommand("workbench.action.webview.openDeveloperTools");
        }, 500);
    }));
    context.subscriptions.push(vscode.commands.registerCommand("todosheet.askQuestion", async () => {
        const answer = await vscode.window.showInformationMessage("How was your day?", "Good", "Bad");
        if (answer === "Bad") {
            vscode.window.showInformationMessage("Sorry to hear that :(");
        }
        else {
            console.log({ answer });
        }
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map