<?php

declare(strict_types=1);

namespace MauticPlugin\ProductTourBundle\EventListener;

use Mautic\CoreBundle\Event\CustomAssetsEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class TourAssetsSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            // Mautic 7 and earlier dispatch this event by name. The string is used in
            // place of CoreEvents::VIEW_INJECT_CUSTOM_ASSETS because the CoreEvents
            // class no longer exists in Mautic 8.
            'mautic.view_inject_custom_assets' => ['injectAssets', 0],
            // Mautic 8 dispatches the event by its class name.
            CustomAssetsEvent::class => ['injectAssets', 0],
        ];
    }

    public function injectAssets(CustomAssetsEvent $assetsEvent): void
    {
        $assetsEvent->addScript('https://cdn.jsdelivr.net/npm/shepherd.js@10.0.1/dist/js/shepherd.min.js');
        $assetsEvent->addScript('https://cdn.jsdelivr.net/npm/@floating-ui/core@1.6.0');
        $assetsEvent->addScript('https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.6.3');
        $assetsEvent->addStylesheet('https://cdn.jsdelivr.net/npm/shepherd.js@10.0.1/dist/css/shepherd.css');
    }
}
