'use strict';

(function () {

  const translate = key => Mautic.translate(`mautic.producttour.${key}`);

  /**
  * Resets all tours by clearing stored progress and restarting the current tour.
  *
  * Use this function to debug from the beginning.
  */
  window.resetTour = function () {
    // If there's a current tour, complete it.
    if (window.currentTour) {
      window.currentTour.complete();
    }

    // Remove the current step from sessionStorage for all tours.
    Object.keys(sessionStorage).forEach(key => {
      if (key.endsWith('Step')) {
        sessionStorage.removeItem(key);
      }
    });

    // Remove the completed tour status from localStorage for all tours.
    Object.keys(localStorage).forEach(key => {
      if (key.endsWith('Completed')) {
        localStorage.removeItem(key);
      }
    });

    // Re-initialize the tour for the current page.
    urlTrigger();
  }

  // Dashboard tour
  const dashboardTourSteps = [
    {
      id: 'dashboard1',
      title: translate('dashboard.welcome.title'),
      text: translate('dashboard.welcome.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ],
      advanceOn: {
        selector: 'a[data-menu-link="mautic_dashboard_index"]',
        event: 'click'
      },
    },
    {
      id: 'dashboard2',
      title: translate('dashboard.filter.title'),
      text: translate('dashboard.filter.text'),
      attachTo: {
        element: 'form[name="daterange"]',
        on: 'bottom'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ],
      beforeShowPromise: () => lazyElement('form[name="daterange"]'),
    },
    {
      id: 'dashboard3',
      title: translate('dashboard.widgets.title'),
      text: translate('dashboard.widgets.text'),
      attachTo: {
        element: '.std-toolbar.btn-group',
        on: 'bottom'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ],
    },
    {
      id: 'dashboard4',
      title: translate('dashboard.navigation.title'),
      text: translate('dashboard.navigation.text'),
      attachTo: {
        element: 'nav.nav-sidebar',
        on: 'right'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ],
    },
    {
      id: 'dashboard5',
      title: translate('dashboard.tracking.title'),
      text: translate('dashboard.tracking.text'),
      attachTo: {
        element: '.navbar-right [data-toggle*="sidebar"]', // '#admin-menu'
        on: 'left' // 'bottom'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        {
          text: translate('button.go_to_configuration'),
          action: function () {
            window.currentTour.complete();
            mQuery('a#mautic_config_index').click();
          }
        }
      ],
      beforeShowPromise: () => lazyElement('.navbar-right [data-toggle*="sidebar"]'),
    },
  ];

  // Config tour
  const configTour = [
    {
      id: 'config1',
      title: translate('configuration.visitor_tracking.title'),
      text: translate('configuration.visitor_tracking.text'),
      attachTo: {
        element: 'a[href="#trackingconfig"]',
        on: 'right'
      },
      buttons: [{
        text: translate('button.go_to_tracking_settings'),
        action: function () {
          window.currentTour.next();
          mQuery('a[href="#trackingconfig"]').click();
        }
      }],
      beforeShowPromise: () => lazyElement('a[href="#trackingconfig"]'),
    },
    {
      id: 'config2',
      title: translate('configuration.implement_tracking.title'),
      text: translate('configuration.implement_tracking.text'),
      attachTo: {
        element: '#trackingconfig .panel-primary:first-child pre',
        on: 'bottom'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ],
      beforeShowPromise: () => {
        // Using lazyElement with a 400ms delay
        return lazyElement('#trackingconfig .panel-primary:first-child pre', 400);
      },
    },
    {
      id: 'config3',
      title: translate('configuration.grow_list.title'),
      text: translate('configuration.grow_list.text'),
      attachTo: {
        element: 'a#mautic_contact_index',
        on: 'right'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        {
          text: translate('button.go_to_contacts'),
          action: function () {
            window.currentTour.complete();
            mQuery('a#mautic_contact_index').click();
          }
        }],
    }
  ];

  // Contacts tour
  const contactsTourSteps = [
    {
      id: 'contacts-step1',
      title: translate('contacts.explore_database.title'),
      text: translate('contacts.explore_database.text'),
      attachTo: {
        element: '.pull-left.page-header-title', // Direct selector
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.next'),
          action: () => window.currentTour.next()
        }
      ]
    },
    {
      id: 'contacts-step2',
      title: translate('contacts.toggle_anonymous.title'),
      text: translate('contacts.toggle_anonymous.text'),
      attachTo: {
        element: '#anonymousLeadButton', // Direct selector
        on: 'left'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ]
    },
    {
      id: 'contacts-step3',
      title: translate('contacts.import.title'),
      text: translate('contacts.import.text'),
      attachTo: {
        element: 'button.btn.btn-nospin.dropdown-toggle', // Direct selector
        on: 'left'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => window.currentTour.complete()
        }
      ]
    }
  ];

  // Segments tour
  const segmentsOverviewTour = [
    {
      id: 'segmentsOverview1',
      title: translate('segments.understand.title'),
      text: translate('segments.understand.text'),
      attachTo: {
        element: 'h1.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [{ text: translate('button.next'), action: () => window.currentTour.next() }]
    },
    {
      id: 'segmentsOverview2',
      title: translate('segments.initiate_creation.title'),
      text: translate('segments.initiate_creation.text'),
      attachTo: {
        element: '.page-header a[href*="segments/new"]',
        on: 'bottom'
      },
      // advanceOn: { selector: '.page-header a[href*="segments/new"]', event: 'click' }
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        {
          text: translate('button.finish'),
          action: () => window.currentTour.complete()
        }
      ]
    }
  ];

  const segmentsNewTour = [
    {
      id: 'segmentsNew1',
      title: translate('segments.internal_name.title'),
      text: translate('segments.internal_name.text'),
      attachTo: {
        element: '#leadlist_name',
        on: 'right'
      },
      buttons: [{ text: translate('button.next'), action: () => window.currentTour.next() }],
      beforeShowPromise: () => lazyElement('#leadlist_name')
    },
    {
      id: 'segmentsNew2',
      title: translate('segments.customer_facing_name.title'),
      text: translate('segments.customer_facing_name.text'),
      attachTo: {
        element: '#leadlist_publicName',
        on: 'right'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ]
    },
    {
      id: 'segmentsNew3',
      title: translate('segments.activate.title'),
      text: translate('segments.activate.text'),
      attachTo: {
        element: '#leadlist_isPublished_1',
        on: 'top'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ]
    },
    {
      id: 'segmentsNew4',
      title: translate('segments.begin_setup.title'),
      text: translate('segments.begin_setup.text'),
      attachTo: {
        element: 'a[href="#filters"][role="tab"]',
        on: 'bottom'
      },
      // advanceOn: { selector: 'a[href="#filters"][role="tab"]', event: 'click' }
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        {
        text: translate('button.next'),
        action: function () {
          window.currentTour.next();
          mQuery('a[href="#filters"][role="tab"]').click();
        }
      }],
    },
    {
      id: 'segmentsNew5',
      title: translate('segments.select_criteria.title'),
      text: translate('segments.select_criteria.text'),
      attachTo: {
        element: '#available_segment_filters_chosen',
        on: 'right'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        {
        text: translate('button.next'),
        action: function () {
          window.currentTour.next();
        }
      }],
      beforeShowPromise: () => lazyElement('#available_segment_filters_chosen .chosen-default', 400)
    },
    {
      id: 'segmentsNew6',
      title: translate('segments.combine_filters.title'),
      text: translate('segments.combine_filters.text'),
      attachTo: {
        element: '#leadlist_filters .panel',
        on: 'top'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        { text: translate('button.next'), action: () => window.currentTour.next() }
      ],
      beforeShowPromise: () => lazyElement('#leadlist_filters .panel')
    },
    {
      id: 'segmentsNew7',
      title: translate('segments.good_to_go.title'),
      text: translate('segments.good_to_go.text'),
      attachTo: {
        element: '#leadlist_buttons_apply_toolbar',
        on: 'bottom'
      },
      buttons: [
        { text: translate('button.back'), action: () => window.currentTour.back() },
        {
        text: translate('button.finish'),
        action: () => {
          window.currentTour.complete();
        }
      }],
    }
  ];

  // Campaigns tour
  const campaignsTour = [
    {
      id: 'campaigns1',
      title: translate('campaigns.welcome.title'),
      text: translate('campaigns.welcome.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Emails tour
  const emailsTour = [
    {
      id: 'emails1',
      title: translate('emails.craft.title'),
      text: translate('emails.craft.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Marketing messages tour
  const marketingMessagesTour = [
    {
      id: 'marketingmessages1',
      title: translate('messages.hub.title'),
      text: translate('messages.hub.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Focus items tour
  const focusItemsTour = [
    {
      id: 'focusitems1',
      title: translate('focus.capture_attention.title'),
      text: translate('focus.capture_attention.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Assets tour
  const assetsTour = [
    {
      id: 'assets1',
      title: translate('assets.manage.title'),
      text: translate('assets.manage.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Forms tour
  const formsTour = [
    {
      id: 'forms1',
      title: translate('forms.design.title'),
      text: translate('forms.design.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Landing pages tour
  const landingPagesTour = [
    {
      id: 'landingpages1',
      title: translate('landing_pages.create.title'),
      text: translate('landing_pages.create.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Dynamic content tour
  const dynamicContentTour = [
    {
      id: 'dynamiccontent1',
      title: translate('dynamic_content.personalize.title'),
      text: translate('dynamic_content.personalize.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Point actions tour
  const pointActionsTour = [
    {
      id: 'pointactions1',
      title: translate('point_actions.automated_responses.title'),
      text: translate('point_actions.automated_responses.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Point triggers tour
  const pointTriggersTour = [
    {
      id: 'pointtriggers1',
      title: translate('point_triggers.configure.title'),
      text: translate('point_triggers.configure.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Point groups tour
  const pointGroupsTour = [
    {
      id: 'pointgroups1',
      title: translate('point_groups.organize.title'),
      text: translate('point_groups.organize.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Stages tour
  const stagesTour = [
    {
      id: 'stages1',
      title: translate('stages.map_journey.title'),
      text: translate('stages.map_journey.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Reports tour
  const reportsTour = [
    {
      id: 'reports1',
      title: translate('reports.gain_insights.title'),
      text: translate('reports.gain_insights.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  // Tags tour
  const tagsTour = [
    {
      id: 'tags1',
      title: translate('tags.organize_contacts.title'),
      text: translate('tags.organize_contacts.text'),
      attachTo: {
        element: '.pull-left.page-header-title',
        on: 'right'
      },
      buttons: [
        {
          text: translate('button.finish'),
          action: () => {
            window.currentTour.complete();
          }
        }],
    },
  ];

  /**
   *
   * @param currentPath url of the page we are on
   */
  function urlTrigger({ currentPath }) {

    let tourKey = '';

    let tourSteps = null;

    if (currentPath.startsWith('/s/dashboard')) {
      tourSteps = dashboardTourSteps;
      tourKey = 'dashboardTour';

    } else if (currentPath.startsWith('/s/config/edit')) {
      tourSteps = configTour;
      tourKey = 'configTour';

    } else if (currentPath === '/s/contacts' && (!window.location.search)) {
      tourSteps = contactsTourSteps;
      tourKey = 'contactsTour';

    } else if (currentPath.startsWith('/s/segments/new')) {
      tourSteps = segmentsNewTour;
      tourKey = 'segmentsNewTour';

    } else if (currentPath.startsWith('/s/segments')) {
      tourSteps = segmentsOverviewTour;
      tourKey = 'segmentsOverviewTour';

    } else if (currentPath.startsWith('/s/campaigns')) {
      tourSteps = campaignsTour;
      tourKey = 'campaignsTour';

    } else if (currentPath.startsWith('/s/emails')) {
      tourSteps = emailsTour;
      tourKey = 'emailsTour';

    } else if (currentPath.startsWith('/s/messages')) {
      tourSteps = marketingMessagesTour;
      tourKey = 'marketingMessagesTour';

    } else if (currentPath.startsWith('/s/focus')) {
      tourSteps = focusItemsTour;
      tourKey = 'focusItemsTour';

    } else if (currentPath.startsWith('/s/assets')) {
      tourSteps = assetsTour;
      tourKey = 'assetsTour';

    } else if (currentPath.startsWith('/s/forms')) {
      tourSteps = formsTour;
      tourKey = 'formsTour';

    } else if (currentPath.startsWith('/s/pages')) {
      tourSteps = landingPagesTour;
      tourKey = 'landingPagesTour';

    } else if (currentPath.startsWith('/s/dwc')) {
      tourSteps = dynamicContentTour;
      tourKey = 'dynamicContentTour';

    } else if (currentPath === '/s/points') {
      tourSteps = pointActionsTour;
      tourKey = 'pointActionsTour';

    } else if (currentPath.startsWith('/s/points/triggers')) {
      tourSteps = pointTriggersTour;
      tourKey = 'pointTriggersTour';

    } else if (currentPath.startsWith('/s/points/groups')) {
      tourSteps = pointGroupsTour;
      tourKey = 'pointGroupsTour';

    } else if (currentPath.startsWith('/s/stages')) {
      tourSteps = stagesTour;
      tourKey = 'stagesTour';

    } else if (currentPath.startsWith('/s/reports')) {
      tourSteps = reportsTour;
      tourKey = 'reportsTour';

    } else if (currentPath.startsWith('/s/tags')) {
      tourSteps = tagsTour;
      tourKey = 'tagsTour';

    } else {
      tourSteps = [];
      tourKey = 'unknownTour';
    }

    // Check if this specific tour has already been completed
    if (localStorage.getItem(`${tourKey}Completed`) === 'true') {
      return; // Exit if this specific tour has already been completed
    }

    if (tourSteps !== null && tourSteps.length > 0) {
      window.currentTour = new Shepherd.Tour({
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          classes: 'shepherd-theme-default',
          scrollTo: { behavior: 'smooth', block: 'center' },
        },
      });

      tourSteps.forEach(step => {
        window.currentTour.addStep(step);
      });

      const currentStep = sessionStorage.getItem(`${tourKey}Step`);
      if (currentStep) {
        window.currentTour.show(currentStep);
      } else {
        window.currentTour.start();
      }

      // Store completed tour status for this specific tour
      window.currentTour.on('complete', () => {
        localStorage.setItem(`${tourKey}Completed`, 'true');
      });

      window.currentTour.on('show', (e) => {
        sessionStorage.setItem(`${tourKey}Step`, e.step.id);
      });
    }

  }

  function init() {

    // this will simply fire when dom is ready, after a page load
    urlTrigger({ currentPath: window.location.pathname.toString() });

    // this will listen for url changes done with JS
    // in case of Ajax navigation
    window.history.pushState = new Proxy(window.history.pushState, {
      apply: (target, thisArg, argArray) => {
        const [state, title, url] = argArray;
        const newUrl = url;

        // If there's a current tour, cancel it
        if (window.currentTour && window.location.pathname.toString() !== newUrl) {
          window.currentTour.cancel();
        }

        // start new tour, if there is one on the new url
        urlTrigger({ currentPath: newUrl });

        return target.apply(thisArg, argArray);
      }
    });

  };

  /**
 * Waits for an element matching the selector to appear in the DOM.
 *
 * @param {string} selector - CSS selector for the element.
 * @param {number} [delay=0] - Optional delay in milliseconds before checking for the element.
 * @returns {Promise<Object>} Promise resolving to the mQuery object of the found element.
 *
 * Handles dynamically loaded content in Mautic pages like importing contacts.
 */
  function lazyElement(selector, delay = 0) {
    return new Promise((resolve) => {
      const checkElement = () => {
        const element = mQuery(selector);
        if (element.length) {
          resolve(element);
          return true;
        }
        return false;
      };

      const observeElement = () => {
        // If the element is already present, resolve immediately
        if (checkElement()) return;

        // Create a MutationObserver to watch for changes in the DOM
        const observer = new MutationObserver(() => {
          if (checkElement()) {
            observer.disconnect(); // Stop observing once the element is found
          }
        });

        // Start observing the document body for added/removed nodes
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      };

      // If delay is provided, wait before starting the observer
      if (delay > 0) {
        setTimeout(() => {
          observeElement();
        }, delay);
      } else {
        observeElement(); // No delay, start observing immediately
      }
    });
  }

  function ready() {
    if (
      document.attachEvent
        ? document.readyState === 'complete'
        : document.readyState !== 'loading'
    ) {
      init();
      addResetShortcut();
    } else {
      document.addEventListener('DOMContentLoaded', init);
      addResetShortcut();
    }
  };

  /**
   * Add keyboard shortcut to reset tour
   */
  function addResetShortcut() {
    document.addEventListener('keydown', function (event) {
      // Reset tour when 'Ctrl+Alt+R' is pressed
      if (event.ctrlKey && event.altKey && event.key === 'r') {
        resetTour();
      }
    });
  }

  ready();

}).call(void 0);
