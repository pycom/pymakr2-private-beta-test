'use babel';

import '../../node_modules/xterm/dist/addons/fit/fit';
import ApiWrapper from '../wrappers/api-wrapper';
import Logger from '../helpers/logger';
import Utils from '../helpers/utils';
import OverlayView from './overlay-view';
import SidebarView from './sidebar-view';
import ActionView from './action-view';
import Config from '../config';

const elementResizeDetectorMaker = require('element-resize-detector');
const $ = require('jquery');
const EventEmitter = require('events');
const { shell } = require('electron');

const fs = require('fs');
const ElementResize = require('element-resize-detector');

export default class PanelView extends EventEmitter {
  constructor(settings, serializedState) {
    super();
    const _this = this;
    this.settings = settings;
    this.visible = true;
    this.api = new ApiWrapper();
    this.package_folder = this.api.getPackageSrcPath();
    this.logger = new Logger('PanelView');
    this.overlay = new OverlayView(this, settings);
    this.action_view = new ActionView(this, settings);
    this.sidebar_view = new SidebarView(this, settings);
    this.feedback_popup_seen =
      serializedState &&
      'feedbackPopupSeen' in serializedState &&
      serializedState.feedbackPopupSeen;
    this.selectedDevice = null;
    this.term_rows = Config.constants().term_rows;
    this.utils = new Utils(settings);
    const html = fs.readFileSync(
      `${_this.package_folder}/views/panel-view.html`,
    );
    this.main_el = document.createElement('div');
    this.main_el.insertAdjacentHTML('beforeend', html.toString());
  }

  build() {
    const _this = this;
    this.element = $('#rkamyp2');
    this.elementOriginal = this.element[0];
    this.resizer = $('#rkamyp2-resizer');
    this.overlay_contents = $('#rkamyp2-overlay-contents');
    this.topbar = $('#pycom-top-bar');
    this.title = $('#rkamyp2-title');
    this.projects_button = $('#rkamyp2-projects');
    this.projects_list = $('#rkamyp2-projects .subnav');
    this.project_name_display = $('#rkamyp2-projects #project-name');
    this.project_name = '';
    this.buttons = $('#rkamyp2-buttons');
    this.button_more_tab = $('#rkamyp2-more-subnav');
    this.overlay_wrapper = $('#rkamyp2-overlay');
    this.terminal_area = $('#rkamyp2-terminal-area');
    this.terminal_placeholder = $('#rkamyp2-terminal-placeholder');
    this.button_more = $('#rkamyp2-buttons #more');
    this.button_more_sub = $('#rkamyp2-buttons #more .subnav');
    this.button_close = $('#rkamyp2-buttons #close');
    this.comport_list = $('#rkamyp2-comports-list');
    this.address_list = $('#rkamyp2-address-list');
    this.device_connection_tabs = $('#rkamyp2-connection-tabs');
    this.connect_all = $('#rkamyp2-connect-all');
    this.close_all = $('#rkamyp2-close-all');
    this.add_address_button = $('#rkamyp2-add-address-button');
    this.add_address_field = $('#rkamyp2-add-address-field');
    this.add_address_field_wrapper = $(
      '#rkamyp2-add-address-field-wrapper',
    );

    this.quick_settings = [];
    this.quick_settings_values = [];
    this.comports = [];
    this.overlay.build(this.overlay_contents);
    this.initResize(_this.resizer);
    this.action_view.build(this.element);
    this.sidebar_view.build(this.element);
    this.bindOnClicks();
    this.bindListeners();
    this.initQuickSettings();
    _this.setProjectNames(null, _this.api.getOpenProjects());
    atom.project.onDidChangePaths(() => {
      _this.setProjectNames(null, _this.api.getOpenProjects());
    });
  }

  openSnippet(s) {
    this.overlay.openSnippet(s);
  }

