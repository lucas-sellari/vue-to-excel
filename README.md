[![npm version](https://badge.fury.io/js/vue-to-excel)](https://badge.fury.io/js/vue-to-excel)

# Vue To Excel

This is a simple vue component which takes your HTML table and exports it to Excel (specifically the `XLS format`) and also maintain your CSS styles. This is specifically for VueJS 2. There are still improvements that can be done to decrease the exported file size and to increase the styling options.


## Installation

```sh
$ npm install vue-to-excel
```

## Basic usage

In the `main.js` file, register the component:

```js
  import Vue from "vue";
  import ExportExcel from "vue-to-excel";

  Vue.component("vue-to-excel", ExportExcel);
  ...
```

In your vue component, you will need to wrap the table using the registered component:

```vue
<script>
import ExportExcel from "vue-to-excel";
...
export default {
  components: { ExportExcel },
  ...
}
</script>

<template>
...
  <ExportExcel tableTitle="Table Title" titleClass="classForCustomization" fileName="exported-file" btnText="Click to Download" btnClass="btn btn-primary">
    <table class="table table-striped table-bordered table-nowrap">
      <thead>
        <tr>
          <th v-for="col in cols" :key="col.field">{{ col.label }}</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="row in rows" :key="row.field">
          <template v-for="col in cols">
            <td :key="col.field">{{ row[col.field] }}</td>
          </template>
        </tr>
      </tbody>
    </table>
  </ExportExcel>
...
</template>
```

TODO: add images...

## Props

The available props are:

  - `tableTitle`: the title that will appear above the table;
  - `titleClass`: class name that can be used to style the table title;
  - `fileName`: the name of the file that will be downloaded;
  - `btnText`: text to appear in the download button;
  - `btnClass`: class name that can be used to style the download button.


## License

[MIT License](https://andreasonny.mit-license.org/2019) © Andrea SonnY