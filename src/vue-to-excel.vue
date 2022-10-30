<template>
  <div>
    <div class="export-header">
      <h3 :class="titleClass">{{ tableTitle }}</h3>
      <button :class="btnClass" class="defaultBtnStyle" @click="saveContent()">{{ btnText }}</button>
    </div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  data() {
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
  mounted() {
    this.button = document.getElementById("btn-export-excel");
  },
  methods: {
    base64(s) {
      return window.btoa(unescape(encodeURIComponent(s)));
    },
    format(s, c) {
      return s.replace(/{(\w+)}/g, (m, p) => c[p]);
    },
    tableToExcel() {
      let uri   = "data:application/vnd.ms-excel;base64,";
      let table = this.$slots.default[0].elm;
      let style = this.extractCSS(table);

      let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><style>${style.stylesheet}</style><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>`;

      let ctx = { worksheet: this.fileName, table: table.innerHTML };
      return uri + this.base64(this.format(template, ctx));
    },
    saveContent() {
      let link = document.createElement("a");
      link.download = this.fileName;
      link.href = this.tableToExcel();
      link.click();
    },
    flatten(array) {
      return array.reduce((flat, toFlatten) => {
        return flat.concat(Array.isArray(toFlatten) ? this.flatten(toFlatten) : toFlatten);
      }, []);
    },
    stringifyComputedStyles(computedStyles) {
      let style = "";
      for (let i = 0; i < computedStyles.length; i++) {
        style += computedStyles[i] +": "+computedStyles.getPropertyValue(""+computedStyles[i]) + ";";
      }
      return style;
    },
    recursiveExtract (element) {
      this.cellId++;
      if (/TH|TD|TABLE/.test(element.tagName)) element.id = `cell_${this.cellId}`;
      else element.id = "";
      let computedStyles = window.getComputedStyle(element);
      let style = this.stringifyComputedStyles(computedStyles);
      let children = Array.prototype.slice.call(element.children);
      let res = [{ id: element.id || null, style: style }].concat(children.map(e => this.recursiveExtract(e)));
      return res;
    },
    extractCSS (element) {
      if (!element) return { elements: [], stylesheet: "" };
      let raw  = this.recursiveExtract(element);
      let flat = this.flatten(raw);
      return {
        elements: flat,
        stylesheet: flat.reduce((acc, cur) => {
          let style = "";
          if (cur.id) style = `#${cur.id} {\n${cur.style}\n}\n\n`;
          return acc + style
        }, "")
      }
    }
  }
}
</script>

<style scoped>
  .export-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  [class=defaultBtnStyle] {
    display: flex;
    justify-content: center;
    align-items: center;
    width: fit-content;
    color: rgba(53, 73, 94);
    background-color: rgba(66, 184, 131, 1);
    border: 1px solid rgba(53, 73, 94);
    font-weight: 700;
    font-size: 14px;
    border-radius: 30px;
    cursor: pointer;
    padding: 15px 20px;
    height: 25px;
    margin-bottom: 10px;
    margin-right: 5px;
  }

  [class=defaultBtnStyle]:active {
    background-color: rgb(61, 140, 105);
  }
</style>