  showFeedbackPopup() {
    const _this = this;
    if (!this.feedback_popup_seen) {
      this.feedback_question = document.createElement('div');
      this.feedback_question.classList.add('rkamyp2-feedback');
      this.feedback_question.innerHTML = '<h2>Hi rkamyp2 User!</h2> ';
      this.feedback_question.innerHTML +=
        'We are working on ideas for rkamyp2 2.0 and would love your feedback! ';
      this.feedback_open_form = this.feedback_question.appendChild(
        document.createElement('div'),
      );
      this.feedback_open_form.innerHTML += 'Click here';
      this.feedback_open_form.classList.add('feedback-link');
      this.feedback_question.appendChild(
        document.createTextNode(
          ' if you have a few minutes to help out.',
        ),
      );
      this.feedbackQuestionDontshowagain = this.feedback_question.appendChild(
        document.createElement('div'),
      );
      this.feedbackQuestionDontshowagain.classList.add(
        'dontshowagain',
      );
      this.feedbackQuestionDontshowagain.innerHTML =
        "Don't show again";
      this.feedback_question_point = this.feedback_question.appendChild(
        document.createElement('div'),
      );
      this.feedback_question_point.classList.add('square');
      this.feedback_question_close = this.feedback_question.appendChild(
        document.createElement('div'),
      );
      this.feedback_question_close.classList.add('close-button');
      this.feedback_question_close.innerHTML = 'x';

      this.element.append(this.feedback_question);

      this.feedback_question_close.onclick = () => {
        _this.feedback_question.classList.add('hidden');
      };

      this.feedback_open_form.onclick = () => {
        _this.feedback_popup_seen = true;
        shell.openExternal(
          'https://danielmariano.typeform.com/to/kQ26Iu',
        );
        _this.feedback_question.classList.add('hidden');
      };

      this.feedbackQuestionDontshowagain.onclick = () => {
        _this.feedback_question.classList.add('hidden');
        _this.feedback_popup_seen = true;
        // do something to hide this permantently?
      };
    }
  }

  buildTerminal() {
    const _this = this;

    // terminal resize functionality
    const erd = ElementResize();
    erd.listenTo(document.getElementById('rkamyp2'), () => {
      if (_this.visible) {
        _this.setPanelHeight();
      }
    });
  }

  initResize(resizer) {
    const _this = this;
    let startY = 0;
    const startRows = Config.constants().term_rows.default;
    const currentFontSize = _this.settings.font_size;
    const lineHeight = currentFontSize + 8;
    let startTermHeight = startRows * lineHeight;
    let startHeight = startRows * lineHeight + 6;

    let newTermHeight = startTermHeight;
    let roundRows = Math.floor(
      (startHeight - 2 * currentFontSize) / lineHeight,
    );
    _this.element.height(`${startHeight}px`);

    if (_this.selectedDevice) {
      _this.selectedDevice.resizeAllTerminals(
        newTermHeight,
        roundRows - 1,
      );
      _this.lastRows = roundRows;
    }

    function onMouseDown(e) {
      startY = e.clientY;
      startHeight = parseInt(_this.element.height(), 10) + 6;
      if (_this.selected_device) {
        startTermHeight = _this.selected_device.terminal.getHeight();
      }
      document.documentElement.addEventListener(
        'mousemove',
        onMouseMove,
        false,
      );
      document.documentElement.addEventListener(
        'mouseup',
        stopDrag,
        false,
      );
    }
    function onMouseMove(e) {
      const newHeight = startHeight + startY - e.clientY;
      newTermHeight = startTermHeight + startY - e.clientY;
      roundRows = Math.floor(
        (newHeight - 2 * currentFontSize) / lineHeight,
      );

      _this.element.height(`${newHeight}px`);
      if (_this.selected_device) {
        _this.selected_device.resizeAllTerminals(
          newTermHeight,
          roundRows + 1,
        );
        _this.lastRows = roundRows;
      }
    }

    function stopDrag() {
      document.documentElement.removeEventListener(
        'mousemove',
        onMouseMove,
        false,
      );
      document.documentElement.removeEventListener(
        'mouseup',
        stopDrag,
        false,
      );
    }

    resizer.mousedown(onMouseDown);
    const erdUltraFast = elementResizeDetectorMaker({
      strategy: 'scroll',
    });
    let previousHeight = 0;
    erdUltraFast.listenTo(
      document.getElementById('rkamyp2'),
      element => {
        const height = element.offsetHeight - 25;
        if (previousHeight === height) {
          // if only the width has been changed (horizontal resizing), to avoid performance issues
          roundRows = Math.floor(
            (height - 2 * currentFontSize) / lineHeight,
          );
          if (_this.selected_device) {
            _this.selected_device.resizeAllTerminals(
              newTermHeight,
              roundRows + 1,
            );
            _this.lastRows = roundRows;
          }
        }
        previousHeight = height;
      },
    );
  }

  bindListeners() {
    const _this = this;
    this.on('device.disconnected', address => {
      _this.setDeviceStatus(address, 'disconnected');
    });

    this.on('device.connected', address => {
      _this.setDeviceStatus(address, 'connected');
    });
  }

