# JC3

The 3 version of JC. JC is a library for single page web applications.
All modules are async loaded by using [alameda](https://github.com/requirejs/alameda).
JC3 is very fast. Startup time of our production application is below 150ms.
We use JC3 in a hybrid app that feels like a native app.

JC3 use a modifed version of [TypeScript](https://github.com/jannesen/TypeScript-jsx-generic).

JC3 is fully async (including userinterfaces)

## Modules
### jannesen
Simple helper function and classes

### jannesen.async
async classes like ExecuteContext, Task, Ajax, Require

### jannesen.dom
Dom manipulations.

### jannesen.datatype / jannesen.datatypeex
Rich datatypes. Data including attributes and conversion.
For example String: attributes maxlength, required, uppercase etc. Conversion to/from user, urlarg, json.


### jannesen.input / jannesen.inputex
Data inputs from String to datetimerange

### jannesen.string
remove diacritics from strings

### jannesen.ui.popup
UI popup

### jannesen.ui.select
UI dropdown select used by Select input.

### jannesen.ui.datetimepicker
datatimepicker

### jannesen.ui.treeview
Treeview

### jannesen.ui.tab
tab strip

### jannesen.ui.datatable
Datatable. Capable of handeling large date sets (more the 10.000 records) with performance issues or crashes of the browser

### jannesen.ui.content
Basic form and dialog handling (fully async).

### jannesen.ui.template
Content template like standard query form. error dialog etc.

### jannesen.ui.wizard
Wizard dialog.

### jannesen.ui.main
A 'standard' main for a application with live a navigation tree and right different form. Including navigation options.


### jannesen.language.*
Language file with all texts.

### jannesen.regional.*
Regional file like datetime formating etc.

### jannesen.timezone.*
Timezone conversions.
