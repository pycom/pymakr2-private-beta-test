'use babel';

import { CompositeDisposable } from 'atom';
import Config from './config';

export default {
  config: Config.settings(),

  activate(state) {
    const _this = this;
    this.prepareSerialPort(error => {
      if (error) {
        const err_mess =
          'There was an error with your serialport module, rkamyp2 will likely not work properly. Please try to install again or report an issue on our github (see developer console for details)';
        atom.notifications.addError(err_mess);

        console.log(err_mess);
        console.log(error);
      }

      const rkamyp2 = require('./rkamyp2');
      const PanelView = require('./views/panel-view');
      const SettingsWrapper = require('./wrappers/settings-wrapper');

      _this.isDark = false;
      _this.buildStatusBarOnConsume = false;
      _this.settings = new SettingsWrapper(settings => {
        _this.view = new PanelView(
          settings,
          state.viewState,
          null,
          _this.isDark,
        );
        _this.view.addPanel();
        _this.view.build();
        _this.rkamyp2 = new rkamyp2(
          state.viewState,
          _this.view,
          settings,
          _this.isDark,
        );
        _this.buildStatusBar();
        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        _this.subscriptions = new CompositeDisposable();
        // Register command that toggles this view
        _this.subscriptions.add(
          atom.commands.add('atom-workspace', {
            'rkamyp2:sync': () => _this.rkamyp2.sync(),
            'rkamyp2:upload': () => _this.rkamyp2.upload(),
            'rkamyp2:upload File': () => _this.rkamyp2.uploadFile(),
            'rkamyp2:toggle REPL': () =>
              _this.rkamyp2.toggleVisibility(),
            'rkamyp2:connect': () => _this.rkamyp2.connect(),
            'rkamyp2:run': () => _this.rkamyp2.run(),
            'rkamyp2:run Selection': () => _this.rkamyp2.runselection(),
            'rkamyp2:help': () => _this.rkamyp2.writeHelpText(),
            'rkamyp2:clear Terminal': () =>
              _this.rkamyp2.clearTerminal(),
            'rkamyp2:disconnect': () => _this.rkamyp2.disconnect(),
          }),
        );
      });
    });
  },

  

  buildStatusBar() {
    const _this = this;
    const div = $('<div></div>').addClass('rkamyp2-status-bar');
    const img = $('<img>')
      .addClass('rkamyp2-logo')
      .attr(
        'src',
        `${this.rkamyp2.api.getPackagePath()}/styles/assets/logo.png`,
      )
      .width('17px');
    div.append(img);
    div.html(`${div.html()} rkamyp2`);

    div.click(() => {
      _this.rkamyp2.toggleVisibility();
    });

    if (this.statusBar)
      this.statusBar.addRightTile({ item: div, priority: 1 });
    else this.buildStatusBarOnConsume = true;
  },

  prepareSerialPort(cb) {
    try {
      require('serialport');
      cb();
    } catch (e) {
      console.log('Error while loading serialport library');
      console.log(e);
    }
  },

  consumeStatusBar(statusBar) {
    this.statusBar = statusBar;
    if (this.buildStatusBarOnConsume) {
      this.buildStatusBar();
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    this.rkamyp2.destroy();
  },

  serialize() {
    const ser = {
      viewState: null,
      feedbackPopupSeen: null,
    };
    if (this.rkamyp2) {
      (ser.viewState = this.rkamyp2.serialize()),
        (ser.feedbackPopupSeen = this.rkamyp2.view.feedback_popup_seen);
    }
    return ser;
  },
};
