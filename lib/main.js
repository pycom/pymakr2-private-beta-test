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
          'There was an error with your serialport module, rkamyp will likely not work properly. Please try to install again or report an issue on our github (see developer console for details)';
        atom.notifications.addError(err_mess);

        console.log(err_mess);
        console.log(error);
      }

      const rkamyp = require('./rkamyp');
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
        _this.rkamyp = new rkamyp(
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
            'rkamyp:sync': () => _this.rkamyp.sync(),
            'rkamyp:upload': () => _this.rkamyp.upload(),
            'rkamyp:upload File': () => _this.rkamyp.uploadFile(),
            'rkamyp:toggle REPL': () =>
              _this.rkamyp.toggleVisibility(),
            'rkamyp:connect': () => _this.rkamyp.connect(),
            'rkamyp:run': () => _this.rkamyp.run(),
            'rkamyp:run Selection': () => _this.rkamyp.runselection(),
            'rkamyp:help': () => _this.rkamyp.writeHelpText(),
            'rkamyp:clear Terminal': () =>
              _this.rkamyp.clearTerminal(),
            'rkamyp:disconnect': () => _this.rkamyp.disconnect(),
          }),
        );
      });
    });
  },

  

  buildStatusBar() {
    const _this = this;
    const div = $('<div></div>').addClass('rkamyp-status-bar');
    const img = $('<img>')
      .addClass('rkamyp-logo')
      .attr(
        'src',
        `${this.rkamyp.api.getPackagePath()}/styles/assets/logo.png`,
      )
      .width('17px');
    div.append(img);
    div.html(`${div.html()} rkamyp`);

    div.click(() => {
      _this.rkamyp.toggleVisibility();
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
    this.rkamyp.destroy();
  },

  serialize() {
    const ser = {
      viewState: null,
      feedbackPopupSeen: null,
    };
    if (this.rkamyp) {
      (ser.viewState = this.rkamyp.serialize()),
        (ser.feedbackPopupSeen = this.rkamyp.view.feedback_popup_seen);
    }
    return ser;
  },
};
