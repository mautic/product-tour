'use strict';

(function () {

  /**
   * Builds a resolver for a step target that works across Mautic versions.
   *
   * Pass the selectors in order of preference (newest markup first). The resolver
   * returns the first matching element that is actually visible, or null.
   * Elements outside the viewport count as visible, so a step can scroll to them.
   *
   * @param {...string} selectors - CSS selectors to try, in order.
   * @returns {function(): (Element|null)}
   */
  function firstVisible(...selectors) {
    return function () {
      for (const selector of selectors) {
        for (const element of document.querySelectorAll(selector)) {
          // An element hidden with `visibility: hidden` still has layout boxes.
          if (element.getClientRects().length > 0 && getComputedStyle(element).visibility === 'visible') {
            return element;
          }
        }
      }
      return null;
    };
  }

  /**
   * Clicks an element with a native click.
   *
   * jQuery's .click() only runs jQuery handlers, which is not enough from Mautic 8
   * onwards, where Bootstrap 5 tabs listen for native events.
   *
   * @param {string} selector - CSS selector of the element to click.
   */
  function clickElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.click();
    }
  }

  // The page title lost its `pull-left` class in Mautic 8.
  const pageTitle = firstVisible('.page-header-title');

  // The admin (cog) menu in the top bar, which contains the Configuration link.
  const adminMenu = firstVisible('#admin-menu', '.navbar-right [data-toggle*="sidebar"]');

  // Link to the tracking settings: an in-page tab up to Mautic 7, its own page from Mautic 8.
  const trackingSettingsLink = firstVisible('a[href="#trackingconfig"]', 'a[href$="/config/edit/trackingconfig"]');

  // The tracking code. From Mautic 7.2 it is split over two tabs, and the consent-managed
  // tab holds two scripts which are both needed, so the whole visible tab is the target.
  // Earlier versions have a single snippet.
  const trackingSnippet = firstVisible(
    '#tracking-snippet-consent',
    '#tracking-snippet-full',
    '#trackingconfig .code-snippet',
    '#trackingconfig .panel-primary:first-child pre',
    'form[name="config"] .code-snippet'
  );

  /**
   * Opens the tracking settings from the first step of the config tour.
   */
  function goToTrackingSettings() {
    if (trackingSnippet()) {
      // Already there, for example after going back from the next step.
      window.currentTour.next();
      return;
    }

    const link = trackingSettingsLink();
    if (!link) {
      return;
    }

    if (link.getAttribute('href').startsWith('#')) {
      // Up to Mautic 7 the tracking settings are a tab on the same page.
      window.currentTour.next();
    } else {
      // From Mautic 8 each settings section is its own page. Following the link
      // restarts this tour, so make sure it resumes on the next step.
      sessionStorage.setItem('configTourStep', 'config2');
    }
    link.click();
  }

  /**
   * Shepherd's Right Arrow shortcut moves to the next step without running the
   * button's action. On the first config step that would skip opening the tracking
   * settings, so the shortcut is routed through the same action as the button.
   *
   * @param {KeyboardEvent} event
   */
  function trackingSettingsShortcut(event) {
    const step = window.currentTour && window.currentTour.getCurrentStep();
    const inStep = event.target instanceof Element && event.target.closest('.shepherd-element');

    if (event.key === 'ArrowRight' && inStep && step && step.id === 'config1') {
      event.preventDefault();
      event.stopPropagation();
      goToTrackingSettings();
    }
  }

  /**
   * Keeps the tracking step on the code that is showing.
   *
   * From Mautic 7.2 the tracking code has two tabs. Switching tab hides the one the
   * step is attached to, so the step is shown again to pick up the visible tab.
   *
   * Runs on Bootstrap's `shown.bs.tab` event, which fires once the switch has
   * finished, whether it was made with the mouse or the keyboard.
   *
   * @param {Event} event
   */
  function followTrackingSnippetTab(event) {
    const tabSelector = '[href^="#tracking-snippet"], [data-bs-target^="#tracking-snippet"], [data-target^="#tracking-snippet"]';
    if (!(event.target instanceof Element) || !event.target.matches(tabSelector)) {
      return;
    }

    const tour = window.currentTour;
    const step = tour && tour.isActive() && tour.getCurrentStep();
    if (!step || step.id !== 'config2') {
      return;
    }

    const target = step.getTarget();
    if (!target || target.getClientRects().length === 0) {
      tour.show('config2');
    }
  }

  /**
   * Steps which can only be resumed when their target is available.
   *
   * Each entry maps a step id to a check that receives the current path. When the
   * check fails the tour starts from its first step instead of the stored one.
   */
  const resumeGuards = {
    config2: (currentPath) => currentPath.split(/[?#]/)[0].endsWith('/config/edit/trackingconfig') || trackingSnippet() !== null,
  };

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
      title: 'Welcome to Mautic',
      text: 'This is your dashboard. Follow the tour to get started and learn how features work.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        { text: 'Next', action: () => window.currentTour.next() }
      ],
      advanceOn: {
        selector: 'a[data-menu-link="mautic_dashboard_index"]',
        event: 'click'
      },
    },
    {
      id: 'dashboard2',
      title: 'Filter the dashboard data',
      text: 'By default, Mautic displays data from the past 30 days, but you can change it in the configuration. It applies to all widgets.',
      attachTo: {
        element: 'form[name="daterange"]',
        on: 'bottom'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        { text: 'Next', action: () => window.currentTour.next() }
      ],
      beforeShowPromise: () => lazyElement('form[name="daterange"]'),
    },
    {
      id: 'dashboard3',
      title: 'See essential information using widgets',
      text: 'These are the charts used to display data. As soon as information starts being collected, check them again.',
      attachTo: {
        element: '.std-toolbar.btn-group',
        on: 'bottom'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        { text: 'Next', action: () => window.currentTour.next() }
      ],
    },
    {
      id: 'dashboard4',
      title: 'Navigate through Mautic',
      text: 'The main menu allows you to easily access and explore its various features.',
      attachTo: {
        element: 'nav.nav-sidebar',
        on: 'right'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        { text: 'Next', action: () => window.currentTour.next() }
      ],
    },
    {
      id: 'dashboard5',
      title: 'Connect tracking script',
      text: 'To start collecting visitor data, go to the configuration and set up your tracking script.',
      attachTo: {
        element: adminMenu,
        on: 'left'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        {
          text: 'Go to Configuration',
          action: function () {
            window.currentTour.complete();
            clickElement('a#mautic_config_index');
          }
        }
      ],
      beforeShowPromise: () => lazyElement(adminMenu),
    },
  ];

  // Config tour
  const configTour = [
    {
      id: 'config1',
      title: 'Configure visitor tracking',
      text: 'On this page, you can manage the way your Mautic works, but first let\'s make sure we can track visitors.',
      attachTo: {
        element: trackingSettingsLink,
        on: 'right'
      },
      buttons: [{
        text: 'Go to Tracking Settings',
        action: goToTrackingSettings
      }],
      beforeShowPromise: () => lazyElement(trackingSettingsLink),
      when: {
        show: () => document.addEventListener('keydown', trackingSettingsShortcut, true),
        hide: () => document.removeEventListener('keydown', trackingSettingsShortcut, true),
        destroy: () => document.removeEventListener('keydown', trackingSettingsShortcut, true),
      },
    },
    {
      id: 'config2',
      title: 'Implement tracking on your website',
      text: 'Copy the code from this section and paste it at the end of the body tag in your website. If it shows two scripts, you need both.',
      attachTo: {
        element: trackingSnippet,
        // The code is taller than most screens, so sit beside it instead of over it.
        on: 'right'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        { text: 'Next', action: () => window.currentTour.next() }
      ],
      beforeShowPromise: () => {
        // Allow 400ms for the tracking settings tab to open. When the code is
        // already showing there is nothing to wait for, and waiting would let the
        // step appear after the tour had been closed in the meantime.
        return lazyElement(trackingSnippet, trackingSnippet() ? 0 : 400);
      },
      when: {
        // Bootstrap 3 (up to Mautic 7) only triggers this event through jQuery.
        show: () => mQuery(document).on('shown.bs.tab', followTrackingSnippetTab),
        hide: () => mQuery(document).off('shown.bs.tab', followTrackingSnippetTab),
        destroy: () => mQuery(document).off('shown.bs.tab', followTrackingSnippetTab),
      },
    },
    {
      id: 'config3',
      title: 'Grow your list',
      text: 'Once people start accessing your website, you\'ll find new visitors in your Contacts page.',
      attachTo: {
        element: 'a#mautic_contact_index',
        on: 'right'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        {
          text: 'Go to Contacts',
          action: function () {
            window.currentTour.complete();
            clickElement('a#mautic_contact_index');
          }
        }],
    }
  ];

  // Contacts tour
  const contactsTourSteps = [
    {
      id: 'contacts-step1',
      title: 'Explore your contact database',
      text: 'Once you\'ve implemented Mautic\'s tracking code, you will be able to see all the unidentified and identified visitors that are interacting with your website. To fill or extend this list, import your own contacts.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Next',
          action: () => window.currentTour.next()
        }
      ]
    },
    {
      id: 'contacts-step2',
      title: 'Toggle anonymous contacts',
      text: 'Mautic creates unidentified visitors, contacts that we don\'t have a name or email address for yet, based on their IP. Click to toggle between unidentified visitors (anonymous contacts) and known visitors (contacts) later.',
      attachTo: {
        element: '#anonymousLeadButton', // Direct selector
        on: 'left'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        { text: 'Next', action: () => window.currentTour.next() }
      ]
    },
    {
      id: 'contacts-step3',
      title: 'Import your contacts',
      text: 'Click on the arrow-button to open the menu and find "Import" to quickly bring leads or "Import history" to see previously imported contacts.',
      attachTo: {
        element: firstVisible('#page-list-actions', 'button.btn.btn-nospin.dropdown-toggle'),
        on: 'left'
      },
      buttons: [
        {
          text: 'Finish',
          action: () => window.currentTour.complete()
        }
      ]
    }
  ];

  // Segments tour
  const segmentsOverviewTour = [
    {
      id: 'segmentsOverview1',
      title: 'Understand contact segmentation',
      text: "Segments are used to categorize your contacts into specific lists based on their attributes, behavior, or campaign participation.",
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [{ text: 'Next', action: () => window.currentTour.next() }]
    },
    {
      id: 'segmentsOverview2',
      title: 'Initiate segment creation',
      text: 'Click "New" to add a new segment. For example, you can create the first to monitor contacts who visited your website\'s contact page.',
      attachTo: {
        element: firstVisible('.page-header a[href*="segments/new"]', 'a#new[href*="segments/new"]'),
        on: 'bottom'
      },
      // advanceOn: { selector: '.page-header a[href*="segments/new"]', event: 'click' }
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        {
          text: 'Finish',
          action: () => window.currentTour.complete()
        }
      ]
    }
  ];

  const segmentsNewTour = [
    {
      id: 'segmentsNew1',
      title: 'Define internal name',
      text: 'It will be visible only for you and other Mautic users in the segments page.',
      attachTo: {
        element: '#leadlist_name',
        on: 'right'
      },
      buttons: [{ text: 'Next', action: () => window.currentTour.next() }],
      beforeShowPromise: () => lazyElement('#leadlist_name')
    },
    {
      id: 'segmentsNew2',
      title: 'Set customer-facing segment name',
      text: 'Use this field to display another name to contacts. It\'d be useful in the preference center to allow people to manage their segment membership later.',
      attachTo: {
        element: '#leadlist_publicName',
        on: 'right'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        { text: 'Next', action: () => window.currentTour.next() }
      ]
    },
    {
      id: 'segmentsNew3',
      title: 'Activate segment',
      text: 'Make sure to put the segment as Active to use it later.',
      attachTo: {
        element: firstVisible('#leadlist_isPublished_label', '#leadlist_isPublished_1'),
        on: 'top'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        { text: 'Next', action: () => window.currentTour.next() }
      ]
    },
    {
      id: 'segmentsNew4',
      title: 'Begin segment setup',
      text: 'By adding filters, you can create dynamic segments, which add and remove contacts automatically. Otherwise, just skip this step to keep them static.',
      attachTo: {
        element: 'a[href="#filters"][role="tab"]',
        on: 'bottom'
      },
      // advanceOn: { selector: 'a[href="#filters"][role="tab"]', event: 'click' }
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        {
        text: 'Next',
        action: function () {
          window.currentTour.next();
          clickElement('a[href="#filters"][role="tab"]');
        }
      }],
    },
    {
      id: 'segmentsNew5',
      title: 'Select segment criteria',
      text: 'You can filter based on known information and behavior. For example, use "Visited X URL" to add contacts that accessed a specific page.',
      attachTo: {
        element: '#available_segment_filters_chosen',
        on: 'right'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        {
        text: 'Next',
        action: function () {
          window.currentTour.next();
        }
      }],
      beforeShowPromise: () => lazyElement('#available_segment_filters_chosen .chosen-default', 400)
    },
    {
      id: 'segmentsNew6',
      title: 'Combine segment filters',
      text: 'For multiple filters, select additional fields from the dropdown and specify whether the filters should use "AND" or "OR" expressions.',
      attachTo: {
        element: '#leadlist_filters .panel',
        on: 'top'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        { text: 'Next', action: () => window.currentTour.next() }
      ],
      beforeShowPromise: () => lazyElement('#leadlist_filters .panel')
    },
    {
      id: 'segmentsNew7',
      title: 'Good to go',
      text: 'You created a segment. Save it to finish.',
      attachTo: {
        element: '#leadlist_buttons_apply_toolbar',
        on: 'bottom'
      },
      buttons: [
        { text: 'Back', action: () => window.currentTour.back() },
        {
        text: 'Finish',
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
      title: 'Welcome to your campaign headquarters',
      text: "Here, you'll manage and power your marketing automation processes within Mautic.",
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Craft your email masterpieces',
      text: 'Here, you can effortlessly create, customize, and track your email communications.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Your multi-channel messaging hub',
      text: 'This is your go-to destination for crafting and managing personalized marketing messages across various channels at once. It allows you organize the sending for SMS, email, social media, and push notifications.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Capture attention with focus items',
      text: "Focus items allow you to create pop-ups, modals, and banners designed to capture your visitors' attention and encourage specific actions, such as subscribing to a newsletter or completing a form.",
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Manage your digital treasures',
      text: 'This is your central hub for managing all digital assets used in your marketing campaigns.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Design your data collection tools',
      text: 'Here, you can create and manage forms to capture valuable customer data effectively.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Create compelling landing pages',
      text: "This is where you can design, customize, and optimize your landing pages with ease. Using Mautic's intuitive drag-and-drop builder, you can effortlessly add images, forms, and CTAs to capture leads and boost conversions.",
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Personalize your content dynamically',
      text: 'Here, you can craft personalized experiences for your audience by delivering tailored content based on user behavior and preferences. Customize website content, emails, and landing pages dynamically to ensure each visitor receives relevant and engaging messages.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Set up automated responses',
      text: 'Here, you can define and automate responses to user interactions within your marketing campaigns. Set up actions like sending follow-up emails, adjusting lead scores, or adding contacts to segments based on predefined conditions and triggers.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Configure your marketing triggers',
      text: 'Automate smaller workflows by configuring actions that respond to user behavior and events. These triggers activate based on interactions such as form submissions, email opens, or page visits, streamlining your marketing processes.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Organize your point strategies',
      text: "Groups allow you to organize separate amount of points. They're useful to have control over strategies targeting several audiences and help you to differentiate engagement metrics for each.",
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Map out your customer journey',
      text: 'Here, you can define and manage the various stages of the customer lifecycle, from initial contact to post-purchase engagement. By organizing leads into distinct stages, you can implement targeted marketing strategies, personalize communications, and analyze progression through the marketing funnel.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Gain insights from your data',
      text: 'This section enables you to create, customize, and analyze a wide range of reports. Track key metrics such as campaign effectiveness, email engagement, lead generation, and more to gain valuable insights into your marketing performance.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      title: 'Organize contacts with tags',
      text: 'Tags are customizable labels you can apply to contacts within Mautic. They help streamline segmentation and targeted marketing. Here, you can create, edit, and manage tags, making it easier to filter and search for specific groups of contacts.',
      attachTo: {
        element: pageTitle,
        on: 'right'
      },
      buttons: [
        {
          text: 'Finish',
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
      const canResume = resumeGuards[currentStep];
      if (currentStep && (!canResume || canResume(currentPath))) {
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
 * Waits for a visible element to appear in the DOM.
 *
 * @param {string|function(): (Element|null)} target - CSS selector, or a resolver built with firstVisible().
 * @param {number} [delay=0] - Optional delay in milliseconds before checking for the element.
 * @returns {Promise<Object>} Promise resolving to the mQuery object of the found element.
 *
 * Handles dynamically loaded content in Mautic pages like importing contacts.
 */
  function lazyElement(target, delay = 0) {
    const find = typeof target === 'function' ? target : firstVisible(target);

    return new Promise((resolve) => {
      const checkElement = () => {
        const element = find();
        if (element) {
          resolve(mQuery(element));
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

        // Start observing the document body for added/removed nodes, and for
        // class/style changes that reveal an element which is already in the DOM
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'hidden']
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
