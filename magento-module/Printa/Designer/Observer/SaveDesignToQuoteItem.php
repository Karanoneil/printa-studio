<?php
declare(strict_types=1);

namespace Printa\Designer\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Quote\Model\Quote\Item;

/**
 * Persists the customer's completed Printa design onto the quote item
 * as custom option values, so it flows through checkout → order → email
 * without any further handling.
 *
 * The frontend (js/designer.js) injects `printa_design` (JSON string)
 * and `printa_preview` (data-URL PNG) into the add-to-cart form.
 */
class SaveDesignToQuoteItem implements ObserverInterface
{
    private const MAX_JSON_LENGTH = 262144; // 256 KB safety cap
    private const MAX_PNG_LENGTH  = 1048576; // 1 MB safety cap

    /**
     * @param Observer $observer
     * @return void
     */
    public function execute(Observer $observer): void
    {
        /** @var Item $quoteItem */
        $quoteItem = $observer->getEvent()->getData('quote_item');
        if (!$quoteItem instanceof Item) {
            return;
        }

        $buyRequest = $quoteItem->getBuyRequest();
        $designJson = (string) $buyRequest->getData('printa_design');
        $previewPng = (string) $buyRequest->getData('printa_preview');

        if ($designJson === '') {
            return;
        }

        // sanity: must be valid JSON and carry the fields we expect
        $decoded = json_decode($designJson, true);
        if (!is_array($decoded) || !isset($decoded['width'], $decoded['height'], $decoded['elements'])) {
            return;
        }

        if (strlen($designJson) > self::MAX_JSON_LENGTH) {
            $designJson = substr($designJson, 0, self::MAX_JSON_LENGTH);
        }

        $options = $quoteItem->getOptionByCode('printa_design');
        if ($options) {
            $options->setValue($designJson);
        } else {
            $quoteItem->addOption([
                'product_id' => $quoteItem->getProductId(),
                'code'       => 'printa_design',
                'value'      => $designJson,
            ]);
        }

        if ($previewPng !== '' && strlen($previewPng) <= self::MAX_PNG_LENGTH) {
            $preview = $quoteItem->getOptionByCode('printa_preview');
            if ($preview) {
                $preview->setValue($previewPng);
            } else {
                $quoteItem->addOption([
                    'product_id' => $quoteItem->getProductId(),
                    'code'       => 'printa_preview',
                    'value'      => $previewPng,
                ]);
            }
        }
    }
}
