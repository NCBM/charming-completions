# Charming Completions

This extension provides extra completion support for Python in VSCode.

## Features

### Postfix completions

Allowing to use some postfix to wrap a value. Inspired from other editors.

#### Examples

![print](./assets/examples/postfix_function_print.gif)

![await](./assets/examples/postfix_keyword_await.gif)

![multiple](./assets/examples/postfix_multi_complete.gif)

![comprehension](./assets/examples/postfix_comprehension.gif)

#### List of supported functions/keywords

- Functions
    - `print`
    - `repr`
    - `id`
    - `hash`
    - `len`
    - `abs`
    - `sum`
    - `round`
    - `str`
    - `int`
    - `float`
    - `bool`
    - `type`
    - `list`
- Keywords
    - `assert`
    - `await`
    - `del`
    - `raise`
    - `return`
    - `yield`

### Re-export completions

Providing a shortcut for re-exporting.

![reexport](./assets/examples/reexport.gif)

## Requirements

- VSCode >= 1.74

## Extension Settings

This extension contributes the following settings:

* No settings available.