  // All button actions
  bindOnClicks() {
    const _this = this;
    this.button_close.click(() => {
      if (_this.visible) {
        setTimeout(() => {
          _this.hidePanel();
          _this.emit('close');
        }, 50);
      } else {
        _this.showPanel();
        _this.emit('open');
      }
    });

    this.connect_all.click(() => {
      _this.emit('connect.all');
    });

    this.close_all.click(() => {
      _this.emit('close.all');
    });

    this.add_address_button.click(e => {
      e.stopPropagation();
      _this.add_address_button.addClass('hidden');
      _this.add_address_field_wrapper.removeClass('hidden');
    });

    _this.add_address_field_wrapper.click(e => {
      e.stopPropagation();
    });

    _this.add_address_field.click(e => {
      e.stopPropagation();
    });

    $('button.has-sub').click(function() {
      if ($(this).hasClass('open')) {
        $(this).removeClass('open');
        // don't do anything
      } else {
        $(this).addClass('open');
      }
    });

    $('button.has-sub').on('blur', function() {
      const button = $(this);
      setTimeout(() => {
        button.removeClass('open');
      }, 150);
    });

    // }
    // this.option_get_serial.onclick = function(){
    //   _this.emit('get_serial')
    // }
    //

    // this.option_get_help.onclick = function(){
    //   _this.emit('help')
    // }

    this.topbar.onclick = function() {
      _this.emit('topbar');
      if (!_this.visible) {
        _this.visible = true;
        _this.showPanel();
      }
    };
  }

  initQuickSettings() {
    const _this = this;
    const quickSettings = ['auto_connect', 'safe_boot_on_upload'];
    for (let i = 0; i < quickSettings.length; i += 1) {
      const quickSetting = quickSettings[i];
      this.quick_settings[quickSetting] = $(
        `#rkamyp2-setting-${quickSetting}`,
      );
      const sCheckbox = $(`#setting-${quickSetting}-value`);
      const labelSetting = $(`#label-${quickSetting}`);
      sCheckbox.prop('checked', _this.settings[quickSetting]);
      sCheckbox.on('change', el => {
        _this.settings.set(el.target.name, el.target.checked);
      });
      labelSetting.on('click', () => {
        const newValue = !_this.settings[quickSetting];
        sCheckbox.prop('checked', newValue);
        _this.settings.set(quickSetting, newValue);
      });
      this.quick_settings_values[quickSetting] = sCheckbox;
    }
  }

  createButton(id, icon, text, className, parent) {
    const cleanId = this.cleanId(id);

    const button = $('<div></div>');

    button.html(`<span class='fa fa-${icon}'></span> ${text}`);
    button.attr('id', `${className}-${cleanId}`);
    button.attr('name', id);
    if (className && className !== '') {
      button.addClass(`rkamyp2-${className}`);
    }
    parent.append(button);
    return button;
  }

  setProjectNames(selected, names) {
    let finalSelected = selected;
    const _this = this;
    if (!finalSelected && names.length > 0) {
      finalSelected = names[0];
    }
    this.project_names = names;
    this.selected_project = finalSelected;

    this.setProjectName(finalSelected);

    this.projects_list.html('');
    for (let i = 0; i < names.length; i += 1) {
      const n = names[i];
      let displayN = n;
      if (n.length > 16) {
        displayN = `${n.substr(0, 20)}...`;
      }
      if (!i) {
        if (this.selectedDevice) {
          this.api.setSelectedProjectByName(
            displayN,
            _this.selectedDevice,
          );
        }
      }
      const el = this.createButton(
        n,
        '',
        displayN,
        'project',
        this.projects_list,
      );
      el.click(function() {
        _this.emit('project.selected', $(this).attr('name'));
        _this.setProjectName($(this).attr('name'));
      });
    }
  }

  setProjectName(name) {
    const _this = this;
    if (name) {
      this.project_name = name;
    } else {
      this.project_name = 'No project';
    }
    this.project_name_display.html(
      `<span class='project-name'>${this.project_name}</span>`,
    );
    $(document).ready(() => {
      const width = parseInt($('#rkamyp2-options-left').width());
      _this.device_connection_tabs.css('left', width + 5);
    });
  }

  setTitle() {
    this.project_name_display.html(this.project_name);
  }

  addComport(com_info) {
    const _this = this;
    const button = this.createButton(
      com_info.name,
      '',
      com_info.title,
      'comport',
      this.comport_list,
    );
    $('#rkamyp2-comports-list .loading_text').remove();
    button.click(function() {
      _this.emit('connect.device', $(this).attr('name'));
    });
    this.comports[com_info.name] = button;
  }

  removeComport(name) {
    this.comports[name].remove();
  }

  removeComports() {
    for (k in this.comports) {
      this.comports[k].remove();
    }
    this.comport_list.html(
      '<div class="loading_text"><span class=`fa fa-`></span>  No devices detected on USB</div>',
    );
  }

  addAddress(address) {
    const _this = this;
    const button = this.createButton(
      address,
      '',
      address,
      'address',
      this.address_list,
    );
    $('#rkamyp2-address-list .loading_text').remove();
    button.click(function() {
      _this.emit('connect.device', $(this).attr('name'));
    });
  }

  removeAddress(address) {
    const finalAddress = this.cleanId(address);
    $(`#address-${finalAddress}`).remove();
  }

