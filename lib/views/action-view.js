'use babel';

import '../../node_modules/xterm/dist/addons/fit/fit';
import ApiWrapper from '../wrappers/api-wrapper';
import Logger from '../helpers/logger';

$ = require('jquery');
const EventEmitter = require('events');

fs = require('fs');

export default class ActionView extends EventEmitter {
  constructor(panelview, settings) {
    super();
    this.panelview = panelview;
    this.settings = settings;
    this.visible = true;
    this.api = new ApiWrapper();
    this.package_folder = this.api.getPackageSrcPath();
    this.logger = new Logger('PanelView');
  }

  build(rootElement) {
    const _this = this;

    const html = fs.readFileSync(
      `${_this.package_folder}/views/action-view.html`,
    );
    rootElement.append(html.toString());
    this.left_panel = $('#rkamyp2-left-panel');
    this.connect = $('#rkamyp2-action-connect');
    this.connect_sub = $('rkamyp2-action-connect .sub');
    this.run = $('#rkamyp2-action-run');
    this.run_sub = $('rkamyp2-action-run .sub');
    this.upload = $('#rkamyp2-action-upload');
    this.upload_sub = $('rkamyp2-action-upload .sub');
    this.download = $('#rkamyp2-action-download');
    this.download_sub = $('rkamyp2-action-download .sub');
    this.info = $('#rkamyp2-action-info');
    this.info_sub = $('rkamyp2-action-info .sub');
    this.left_buttons = $('.left-button');
    this.left_buttons.addClass('disabled');
    this.runActionButton = $('#iab-run');
    this.runActionDialog = $('#action-dialog-run');

    const tooltipOptions = title => ({
      title,
      trigger: 'hover',
      delay: 0,
      placement: 'right',
    });
    atom.tooltips.add(
      this.connect,
      tooltipOptions('Connect/Disconnect'),
    );
    atom.tooltips.add(this.run, tooltipOptions('Run selected file'));
    atom.tooltips.add(
      this.download,
      tooltipOptions('Download from device'),
    );
    atom.tooltips.add(
      this.upload,
      tooltipOptions('Upload project to device'),
    );
    atom.tooltips.add(this.info, tooltipOptions('Get device info'));
    this.bindOnClicks();
  }

  enable() {
    this.left_buttons.removeClass('disabled');
  }

  disable() {
    this.left_buttons.addClass('disabled');
    // $('#rkamyp2-action-connect span.main').removeClass('toggle-off')
  }

  disableExceptConnectButton() {
    this.left_buttons.addClass('disabled');
    $('#rkamyp2-action-connect').removeClass('disabled');
  }

  update(connected, disableAll) {
    if (connected) {
      this.enable();
      $('#rkamyp2-action-connect').removeClass('not-connected');
    } else {
      if (disableAll && !connected) this.disable();
      else this.disableExceptConnectButton();
      $('#rkamyp2-action-connect').addClass('not-connected');
    }
    $('#rkamyp2-action-connect span.main').attr(
      'class',
      'main fa fa-toggle-on',
    );
  }

  bindOnClicks() {
    const _this = this;
    this.connect.click(() => {
      if (
        !_this.connect.hasClass('disabled') &&
        !_this.connect.hasClass('no-devices')
      ) {
        _this.panelview.emit('connect.toggle');
      }
    });
    this.run.click(() => {
      if (!_this.run.hasClass('disabled'))
        _this.panelview.emit('run');
    });
    this.upload.click(() => {
      if (!_this.run.hasClass('disabled')) {
        _this.panelview.emit('sync');
      }
    });
    this.download.click(() => {
      if (!_this.run.hasClass('disabled'))
        _this.panelview.emit('sync_receive');
    });

    this.info.click(() => {
      if (!_this.run.hasClass('disabled'))
        _this.panelview.emit('openInfo');
    });
  }
}
