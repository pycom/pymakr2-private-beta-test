'use babel';

import rkamyp from '../lib/rkamyp';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('rkamyp', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('rkamyp');
  });

  // order:
  // - Open rkamyp, check if element exists
  // - Start monitoring terminal output
  // - Autoconnected do device on USB?
  // - Disconnect and connect again
  // - Run a piece of code on the board
  // - Clear board flash
  // - Upload a file to the board (boot file with wifi connect)
  // - Download feature
  //    - remove local file that was just uploaded
  //    - Execute download
  //    - Check local file for correct content
  // - Wifi connect
  //    - Disable autoconnect
  //    - Change config to correct IP address
  //    - Check if automatically connected after config change
  // - Repeat download/upload/disconnect over wifi


  describe('rkamyp open', () => {
    it('opens the terminal', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.rkamyp')).toExist();

      // // This is an activation event, triggering it will cause the package to be
      // // activated.
      // atom.commands.dispatch(workspaceElement, 'rkamyp:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // expect(workspaceElement.querySelector('#rkamyp')).toExist();

        let pycomSyncAtomElement = workspaceElement.querySelector('.rkamyp');
        expect(pycomSyncAtomElement).toExist();
      });
    });

    //
    it('connects to the device', () => {

      waitsFor(function() {
         // workspaceElement = atom.views.getView(atom.workspace);
         var title_el = workspaceElement.querySelector('.rkamyp-title')
         if(title_el){
           console.log(title_el.innerHTML)
           return title_el.innerHTML.indexOf(" Connected") > -1;
         }
         return false

      }, "Board to be connected", 10000);

      runs(() => {
        let connected = workspaceElement.querySelector('.rkamyp-title').innerHTML.indexOf(" Connected") > -1;
        console.log(workspaceElement.querySelector('.rkamyp-title').innerHTML)
        expect(connected).toEqual(true);
      });
    })


    //   // This test shows you an integration test testing at the view level.
    //
    //   // Attaching the workspaceElement to the DOM is required to allow the
    //   // `toBeVisible()` matchers to work. Anything testing visibility or focus
    //   // requires that the workspaceElement is on the DOM. Tests that attach the
    //   // workspaceElement to the DOM are generally slower than those off DOM.
    //   jasmine.attachToDOM(workspaceElement);
    //
    //   expect(workspaceElement.querySelector('.rkamyp')).not.toExist();
    //
    //   // This is an activation event, triggering it causes the package to be
    //   // activated.
    //   atom.commands.dispatch(workspaceElement, 'rkamyp:toggle');
    //
    //   waitsForPromise(() => {
    //     return activationPromise;
    //   });
    //
    //   runs(() => {
    //     // Now we can test for view visibility
    //     let pycomSyncAtomElement = workspaceElement.querySelector('.rkamyp');
    //     expect(pycomSyncAtomElement).toBeVisible();
    //     atom.commands.dispatch(workspaceElement, 'rkamyp:toggle');
    //     expect(pycomSyncAtomElement).not.toBeVisible();
    //   });
    // });
  });
});
