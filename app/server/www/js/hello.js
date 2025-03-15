'use strict';

function createElement(query, ns) {
  const {
    tag,
    id,
    className
  } = parse(query);
  const element = ns ? document.createElementNS(ns, tag) : document.createElement(tag);
  if (id) {
    element.id = id;
  }
  if (className) {
    {
      element.className = className;
    }
  }
  return element;
}
function parse(query) {
  const chunks = query.split(/([.#])/);
  let className = "";
  let id = "";
  for (let i = 1; i < chunks.length; i += 2) {
    switch (chunks[i]) {
      case ".":
        className += ` ${chunks[i + 1]}`;
        break;
      case "#":
        id = chunks[i + 1];
    }
  }
  return {
    className: className.trim(),
    tag: chunks[0] || "div",
    id
  };
}
function html(query, ...args) {
  let element;
  const type = typeof query;
  if (type === "string") {
    element = createElement(query);
  } else if (type === "function") {
    const Query = query;
    element = new Query(...args);
  } else {
    throw new Error("At least one argument required");
  }
  parseArgumentsInternal(getEl(element), args);
  return element;
}
const el = html;
html.extend = function extendHtml(...args) {
  return html.bind(this, ...args);
};
function doUnmount(child, childEl, parentEl) {
  const hooks = childEl.__redom_lifecycle;
  if (hooksAreEmpty(hooks)) {
    childEl.__redom_lifecycle = {};
    return;
  }
  let traverse = parentEl;
  if (childEl.__redom_mounted) {
    trigger(childEl, "onunmount");
  }
  while (traverse) {
    const parentHooks = traverse.__redom_lifecycle || {};
    for (const hook in hooks) {
      if (parentHooks[hook]) {
        parentHooks[hook] -= hooks[hook];
      }
    }
    if (hooksAreEmpty(parentHooks)) {
      traverse.__redom_lifecycle = null;
    }
    traverse = traverse.parentNode;
  }
}
function hooksAreEmpty(hooks) {
  if (hooks == null) {
    return true;
  }
  for (const key in hooks) {
    if (hooks[key]) {
      return false;
    }
  }
  return true;
}

/* global Node, ShadowRoot */

const hookNames = ["onmount", "onremount", "onunmount"];
const shadowRootAvailable = typeof window !== "undefined" && "ShadowRoot" in window;
function mount(parent, _child, before, replace) {
  let child = _child;
  const parentEl = getEl(parent);
  const childEl = getEl(child);
  if (child === childEl && childEl.__redom_view) {
    // try to look up the view if not provided
    child = childEl.__redom_view;
  }
  if (child !== childEl) {
    childEl.__redom_view = child;
  }
  const wasMounted = childEl.__redom_mounted;
  const oldParent = childEl.parentNode;
  if (wasMounted && oldParent !== parentEl) {
    doUnmount(child, childEl, oldParent);
  }
  {
    parentEl.appendChild(childEl);
  }
  doMount(child, childEl, parentEl, oldParent);
  return child;
}
function trigger(el, eventName) {
  if (eventName === "onmount" || eventName === "onremount") {
    el.__redom_mounted = true;
  } else if (eventName === "onunmount") {
    el.__redom_mounted = false;
  }
  const hooks = el.__redom_lifecycle;
  if (!hooks) {
    return;
  }
  const view = el.__redom_view;
  let hookCount = 0;
  view?.[eventName]?.();
  for (const hook in hooks) {
    if (hook) {
      hookCount++;
    }
  }
  if (hookCount) {
    let traverse = el.firstChild;
    while (traverse) {
      const next = traverse.nextSibling;
      trigger(traverse, eventName);
      traverse = next;
    }
  }
}
function doMount(child, childEl, parentEl, oldParent) {
  if (!childEl.__redom_lifecycle) {
    childEl.__redom_lifecycle = {};
  }
  const hooks = childEl.__redom_lifecycle;
  const remount = parentEl === oldParent;
  let hooksFound = false;
  for (const hookName of hookNames) {
    if (!remount) {
      // if already mounted, skip this phase
      if (child !== childEl) {
        // only Views can have lifecycle events
        if (hookName in child) {
          hooks[hookName] = (hooks[hookName] || 0) + 1;
        }
      }
    }
    if (hooks[hookName]) {
      hooksFound = true;
    }
  }
  if (!hooksFound) {
    childEl.__redom_lifecycle = {};
    return;
  }
  let traverse = parentEl;
  let triggered = false;
  if (remount || traverse?.__redom_mounted) {
    trigger(childEl, remount ? "onremount" : "onmount");
    triggered = true;
  }
  while (traverse) {
    const parent = traverse.parentNode;
    if (!traverse.__redom_lifecycle) {
      traverse.__redom_lifecycle = {};
    }
    const parentHooks = traverse.__redom_lifecycle;
    for (const hook in hooks) {
      parentHooks[hook] = (parentHooks[hook] || 0) + hooks[hook];
    }
    if (triggered) {
      break;
    }
    if (traverse.nodeType === Node.DOCUMENT_NODE || shadowRootAvailable && traverse instanceof ShadowRoot || parent?.__redom_mounted) {
      trigger(traverse, remount ? "onremount" : "onmount");
      triggered = true;
    }
    traverse = parent;
  }
}
function setStyle(view, arg1, arg2) {
  const el = getEl(view);
  if (typeof arg1 === "object") {
    for (const key in arg1) {
      setStyleValue(el, key, arg1[key]);
    }
  } else {
    setStyleValue(el, arg1, arg2);
  }
}
function setStyleValue(el, key, value) {
  el.style[key] = value == null ? "" : value;
}

/* global SVGElement */

const xlinkns = "http://www.w3.org/1999/xlink";
function setAttrInternal(view, arg1, arg2, initial) {
  const el = getEl(view);
  const isObj = typeof arg1 === "object";
  if (isObj) {
    for (const key in arg1) {
      setAttrInternal(el, key, arg1[key]);
    }
  } else {
    const isSVG = el instanceof SVGElement;
    const isFunc = typeof arg2 === "function";
    if (arg1 === "style" && typeof arg2 === "object") {
      setStyle(el, arg2);
    } else if (isSVG && isFunc) {
      el[arg1] = arg2;
    } else if (arg1 === "dataset") {
      setData(el, arg2);
    } else if (!isSVG && (arg1 in el || isFunc) && arg1 !== "list") {
      el[arg1] = arg2;
    } else {
      if (isSVG && arg1 === "xlink") {
        setXlink(el, arg2);
        return;
      }
      if (arg1 === "class") {
        setClassName(el, arg2);
        return;
      }
      if (arg2 == null) {
        el.removeAttribute(arg1);
      } else {
        el.setAttribute(arg1, arg2);
      }
    }
  }
}
function setClassName(el, additionToClassName) {
  if (additionToClassName == null) {
    el.removeAttribute("class");
  } else if (el.classList) {
    el.classList.add(additionToClassName);
  } else if (typeof el.className === "object" && el.className && el.className.baseVal) {
    el.className.baseVal = `${el.className.baseVal} ${additionToClassName}`.trim();
  } else {
    el.className = `${el.className} ${additionToClassName}`.trim();
  }
}
function setXlink(el, arg1, arg2) {
  if (typeof arg1 === "object") {
    for (const key in arg1) {
      setXlink(el, key, arg1[key]);
    }
  } else {
    if (arg2 != null) {
      el.setAttributeNS(xlinkns, arg1, arg2);
    } else {
      el.removeAttributeNS(xlinkns, arg1, arg2);
    }
  }
}
function setData(el, arg1, arg2) {
  if (typeof arg1 === "object") {
    for (const key in arg1) {
      setData(el, key, arg1[key]);
    }
  } else {
    if (arg2 != null) {
      el.dataset[arg1] = arg2;
    } else {
      delete el.dataset[arg1];
    }
  }
}
function text(str) {
  return document.createTextNode(str != null ? str : "");
}
function parseArgumentsInternal(element, args, initial) {
  for (const arg of args) {
    if (arg !== 0 && !arg) {
      continue;
    }
    const type = typeof arg;
    if (type === "function") {
      arg(element);
    } else if (type === "string" || type === "number") {
      element.appendChild(text(arg));
    } else if (isNode(getEl(arg))) {
      mount(element, arg);
    } else if (arg.length) {
      parseArgumentsInternal(element, arg);
    } else if (type === "object") {
      setAttrInternal(element, arg, null);
    }
  }
}
function getEl(parent) {
  return parent.nodeType && parent || !parent.el && parent || getEl(parent.el);
}
function isNode(arg) {
  return arg?.nodeType;
}
class LoginPage {
  constructor() {
      this.el = el("div", { className: 'container login-container' },
          el("div", { className: "row justify-content-center align-items-center w-100" },
              el("div", { className: "col-md-3" },
                  el("h2", { className: "text-center" }, "Login"),
                  el("form",
                      el("div", { className: "mb-2" },
                          el("label", { for: "username", className: "form-label" }, 'Username or Email'),
                          el("input", { type: "text", className: "form-control", id: "username", placeholder: "Login or email" })
                      ),
                      el("div", { className: "mb-2" },
                          el("label", { for: "password", className: "form-label" }, 'Password'),
                          el("input", { type: "password", className: "form-control", id: "password", placeholder: "Password" })
                      ),
                      el("button", { className: "btn btn-primary w-100", type: "submit", id: "login-action" }, "Login"),
                      el("button", { className: "text-center mt-3 btn w-100", id: "registrateLink" },
                        "Register"
                    )
                  )
              )
          )
        )
  }
}

class RegisterPage {
  constructor() {
    this.el = el('div', { className: "container register-container" },
      el('div', { className: "row justify-content-center align-items-center w-100" },
        el('div', { className: "col-md-3" },
          el('h2', { className: "mb-2" }, "Register"),
          el('form',
            el('div', { className: "mb-2" },
              el('label', {className: "form-labe", for: "username"}, "Username"),
              el('input', {className: "form-control", type: "text", id: "username", required: true})
            ),
            el('div', { className: "mb-2" },
              el('label', {className: "form-labe", for: "username"}, "Email"),
              el('input', {className: "form-control", type: "text", id: "mail", required: true})
            ),
            el('div', { className: "mb-2" },
              el('label', {className: "form-labe", for: "username"}, "Password"),
              el('input', {className: "form-control", type: "password", id: "password", required: true})
            ),
            el('div', { className: "mb-2" },
              el('label', { className: "form-labe", for: "username"}, "Confirm password"),
              el('input', { className: "form-control", type: "password", id: "password-confirm", required: true})
            ),
            el('button', { className: "btn btn-primary w-100"}, "Submit"),
            el("button", { className: "mt-3 btn w-100", id: "loginLink" },
              text('Login')
            )
          )
        )
      )
    )
  }
}

class ModalWindow {
  constructor() {
    this.el = el('div', { className: "modal fade", id: "addTaskModal", tabindex: "-1", role: "dialog", 'aria-labelledby': "addTaskLabel", 'aria-hidden': "true" },
      el('div', { className: "modal-dialog", role: "document" },
        el('div', { className: 'modal-content' },
          el('div', { className: 'modal-header' },
            el('h5', { className: 'modal-title', id: 'addTaskLabel' }, "Add task"),
            el('button', { className: 'close', type: 'button', 'data-dismiss': 'modal', 'area-label': 'Close' },
              el('span', { 'aira-hidden': true }, '&times;')
            )
          ),
          el('div', { className: 'modal-body' },
            el('form', { id: 'taskForm' },
              el('div', { className: 'form-group' },
                el('label', { for: 'taskName' }, "Task num"),
                el('input', { type: 'number', className: "form-control", id: "row-num", required: true })
              ),
              el('div', { className: 'form-group' },
                el('label', { for: 'taskName' }, "Task name"),
                el('input', { type: 'text', className: "form-control", id: "task-name", required: true })
              ),
              el('div', { className: 'form-group' },
                el('label', { for: 'endDate' }, "End date"),
                el('div', { className: "form-control", id: "task-end-date", required: true, 'data-coreui-locale': "en-US", 'data-coreui-toggle': "date-picker" })
              ),
              el('div', { className: 'form-group' },
                el('label', { for: 'maintance-label' }, "Maintaince"),
                el('input', { type: 'text', className: "form-control", id: "maintaince-tag", required: true })
              ),
              el('div', { className: 'form-group' },
                el('label', { for: 'task' }, "Task description"),
                el('input', { type: 'text', className: "form-control", id: "task-decription", required: true })
              )
            )
          ),
          el('div', { className:'modal-footer' },
            el('button', { className: "btn btn-secondary", type: 'button', id: 'cancel-changes'}, "Close"),
            el('button', { className: "btn btn-primary", type: 'button', id: 'save-row' }, "Close"),
          )
        )
      )
    );    
  }
}

class TaskPage {
  constructor() {
    this.el = el('div', { className: 'container' },
      el('nav', { className: "navbar navbar-expand-lg navbar-dark bg-dark" },
        el('div', { className: "ml-auto" },
          el('button', { className: "btn btn-primary", id: 'change-table-data', 'data-toggle':"modal", 'data-target':"#addTaskModal" }),
          el('button', { className: "btn btn-primary", id: 'unlogin-action' })
        ),
      ),
      el('div', { className: "container mt-4", id: 'tasks-table' },
        el('table', { className: 'table' },
          el('thread', { className: 'thread-dark' },
            el('tr',
              el('th', {scope: 'col'}, '№'),
              el('th', {scope: 'col'}, 'Task Name'),
              el('th', {scope: 'col'}, 'Priority tag'),
              el('th', {scope: 'col'}, 'End date'),
              el('th', {scope: 'col'}, 'Description')
            )
          )
        )
      )
    )
  }
}

var main = document.getElementById("main");
var currentPage;
var rows = [];
function switchToLoginPage() {
  if (currentPage !== null && currentPage != undefined) {
    doUnmount(main, currentPage);
  }
  main.innerHTML=""
  currentPage = new LoginPage();
  mount(main, currentPage);
  document.getElementById('registrateLink').addEventListener('click', (e) => switchToRegisterPage());
  document.getElementById('login-action').addEventListener('click', (e) => switchToTaskPage());
}

function switchToRegisterPage() {
  if (currentPage !== null && currentPage != undefined) {
    doUnmount(main, currentPage);
  }
  main.innerHTML=""
  currentPage = new RegisterPage();
  mount(main, currentPage);
  document.getElementById('loginLink').addEventListener('click', (e) => {switchToLoginPage(); console.log('Click from register')});
}

function switchToTaskPage() {
  if (currentPage !== null && currentPage != undefined) {
    doUnmount(main, currentPage);
  }
  main.innerHTML=""
  currentPage = new TaskPage();
  mount(main, currentPage);
  document.getElementById('change-table-data').addEventListener('click', (e) => { switchToModalWindow() });
  document.getElementById('unlogin-action').addEventListener('click', (e) => switchToLoginPage());
}

function switchToModalWindow() {
  if (currentPage !== null && currentPage != undefined) {
    doUnmount(main, currentPage);
  }
  main.innerHTML=""
  currentPage = new ModalWindow();
  mount(main, currentPage);
  document.getElementById('cancel-changes').addEventListener('click', (e) => switchToTaskPage());
  document.getElementById('save-row').addEventListener('click', (e) => { switchToTaskPage() });
}


switchToLoginPage();
