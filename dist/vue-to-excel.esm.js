//
//
//
//
//
//
//
//
//
//

var script = {
  data: function data() {
    return {
      cellId: 0,
      button: null
    }
  },
  props: {
    tableTitle:
      { type: String, required: false },
    titleClass:
      { type: String, required: false },
    fileName:
      { type: String, required: false, default: "exported-table" },
    btnText:
      { type: String, required: false, default: "Export Excel" },
    btnClass:
      { type: String, required: false },
  },
  mounted: function mounted() {
    this.button = document.getElementById("btn-export-excel");
  },
  methods: {
    base64: function base64(s) {
      return window.btoa(unescape(encodeURIComponent(s)));
    },
    format: function format(s, c) {
      return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; });
    },
    tableToExcel: function tableToExcel() {
      var uri   = "data:application/vnd.ms-excel;base64,";
      var table = this.$slots.default[0].elm;
      var style = this.extractCSS(table);

      var template = "<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\" xmlns=\"http://www.w3.org/TR/REC-html40\"><head><style>" + (style.stylesheet) + "</style><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>";

      var ctx = { worksheet: this.fileName, table: table.innerHTML };
      return uri + this.base64(this.format(template, ctx));
    },
    saveContent: function saveContent() {
      var link = document.createElement("a");
      link.download = this.fileName;
      link.href = this.tableToExcel();
      link.click();
    },
    flatten: function flatten(array) {
      var this$1 = this;

      return array.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) ? this$1.flatten(toFlatten) : toFlatten);
      }, []);
    },
    stringifyComputedStyles: function stringifyComputedStyles(computedStyles) {
      var style = "";
      for (var i = 0; i < computedStyles.length; i++) {
        style += computedStyles[i] +": "+computedStyles.getPropertyValue(""+computedStyles[i]) + ";";
      }
      return style;
    },
    recursiveExtract: function recursiveExtract (element) {
      var this$1 = this;

      this.cellId++;
      if (/TH|TD|TABLE/.test(element.tagName)) { element.id = "cell_" + (this.cellId); }
      else { element.id = ""; }
      var computedStyles = window.getComputedStyle(element);
      var style = this.stringifyComputedStyles(computedStyles);
      var children = Array.prototype.slice.call(element.children);
      var res = [{ id: element.id || null, style: style }].concat(children.map(function (e) { return this$1.recursiveExtract(e); }));
      return res;
    },
    extractCSS: function extractCSS (element) {
      if (!element) { return { elements: [], stylesheet: "" }; }
      var raw  = this.recursiveExtract(element);
      var flat = this.flatten(raw);
      return {
        elements: flat,
        stylesheet: flat.reduce(function (acc, cur) {
          var style = "";
          if (cur.id) { style = "#" + (cur.id) + " {\n" + (cur.style) + "\n}\n\n"; }
          return acc + style
        }, "")
      }
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    var options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    var hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            var originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            var existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

var isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return function (id, style) { return addStyle(id, style); };
}
var HEAD;
var styles = {};
function addStyle(id, css) {
    var group = isOldIE ? css.media || 'default' : id;
    var style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        var code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                { style.element.setAttribute('media', css.media); }
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            var index = style.ids.size - 1;
            var textNode = document.createTextNode(code);
            var nodes = style.element.childNodes;
            if (nodes[index])
                { style.element.removeChild(nodes[index]); }
            if (nodes.length)
                { style.element.insertBefore(textNode, nodes[index]); }
            else
                { style.element.appendChild(textNode); }
        }
    }
}

/* script */
var __vue_script__ = script;

