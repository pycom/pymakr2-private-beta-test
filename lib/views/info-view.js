'use babel';

import '../../node_modules/xterm/dist/addons/fit/fit';
import ApiWrapper from '../wrappers/api-wrapper';

const EventEmitter = require('events');
fs = require('fs');
$ = require('jquery');

export default class InfoView extends EventEmitter {
  constructor(panelview, overlayview, settings) {
    super();
    this.api = new ApiWrapper(settings);
    this.packageFolder = this.api.getPackageSrcPath();
    this.panelview = panelview;
    this.overlayview = overlayview;
    this.settings = settings;
    this.packageFolder;
  }

  build(rootElement) {
    const _this = this;
    $(document).ready(() => {
      const snippetsHtml = fs.readFileSync(
        `${_this.packageFolder}/views/info-view.html`,
      );
      rootElement.append(snippetsHtml.toString());

      _this.info_content = $('#rkamyp2-info-view');
      _this.info_close = $('#rkamyp2-info-close');

      _this.info_close.click(async () => {
        if (_this.panelview.selected_device) {
          const { commands } = _this.panelview.selected_device;
          _this.panelview.closeOverlay(commands);
        } else {
          console.log('Triggered');
        }
      });

      _this.bindClicks();
    });
  }

  bindClicks() {
    const _this = this;

    $('#info-view-wifiOnBoot input').change(event => {
      const { commands } = _this.panelview.selected_device;
      commands.prepare(() => {
        commands.setWifiOnBoot(event.currentTarget.checked, () => {
          commands.exit(() => {});
        });
      });
    });
    $('button#info-button-free-memory').click(() => {
      const { commands } = _this.panelview.selected_device;
      commands.prepare(() => {
        commands.formatFlash(() => {
          _this.panelview.selected_device.commands.getFreeMemory(
            result => {
              commands.exit(() => {
                _this.setContent({ freeMemory: result });
              });
            },
          );
        });
      });
    });
    $('button#info-button-free-ram').click(async () => {
      const { commands } = _this.panelview.selected_device;
      await commands.prepareAsync();
      const result = await commands.gcCollect();
      await commands.exit();
      this.setContent({ freeRam: result });
    });
    $('button#info-button-reboot').click(async () => {
      const { commands } = _this.panelview.selected_device;
      this.panelview.closeOverlay();
      await commands.reset();
      this.panelview.closeOverlay();
    });
  }

  setContent(info) {
    $(document).ready(() => {
      for (const key in info) {
        const val = info[key];
        const el = $(`#info-view-${key}`);
        if (el.hasClass('radio')) {
          $(`input:radio[name=info-view-${key}-input]`).val([val]);
          // $('input:radio[name=info-view-fsType-input]').val([val]).trigger('change');
          $(`#info-view-${key}-test`).html(val);
        } else if (el.hasClass('checkbox')) {
          $(`input:checkbox[name=info-view-${key}-input]`).attr(
            'checked',
            val == 'True',
          );
        } else {
          $(`#info-view-${key}`).html(val);
        }
      }
    });
  }
}
