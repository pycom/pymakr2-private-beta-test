'use babel';

const EventEmitter = require('events');
fs = require('fs');
$ = require('jquery');

let projectPath = '';
export default class ApiWrapper {
  constructor(settings) {
    atom.config.observe('rkamyp2.font_size', newValue => {
      try {
        let fontSize = newValue || 14;
        if (fontSize > 50) fontSize = 50;
        const fontSizeInt = parseInt(fontSize);

        $('#rkamyp2-terminal-placeholder').css(
          'font-size',
          `${fontSizeInt}px`,
        );
      } catch (e) {
        atom.notifications.addError('Invalid font size.');
        atom.config.set(`rkamyp2.font_size`, 14);
      }
    });
  }

  config(key) {
    return atom.config.get(`rkamyp2.${key}`);
  }

  setConfig(key, value) {
    return atom.config.set(`rkamyp2.${key}`, value);
  }

  openSettings() {
    atom.workspace.open('atom://config/packages/rkamyp2');
  }

  getConnectionState(com) {
    const state = this.getConnectionStateContents();
    if (!state) return state;
    return state[com];
  }

  getConnectionStateContents() {
    const obj = localStorage.getItem('connection');
    if (!obj) return {};
    try {
      return JSON.parse(obj);
    } catch (e) {
      console.log(e);
      return {};
    }
  }

  setConnectionState(com, state, projectName) {
    const timestamp = new Date().getTime();
    const stateObject = this.getConnectionStateContents();

    if (state && com) {
      stateObject[com] = { timestamp, project: projectName };
    } else if (stateObject[com]) {
      delete stateObject[com];
    }

    localStorage.setItem('connection', JSON.stringify(stateObject));
  }

  onConfigChange(key, cb) {
    atom.config.onDidChange(`rkamyp2.${key}`, cb);
  }

  writeToCipboard(text) {
    atom.clipboard.write(text);
  }

  addBottomPanel(options) {
    atom.workspace.addBottomPanel(options);
  }

  getPackagePath() {
    return atom.packages.resolvePackagePath('rkamyp2');
  }

  getPackageSrcPath() {
    return `${this.getPackagePath()}/lib/`;
  }

  clipboard() {
    return atom.clipboard.read();
  }

  writeClipboard(text) {
    atom.clipboard.write(text);
  }

  getProjectPaths() {
    return atom.project.getPaths();
  }

  onProjectsChange(cb) {
    atom.project.onDidChangePaths(cb);
  }

  getOpenProjects() {
    const directories = atom.project.getDirectories();
    const names = directories.map(item => {
      const folders = item.path.split('/');
      return folders[folders.length - 1];
    });

    return names;
  }

  selectFirstProject() {
    if ($('.rkamyp2-project') && $('.rkamyp2-project').toArray()[0]) {
      $('.rkamyp2-project')
        .toArray()[0]
        .click();
      const projectsButton = $('#rkamyp2-projects');

      projectsButton && projectsButton.click();
    }
  }

  getProjectFolderByName(name) {
    const folders = atom.project.getPaths();
    const foundProjectPath = folders.find(item =>
      item.includes(name),
    );
    if (foundProjectPath) return { folderPath: projectPath, name };
    return null;
  }

  setSelectedProjectByName(name, address) {
    const folders = atom.project.getPaths();
    const foundProjectPath = folders.find(item => {
      return item.includes(name);
    });
    this.setFolder(name);
    if (foundProjectPath) {
      projectPath = foundProjectPath;
      this.setConnectionState(address, true, name);
    } else {
    }
  }

  setFolder(name) {
    const projectName = name || 'No project';
    $('#rkamyp2-projects #project-name').html(
      `<span class='project-name'>${projectName}</span>`,
    );
    $(document).ready(() => {
      const width = parseInt($('#rkamyp2-options-left').width());
      $('#rkamyp2-connection-tabs').css('left', width + 5);
    });
  }

  confirm(title, text, options) {
    atom.confirm({
      message: title,
      detailedMessage: text,
      buttons: options,
    });
  }

  getIDEPath() {
    return atom.getConfigDirPath();
  }

  getProjectPath() {
    return projectPath;
  }

  getSelected() {
    editor = atom.workspace.getActiveTextEditor(); // Get the active editor object and also return immediately if something goes wrong and there's no active text editor.
    if (editor) {
      selection = editor.getLastSelection(); // Get the most recent selection.
      text = selection.getText(); // A selection is an object with a bunch of information attached, so we need to get the text from it.
      if (text && text != '') {
        return text;
      }
    }
    return '';
  }

  getSelectedOrLine() {
    let code = this.getSelected();

    if (!code) {
      const editor = atom.workspace.getActiveTextEditor();
      const pos = editor.getCursorBufferPosition().row;

      code = editor
        .getTextInRange([
          [pos, 0],
          [pos + 1, 0],
        ])
        .replace(/\n$/, ''); // remove trailing newline
    }
    return code;
  }

  insertInOpenFile(code) {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      editor.insertText(code.toString());
    } else {
      atom.notifications.addWarning(
        'No file open to insert code into',
      );
    }
  }

  notification(text, type) {
    if (type == 'warning') {
      atom.notifications.addWarning(text);
    } else if (type == 'info') {
      atom.notifications.addInfo(text);
    } else if (type == 'error') {
      atom.notifications.addError(text);
    }
  }

  error(text) {
    this.notification(text, 'error');
  }

  info(text) {
    this.notification(text, 'info');
  }

  warning(text) {
    this.notification(text, 'warning');
  }

  getOpenFile(cb, onerror) {
    editor = atom.workspace.getActivePaneItem();

    if (
      editor &&
      (editor.constructor.name == 'TextEditor' ||
        editor.constructor.name == 'TextBuffer')
    ) {
      if (editor.isEmpty()) {
        onerror('File is empty');
      } else {
        cb(editor.getText(), editor.getPath());
      }
    } else if (editor && editor.constructor.name == 'TreeView') {
      try {
        const contents = fs.readFileSync(editor.selectedPath);
        cb(contents, editor.selectedPath);
      } catch (e) {
        if (onerror) {
          onerror('Unable to run selected file');
        }
      }
    } else if (onerror) {
      onerror('No file open to run');
    }
  }
}