  addConnectionTab(address) {
    const _this = this;
    // the simultaneous connection bug might be here
    const cleanAddress = this.cleanId(address);
    const shortAddress = this.utils.shortenComport(address);

    // create tab
    const button = this.createButton(
      address,
      '',
      `<span class='button-title'>${shortAddress}</span>`,
      'connection',
      this.device_connection_tabs,
    );
    button.click(function() {
      _this.emit('open.tab', $(this).attr('name'));
    });

    const connStatus = $('<span></span>');
    connStatus.addClass('connection-status');
    button.append(connStatus);
    const closeIcon = $('<span></span>');
    closeIcon.addClass('close');
    closeIcon.html('<span class="fa fa-times"></span>');
    button.append(closeIcon);
    closeIcon.click(function() {
      _this.closeOverlay();
      _this.emit(
        'close.tab',
        $(this)
          .parent('.rkamyp2-connection')
          .text()
          .trim(),
      );
    });

    const terminalElement = $('<div></div>');
    terminalElement.attr('id', `terminal-${cleanAddress}`);
    terminalElement.attr('class', 'device-terminal');
    this.terminal_area.append(terminalElement);
    this.selectTab(address, this.selectedDevice);
    const fontSize = this.settings.font_size;
    terminalElement.css('font-size', `${fontSize}px`);
    $('#rkamyp2-terminal-placeholder').css(
      'font-size',
      `${fontSize}px`,
    );

    return terminalElement;
  }

  removeConnectionTab(address) {
    const finalAddress = this.cleanId(address);
    $(`#connection-${finalAddress}`).remove();
    $(`#terminal-${finalAddress}`).remove();
    if ($('#rkamyp2-terminal-area div.device-terminal').length === 0) {
      this.terminal_placeholder.addClass('open');
      const runButton = $('#rkamyp2-action-connect');
      runButton.addClass('no-devices');
      $('#rkamyp2-action-connect').removeClass('not-connected');
    }
  }

  selectTab(address, device) {
    const finalAaddress = this.cleanId(address);
    this.terminal_area.find('.device-terminal').removeClass('open');
    $(`#terminal-${finalAaddress}`).addClass('open');
    this.terminal_placeholder.removeClass('open');
    const runButton = $('#rkamyp2-action-connect');
    runButton.removeClass('no-devices');
    if (device) {
      this.action_view.update(device.connected());
    }
    this.device_connection_tabs.find('div').removeClass('open');
    $(`#connection-${finalAaddress}`).addClass('open');
  }

  setDeviceStatus(address, status) {
    const connected = status === 'connected' || status === true;
    if (status === 'connected') {
      $(`#connection-${this.cleanId(address)}`).addClass('connected');
    } else if (status === 'disconnected') {
      $(`#connection-${this.cleanId(address)}`).removeClass(
        'connected',
      );
    }
    this.action_view.update(connected);
  }

  syncActionView() {}

  cleanId(id) {
    return id
      .replace(/\./g, '')
      .replace(/\//g, '')
      .replace(/\\/g, '')
      .trim();
  }

  // UI Stuff
  addPanel() {
    this.api.addBottomPanel({
      item: this.getElement(),
      visible: true,
      priority: 100,
    });
  }

  setPanelHeight(height, minimized) {
    let newHeight = height;
    if (newHeight === undefined) {
      if (this.selectedDevice) {
        const firstTerminal = this.selectedDevice.terminal;
        newHeight = firstTerminal.getHeight() + 25; // add 25 for the bar
      } else {
        newHeight = 200;
      }
    }
    if (!minimized)
      if (newHeight < 200) {
        const startRows = Config.constants().term_rows.default;
        const currentFontSize = this.settings.font_size;
        const lineHeight = currentFontSize + 8;
        newHeight = startRows * lineHeight + 6;
      }
    this.element.height(`${newHeight}px`);
  }

  hidePanel() {
    this.element.removeClass('container-open');
    this.element.addClass('container-close');

    this.visible = false;
  }

  showPanel() {
    this.visible = true;
    this.element.addClass('container-open');
    this.element.removeClass('container-close');
  }

  openInfoOverlay(info) {
    this.overlay_wrapper.addClass('rkamyp2-open');
    this.overlay_contents.addClass('rkamyp2-open');
    this.overlay.open(info);
    $('.xterm-rows').addClass('blur-text');
  }

  closeOverlay() {
    this.overlay_wrapper.removeClass('rkamyp2-open');
    this.overlay_contents.removeClass('rkamyp2-open');
    $('.xterm-rows').removeClass('blur-text');
    this.emit('snippets.close');
  }

  // Tear down any state and detach
  removeElement() {
    this.element.remove();
  }

  getElement() {
    return this.main_el;
  }
}
