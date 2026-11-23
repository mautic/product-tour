# Product tour
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

An interactive tour which helps onboard new users to Mautic

## Installation

Reload plugins on the plugin page, and the tours will be available. 

After installing or updating the plugin, regenerate Mautic's assets so `tour.js` and `tour.css` are included in `media/js/app.js` and `media/css/app.css`:

```bash
php bin/console mautic:assets:generate
```

## Development info

This plugin leverages the [shepherdjs](https://www.shepherdjs.dev/) library to add tours to Mautic. 
Tours are created inside the `Assets/js/tour.js` file.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/en/reference/emoji-key/)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lepi-dozni"><img src="https://avatars.githubusercontent.com/u/123205844?v=4&size=100" width="100px" height="100px" alt="lepi-dozni"/><br /><sub><b>lepi-dozni</b></sub></a><br /><a href="https://github.com/mautic/product-tour/commits?author=lepi-dozni" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://tendence.ru/zlobin"><img src="https://avatars.githubusercontent.com/u/186687229?v=4&size=100" width="100px" height="100px" alt="Alexander Zlobin"/><br /><sub><b>Alexander Zlobin</b></sub></a><br /><a href="https://github.com/mautic/product-tour/pulls?q=is%3Apr+reviewed-by%3AAlexanderZlobinM1" title="Reviewed Pull Requests">👀</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!