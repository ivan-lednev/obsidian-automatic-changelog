🐞 [Create issues, feature requests, share your ideas](https://github.com/ivan-lednev/obsidian-automatic-changelog/issues)

<!-- TOC -->
  * [Purpose](#purpose)
  * [Usage](#usage)
    * [`dates`](#dates)
    * [`commits`](#commits)
    * [`path`](#path)
    * [`exclude`](#exclude)
    * [Command: Generate diff code block for today](#command--generate-diff-code-block-for-today)
  * [Contributing](#contributing)
  * [Acknowledgements](#acknowledgements)
<!-- TOC -->

## Purpose

This plugin lets you render Git diff output in your notes.

I personally use it in a combo with obsidian-git to revise what I've been working on a given day, like an automatic
changelog, but you can point it to any repo in your file system.

## Usage

The plugin renders Markdown code blocks with the `show-diff` language tag.

An empty code block will show a diff between today and yesterday:

<pre>
```show-diff
```
</pre>

### `dates`

With `dates` you can specify a date range to show changes for:
<pre>
```show-diff
dates:
  from: 2021-01-01
  to: 2021-01-02
```
</pre>

### `commits`

With `commits` you can specify a commit range to show changes for:
<pre>
```show-diff
commits:
  from: HEAD^
  to: HEAD
```
</pre>

### `path`

This defaults to obsidian, but you can point the plugin to any repository in your file system:
<pre>
```show-diff
path: /path/to/my-pet-project
```
</pre>

### `exclude`

`.obsidian` (Obsidian's settings & cache) is excluded by default. You can override this with a single path:
<pre>
```show-diff
exclude: trash
```
</pre>

or with a list of paths:
<pre>
```show-diff
exclude:
  - trash
  - archive
  - .obsidian
```
</pre>

### Command: Generate diff code block for today

The plugin provides a command to quickly insert in a note a code block like this:
<pre>
```show-diff
dates:
  from: 2023-04-23
  to: 2023-04-24
```
</pre>

## Contributing

If you noticed a bug or thought of some way to improve the plugin, feel free to create an
issue: https://github.com/ivan-lednev/obsidian-automatic-changelog/issues.

Pull-requests are also welcome! If you want to contribute but don't know where to start, you can create an issue or
write me an email: <bishop1860@gmail.com>.

You can also support me by buying me a coffee:

<a href="https://www.buymeacoffee.com/machineelf" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Acknowledgements

I've used the following plugins as a reference:

- [denolehov/obsidian-git: Backup your Obsidian.md vault with git](https://github.com/denolehov/obsidian-git)
- [kometenstaub/obsidian-version-history-diff: Get a diff view of your Obsidian Sync, File Recovery and Git version history](https://github.com/kometenstaub/obsidian-version-history-diff)