/* template */
var __vue_render__ = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c("div", { staticClass: "export-header" }, [
        _c("h3", { class: _vm.titleClass }, [_vm._v(_vm._s(_vm.tableTitle))]),
        _vm._v(" "),
        _c(
          "button",
          {
            staticClass: "defaultBtnStyle",
            class: _vm.btnClass,
            on: {
              click: function ($event) {
                return _vm.saveContent()
              },
            },
          },
          [_vm._v(_vm._s(_vm.btnText))]
        ) ]),
      _vm._v(" "),
      _vm._t("default") ],
    2
  )
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  var __vue_inject_styles__ = function (inject) {
    if (!inject) { return }
    inject("data-v-246d4622_0", { source: "\n.export-header[data-v-246d4622] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n[class=defaultBtnStyle][data-v-246d4622] {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  width: fit-content;\n  color: rgba(53, 73, 94);\n  background-color: rgba(66, 184, 131, 1);\n  border: 1px solid rgba(53, 73, 94);\n  font-weight: 700;\n  font-size: 14px;\n  border-radius: 30px;\n  cursor: pointer;\n  padding: 15px 20px;\n  height: 25px;\n  margin-bottom: 10px;\n  margin-right: 5px;\n}\n[class=defaultBtnStyle][data-v-246d4622]:active {\n  background-color: rgb(61, 140, 105);\n}\n", map: {"version":3,"sources":["/home/lucas/??rea de Trabalho/DevStuff/npm/vue-to-excel/src/vue-to-excel.vue"],"names":[],"mappings":";AAgGA;EACA,aAAA;EACA,8BAAA;EACA,mBAAA;AACA;AAEA;EACA,aAAA;EACA,uBAAA;EACA,mBAAA;EACA,kBAAA;EACA,uBAAA;EACA,uCAAA;EACA,kCAAA;EACA,gBAAA;EACA,eAAA;EACA,mBAAA;EACA,eAAA;EACA,kBAAA;EACA,YAAA;EACA,mBAAA;EACA,iBAAA;AACA;AAEA;EACA,mCAAA;AACA","file":"vue-to-excel.vue","sourcesContent":["<template>\n  <div>\n    <div class=\"export-header\">\n      <h3 :class=\"titleClass\">{{ tableTitle }}</h3>\n      <button :class=\"btnClass\" class=\"defaultBtnStyle\" @click=\"saveContent()\">{{ btnText }}</button>\n    </div>\n    <slot></slot>\n  </div>\n</template>\n\n<script>\nexport default {\n  data() {\n    return {\n      cellId: 0,\n      button: null\n    }\n  },\n  props: {\n    tableTitle:\n      { type: String, required: false },\n    titleClass:\n      { type: String, required: false },\n    fileName:\n      { type: String, required: false, default: \"exported-table\" },\n    btnText:\n      { type: String, required: false, default: \"Export Excel\" },\n    btnClass:\n      { type: String, required: false },\n  },\n  mounted() {\n    this.button = document.getElementById(\"btn-export-excel\");\n  },\n  methods: {\n    base64(s) {\n      return window.btoa(unescape(encodeURIComponent(s)));\n    },\n    format(s, c) {\n      return s.replace(/{(\\w+)}/g, (m, p) => c[p]);\n    },\n    tableToExcel() {\n      let uri   = \"data:application/vnd.ms-excel;base64,\";\n      let table = this.$slots.default[0].elm;\n      let style = this.extractCSS(table);\n\n      let template = `<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\" xmlns=\"http://www.w3.org/TR/REC-html40\"><head><style>${style.stylesheet}</style><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>`;\n\n      let ctx = { worksheet: this.fileName, table: table.innerHTML };\n      return uri + this.base64(this.format(template, ctx));\n    },\n    saveContent() {\n      let link = document.createElement(\"a\");\n      link.download = this.fileName;\n      link.href = this.tableToExcel();\n      link.click();\n    },\n    flatten(array) {\n      return array.reduce((flat, toFlatten) => {\n        return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);\n      }, []);\n    },\n    stringifyComputedStyles(computedStyles) {\n      let style = \"\";\n      for (let i = 0; i < computedStyles.length; i++) {\n        style += computedStyles[i] +\": \"+computedStyles.getPropertyValue(\"\"+computedStyles[i]) + \";\";\n      }\n      return style;\n    },\n    recursiveExtract (element) {\n      this.cellId++;\n      if (/TH|TD|TABLE/.test(element.tagName)) element.id = `cell_${this.cellId}`;\n      else element.id = \"\";\n      let computedStyles = window.getComputedStyle(element);\n      let style = this.stringifyComputedStyles(computedStyles);\n      let children = Array.prototype.slice.call(element.children);\n      let res = [{ id: element.id || null, style: style }].concat(children.map(e => this.recursiveExtract(e)));\n      return res;\n    },\n    extractCSS (element) {\n      if (!element) return { elements: [], stylesheet: \"\" };\n      let raw  = this.recursiveExtract(element);\n      let flat = this.flatten(raw);\n      return {\n        elements: flat,\n        stylesheet: flat.reduce((acc, cur) => {\n          let style = \"\";\n          if (cur.id) style = `#${cur.id} {\\n${cur.style}\\n}\\n\\n`;\n          return acc + style\n        }, \"\")\n      }\n    }\n  }\n}\n</script>\n\n<style scoped>\n  .export-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n  }\n\n  [class=defaultBtnStyle] {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n    width: fit-content;\n    color: rgba(53, 73, 94);\n    background-color: rgba(66, 184, 131, 1);\n    border: 1px solid rgba(53, 73, 94);\n    font-weight: 700;\n    font-size: 14px;\n    border-radius: 30px;\n    cursor: pointer;\n    padding: 15px 20px;\n    height: 25px;\n    margin-bottom: 10px;\n    margin-right: 5px;\n  }\n\n  [class=defaultBtnStyle]:active {\n    background-color: rgb(61, 140, 105);\n  }\n</style>"]}, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__ = "data-v-246d4622";
  /* module identifier */
  var __vue_module_identifier__ = undefined;
  /* functional template */
  var __vue_is_functional_template__ = false;
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__ = /*#__PURE__*/normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    createInjector,
    undefined,
    undefined
  );

function install(Vue) {
	if (install.installed) { return; }
	install.installed = true;
	Vue.component('VueToExcel', __vue_component__);
}
var plugin = {
	install: install,
};

var GlobalVue = null;
if (typeof window !== 'undefined') {
	GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
	GlobalVue = global.Vue;
}
if (GlobalVue) {
	GlobalVue.use(plugin);
}

export default __vue_component__;
export { install };
