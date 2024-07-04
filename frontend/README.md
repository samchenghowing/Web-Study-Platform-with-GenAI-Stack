# Pen Editor

[![GitHub code size](https://img.shields.io/github/languages/code-size/samchenghowing/Learning_with_PenEditor)](https://github.com/samchenghowing/PenCode)  [![GitHub license](https://img.shields.io/github/license/samchenghowing/Learning_with_PenEditor)](https://github.com/samchenghowing/PenCode)  [![GitHub issues](https://img.shields.io/github/issues-raw/samchenghowing/Learning_with_PenEditor)](https://github.com/samchenghowing/PenCode)

 :rocket: ​Simple Online Code Editor! Support Rect, HTML, CSS, Javascript | PenEditor

PenEditor is a simple HTML / CSS / JS code editor, works online in real-time, and out of the box! Learning_with_PenEditor.js is an open-source online HTML / CSS / JavaScript code editor (Code Playground) inspired by Codepen.io.

<a href="https://github.com/jojowwbb/PenEditor">Orignated by jojowwbb</a>


<p align="center">
  <a href="https://github.com/samchenghowing/Learning_with_PenEditor">
    <img src="https://z3.ax1x.com/2021/04/01/cV436J.png" alt="Logo" width="86" height="86"/>
  </a>
</p>
  <h3 align="center">Pen Editor</h3>

  <p align="center">
    Simple Online Code Editor
    <br />
    <br />
    <a href="https://github.com/samchenghowing/Learning_with_PenEditor">View Demo</a>
    ·
    <a href="https://github.com/samchenghowing/Learning_with_PenEditor/issues">Report Bug</a>
    ·
    <a href="https://github.com/samchenghowing/Learning_with_PenEditor/issues">Request Feature</a>
  </p>


  <p align="center">
  <img src="https://z3.ax1x.com/2021/04/02/cm1vz4.png" alt="Logo" width="100%"/>
</p>


## Features

-   [x] HTML/CSS/JS code editing
-   [x] Code formatting
-   [x] HTML editor supports emmet
-   [x] Code hint
-   [x] Sublime shortcut keys
-   [x] Simple console(log,error,info,warn)
-   [x] Built-in babel
-   [x] Built-in react, no need to quote separately
-   [x] Download HTML save
-   [x] works online in real-time


## Online

[Learning_with_PenEditor Demo](https://samchenghowing.github.io/pen/index.html)

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Example Readmes](#example-readmes)
-   [Maintainers](#maintainers)
-   [Contributing](#contributing)
-   [License](#license)

## Install

This project uses [node](http://nodejs.org), [npm](https://npmjs.com) and [webpack](https://webpack.js.org/).. Go check them out if you don't have them locally installed.

```sh
$ git clone https://github.com/samchenghowing/Learning_with_PenEditor.git
```

## Development

```sh
npm ci
npm run dev
```

## Deployment

```sh
npm ci
npm run build
npm install -g serve
serve -s dist
```

## Deployment inside Docker container

```sh
docker build -t pen_editor:1.0.0 .
docker run -d -p 3000:3000 pen_editor:1.0.0

# to terminate the container, list its id then stop it by id
docker ps
docker stop #containerID

# or, stop all containers
docker stop $(docker ps -q)
```

## Example

[Online demo](https://samchenghowing.github.io/pen/index.html)

## Related

-   [React](https://reactjs.org/)
-   [CodeMirror](http://codemirror.com)
-   [Bulma.css](https://bulma.io/)

## Maintainers

[@jojowwbb](https://github.com/jojowwbb).
[@samchenghowing](https://github.com/samchenghowing).

## Contributing

Feel free to dive in! [Open an issue](https://github.com/samchenghowing/Learning_with_PenEditor/issues/new) or submit PRs.

Standard Readme follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

### Contributors

This project exists thanks to all the people who contribute.

## License

[BSD](LICENSE)

## Thanks

-   [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet)
-   [Img Shields](https://shields.io)
-   [Choose an Open Source License](https://choosealicense.com)
-   [GitHub Pages](https://pages.github.com)
